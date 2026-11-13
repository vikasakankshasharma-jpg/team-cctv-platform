import { register } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve } from "node:path";

const repoRoot = resolve(process.env.CERT_REPO_ROOT ?? process.cwd());
const loaderUrl = new URL("./loader.mjs", import.meta.url).href;
const productionRoot = fileURLToPath(new URL("../", import.meta.url));
const shimRoot = fileURLToPath(new URL("../snapshot-firestore-shim/", import.meta.url));

register(loaderUrl, pathToFileURL(productionRoot), {
  data: { repoRoot, shimRoot },
});
