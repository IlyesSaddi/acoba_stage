const stopWords = new Set([
    "le", "la", "les", "l", "un", "une", "des", "du", "de", "d",
    "et", "ou", "à", "au", "aux", "par", "pour", "sur", "dans",
    "depuis", "avec", "sans", "que", "qui", "ce", "cette", "ces",
    "est", "sont", "peut", "peuvent", "tester", "test", "vérifier",
    "verifier", "nouveau", "nouvelle", "nouveaux", "nouvelles", "nouvel",
    "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses",
    "il", "elle", "ils", "elles", "on", "nous", "vous", "svp", "please"
]);

const synonyms = {
    // Actions: Create
    "création": "create",
    "creation": "create",
    "créer": "create",
    "creer": "create",
    "ajouter": "create",
    "ajout": "create",
    "add": "create",
    "inscription": "create",
    "register": "create",
    "signup": "create",

    // Actions: Update / Edit
    "modification": "update",
    "modifier": "update",
    "modifié": "update",
    "modifie": "update",
    "edit": "update",
    "editer": "update",
    "mise": "update",
    "changer": "update",
    "changement": "update",

    // Actions: Delete / Remove
    "suppression": "delete",
    "supprimer": "delete",
    "supprime": "delete",
    "delete": "delete",
    "remove": "delete",
    "retirer": "delete",
    "effacer": "delete",
    "dissocier": "delete",

    // Entities: User
    "utilisateur": "user",
    "utilisateurs": "user",
    "users": "user",
    "compte": "user",
    "comptes": "user",

    // Entities: Role / Admin
    "administrateur": "admin",
    "administrateurs": "admin",
    "role": "role",
    "rôle": "role",
    "roles": "role",
    "rôles": "role",

    // Entities: Company
    "entreprise": "company",
    "entreprises": "company",
    "company": "company",
    "companies": "company",
    "société": "company",
    "societe": "company",
    "sociétés": "company",
    "compagnie": "company",
    "compagnies": "company",

    // Entities: Device
    "appareil": "device",
    "appareils": "device",
    "device": "device",
    "devices": "device",
    "caméra": "camera",
    "camera": "camera",
    "caméras": "camera",
    "cameras": "camera",
    "équipement": "device",
    "equipement": "device",

    // Authentication & Reset
    "connexion": "login",
    "connecter": "login",
    "connecté": "login",
    "connectee": "login",
    "login": "login",
    "signin": "login",
    "authentification": "login",
    "mot de passe": "password",
    "mdp": "password",
    "password": "password",
    "passwords": "password",
    "reinitialisation": "reset",
    "réinitialisation": "reset",
    "reinitialiser": "reset",
    "réinitialiser": "reset",
    "reset": "reset",
    "oublié": "reset",
    "oublie": "reset",
    "forgot": "reset"
};

function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}\s]/gu, " ");
}

function extractKeywords(prompt) {
    const normalized = normalizeText(prompt);

    const words = normalized
        .split(/\s+/)
        .filter(Boolean);

    const keywords = [];

    for (const word of words) {
        if (stopWords.has(word)) {
            continue;
        }

        const keyword = synonyms[word] || word;

        if (!keywords.includes(keyword)) {
            keywords.push(keyword);
        }
    }

    return keywords;
}

module.exports = {
    extractKeywords
};