# Solace Shaders

An interactive catalog of shader experiments for [Solace UI](https://www.solaceui.com). Each shader includes live DialKit controls and a shadcn-compatible registry item that can be installed as source code.

## Local development

Requirements:

- Node.js `>=22.13.0`
- npm

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm run lint
npm run build
npm test
```

The production build regenerates the registry files in `public/r` before compiling the application.

## Registry

Every shader page displays an installation command using the current site origin:

```bash
npx shadcn@latest add https://your-domain.com/r/thermal-pixel-ink.json
```

Registry source components live in `registry/default`. Run `npm run registry:build` after changing a registry component or its metadata.

## Deployment

The application is a standard Next.js App Router project and can be imported directly into Vercel from GitHub. It requires no database, Worker, or deployment environment variables.

Vercel should detect the framework and use:

- Install command: `npm install`
- Build command: `npm run build`
- Output: Next.js default

Agentation is included for local development and does not render in production.
