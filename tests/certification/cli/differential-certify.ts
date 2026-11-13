import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { CanonicalRequirement } from '../schema/canonical-requirement.ts';
import { sha256Json } from '../fixtures/frozen-context.ts';
import { runDifferentialCorpus } from '../production/differential-runner.ts';
import { PricingEngineAdapter } from '../production/pricing-engine.adapter.ts';
import type { FrozenContext } from '../types/certification.ts';

type Args = { repo?: string; snapshot?: string; out?: string; seed?: string; cases?: string };

function parseArgs(argv: string[]): Args {
  const flags: Args = {};
  const ALLOWED_FLAGS = new Set(["repo", "snapshot", "out", "seed", "cases"]);
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2) as keyof Args;
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
      if (ALLOWED_FLAGS.has(key)) (flags as any)[key] = value;
      else throw new Error(`Unknown argument: --${key}`);
      i += 1;
    } else positional.push(token);
  }
  return { repo: flags.repo ?? positional[0], snapshot: flags.snapshot ?? positional[1], out: flags.out ?? positional[2], seed: flags.seed, cases: flags.cases };
}

function firstExisting(paths: string[]): string | undefined {
  return paths.map((p) => resolve(p)).find((p) => existsSync(p));
}

async function loadSnapshot(path: string): Promise<FrozenContext> {
  const parsed = JSON.parse(await readFile(path, 'utf8')) as any;
  return parsed?.context && typeof parsed.context === 'object' ? parsed.context as FrozenContext : parsed as FrozenContext;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = resolve(args.repo ?? process.env.CERT_REPO_ROOT ?? process.cwd());
  const snapshotPath = resolve(args.snapshot ?? process.env.CERT_SNAPSHOT ?? firstExisting([
    'CERTIFICATION_SNAPSHOT_BUNDLE.json',
    'tests/certification/snapshots/CERTIFICATION_SNAPSHOT_BUNDLE.json',
  ]) ?? 'CERTIFICATION_SNAPSHOT_BUNDLE.json');
  const outPath = resolve(args.out ?? process.env.CERT_OUT ?? 'certification-discrepancy-report.json');
  if (!existsSync(snapshotPath)) throw new Error(`Snapshot not found: ${snapshotPath}. Pass --snapshot <CERTIFICATION_SNAPSHOT_BUNDLE.json|FrozenContext.json> or set CERT_SNAPSHOT.`);

  const oracleBindingPath = process.env.CERT_ORACLE_BINDING;
  const oracleModule = oracleBindingPath
    ? await import(pathToFileURL(resolve(oracleBindingPath)).href) as { runOracle?: (requirement: CanonicalRequirement, snapshot: FrozenContext) => unknown | Promise<unknown> }
    : await import(pathToFileURL(resolve('tests/certification/oracle/index.ts')).href) as { runOracle?: (requirement: CanonicalRequirement, snapshot: FrozenContext) => unknown | Promise<unknown> };
  if (typeof oracleModule.runOracle !== 'function') throw new Error('Oracle binding must export runOracle(requirement, snapshot).');

  const seed = Number(args.seed ?? process.env.CERT_SEED ?? 20261111);
  const cases = Number(args.cases ?? process.env.CERT_CASES ?? 25);
  const snapshot = await loadSnapshot(snapshotPath);
  const report = await runDifferentialCorpus(new PricingEngineAdapter(), { repoRoot, snapshot, env: process.env }, {
    seed, cases, shrink: process.env.CERT_SHRINK !== '0', oracle: oracleModule.runOracle,
  });
  await writeFile(outPath, JSON.stringify({ ...report, snapshotSha256: sha256Json(snapshot), snapshotPath, repoRoot }, null, 2));
  console.log(JSON.stringify(report.summary));
}
await main();
