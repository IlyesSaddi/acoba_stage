const { extractIntent } = require("./retriever/intentExtractor");

const prompt = process.argv.slice(2).join(" ");

if (!prompt) {
    console.log(
        'Usage: node src/test-intent.js "Créer un utilisateur"'
    );
    process.exit(1);
}

const intent = extractIntent(prompt);

console.log("\n==============================");
console.log("PROMPT");
console.log("==============================");

console.log(prompt);

console.log("\n==============================");
console.log("INTENT");
console.log("==============================");

console.log(JSON.stringify(intent, null, 2));
