const fs = require("fs");
const path = require("path");

const ignoredFolders = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "coverage"
]);

const allowedExtensions = new Set([
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".graphql",
    ".gql"
]);

function scanDirectory(directory) {
    const results = [];

    const entries = fs.readdirSync(directory, {
        withFileTypes: true
    });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            if (ignoredFolders.has(entry.name)) {
                continue;
            }

            results.push(...scanDirectory(fullPath));
        }

        if (entry.isFile()) {
            const extension = path.extname(entry.name);

            if (allowedExtensions.has(extension)) {
                results.push(fullPath);
            }
        }
    }

    return results;
}

module.exports = {
    scanDirectory
};