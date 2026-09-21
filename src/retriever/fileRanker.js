const fs = require("fs");
const path = require("path");


// ======================================================
// NORMALISATION
// ======================================================

function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_$\s]/g, " ");
}


// ======================================================
// ÉCHAPPER UNE CHAÎNE POUR REGEX
// ======================================================

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


// ======================================================
// ANALYSE ACTION + ENTITY
// ======================================================

function analyzeActionEntity(content, action, entity) {

    const combined = `${action}${entity}`;

    const safeCombined = escapeRegex(combined);

    const results = {
        backendDefinition: false,
        graphqlDefinition: false,
        frontendCall: false,
        import: false,
        generic: false
    };


    // ==================================================
    // 1. BACKEND JAVASCRIPT DEFINITION
    // ==================================================

    /*
     * Exemples détectés :
     *
     * createUser: async ({ userInput }) => {
     *
     * createUser: async function (...) {
     *
     * createUser: function (...) {
     *
     * function createUser(...) {
     *
     * const createUser = ...
     *
     * let createUser = ...
     *
     * var createUser = ...
     */

    const backendDefinitionPatterns = [

        // createUser: async (...) =>
        new RegExp(
            `\\b${safeCombined}\\s*:\\s*async\\s*\\([^)]*\\)\\s*=>`,
            "i"
        ),

        // createUser: async function
        new RegExp(
            `\\b${safeCombined}\\s*:\\s*async\\s+function\\b`,
            "i"
        ),

        // createUser: function
        new RegExp(
            `\\b${safeCombined}\\s*:\\s*function\\b`,
            "i"
        ),

        // function createUser(...)
        new RegExp(
            `\\bfunction\\s+${safeCombined}\\s*\\(`,
            "i"
        ),

        // const createUser =
        new RegExp(
            `\\b(?:const|let|var)\\s+${safeCombined}\\s*=`,
            "i"
        )
    ];


    for (const pattern of backendDefinitionPatterns) {

        if (pattern.test(content)) {
            results.backendDefinition = true;
            break;
        }
    }


    // ==================================================
    // 2. GRAPHQL DEFINITION
    // ==================================================

    /*
     * Exemple :
     *
     * createUser(userInput: AddUserInput!): User
     *
     * Ceci est une définition GraphQL,
     * PAS un appel JavaScript.
     */

    const graphqlDefinitionPattern = new RegExp(
        `\\b${safeCombined}\\s*\\([^)]*\\)\\s*:\\s*[A-Za-z_][A-Za-z0-9_\\[\\]!]*`,
        "i"
    );


    if (graphqlDefinitionPattern.test(content)) {
        results.graphqlDefinition = true;
    }


    // ==================================================
    // 3. FRONTEND / JAVASCRIPT CALL
    // ==================================================

    /*
     * Exemple :
     *
     * createUser({
     *     ...
     * })
     *
     * MAIS seulement si ce n'est PAS une définition
     * GraphQL.
     */

    const callPattern = new RegExp(
        `\\b${safeCombined}\\s*\\(`,
        "i"
    );


    if (
        callPattern.test(content) &&
        !results.backendDefinition &&
        !results.graphqlDefinition
    ) {
        results.frontendCall = true;
    }


    // ==================================================
    // 4. IMPORT
    // ==================================================

    /*
     * Exemples :
     *
     * import { createUser } from ...
     *
     * import createUser from ...
     *
     * const { createUser } = require(...)
     */

    const importPattern = new RegExp(
        `(import[\\s\\S]{0,150}\\b${safeCombined}\\b|require[\\s\\S]{0,150}\\b${safeCombined}\\b)`,
        "i"
    );


    if (importPattern.test(content)) {
        results.import = true;
    }


    // ==================================================
    // 5. SIMPLE MENTION
    // ==================================================

    const genericPattern = new RegExp(
        `\\b${safeCombined}\\b`,
        "i"
    );


    if (genericPattern.test(content)) {
        results.generic = true;
    }


    return results;
}


// ======================================================
// CALCUL DU SCORE
// ======================================================

