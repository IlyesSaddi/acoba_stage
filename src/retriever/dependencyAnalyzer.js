const fs = require("fs");
const path = require("path");

function extractImports(filePath) {
    let content;

    try {
        content = fs.readFileSync(filePath, "utf8");
    } catch (error) {
        return [];
    }

    const imports = [];

    // ES6 imports
    const importRegex =
        /import\s+(?:[\s\S]*?)?\s+from\s+['"]([^'"]+)['"]/g;

    // require()
    const requireRegex =
        /require\(\s*['"]([^'"]+)['"]\s*\)/g;

    let match;

    while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }

    while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }

    return imports;
}

function resolveImport(importPath, currentFile) {

    // Ignore external packages
    if (
        !importPath.startsWith(".") &&
        !importPath.startsWith("/")
    ) {
        return null;
    }

    const currentDirectory =
        path.dirname(currentFile);

    let resolved =
        path.resolve(currentDirectory, importPath);

    // Fichier exact
    if (fs.existsSync(resolved)) {
        return resolved;
    }

    // Extensions
    const extensions = [
        ".js",
        ".jsx",
        ".ts",
        ".tsx"
    ];

    for (const extension of extensions) {

        if (
            fs.existsSync(resolved + extension)
        ) {
            return resolved + extension;
        }
    }

    // index.js / index.jsx
    for (const extension of extensions) {

        const indexFile =
            path.join(
                resolved,
                "index" + extension
            );

        if (fs.existsSync(indexFile)) {
            return indexFile;
        }
    }

    return null;
}

function analyzeDependencies(filePath) {

    const imports =
        extractImports(filePath);

    const dependencies = [];

    for (const importPath of imports) {

        const resolved =
            resolveImport(
                importPath,
                filePath
            );

        if (resolved) {
            dependencies.push(resolved);
        }
    }

    return dependencies;
}

module.exports = {
    extractImports,
    analyzeDependencies
};
