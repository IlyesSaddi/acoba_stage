const path = require("path");

const {
    analyzeDependencies
} = require("./retriever/dependencyAnalyzer");

const filePath = path.resolve(
    "../Acoba/Backend_stage2025/graphql/resolvers/Users.js"
);

console.log("\n==============================");
console.log("FILE");
console.log("==============================");

console.log(filePath);

console.log("\n==============================");
console.log("DEPENDENCIES");
console.log("==============================");

const dependencies =
    analyzeDependencies(filePath);

if (dependencies.length === 0) {

    console.log(
        "Aucune dépendance locale trouvée."
    );

} else {

    dependencies.forEach(
        (dependency, index) => {

            console.log(
                `${index + 1}. ${dependency}`
            );

        }
    );
}
