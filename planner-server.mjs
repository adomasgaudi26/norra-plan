import { createServer } from "node:http";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const configuredDataFile = process.env.PLANNER_DATA_FILE;
const dataFile = configuredDataFile
  ? resolve(configuredDataFile)
  : resolve(projectRoot, "data", "planner.json");
const dataDirectory = dirname(dataFile);
const port = Number.parseInt(process.env.PLANNER_PORT ?? "8787", 10) || 8787;
const host = process.env.PLANNER_HOST ?? "127.0.0.1";
const corsOrigin = process.env.PLANNER_CORS_ORIGIN ?? "*";
const emptyPlanner = {
  schemaVersion: 1,
  tasks: [],
  categories: { top: [], bottom: [] },
  ledger: [],
  deletedTaskIds: [],
};

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlannerPayload(value) {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    Array.isArray(value.tasks) &&
    isRecord(value.categories) &&
    Array.isArray(value.categories.top) &&
    Array.isArray(value.categories.bottom) &&
    Array.isArray(value.ledger) &&
    Array.isArray(value.deletedTaskIds)
  );
}

async function ensureDataFile() {
  await mkdir(dataDirectory, { recursive: true });
  try {
    await readFile(dataFile, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeFile(dataFile, `${JSON.stringify(emptyPlanner, null, 2)}\n`, "utf8");
  }
}

async function readPlanner() {
  const raw = await readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw);
  if (!isPlannerPayload(parsed)) {
    throw new Error("data/planner.json does not match the planner schema");
  }
  return parsed;
}

async function readEnvelope() {
  const [planner, fileStats] = await Promise.all([readPlanner(), stat(dataFile)]);
  return { ...planner, revision: fileStats.mtimeMs };
}

async function writePlanner(planner) {
  const temporaryFile = `${dataFile}.${process.pid}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(planner, null, 2)}\n`, "utf8");
  await rename(temporaryFile, dataFile);
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Origin": corsOrigin,
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(body);
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": corsOrigin,
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end(body);
}

function readRequestBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > 8 * 1024 * 1024) {
        rejectBody(new Error("Planner payload is larger than 8 MB"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    request.on("error", rejectBody);
  });
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Origin": corsOrigin,
    });
    response.end();
    return;
  }

  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (requestUrl.pathname === "/api/planner") {
    try {
      if (request.method === "GET") {
        sendJson(response, 200, await readEnvelope());
        return;
      }

      if (request.method === "PUT") {
        const parsed = JSON.parse(await readRequestBody(request));
        if (!isPlannerPayload(parsed)) {
          sendJson(response, 400, { error: "Planner payload does not match schemaVersion 1" });
          return;
        }
        await writePlanner(parsed);
        sendJson(response, 200, await readEnvelope());
        return;
      }

      response.setHeader("Allow", "GET, PUT, OPTIONS");
      sendText(response, 405, "Method not allowed");
      return;
    } catch (error) {
      sendJson(response, 500, { error: error instanceof Error ? error.message : "Planner server error" });
      return;
    }
  }

  if (request.method === "GET" && requestUrl.pathname === "/") {
    sendText(response, 200, "Norra planner server is running. Use GET or PUT /api/planner.\n");
    return;
  }

  sendText(response, 404, "Not found");
});

await ensureDataFile();
server.listen(port, host, () => {
  console.log(`Norra planner server listening at http://${host}:${port}`);
  console.log(`Planner source of truth: ${dataFile}`);
});