function calculateScore(filePath, intent) {

    const fileName = path.basename(filePath);

    let content = "";

    try {

        content = fs.readFileSync(
            filePath,
            "utf8"
        );

    } catch (error) {

        return {
            filePath,
            score: 0,
            reasons: []
        };
    }


    const normalizedFileName =
        normalizeText(fileName);

    const normalizedContent =
        normalizeText(content);


    let score = 0;

    const reasons = [];


    const action =
        intent.action?.toLowerCase();

    const entity =
        intent.entity?.toLowerCase();


    const attributes =
        Array.isArray(intent.attributes)
            ? intent.attributes
            : [];


    // ==================================================
    // ENTITY
    // ==================================================

    if (entity) {

        // Entity dans le nom du fichier
        if (
            normalizedFileName.includes(entity)
        ) {

            score += 10;

            reasons.push(
                `Entity "${entity}" found in filename`
            );
        }


        // Entity dans le contenu
        if (
            new RegExp(
                `\\b${escapeRegex(entity)}\\b`,
                "i"
            ).test(normalizedContent)
        ) {

            score += 3;

            reasons.push(
                `Entity "${entity}" found in content`
            );
        }
    }


    // ==================================================
    // ACTION + ENTITY
    // ==================================================

    if (action && entity) {

        const analysis =
            analyzeActionEntity(
                content,
                action,
                entity
            );


        // ----------------------------------------------
        // BACKEND IMPLEMENTATION
        // ----------------------------------------------

        if (analysis.backendDefinition) {

            score += 50;

            reasons.push(
                `Backend implementation of "${action}${entity}" found`
            );
        }


        // ----------------------------------------------
        // GRAPHQL DEFINITION
        // ----------------------------------------------

        if (analysis.graphqlDefinition) {

            score += 35;

            reasons.push(
                `GraphQL definition of "${action}${entity}" found`
            );
        }


        // ----------------------------------------------
        // FRONTEND / JAVASCRIPT CALL
        // ----------------------------------------------

        if (
            analysis.frontendCall &&
            !analysis.backendDefinition &&
            !analysis.graphqlDefinition
        ) {

            score += 20;

            reasons.push(
                `Call to "${action}${entity}" found`
            );
        }


        // ----------------------------------------------
        // IMPORT
        // ----------------------------------------------

        if (
            analysis.import &&
            !analysis.backendDefinition &&
            !analysis.graphqlDefinition &&
            !analysis.frontendCall
        ) {

            score += 5;

            reasons.push(
                `Import of "${action}${entity}" found`
            );
        }


        // ----------------------------------------------
        // GENERIC MENTION
        // ----------------------------------------------

        if (
            analysis.generic &&
            !analysis.backendDefinition &&
            !analysis.graphqlDefinition &&
            !analysis.frontendCall &&
            !analysis.import
        ) {

            score += 2;

            reasons.push(
                `"${action}${entity}" mentioned in content`
            );
        }
    }


    // ==================================================
    // ACTION SEULE
    // ==================================================

    if (action) {

        if (
            normalizedFileName.includes(action)
        ) {

            score += 5;

            reasons.push(
                `Action "${action}" found in filename`
            );
        }
    }


    // ==================================================
    // ATTRIBUTES
    // ==================================================

    for (const attribute of attributes) {

        const normalizedAttribute =
            attribute.toLowerCase();


        if (
            normalizedFileName.includes(
                normalizedAttribute
            )
        ) {

            score += 10;

            reasons.push(
                `Attribute "${attribute}" found in filename`
            );
        }


        if (
            normalizedContent.includes(
                normalizedAttribute
            )
        ) {

            score += 3;

            reasons.push(
                `Attribute "${attribute}" found in content`
            );
        }
    }


    return {
        filePath,
        score,
        reasons
    };
}


// ======================================================
// RANK FILES
// ======================================================

function rankFiles(files, intent) {

    const results = files.map(
        file =>
            calculateScore(
                file,
                intent
            )
    );


    return results
        .filter(
            result =>
                result.score > 0
        )
        .sort(
            (a, b) =>
                b.score - a.score
        );
}


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    rankFiles
};