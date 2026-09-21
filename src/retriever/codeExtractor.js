const fs = require("fs");
const path = require("path");


// ======================================================
// NORMALIZE
// ======================================================

function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


// ======================================================
// ESCAPE REGEX
// ======================================================

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


// ======================================================
// EXTRACT LINES AROUND MATCH
// ======================================================

function extractAroundMatches(
    content,
    keywords,
    contextBefore = 5,
    contextAfter = 15
) {

    const lines = content.split("\n");

    const normalizedKeywords =
        keywords.map(keyword =>
            normalizeText(keyword)
        );

    const matchingLines = new Set();


    // --------------------------------------------------
    // Find lines containing keywords
    // --------------------------------------------------

    lines.forEach((line, index) => {

        const normalizedLine =
            normalizeText(line);

        for (const keyword of normalizedKeywords) {

            if (
                keyword &&
                normalizedLine.includes(keyword)
            ) {

                const start =
                    Math.max(
                        0,
                        index - contextBefore
                    );

                const end =
                    Math.min(
                        lines.length,
                        index + contextAfter + 1
                    );


                for (
                    let i = start;
                    i < end;
                    i++
                ) {

                    matchingLines.add(i);

                }

                break;
            }
        }
    });


    if (matchingLines.size === 0) {
        return "";
    }


    // --------------------------------------------------
    // Convert indexes to sorted array
    // --------------------------------------------------

    const indexes =
        [...matchingLines].sort(
            (a, b) => a - b
        );


    // --------------------------------------------------
    // Build blocks
    // --------------------------------------------------

    const blocks = [];

    let currentBlock = [];
    let previousIndex = null;


    for (const index of indexes) {

        if (
            previousIndex !== null &&
            index > previousIndex + 1
        ) {

            blocks.push(
                currentBlock
            );

            currentBlock = [];
        }


        currentBlock.push(index);

        previousIndex = index;
    }


    if (currentBlock.length > 0) {
        blocks.push(currentBlock);
    }


    // --------------------------------------------------
    // Convert blocks to text
    // --------------------------------------------------

    return blocks
        .map(block => {

            const start = block[0];
            const end =
                block[block.length - 1];

            return lines
                .slice(start, end + 1)
                .join("\n");

        })
        .join(
            "\n\n// ==============================\n\n"
        );
}


// ======================================================
// EXTRACT IMPORTS
// ======================================================

function extractImports(content) {

    const lines =
        content.split("\n");

    const imports = [];


    for (const line of lines) {

        const trimmed =
            line.trim();


        // ES module
        if (
            trimmed.startsWith("import ")
        ) {

            imports.push(line);
            continue;
        }


        // CommonJS
        if (
            trimmed.includes("require(")
        ) {

            imports.push(line);
        }
    }


    return imports.join("\n");
}


// ======================================================
// EXTRACT EXPORTS
// ======================================================

function extractExports(content) {

    const lines =
        content.split("\n");

    const exports = [];


    for (const line of lines) {

        const trimmed =
            line.trim();


        if (
            trimmed.startsWith("module.exports") ||
            trimmed.startsWith("export ")
        ) {

            exports.push(line);
        }
    }


    return exports.join("\n");
}


// ======================================================
// EXTRACT FILE
// ======================================================

function extractRelevantCode(
    filePath,
    intent,
    options = {}
) {

    const {
        contextBefore = 5,
        contextAfter = 15
    } = options;


    // --------------------------------------------------
    // Read file
    // --------------------------------------------------

    let content = "";

    try {

        content =
            fs.readFileSync(
                filePath,
                "utf8"
            );

    } catch (error) {

        return {
            filePath,
            fileName: path.basename(filePath),
            code: "",
            error: error.message
        };
    }


    const action =
        intent.action || "";

    const entity =
        intent.entity || "";


    const keywords = [
        action,
        entity,
        `${action}${entity}`
    ];


    // Add attributes
    if (
        Array.isArray(intent.attributes)
    ) {

        keywords.push(
            ...intent.attributes
        );
    }


    // Remove duplicates
    const uniqueKeywords =
        [...new Set(
            keywords
                .filter(Boolean)
                .map(keyword =>
                    normalizeText(keyword)
                )
        )];


    // --------------------------------------------------
    // Extract relevant code
    // --------------------------------------------------

    const relevantCode =
        extractAroundMatches(
            content,
            uniqueKeywords,
            contextBefore,
            contextAfter
        );


    // --------------------------------------------------
    // Extract imports
    // --------------------------------------------------

    const imports =
        extractImports(content);


    // --------------------------------------------------
    // Extract exports
    // --------------------------------------------------

    const exports =
        extractExports(content);


    // --------------------------------------------------
    // Build final context
    // --------------------------------------------------

    let finalCode = "";


    if (imports) {

        finalCode +=
            "// IMPORTS\n" +
            imports +
            "\n\n";
    }


    if (relevantCode) {

        finalCode +=
            "// RELEVANT CODE\n" +
            relevantCode +
            "\n\n";
    }


    if (exports) {

        finalCode +=
            "// EXPORTS\n" +
            exports +
            "\n";
    }


    return {

        filePath,

        fileName:
            path.basename(filePath),

        code:
            finalCode.trim(),

        matched:
            Boolean(relevantCode),

        keywords:
            uniqueKeywords
    };
}


// ======================================================
// EXTRACT FROM RANKED FILES
// ======================================================

function extractFromRankedFiles(
    rankedFiles,
    intent,
    options = {}
) {

    return rankedFiles.map(
        result => {

            const extracted =
                extractRelevantCode(
                    result.filePath,
                    intent,
                    options
                );


            return {

                ...extracted,

                score:
                    result.score,

                reasons:
                    result.reasons
            };
        }
    );
}


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    extractRelevantCode,
    extractFromRankedFiles
};
