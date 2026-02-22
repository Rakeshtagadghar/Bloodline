import { createServer } from "node:http";
import { stat, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "apps", "web", "e2e-harness");
const host = "127.0.0.1";
const port = 4173;

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"]
]);

function safePathname(urlPathname) {
  const decoded = decodeURIComponent(urlPathname);
  const withoutLeading = decoded.replace(/^\/+/, "");
  const normalized = path.normalize(withoutLeading || "index.html").replace(/^(\.\.[/\\])+/, "");
  return normalized.replace(/^[/\\]+/, "");
}

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url ?? "/", `http://${host}:${port}`);
    let relativePath = safePathname(requestUrl.pathname);
    if (relativePath === "." || relativePath === "/") {
      relativePath = "index.html";
    }
    if (relativePath.endsWith(path.sep)) {
      relativePath = path.join(relativePath, "index.html");
    }

    let filePath = path.resolve(publicDir, relativePath);
    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    let fileStat;
    try {
      fileStat = await stat(filePath);
      if (fileStat.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
    } catch {
      filePath = path.join(publicDir, "index.html");
    }

    const ext = path.extname(filePath);
    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes.get(ext) ?? "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Server error: ${error instanceof Error ? error.message : String(error)}`);
  }
});

server.listen(port, host, () => {
  // Playwright waits for the URL to respond; keep startup log concise.
  console.log(`e2e harness: http://${host}:${port}`);
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
