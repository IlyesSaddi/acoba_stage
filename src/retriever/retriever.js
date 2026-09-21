const {
    analyzeDependencies
} = require("./dependencyAnalyzer");

function enrichResults(rankedFiles, maxPrimaryFiles = 5) {

    const results = [...rankedFiles];

    const existingFiles =
        new Set(results.map(r => r.filePath));

    const primaryFiles =
        rankedFiles.slice(0, maxPrimaryFiles);

    for (const primary of primaryFiles) {

        const dependencies =
            analyzeDependencies(
                primary.filePath
            );

        for (const dependency of dependencies) {

            if (existingFiles.has(dependency)) {
                continue;
            }

            results.push({
                filePath: dependency,

                // Score inférieur au fichier
                // qui a été trouvé directement
                score: Math.max(
                    primary.score - 25,
                    1
                ),

                reasons: [
                    `Dependency of ${primary.filePath}`
                ],

                relation: "dependency"
            });

            existingFiles.add(dependency);
        }
    }

    return results;
}

module.exports = {
    enrichResults
};
