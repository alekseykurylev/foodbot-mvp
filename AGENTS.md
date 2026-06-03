<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Instructions

## Stack

- Next.js with React; check exact versions in `package.json`.
- TypeScript, App Router conventions, and ESLint.
- Payload CMS with PostgreSQL; check exact versions in `package.json`.
- Mantine for UI components; check exact versions in `package.json`.
- Package manager: pnpm.

## Commands

- Install dependencies: `pnpm install`.
- Run development server: `pnpm dev`.
- Build: `pnpm build`.
- Lint: `pnpm lint`.
- Type-check: `pnpm type-check`.
- Generate Payload import map: `pnpm generate:importmap`.
- Generate Payload types: `pnpm generate:types`.
- Create Payload migration: `pnpm migrate:create`.
- Run Payload migrations and production build: `pnpm run ci`.
- Do not use `pnpm ci`: pnpm treats `ci` as a built-in command, and that command is not implemented.

## Next.js

- Check the installed Next.js version in `package.json` before relying on version-specific behavior.
- Before editing Next.js-specific code, read the relevant local documentation in `node_modules/next/dist/docs/`.
- Do not rely on older Next.js assumptions without verifying them against the local docs.
- Keep server and client component boundaries explicit.
- Prefer existing project routing, data-loading, and component patterns before introducing new ones.

## React Performance

- When changing React components, data loading, hooks, client/server boundaries, or bundle-sensitive code, consult Vercel React Best Practices: `https://github.com/vercel-labs/react-best-practices`.
- Prioritize high-impact issues first: async waterfalls, unnecessary client bundles, server-side performance, client-side data fetching, and avoidable re-renders.
- Do not apply micro-optimizations unless they improve a measured or clearly visible issue.

## Payload

- Check the installed Payload packages in `package.json` before relying on version-specific APIs.
- Prefer Payload APIs and generated types over ad hoc database access.
- When changing Payload collections, fields, or config, update generated types and migrations when needed.
- Keep `payload-types.ts` and import map changes tied to the schema/config changes that require them.

## Mantine

- This project uses Mantine; check exact package versions in `package.json`.
- Before adding or changing Mantine components, styling, forms, or theme code, consult the Mantine LLM documentation: `https://mantine.dev/llms.txt`.
- Prefer Mantine components, hooks, and `@mantine/form` patterns over custom UI/form implementations when they fit the task.
- Follow existing MantineProvider, theme, CSS modules, and PostCSS patterns in this repo.

## Code Style

- Preserve TypeScript strictness and existing formatting.
- Prefer existing helpers, components, and conventions before adding new abstractions.
- Keep edits scoped to the requested behavior.
- Avoid unrelated refactors and generated-file churn.

## Safety

- Do not rename environment variables without updating all references and documentation.
- Do not edit generated files unless the change is required by the task.
- Do not remove migrations, lockfiles, or config files unless explicitly requested.
