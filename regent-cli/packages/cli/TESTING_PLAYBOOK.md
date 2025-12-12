# Local Testing Playbook for Generated Agent Projects

This playbook describes how to test CLI-generated agent projects locally when they're not part of the monorepo workspace. This is useful for integration testing and verifying that the CLI generates working projects.

## Problem

When you generate a project using the CLI outside the monorepo, `bun install` fails because:

- Workspace dependencies (`workspace:*`) don't resolve
- Catalog dependencies (`catalog:`) don't resolve
- The generated project isn't part of the monorepo workspace

## Solution: Copy Built Packages to node_modules

The solution is to manually copy the built packages from the monorepo into the generated project's `node_modules` directory, then update their `package.json` files to use `file:` paths instead of workspace/catalog references.

## Prerequisites

1. Build all monorepo packages:

   ```bash
   cd /path/to/regent-sdk
   bun run build
   ```

2. Generate a test project:
   ```bash
   cd /tmp
   bunx /path/to/regent-sdk/packages/cli/dist/index.js test-agent --adapter=hono --template=identity --non-interactive
   cd test-agent
   ```

## Step-by-Step Process

### 1. Create node_modules directory structure

```bash
cd /tmp/test-agent
mkdir -p node_modules/@regent
```

### 2. Copy built packages

Copy the `dist` folder and `package.json` from each built package:

```bash
# From monorepo root
MONOREPO_ROOT=/path/to/regent-sdk
TEST_PROJECT=/tmp/test-agent

# Copy each package
cp -r $MONOREPO_ROOT/packages/types/dist $TEST_PROJECT/node_modules/@regent/types/
cp $MONOREPO_ROOT/packages/types/package.json $TEST_PROJECT/node_modules/@regent/types/

cp -r $MONOREPO_ROOT/packages/wallet/dist $TEST_PROJECT/node_modules/@regent/wallet/
cp $MONOREPO_ROOT/packages/wallet/package.json $TEST_PROJECT/node_modules/@regent/wallet/

cp -r $MONOREPO_ROOT/packages/payments/dist $TEST_PROJECT/node_modules/@regent/x402/
cp $MONOREPO_ROOT/packages/payments/package.json $TEST_PROJECT/node_modules/@regent/x402/

cp -r $MONOREPO_ROOT/packages/identity/dist $TEST_PROJECT/node_modules/@regent/erc8004/
cp $MONOREPO_ROOT/packages/identity/package.json $TEST_PROJECT/node_modules/@regent/erc8004/

cp -r $MONOREPO_ROOT/packages/core/dist $TEST_PROJECT/node_modules/@regent/core/
cp $MONOREPO_ROOT/packages/core/package.json $TEST_PROJECT/node_modules/@regent/core/

cp -r $MONOREPO_ROOT/packages/hono/dist $TEST_PROJECT/node_modules/@regent/hono/
cp $MONOREPO_ROOT/packages/hono/package.json $TEST_PROJECT/node_modules/@regent/hono/

# For express adapter (if used)
cp -r $MONOREPO_ROOT/packages/express/dist $TEST_PROJECT/node_modules/@regent/express/
cp $MONOREPO_ROOT/packages/express/package.json $TEST_PROJECT/node_modules/@regent/express/

# For tanstack adapter (if used)
cp -r $MONOREPO_ROOT/packages/tanstack/dist $TEST_PROJECT/node_modules/@regent/tanstack/
cp $MONOREPO_ROOT/packages/tanstack/package.json $TEST_PROJECT/node_modules/@regent/tanstack/
```

### 3. Update package.json files in node_modules

Update each copied package's `package.json` to:

- Remove `devDependencies` (not needed for runtime)
- Replace `workspace:*` with `file:../<package-name>` paths
- Replace `catalog:` with actual versions

You can use this Node.js script:

```javascript
const fs = require('fs');
const path = require('path');

const packages = [
  'types',
  'wallet',
  'payments',
  'identity',
  'core',
  'hono',
  'express',
  'tanstack',
];
const basePath = 'node_modules/@regent';
const catalogVersions = {
  zod: '^4.1.12',
  hono: '4.10.1',
  typescript: '^5.9.2',
  tsup: '^8.5.0',
  '@ax-llm/ax': '^14.0.31',
  'x402-fetch': 'latest',
  x402: '^0.7.1',
};

packages.forEach(pkg => {
  const pkgPath = path.join(basePath, pkg, 'package.json');
  if (!fs.existsSync(pkgPath)) return;

  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  // Remove devDependencies
  delete pkgJson.devDependencies;

  // Replace workspace:* with file: paths
  if (pkgJson.dependencies) {
    Object.keys(pkgJson.dependencies).forEach(dep => {
      if (
        pkgJson.dependencies[dep] === 'workspace:*' &&
        dep.startsWith('@regent/')
      ) {
        const depName = dep.replace('@regent/', '');
        pkgJson.dependencies[dep] = 'file:../' + depName;
      } else if (pkgJson.dependencies[dep] === 'catalog:') {
        pkgJson.dependencies[dep] = catalogVersions[dep] || 'latest';
      }
    });
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n');
  console.log('Updated', pkg);
});
```

