const path = require("path");


// ============================================================
// WORKFLOW CONFIGURATION
// ============================================================
//
// Cette configuration décrit les relations métier connues.
// Elle ne génère pas le test elle-même.
// Elle aide le LLM à comprendre le rôle des fonctions trouvées.
//
// ============================================================

const WORKFLOW_RULES = {

    createUser: {

        main: [
            "createUser",
            "confirmUser"
        ],

        alternative: [
            "resendConfirmationEmail"
        ],

        unrelated: [
            "login",
            "users"
        ]
    }

};


// ============================================================
// NORMALIZE
// ============================================================

function normalize(value) {

    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

}


// ============================================================
// DETECT FUNCTIONS PRESENT IN EXTRACTED CODE
// ============================================================

function detectWorkflowFunctions(extractedFiles) {

    const detected = {

        main: [],
        alternative: [],
        unrelated: [],
        unknown: []

    };


    const rules = WORKFLOW_RULES.createUser;


    for (const file of extractedFiles) {

        const code =
            String(file.code || "");

        const normalizedCode =
            normalize(code);


        // ================================================
        // MAIN WORKFLOW
        // ================================================

        for (const functionName of rules.main) {

            if (
                normalizedCode.includes(
                    normalize(functionName)
                )
            ) {

                if (
                    !detected.main.some(
                        item =>
                            item.function === functionName
                    )
                ) {

                    detected.main.push({

                        function: functionName,

                        file: file.fileName,

                        filePath: file.filePath,

                        score: file.score

                    });

                }

            }

        }


        // ================================================
        // ALTERNATIVE
        // ================================================

        for (
            const functionName
            of rules.alternative
        ) {

            if (
                normalizedCode.includes(
                    normalize(functionName)
                )
            ) {

                if (
                    !detected.alternative.some(
                        item =>
                            item.function === functionName
                    )
                ) {

                    detected.alternative.push({

                        function: functionName,

                        file: file.fileName,

                        filePath: file.filePath,

                        score: file.score

                    });

                }

            }

        }


        // ================================================
        // UNRELATED
        // ================================================

        for (
            const functionName
            of rules.unrelated
        ) {

            if (
                normalizedCode.includes(
                    normalize(functionName)
                )
            ) {

                if (
                    !detected.unrelated.some(
                        item =>
                            item.function === functionName
                    )
                ) {

                    detected.unrelated.push({

                        function: functionName,

                        file: file.fileName,

                        filePath: file.filePath,

                        score: file.score

                    });

                }

            }

        }

    }


    return detected;
}


// ============================================================
// CLASSIFY FILE
// ============================================================

function classifyFile(
    file,
    detectedFunctions
) {

    const code =
        String(file.code || "");

    const normalizedCode =
        normalize(code);


    let role = "supporting";


    // ================================================
    // MAIN WORKFLOW
    // ================================================

    for (
        const item
        of detectedFunctions.main
    ) {

        if (
            normalizedCode.includes(
                normalize(item.function)
            )
        ) {

            return "main-workflow";

        }

    }


    // ================================================
    // ALTERNATIVE
    // ================================================

    for (
        const item
        of detectedFunctions.alternative
    ) {

        if (
            normalizedCode.includes(
                normalize(item.function)
            )
        ) {

            return "alternative-workflow";

        }

    }


    // ================================================
    // UNRELATED
    // ================================================

    const unrelatedFunctions =
        detectedFunctions.unrelated;


    let unrelatedCount = 0;


    for (
        const item
        of unrelatedFunctions
    ) {

        if (
            normalizedCode.includes(
                normalize(item.function)
            )
        ) {

            unrelatedCount++;

        }

    }


    // Si le fichier contient uniquement
    // des fonctions non pertinentes.

    if (
        unrelatedCount > 0 &&
        unrelatedCount >=
        detectedFunctions.main.length +
        detectedFunctions.alternative.length
    ) {

        role = "unrelated";

    }


    return role;
}


// ============================================================
// BUILD FILE CONTEXT
// ============================================================

function buildFileContext(
    file,
    role
) {

    let context = "";


    context += `

------------------------------------------------------------
FILE
------------------------------------------------------------

Name:
${file.fileName}

Path:
${file.filePath}

Rank score:
${file.score}

Workflow role:
${role}


------------------------------------------------------------
CODE
------------------------------------------------------------

${file.code || "// No code extracted"}

`;


    return context;
}


