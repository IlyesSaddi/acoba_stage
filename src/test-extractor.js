const { rankFiles } =
    require("./retriever/fileRanker");

const {
    extractFromRankedFiles
} = require("./retriever/codeExtractor");


// ======================================================
// PROJECT FILES
// ======================================================

const files = [

    "/home/ilyess/web - Devops/Acoba/Backend_stage2025/graphql/resolvers/Users.js",

    "/home/ilyess/web - Devops/Acoba/Backend_stage2025/graphql/schema/index.js",

    "/home/ilyess/web - Devops/Acoba/Frontend_stage2025/src/components/Login.jsx",

    "/home/ilyess/web - Devops/Acoba/Backend_stage2025/models/User.js"

];


// ======================================================
// INTENT
// ======================================================

const intent = {

    action: "create",

    entity: "user",

    attributes: [],

    keywords: [
        "create",
        "user"
    ]

};


// ======================================================
// RANK
// ======================================================

const rankedFiles =
    rankFiles(
        files,
        intent
    );


// ======================================================
// EXTRACT
// ======================================================

const extractedFiles =
    extractFromRankedFiles(
        rankedFiles,
        intent,
        {
            contextBefore: 5,
            contextAfter: 15
        }
    );


// ======================================================
// DISPLAY
// ======================================================

console.log(
    "\n=============================="
);

console.log(
    "EXTRACTED CODE"
);

console.log(
    "==============================\n"
);


for (
    const file
    of extractedFiles
) {

    console.log(
        `\n### ${file.fileName}`
    );

    console.log(
        `Score: ${file.score}`
    );

    console.log(
        `Matched: ${file.matched}`
    );

    console.log(
        "\n------------------------------"
    );

    console.log(
        file.code
    );

    console.log(
        "------------------------------\n"
    );
}
