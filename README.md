# Solace Shaders

An open catalog of interactive WebGL experiments for [Solace UI](https://www.solaceui.com). Explore each effect in the browser, tune it with live controls, and install the component source through the shadcn registry.

[![Solace Shaders catalog preview](./public/og-catalog.png)](https://shaders.solaceui.com)

**[Explore the live catalog](https://shaders.solaceui.com)**

## What is inside

- 14 interactive shader studies, from thermal ink and fluid distortion to particle assembly and gravitational lensing
- Live parameter controls powered by [DialKit](https://github.com/joshpuckett/dialkit)
- Reusable React components with shader source included
- A shadcn-compatible registry generated from the project metadata
- Responsive catalog and experiment pages built with the Next.js App Router

## Tech stack

- [Next.js 16](https://nextjs.org) and React 19
- TypeScript
- WebGL and GLSL
- [Motion](https://motion.dev) for interface animation
- [Shiki](https://shiki.style) for source highlighting
- Vercel Analytics

## Getting started

You will need Node.js `>=22.13.0` and npm.

```bash
git clone https://github.com/HARSHITSHARMA18/shaders.git
cd shaders
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the catalog.

## Installing a shader

Every available experiment includes an installation command. For example:

```bash
npx shadcn@latest add https://shaders.solaceui.com/r/thermal-pixel-ink.json
```

The command copies the component and its declared dependencies into your project so you can inspect, adapt, and own the source.

## Project structure

```text
app/                  Next.js routes, catalog UI, and interactive demos
registry/default/     Installable shader component source
public/r/             Generated shadcn registry JSON
scripts/              Registry build tooling
tests/                Build and route-level application checks
registry.json         Shader metadata and registry configuration
```

## Adding or updating a shader

1. Add the reusable component under `registry/default/<shader-name>/`.
2. Register its files and dependencies in `registry.json`.
3. Add or update the matching demo route under `app/shaders/`.
4. Regenerate the published registry files:

   ```bash
   npm run registry:build
   ```

5. Run the project checks before opening a pull request.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run registry:build` | Regenerate registry JSON in `public/r` |
| `npm run lint` | Run ESLint |
| `npm run build` | Regenerate the registry and create a production build |
| `npm test` | Build the app and run the application test suite |

## Deployment

The repository is a standard Next.js application designed for Vercel. It does not require a database, Cloudflare Worker, or deployment environment variables.

Import the GitHub repository into Vercel and keep the detected defaults:

- Install command: `npm install`
- Build command: `npm run build`
- Output: Next.js default

Vercel Analytics is mounted in the root layout and starts collecting data after the deployment is connected to a Vercel project with Analytics enabled.

## Contributing

External contributions are not open yet. Issues and pull requests will be welcomed in the future once the project roadmap and contribution guidelines are ready.

## License

Solace Shaders is available under the [MIT License](./LICENSE).

## Acknowledgements

Created by [Harshit Sharma](https://github.com/HARSHITSHARMA18) for [Solace UI](https://www.solaceui.com).
