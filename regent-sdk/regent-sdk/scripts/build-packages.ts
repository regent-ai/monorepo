import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type Manifest = {
  name?: string;
  scripts?: Record<string, string>;
};

type PackageInfo = {
  dir: string;
  manifest: Manifest;
  name: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const packagesDir = path.join(repoRoot, 'packages');

function collectPackages(): PackageInfo[] {
  if (!existsSync(packagesDir)) return [];

  const entries = readdirSync(packagesDir, { withFileTypes: true });
  const results: PackageInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(packagesDir, entry.name);
    const manifestPath = path.join(dir, 'package.json');
    if (!existsSync(manifestPath)) continue;

    try {
      const manifest = JSON.parse(
        readFileSync(manifestPath, 'utf8')
      ) as Manifest;
      const name = manifest.name ?? path.basename(dir);
      results.push({ dir, manifest, name });
    } catch (err) {
      console.warn(`Skipping ${entry.name}: ${(err as Error).message}`);
    }
  }

  return results;
}

async function exec(argv: string[], cwd: string) {
  const proc = Bun.spawn(argv, {
    cwd,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`${argv.join(' ')} exited with code ${code}`);
  }
}

async function cleanPackages() {
  const packages = collectPackages();

  for (const { manifest, dir, name } of packages) {
    const cleanScript = manifest.scripts?.clean;

    if (!cleanScript) {
      continue;
    }

    console.log(`Cleaning ${name}...`);
    await exec(['bun', 'run', 'clean'], dir);
  }
}

async function buildPackages() {
  const packages = collectPackages();

  if (!packages.length) {
    console.warn('No packages found in packages/ – skipping build step.');
    return;
  }

  // Build order ensures dependencies are built before dependents.
  // Layer 0: Packages with no internal dependencies (types)
  // Layer 1: Extensions that only depend on @regent/types
  // Layer 2: Core runtime that depends on all extensions
  // Layer 3: Adapters that depend on core and extensions
  // Layer 4: ERC-8004 and umbrella SDK
  const preferredOrder = [
    // Layer 0: Base packages with no internal dependencies
    '@regent/types',

    // Layer 1: Extensions (only depend on @regent/types)
    '@regent/wallet',
    '@regent/x402',
    '@regent/analytics',
    '@regent/a2a',
    '@regent/ap2',
    '@regent/http',
    '@regent/scheduler',

    // Layer 2: Core runtime (depends on all extensions)
    '@regent/core',

    // Layer 3: Adapters (depend on core and extensions)
    '@regent/hono',
    '@regent/express',
    '@regent/tanstack',

    // Layer 4: ERC-8004 and umbrella SDK
    '@regent/erc8004',
    'regent-sdk',
  ];

  const packagesByName = new Map(packages.map(pkg => [pkg.name, pkg]));
  const orderedBuildList: PackageInfo[] = [];

  for (const name of preferredOrder) {
    const pkg = packagesByName.get(name);
    if (pkg) {
      orderedBuildList.push(pkg);
      packagesByName.delete(name);
    }
  }

  // Append any remaining packages that weren't explicitly ordered.
  orderedBuildList.push(...packagesByName.values());

  for (const { manifest, dir, name } of orderedBuildList) {
    const buildScript = manifest.scripts?.build;

    if (!buildScript) {
      console.log(`Skipping ${name}: no build script defined.`);
      continue;
    }

    console.log(`Building ${name}...`);
    await exec(['bun', 'run', 'build'], dir);
  }
}

const shouldClean =
  process.argv.includes('--clean') || process.argv.includes('-c');

if (shouldClean) {
  await cleanPackages();
}

await buildPackages().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
