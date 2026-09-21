// ============================================================
// SCENARIO REGISTRY
// Loads all scenario configs and exposes a keyword-based finder.
// ============================================================

const creerUtilisateur = require("./creer-utilisateur");
const login = require("./login");
const resetPassword = require("./reset-password");
const nouveauMotDePasse = require("./nouveau-mot-de-passe");
const creerEntreprise = require("./creer-entreprise");
const supprimerEntreprise = require("./supprimer-entreprise");
const creerDevice = require("./creer-device");
const supprimerDevice = require("./supprimer-device");
const modifierDevice = require("./modifier-device");
const modifierRoleUtilisateur = require("./modifier-role-utilisateur");
const ajouterEntrepriseUtilisateur = require("./ajouter-entreprise-utilisateur");
const retirerEntrepriseUtilisateur = require("./retirer-entreprise-utilisateur");

const scenarios = [
  creerUtilisateur,
  nouveauMotDePasse,
  resetPassword,
  login,
  creerEntreprise,
  supprimerEntreprise,
  creerDevice,
  supprimerDevice,
  modifierDevice,
  modifierRoleUtilisateur,
  ajouterEntrepriseUtilisateur,
  retirerEntrepriseUtilisateur
];

/**
 * Normalize a string for keyword matching:
 * lowercases, strips accents, and collapses extra whitespace.
 */
function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(.)\1{2,}/g, "$1")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Levenshtein edit distance between two strings.
 */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    const swap = prev;
    prev = curr;
    curr = swap;
  }
  return prev[n];
}

/**
 * Sliding-window Levenshtein distance (handles typos on a contiguous phrase).
 */
function windowDistance(input, keyword) {
  if (!input || !keyword) return Number.POSITIVE_INFINITY;

  if (input.length < keyword.length) {
    return levenshtein(input, keyword);
  }

  let best = Number.POSITIVE_INFINITY;
  const maxStart = input.length - keyword.length;
  for (let start = 0; start <= maxStart; start++) {
    const window = input.slice(start, start + keyword.length);
    const d = levenshtein(window, keyword);
    if (d < best) best = d;
    if (best === 0) break;
  }

  return best;
}

/**
 * Does a single keyword token approximately equal an input token?
 */
function fuzzyTokenEqual(inputToken, keywordToken) {
  const d = levenshtein(inputToken, keywordToken);
  return d <= Math.max(1, Math.floor(keywordToken.length * 0.3));
}

/**
 * Unordered fuzzy token ("bag") score: every keyword token must appear in the
 * input somewhere (order does not matter), tolerating typos and inserted words.
 * Returns sum of per-token edit distances (0 = exact), Infinity = no match.
 * Order is not enforced, so "oubli du mot de passe" still matches the keyword
 * "mot de passe oublie".
 */
function tokenSubsequenceScore(input, keyword) {
  const inputTokens = input.split(" ");
  const keywordTokens = keyword.split(" ");
  let total = 0;

  for (const kt of keywordTokens) {
    let bestToken = null;
    for (const it of inputTokens) {
      if (fuzzyTokenEqual(it, kt)) {
        if (!bestToken || levenshtein(it, kt) < levenshtein(bestToken, kt)) {
          bestToken = it;
        }
      }
    }
    if (!bestToken) return Number.POSITIVE_INFINITY;
    total += levenshtein(bestToken, kt);
  }

  return total;
}

/**
 * Best fuzzy distance between a normalized keyword and a normalized input
 * (0 = exact match). Combines the sliding-window phrase distance with ordered
 * token subsequence matching so both typos ("unn" -> "un") and inserted words
 * ("créer une nouvelle device") are tolerated.
 */
function fuzzyDistance(input, keyword) {
  const windowed = windowDistance(input, keyword);
  const tokenized = tokenSubsequenceScore(input, keyword);
  return Math.min(windowed, tokenized);
}

/**
 * Tolerated edit distance for a keyword of the given (normalized) length.
 */
function tolerance(keywordLen) {
  return Math.max(1, Math.floor(keywordLen * 0.25));
}

/**
 * Find the best matching scenario for the given user input.
 * Uses fuzzy (Levenshtein) matching against all scenario keywords, so
 * typos and paraphrases ("créer unn device", "créer device nommé h13")
 * still resolve to the right scenario.
 *
 * @param {string} input - The scenario description provided by the user.
 * @returns {object|null} The matched scenario config, or null if no match found.
 */
function findScenario(input) {
  const normalizedInput = normalize(input);
  let bestMatch = null;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestKeywordLen = -1;

  for (const scenario of scenarios) {
    const keywordList = [scenario.name, ...(scenario.keywords || [])];
    for (const keyword of keywordList) {
      const normalizedK = normalize(keyword);
      if (!normalizedK) continue;

      const score = fuzzyDistance(normalizedInput, normalizedK);
      if (score > tolerance(normalizedK.length)) continue;

      // Better score wins; on a tie, the more specific (longer) keyword wins.
      if (score < bestScore || (score === bestScore && normalizedK.length > bestKeywordLen)) {
        bestScore = score;
        bestKeywordLen = normalizedK.length;
        bestMatch = scenario;
      }
    }
  }

  return bestMatch;
}

/**
 * Rank the closest scenarios to the input, even when none match within the
 * tolerance. Used to propose copyable phrases when the user's input is not
 * understood. Score = best fuzzy distance relative to keyword length
 * (lower = closer). Returns [{ name, phrase, score }].
 */
function suggestScenarios(input, limit = 3) {
  const normalizedInput = normalize(input);
  const scored = [];

  for (const scenario of scenarios) {
    const keywordList = [scenario.name, ...(scenario.keywords || [])];
    let bestScore = Number.POSITIVE_INFINITY;

    for (const keyword of keywordList) {
      const normalizedK = normalize(keyword);
      if (!normalizedK) continue;

      const score = fuzzyDistance(normalizedInput, normalizedK);
      const relative = score / Math.max(1, normalizedK.length);
      if (relative < bestScore) bestScore = relative;
    }

    scored.push({ scenario, score: bestScore });
  }

  scored.sort((a, b) => a.score - b.score);

  return scored.slice(0, limit).map(({ scenario, score }) => ({
    name: scenario.name,
    phrase: scenario.name,
    score: Math.round(score * 100) / 100
  }));
}

module.exports = { findScenario, suggestScenarios, normalize, fuzzyDistance, scenarios, scenariosWithSteps: scenarios.map(s => ({ name: s.name, steps: s.steps || [], keywords: s.keywords || [] })) };