// ============================================================
// BUILD WORKFLOW CONTEXT
// ============================================================

function buildWorkflowContext(
    scenario,
    intent,
    extractedFiles
) {

    const detectedFunctions =
        detectWorkflowFunctions(
            extractedFiles
        );


    const classifiedFiles = {


        main: [],

        alternative: [],

        supporting: [],

        unrelated: []

    };


    // ========================================================
    // CLASSIFY ALL FILES
    // ========================================================

    for (
        const file
        of extractedFiles
    ) {

        const role =
            classifyFile(
                file,
                detectedFunctions
            );


        if (
            role === "main-workflow"
        ) {

            classifiedFiles.main.push(
                file
            );

        }

        else if (
            role === "alternative-workflow"
        ) {

            classifiedFiles.alternative.push(
                file
            );

        }

        else if (
            role === "unrelated"
        ) {

            classifiedFiles.unrelated.push(
                file
            );

        }

        else {

            classifiedFiles.supporting.push(
                file
            );

        }

    }


    // ========================================================
    // BUILD CONTEXT
    // ========================================================

    let context = "";


    context += `
============================================================
TEST SCENARIO
============================================================

${scenario}


============================================================
INTENT
============================================================

Action:
${intent.action}

Entity:
${intent.entity}

Keywords:
${(intent.keywords || []).join(", ")}


============================================================
WORKFLOW INTERPRETATION
============================================================

The requested feature is:

${intent.action} ${intent.entity}


The extracted project code has been classified into:

MAIN WORKFLOW
    ↓
Required steps directly related to the requested feature.

ALTERNATIVE WORKFLOW
    ↓
Optional or error-recovery paths related to the feature.

SUPPORTING CODE
    ↓
Models, schemas, utilities, imports, or infrastructure needed
to understand the workflow.

UNRELATED CODE
    ↓
Functions found in the same files but not part of the requested
workflow.


============================================================
MAIN WORKFLOW FUNCTIONS
============================================================

`;


    if (
        detectedFunctions.main.length === 0
    ) {

        context +=
            "No main workflow function was explicitly detected.\n";

    }

    else {

        for (
            const item
            of detectedFunctions.main
        ) {

            context += `
- ${item.function}
  File: ${item.file}
  Score: ${item.score}
`;

        }

    }


    context += `

============================================================
ALTERNATIVE WORKFLOW FUNCTIONS
============================================================

`;


    if (
        detectedFunctions.alternative.length === 0
    ) {

        context +=
            "No alternative workflow function was detected.\n";

    }

    else {

        for (
            const item
            of detectedFunctions.alternative
        ) {

            context += `
- ${item.function}
  File: ${item.file}
  Score: ${item.score}
`;

        }

    }


    context += `

============================================================
UNRELATED FUNCTIONS DETECTED
============================================================

`;


    if (
        detectedFunctions.unrelated.length === 0
    ) {

        context +=
            "No explicitly unrelated function was detected.\n";

    }

    else {

        for (
            const item
            of detectedFunctions.unrelated
        ) {

            context += `
- ${item.function}
  File: ${item.file}
`;

        }

    }


    // ========================================================
    // MAIN FILES
    // ========================================================

    context += `

============================================================
MAIN WORKFLOW CODE
============================================================
`;


    for (
        const file
        of classifiedFiles.main
    ) {

        context +=
            buildFileContext(
                file,
                "MAIN WORKFLOW"
            );

    }


    // ========================================================
    // ALTERNATIVE FILES
    // ========================================================

    context += `

============================================================
ALTERNATIVE WORKFLOW CODE
============================================================
`;


    for (
        const file
        of classifiedFiles.alternative
    ) {

        context +=
            buildFileContext(
                file,
                "ALTERNATIVE WORKFLOW"
            );

    }


    // ========================================================
    // SUPPORTING FILES
    // ========================================================

    context += `

============================================================
SUPPORTING CODE
============================================================
`;


    for (
        const file
        of classifiedFiles.supporting
    ) {

        context +=
            buildFileContext(
                file,
                "SUPPORTING CODE"
            );

    }


    // ========================================================
    // UNRELATED FILES
    // ========================================================

    context += `

============================================================
UNRELATED CODE
============================================================

The following code may contain functions that are not required
for the requested workflow. Do not execute them unless another
dependency demonstrates that they are required.

`;


    for (
        const file
        of classifiedFiles.unrelated
    ) {

        context +=
            buildFileContext(
                file,
                "UNRELATED"
            );

    }


    return {

        context: context.trim(),

        detectedFunctions,

        classifiedFiles

    };

}


