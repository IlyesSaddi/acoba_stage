const path = require("path");

const { scanDirectory } =
    require("./retriever/scanner");

const { extractIntent } =
    require("./retriever/intentExtractor");

const { rankFiles } =
    require("./retriever/fileRanker");

const { enrichResults } =
    require("./retriever/retriever");


// ==========================================
// PROMPT
// ==========================================

const prompt =
    process.argv.slice(2).join(" ");

if (!prompt) {
    console.log(
        'Usage: node src/test-ranker.js "Créer un utilisateur"'
    );

    process.exit(1);
}


// ==========================================
// PROJECT
// ==========================================

const projectPath =
    path.resolve("../Acoba");


// ==========================================
// 1. SCAN PROJECT
// ==========================================

const files =
    scanDirectory(projectPath);


// ==========================================
// 2. EXTRACT INTENT
// ==========================================

const intent =
    extractIntent(prompt);


// ==========================================
// 3. RANK FILES
// ==========================================

const rankedFiles =
    rankFiles(files, intent);


// ==========================================
// 4. ENRICH WITH DEPENDENCIES
// ==========================================

const enrichedFiles =
    enrichResults(rankedFiles);


// ==========================================
// OUTPUT
// ==========================================

console.log("\n==============================");
console.log("SCENARIO");
console.log("==============================");

console.log(prompt);


console.log("\n==============================");
console.log("INTENT");
console.log("==============================");

console.log(
    JSON.stringify(intent, null, 2)
);


console.log("\n==============================");
console.log("RELEVANT FILES");
console.log("==============================");

enrichedFiles
    .slice(0, 10)
    .forEach((result, index) => {

        console.log(
            `\n${index + 1}. ${result.filePath}`
        );

        console.log(
            `Score: ${result.score}`
        );

        console.log("Reasons:");

        result.reasons.forEach(reason => {

            console.log(
                `  - ${reason}`
            );

        });

    });