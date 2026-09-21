const { extractKeywords } = require("./keywordExtractor");

const actions = new Set([
    "create",
    "update",
    "delete",
    "login"
]);

const entities = new Set([
    "user",
    "company",
    "device",
    "camera"
]);

const attributes = new Set([
    "role"
]);

function extractIntent(prompt) {
    const keywords = extractKeywords(prompt);

    const intent = {
        action: null,
        entity: null,
        attributes: [],
        keywords
    };

    for (const keyword of keywords) {
        if (actions.has(keyword)) {
            intent.action = keyword;
        }

        if (entities.has(keyword)) {
            intent.entity = keyword;
        }

        if (attributes.has(keyword)) {
            intent.attributes.push(keyword);
        }
    }

    return intent;
}

module.exports = {
    extractIntent
};
