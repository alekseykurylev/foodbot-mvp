<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:payload-agent-rules -->
# Payload Skills Required

This project uses the Payload skill installed by `npx skills add https://github.com/payloadcms/skills --skill payload -a codex --copy -y`. Before writing Payload code, read `.agents/skills/payload/SKILL.md` and the relevant guide in `.agents/skills/payload/reference/`. Heed security and transaction warnings.
<!-- END:payload-agent-rules -->

# Project Instructions

## Stack

- Next.js with React; check exact versions in `package.json`.
- TypeScript, App Router conventions, and ESLint.
- Payload CMS with PostgreSQL; check exact versions in `package.json`.
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

## Project Structure

This project uses an adapted FEOD-style structure with Next.js App Router:

- `app/` — Next.js routing contract only: route segments, `page.tsx`, `layout.tsx`, route handlers, metadata, params, redirects, and `notFound()`.
- `screens/` — screen composition imported by `app/**/page.tsx`; keep route-agnostic React composition here.
- `modules/` — business modules: domain UI, server reads/writes, local model state, bot logic, integrations, and module-owned Payload collections.
- `common/` — shared non-business primitives: UI components, hooks, helpers, CMS utilities, and generic utils.
- `shell/` — application shell: global layout chrome, providers, and top-level integration adapters such as Payload admin graphics.
- `global/` — global styles and global-only assets or shims.
- `migrations/`, `payload-types.ts`, and Payload import maps are framework/generated files; change them only when required by schema/config changes or generation commands.

Do not create a top-level `pages/` folder. Next.js treats it as Pages Router even when the project uses App Router. Use `screens/` for page/screen composition.

## React Performance

- When changing React components, data loading, hooks, client/server boundaries, or bundle-sensitive code, consult Vercel React Best Practices: `https://github.com/vercel-labs/react-best-practices`.
- Prioritize high-impact issues first: async waterfalls, unnecessary client bundles, server-side performance, client-side data fetching, and avoidable re-renders.
- Do not apply micro-optimizations unless they improve a measured or clearly visible issue.

## Payload

- Keep the local Payload skill synced with the current upstream source: `https://github.com/payloadcms/skills/tree/main/skills/payload`.
- Check the installed Payload packages in `package.json` before relying on version-specific APIs.
- Prefer Payload Local API for server-side Payload operations in this project:
  - Use `req.payload` when Payload is available from hooks, access control, validation, endpoints, or other Payload-provided request contexts.
  - Use `getPayload({ config })` for server-side code that runs without an existing Payload `req`, including Next.js Server Components, Server Functions, route handlers, and scripts outside Next.js.
  - Prefer Local API calls over REST/GraphQL or ad hoc database access for internal server-side reads and writes.
  - When Local API operations must respect collection/global access control, explicitly pass `overrideAccess: false` and the current `user` or `req`; remember Local API operations skip access control by default.
  - When operations run inside hooks, transactions, or request-scoped workflows, pass `req` through related Local API calls.
  - Relevant docs: `https://payloadcms.com/docs/local-api/overview`, `https://payloadcms.com/docs/local-api/outside-nextjs`, `https://payloadcms.com/docs/local-api/server-functions`, `https://payloadcms.com/docs/local-api/access-control`.
- Prefer Payload APIs and generated types over ad hoc database access.
- When changing Payload collections, fields, or config, update generated types and migrations when needed.
- Keep `payload-types.ts` and import map changes tied to the schema/config changes that require them.

## Code Style

- Preserve TypeScript strictness and existing formatting.
- Prefer existing helpers, components, and conventions before adding new abstractions.
- Keep edits scoped to the requested behavior.
- Avoid unrelated refactors and generated-file churn.

## Git

- Use Conventional Commits for commit messages: `type(scope): summary`, for example `feat(auth): add login form` or `fix(payload): handle missing relation`. Prefer common types such as `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, and `ci`.

## Safety

- Do not rename environment variables without updating all references and documentation.
- Do not edit generated files unless the change is required by the task.
- Do not remove migrations, lockfiles, or config files unless explicitly requested.

# Communication

Always answer the user in Russian unless the user explicitly asks for another language.
Use English only for code, identifiers, commands, logs, API names, and exact error messages.
