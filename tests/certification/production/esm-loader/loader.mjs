import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, extname, join, normalize, resolve as pathResolve } from "node:path";
import { readFile } from "node:fs/promises";
import ts from "typescript";

let repoRoot = process.cwd();
let shimRoot = "";

export function initialize(data) {
  repoRoot = data?.repoRoot ?? repoRoot;
  shimRoot = data?.shimRoot ?? shimRoot;
}

const TS_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts"]);

function shim(specifier) {
  if (specifier === "next/server") return pathToFileURL(join(shimRoot, "next-server.mjs")).href;
  if (specifier === "firebase-admin") return pathToFileURL(join(shimRoot, "firebase-admin.mjs")).href;
  if (specifier === "firebase-admin/firestore") return pathToFileURL(join(shimRoot, "firebase-admin-firestore.mjs")).href;
  if (specifier === "firebase-admin/app") return pathToFileURL(join(shimRoot, "firebase-admin-app.mjs")).href;
  if (specifier === "firebase-admin/auth") return pathToFileURL(join(shimRoot, "firebase-admin-auth.mjs")).href;
  if (specifier === "firebase-admin/storage") return pathToFileURL(join(shimRoot, "firebase-admin-storage.mjs")).href;
  if (specifier === "next/cache") return pathToFileURL(join(shimRoot, "next-cache.mjs")).href;
  return null;
}

function aliasPath(specifier) {
  if (specifier === "@") return pathToFileURL(join(repoRoot)).href;
  if (specifier.startsWith("@/")) return pathToFileURL(join(repoRoot, specifier.slice(2))).href;
  return null;
}

async function candidateFile(base) {
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.mts`, `${base}.cts`, join(base, "index.ts"), join(base, "index.tsx")];
  for (const candidate of candidates) {
    try { await readFile(candidate); return candidate; } catch {}
  }
  return null;
}

export async function resolve(specifier, context, defaultResolve) {
  const exactShim = shim(specifier);
  if (exactShim) return { url: exactShim, shortCircuit: true };

  const alias = aliasPath(specifier);
  if (alias) {
    const aliasedPath = fileURLToPath(alias);
    const base = normalize(aliasedPath).split(/[\\/]/).pop() ?? "";
    if (/^cached-catalog(?:\.(?:ts|tsx|js|mjs))?$/.test(base)) {
      return { url: pathToFileURL(join(shimRoot, "cached-catalog.mjs")).href, shortCircuit: true };
    }
    if (/^cached-settings(?:\.(?:ts|tsx|js|mjs))?$/.test(base)) {
      return { url: pathToFileURL(join(shimRoot, "cached-settings.mjs")).href, shortCircuit: true };
    }
    const candidate = await candidateFile(aliasedPath);
    if (candidate) return { url: pathToFileURL(candidate).href, shortCircuit: true };
  }

  try {
    const resolved = await defaultResolve(specifier, context, defaultResolve);
    if (resolved?.url?.startsWith("file:")) {
      const pathname = normalize(fileURLToPath(resolved.url));
      const base = pathname.split(/[\\/]/).pop() ?? "";
      if (/^(cached-catalog|cached-settings)\.(ts|tsx|js|mjs)$/.test(base)) {
        const shimName = base.startsWith("cached-catalog") ? "cached-catalog.mjs" : "cached-settings.mjs";
        return { url: pathToFileURL(join(shimRoot, shimName)).href, shortCircuit: true };
      }
      if (!extname(pathname)) {
        const candidate = await candidateFile(pathname);
        if (candidate) return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
    return resolved;
  } catch (error) {
    if (specifier.startsWith(".") || specifier.startsWith("/")) {
      const parent = context.parentURL && context.parentURL.startsWith("file:") ? dirname(fileURLToPath(context.parentURL)) : repoRoot;
      const candidate = await candidateFile(pathResolve(parent, specifier));
      if (candidate) return { url: pathToFileURL(candidate).href, shortCircuit: true };
    }
    throw error;
  }
}

export async function load(url, context, defaultLoad) {
  if (url.startsWith("file:")) {
    const pathname = fileURLToPath(url);
    if (TS_EXTENSIONS.has(extname(pathname))) {
      const source = await readFile(pathname, "utf8");
      const format = extname(pathname) === ".tsx" ? "module" : "module";
      const transpiled = ts.transpileModule(source, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          jsx: ts.JsxEmit.ReactJSX,
          sourceMap: false,
        },
        fileName: pathname,
      }).outputText;
      return { format, source: transpiled, shortCircuit: true };
    }
  }
  return defaultLoad(url, context, defaultLoad);
}