// ============================================================
// BUILD LLM PROMPT
// ============================================================

function buildTestGenerationPrompt(
    scenario,
    intent,
    workflowResult
) {

    const workflowContext =
        workflowResult.context;


    return `
You are an expert software test engineer.

Your task is to generate an automated end-to-end regression
test for an EXISTING application.


============================================================
USER REQUEST
============================================================

${scenario}


============================================================
INTENT
============================================================

Action:
${intent.action}

Entity:
${intent.entity}

Keywords:
${(intent.keywords || []).join(", ")}


============================================================
CRITICAL INSTRUCTIONS
============================================================

1. Analyze the complete BUSINESS WORKFLOW.

2. Do not generate a test for only one function.

3. Do not assume that every function in the same file belongs
   to the requested workflow.

4. Do not treat functions marked as UNRELATED as test steps.

5. Distinguish MAIN WORKFLOW from ALTERNATIVE WORKFLOW.

6. MAIN WORKFLOW steps should be used for the main happy-path
   test when they are required by the application behavior.

7. ALTERNATIVE WORKFLOW steps should NOT automatically be
   executed in the main happy-path test.

8. Alternative workflows should be proposed as separate
   scenarios when appropriate.

9. Do not invent application behavior.

10. Do not invent selectors.

11. Do not invent API endpoints.

12. Do not invent routes.

13. Do not invent database behavior.

14. Use the provided source code as the only source of truth.


============================================================
IMPORTANT EXAMPLE
============================================================

For user creation, the workflow may look like:

MAIN:

Create user
    ↓
createUser
    ↓
validate existing user
    ↓
hash password
    ↓
create User document
    ↓
save User
    ↓
send confirmation email
    ↓
confirm account
    ↓
account becomes confirmed


ALTERNATIVE:

Confirmation email is not received
    ↓
resendConfirmationEmail
    ↓
new confirmation link
    ↓
confirm account


IMPORTANT:

resendConfirmationEmail is an alternative/recovery operation.

Do NOT automatically execute it in the main happy-path test.

Similarly, login is not part of user creation unless the
provided application workflow demonstrates that login is required
to complete the requested feature.


============================================================
PROJECT WORKFLOW CONTEXT
============================================================

${workflowContext}


============================================================
YOUR ANALYSIS
============================================================

Determine:

1. Frontend entry point.

2. User actions.

3. GraphQL operation.

4. Backend resolver.

5. Database operations.

6. External services.

7. Required workflow dependencies.

8. Alternative/error branches.

9. Expected results.

10. Missing information.


============================================================
PLAYWRIGHT REQUIREMENTS
============================================================

Generate a deterministic Playwright test.

The test must:

- follow the real application workflow;
- use the real frontend entry point;
- use selectors supported by the provided code;
- wait for asynchronous operations correctly;
- verify important results;
- verify important error states where appropriate;
- avoid unrelated functionality.


If a required selector cannot be determined from the source code,
write:

SELECTOR_NOT_FOUND

Do NOT invent a selector.


============================================================
OUTPUT FORMAT
============================================================

Return exactly:

# 1. WORKFLOW ANALYSIS

Explain the complete workflow.


# 2. MAIN TEST SCENARIO

Describe the main happy-path test.


# 3. ALTERNATIVE / ERROR SCENARIOS

Describe alternative or recovery scenarios separately.


# 4. PLAYWRIGHT TEST

Provide the Playwright test code.


# 5. EXPECTED RESULTS

List the assertions that should pass.


# 6. REQUIRED TEST DATA

List the required test data.


# 7. MISSING INFORMATION

List information that cannot be determined from the source code.
`;
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    buildWorkflowContext,

    buildTestGenerationPrompt,

    detectWorkflowFunctions,

    classifyFile

};