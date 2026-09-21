const path = require("path");
const { scanDirectory } = require("./retriever/scanner");

const projectPath = process.argv[2];

if (!projectPath) {
    console.log("Usage:");
    console.log(
        "node src/test-scanner.js /chemin/vers/ton/projet"
    );
    process.exit(1);
}

const absolutePath = path.resolve(projectPath);

const files = scanDirectory(absolutePath);

console.log(`\n${files.length} fichiers trouvés:\n`);

files.forEach(file => {
    console.log(file);
});