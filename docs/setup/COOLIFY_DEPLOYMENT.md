# Coolify Deployment

## Node version (required)

This app is built with Create React App and is tested on **Node 18**. Coolify/Nixpacks may default to Node 22, which can cause the production build to fail.

**In Coolify:** set the build environment variable so Nixpacks uses Node 18:

- **Variable:** `NIXPACKS_NODE_VERSION`
- **Value:** `18`

How to set it in Coolify:

1. Open your application in Coolify.
2. Go to the **Build** or **Environment** section.
3. Add a **Build** (not runtime) environment variable: `NIXPACKS_NODE_VERSION=18`.
4. Save and redeploy.

The repo also includes `package.json` `engines.node: "18"` and a `.nvmrc` with `18` for local and CI consistency.

## Build script

The production build runs `npm run build`, which:

1. Builds the React app with `react-scripts build` (with ESLint retry if needed).
2. Copies the `netlify` folder into `build/netlify` if it exists (skipped if not).

If the build fails in Coolify, the logs will now show the full React/build error (stdout and stderr) so you can fix the underlying issue.
