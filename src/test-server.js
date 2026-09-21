require("dotenv").config();

const http = require("http");
const path = require("path");
const { spawn } = require("child_process");
const { findScenario, suggestScenarios, scenarios } = require("../scenarios/index");

const PORT = process.env.TEST_SERVER_PORT || 3100;
const ROOT = path.join(__dirname, "..");
const ALLOWED_ORIGINS = (process.env.TEST_SERVER_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173").split(",").map(s => s.trim());

let running = false;

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}

function readBody(req, callback) {
  let data = "";
  req.on("data", chunk => { data += chunk; });
  req.on("end", () => {
    try {
      callback(JSON.parse(data || "{}"));
    } catch (err) {
      callback({});
    }
  });
}

function handleResolve(res, query) {
  const matched = findScenario(query);
  const suggestions = suggestScenarios(query, 3);
  sendJson(res, 200, { query, matched: matched ? { name: matched.name, steps: (matched.steps || []).length } : null, suggestions });
}

function handleRun(res, reqBody) {
  if (running) {
    sendJson(res, 409, { error: "Un test est déjà en cours d'exécution." });
    return;
  }
  const query = (reqBody.query || "").trim() || (reqBody.scenario || "").trim();
  if (!query) {
    sendJson(res, 400, { error: "Le champ 'query' (scénario) est requis." });
    return;
  }

  const fresh = reqBody.fresh === true || reqBody.fresh === "true";
  const matched = findScenario(query);

  running = true;

  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Transfer-Encoding": "chunked",
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*",
    "X-Ai-Tests-Started": "1"
  });

  res.write(`Interprété comme: ${matched ? matched.name : "?"}\n`);
  res.write(`Lancement: node src/run-and-heal.js "${query}"${fresh ? " --fresh" : ""}\n`);
  res.write("==========================================\n\n");

  const args = ["src/run-and-heal.js", query];
  if (fresh) args.push("--fresh");

  const child = spawn("node", args, { cwd: ROOT });

  let ended = false;

  const killTimer = setTimeout(() => {
    child.kill("SIGKILL");
    res.write("\n[Timeout: arrêt forcé après 20 min]\n");
    res.end();
    running = false;
  }, 20 * 60 * 1000);

  child.stdout.on("data", d => { if (!ended) res.write(d); });
  child.stderr.on("data", d => { if (!ended) res.write(d); });

  child.on("close", code => {
    clearTimeout(killTimer);
    ended = true;
    if (!res.writableEnded) {
      res.write(`\n[process terminé avec code ${code}]\n`);
      res.end();
    }
    running = false;
  });

  child.on("error", err => {
    clearTimeout(killTimer);
    ended = true;
    if (!res.writableEnded) {
      res.write(`\n[erreur lancement: ${err.message}]\n`);
      res.end();
    }
    running = false;
  });

  // Si le client se déconnecte (refresh/fermeture d'onglet), on tue le test
  res.on("close", () => {
    if (!ended) {
      child.kill("SIGKILL");
      running = false;
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/api/scenarios") {
    sendJson(res, 200, { scenarios: scenarios.map(s => s.name) });
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && req.url === "/api/resolve") {
    readBody(req, body => handleResolve(res, body.query || ""));
    return;
  }

  if (req.method === "POST" && req.url === "/api/run") {
    readBody(req, body => handleRun(res, body));
    return;
  }

  sendJson(res, 404, { error: "Route inconnue." });
});

server.listen(PORT, () => {
  console.log(`\n  AI Test Server prêt: http://localhost:${PORT}`);
  console.log(`  - POST /api/resolve   { "query": "créer unn device" }`);
  console.log(`  - POST /api/run       { "query": "créer unn device", "fresh": true }`);
  console.log(`  - GET  /api/scenarios`);
  console.log(`  - CORS autorisé pour: ${ALLOWED_ORIGINS.join(", ")}\n`);
});