# AGENTS.md

## Project Instructions for AI Agents

### Type & format Checking

**Always run type checking & prettier after making changes:**

```bash
bun run types
bun run format
```

This project uses strict TypeScript. Ensure all new code passes type checking before considering a task complete.

### Type Error Debugging

When a TS error mentions an unexpected `undefined` in a type (e.g. `Type 'X | undefined' is not assignable to type 'X'`):

1. Read the source file where the type/constant is defined to rule out bad data.
2. Check `tsconfig.json` for `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` — these flags widen types without any visible `?` in the code. `noUncheckedIndexedAccess` makes every indexed array access (`arr[i]`) return `T | undefined`, even when the index is provably in-bounds (e.g. `i % arr.length`).
3. Grep for all usages of the type to find indexed accesses, `Record` lookups, or optional props where `undefined` could enter — error messages often don't point at the actual offending line.

Fix pattern: provide a fallback (`arr[i] ?? defaultValue`) rather than weakening the type.

### Chart Types

Chart.js types are barrel-exported from `utils/chart-types.interface.ts`. This file contains:

- All Chart.js type re-exports (`ChartType`, `ChartData`, `ChartOptions`, etc.)
- Per-chart dataset interfaces (`BarChartDataset`, `PieChartDataset`, etc.)
- Factory functions (`createBarDataset`, `createPieDataset`, etc.)
- Type-safe lookup utilities (`ChartDatasetByType`, `ChartDataByType`)

When working with charts, import from this barrel file rather than directly from `chart.js`.

### Code Style

- Follow existing conventions in the codebase
- Use explicit types over `any`
- Prefer `type` over `interface` for simple type aliases
- Keep imports organized (external first, then internal)
- Imports of components DO NOT require having explicit imports. Simply import the component, then confirm the type is working by running the aformentioned type-check
- use kebab-case for file names & component names within the files themselves
- All `.vue` files need to have their styles on top, component templates in the middle, and scripts on the bottom.
- Interfaces, and string constants MUST have their own dedicated files (`utils/file.constants.ts`, `utils/file.interface.ts`)
  - Exception: `.vue` files can't import types in TS 7.0.2, therefore interfaces are in-file

#### AVOID:

in `.vue` files in the script tag:

```ts
import { computed } from "vue";
import type { ChartDataDTO } from "~/utils/use-chart-data.interface";
```

It is not necessary, nuxt takes care of imports automatically

## NPM imports

Agents MUST NOT import any new packages without explicit permission. If there are existing packages that need to be upgraded, that is the primary exception. Otherwise if you're thinking a package needs to be installed, please prompt the user before taking the action
