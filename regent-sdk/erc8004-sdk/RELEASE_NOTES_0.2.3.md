# Release Notes: Regent ERC-8004 SDK v0.2.3

## ESM Package

This package is now a native ESM (ECMAScript Module) package. Use `import` statements in your code:

```typescript
import { SDK } from '@regent/erc8004-sdk';
```

**Note:** This package no longer supports CommonJS (`require()`). If you're using CommonJS, you'll need to migrate to ESM or use dynamic imports.

---

## Upgrade Instructions

```bash
npm install @regent/erc8004-sdk@0.2.3
```

