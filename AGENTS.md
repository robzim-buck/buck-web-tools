# Repository Guidelines

## Project Structure & Module Organization
- Primary React app lives in `src/`; views under `src/pages`, data-heavy widgets in `src/components`, and route orchestration in `src/components/Routes.jsx`.
- Shared hooks belong in `src/hooks`, Okta configuration stays in `src/config.js` and `.okta.env` (excluded from git).
- Static assets ship from `public/`; production bundles land in `dist/` and should stay out of commits.
- `reference/` holds legacy datasets for context only—do not modify without business sign-off.

## Build, Test, and Development Commands
- Install dependencies with `npm ci` to honor the lockfile.
- `npm start` runs Vite on port 3000 with the Okta auth proxy enabled.
- `npm run build` outputs an optimized bundle to `dist/`; verify before tagging releases.
- `npm run build:analyze` surfaces chunk sizes for dependency tuning, and `npm test` runs Vitest headlessly (`--watch` is optional during local work).

## Coding Style & Naming Conventions
- Use functional React patterns with hooks and Suspense, mirroring `src/components/Routes.jsx` for lazy loading.
- Prefer `.tsx` for new typed components; otherwise keep PascalCase `.jsx` files, camelCase hooks, and descriptive suffixes like `Layout` or `List`.
- Match the existing 2-space indentation, single quotes, trailing semicolons, and grouped/destructured imports.
- Lean on MUI `sx` styling blocks over inline styles; if Prettier/ESLint is added, run it before pushing.

## Testing Guidelines
- Add Vitest + Testing Library specs as `ComponentName.test.tsx` beside the source or within `src/__tests__/` when shared.
- Stub network calls with `vi.mock` and assert rendered states rather than implementation details.
- Cover critical auth flows (`SecureRoute`, route guards) and document remaining gaps in the PR description.

## Commit & Pull Request Guidelines
- Follow the existing short, imperative commit style (e.g., `filter by product`); keep one concern per commit.
- PRs must outline intent, link relevant tickets, note env/config changes, and attach UI screenshots when layouts shift.
- Confirm `npm test` passes and request review from a teammate familiar with the touched module before marking ready.

## Security & Configuration Tips
- Keep `.okta.env` local with `ISSUER` and `CLIENT_ID`; never check credentials into git.
- Ensure new API calls go through the `/api` proxy to `https://laxcoresrv.buck.local:8000` and strip secrets from client logs.
- Run `npm run build` prior to merge to catch env or proxy misconfigurations early.

## other considerations

- Config: Anthropic's AI configuration and setup parameters that define Claude's behavior and capabilities
- You are a typescript expert, javascript expert
- You are expert at working with REST APIs  
- React Query: use @tanstack/react-query to fetch data
- @mui/material: always use @mui/material library for the user interface
- Always memoize data when possible.  On a component load, memoize the data and use the memoized version of the data for data requests.  Never fetch new data for a memoized endpoint unless explicitly told to do so via a button press or some other human interaction. 
- Never run npm start. Always assume the developer is running npm start in a terminal session.
- When fetching data from the Buck API, always use https://laxcoresrv.buck.local:8000/openapi.json as a reference.
- If an API call is 'protected' use this header { 'x-token': 'a4taego8aerg;oeu;ghak1934570283465g23745693^$&%^$#$#^$#^#$nrghaoiughnoaergfo' } when fetching data
- Never use axios to fetch data.
- For deployment, use npm run build and the ./copy_to_lax.sh script
- Never create helper apps like those defined in srv/hooks/useApi.js.  Always fix or modify the Component or route requested by the user.
- Use a Grid layout with copmonents from the @mui/material library where possible.
- In Grid components, never use the sm, med, lg or item tags. They are deprecated. Always use the size tag instead.
- Always import the component in the file that uses it.
- Always check api endpoints to see if they require the x-token header. If they do, use the protected api method to fetch data
- The api endpoint has cors set up properly. Always double-check cors errors to see if they are another type of error.
- Always add newly created components to the NavBar.
- Always try to 'raise the state' to the highest component in use.   Pass the data from the highest state to components as props.