Save this as `fix-packages.js` and run:

```bash
cd /tmp/test-agent
node fix-packages.js
```

### 4. Update test project's package.json

Update the test project's `package.json` to use `file:` paths:

```json
{
  "dependencies": {
    "@regent/core": "file:./node_modules/@regent/core",
    "@regent/hono": "file:./node_modules/@regent/hono",
    "@regent/wallet": "file:./node_modules/@regent/wallet",
    "@regent/erc8004": "file:./node_modules/@regent/erc8004",
    "@regent/types": "file:./node_modules/@regent/types",
    "zod": "^4.1.12",
    "viem": "^2.41.2",
    "hono": "^4.10.1"
  }
}
```

### 5. Install external dependencies

```bash
cd /tmp/test-agent
bun install
```

This will install external dependencies (zod, viem, hono, etc.) while using the local copies of `@regent/*` packages.

### 6. Run the project

```bash
cd /tmp/test-agent
bun run dev
```

## Automated Script

You can create a helper script to automate this process:

```bash
#!/bin/bash
# test-generated-project.sh

MONOREPO_ROOT="${1:-$(pwd)}"
TEST_PROJECT="${2:-/tmp/test-agent}"

if [ ! -d "$MONOREPO_ROOT/packages" ]; then
  echo "Error: $MONOREPO_ROOT doesn't appear to be the monorepo root"
  exit 1
fi

if [ ! -d "$TEST_PROJECT" ]; then
  echo "Error: Test project $TEST_PROJECT doesn't exist"
  exit 1
fi

echo "Copying packages from $MONOREPO_ROOT to $TEST_PROJECT..."

cd "$TEST_PROJECT"
mkdir -p node_modules/@regent

# Copy packages
for pkg in types wallet payments identity core hono express tanstack; do
  if [ -d "$MONOREPO_ROOT/packages/$pkg/dist" ]; then
    echo "Copying $pkg..."
    cp -r "$MONOREPO_ROOT/packages/$pkg/dist" "node_modules/@regent/$pkg/"
    cp "$MONOREPO_ROOT/packages/$pkg/package.json" "node_modules/@regent/$pkg/"
  fi
done

# Run the Node.js fix script
node << 'EOF'
const fs = require('fs');
const path = require('path');

const packages = ['types', 'wallet', 'payments', 'identity', 'core', 'hono', 'express', 'tanstack'];
const basePath = 'node_modules/@regent';
const catalogVersions = {
  'zod': '^4.1.12',
  'hono': '4.10.1',
  'typescript': '^5.9.2',
  'tsup': '^8.5.0',
  '@ax-llm/ax': '^14.0.31',
  'x402-fetch': 'latest',
  'x402': '^0.7.1',
};

packages.forEach(pkg => {
  const pkgPath = path.join(basePath, pkg, 'package.json');
  if (!fs.existsSync(pkgPath)) return;

  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  delete pkgJson.devDependencies;

  if (pkgJson.dependencies) {
    Object.keys(pkgJson.dependencies).forEach(dep => {
      if (pkgJson.dependencies[dep] === 'workspace:*' && dep.startsWith('@regent/')) {
        const depName = dep.replace('@regent/', '');
        pkgJson.dependencies[dep] = 'file:../' + depName;
      } else if (pkgJson.dependencies[dep] === 'catalog:') {
        pkgJson.dependencies[dep] = catalogVersions[dep] || 'latest';
      }
    });
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n');
  console.log('Updated', pkg);
});
EOF

echo "Done! Now run: cd $TEST_PROJECT && bun install && bun run dev"
```

Usage:

```bash
./test-generated-project.sh /path/to/regent-sdk /tmp/test-agent
```

## Testing Different Adapters

To test different adapters, generate projects with different `--adapter` flags:

```bash
# Hono
bunx @regent/create-agent-kit test-hono --adapter=hono --template=identity

# Express
bunx @regent/create-agent-kit test-express --adapter=express --template=identity

# TanStack UI
bunx @regent/create-agent-kit test-tanstack-ui --adapter=tanstack-ui --template=identity

# TanStack Headless
bunx @regent/create-agent-kit test-tanstack-headless --adapter=tanstack-headless --template=identity
```

Then follow the same process for each.

## Troubleshooting

### "Cannot find module '@regent/...'"

- Ensure the package was copied to `node_modules/@regent/<package-name>/`
- Check that `package.json` exists in the package directory
- Verify the `file:` paths in the test project's `package.json` are correct

### "Workspace dependency not found"

- The package.json files in `node_modules/@regent/*` still have `workspace:*` references
- Re-run the fix script to update them

### "catalog: failed to resolve"

- The package.json files still have `catalog:` references
- Re-run the fix script to replace them with actual versions

### Module resolution errors

- Ensure all packages are built: `cd monorepo && bun run build`
- Check that `dist` folders exist in each package
- Verify the package.json `main` and `exports` fields point to the correct files

## Notes

- This process is only needed for testing outside the monorepo
- In production, packages are published to npm and resolve normally
- The `file:` paths are relative to the package.json location
- You may need to rebuild packages if you make changes to the monorepo
