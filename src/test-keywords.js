const { extractKeywords } = require("./retriever/keywordExtractor");

const prompt = process.argv.slice(2).join(" ");

if (!prompt) {
    console.log("Usage:");
    console.log(
        'node src/test-keywords.js "Tester la création d\'un utilisateur"'
    );
    process.exit(1);
}

const keywords = extractKeywords(prompt);

console.log("\nPrompt :");
console.log(prompt);

console.log("\nMots-clés :");
console.log(keywords);