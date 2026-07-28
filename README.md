# RankUp

RankUp is a cross-platform desktop productivity and time-tracking app built with Electron, React, Chart.js, and SQLite.

## Features

- Create, rename, and delete custom focus topics.
- Run a pause/resume stopwatch and save cumulative daily sessions.
- Plan dated, topic-specific tasks and archive completed work automatically.
- Explore daily, weekly, monthly, and topic-level focus analytics.
- Complete a mandatory first-run timezone setup for correct local day boundaries.
- Set a flexible 2h, 4h, 8h, 10h, or unlimited daily focus milestone.
- Keep all data private in a local SQLite database.

## Development

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

The development command starts Vite and opens the Electron application. SQLite data is stored under Electron's platform-specific application data directory.

## Build and packaging

Create the renderer production build:

```bash
npm run build
```

Build an installer for the current operating system:

```bash
npm run dist
```

Platform-specific commands are also available:

```bash
npm run build
npm run build:win
npm run build:mac
npm run build:linux
npm run build:all
```

Outputs are written to `release/`: NSIS `.exe` on Windows, `.dmg` and `.zip` on macOS, and `.AppImage` plus `.deb` on Linux. Build the renderer with `npm run build` before invoking a platform package command. macOS installers must be built on macOS; Windows installers are best built on Windows. Code signing credentials can be supplied through the standard `electron-builder` environment variables when distributing publicly.

### Local Windows code signing

`npm run build:win`, `npm run dist:win`, and `npm run dist` on Windows automatically create and reuse a local self-signed code-signing certificate under `build/certs/`. The `.pfx` file and its randomly generated password are ignored by Git. The build wrapper passes the password to `electron-builder` only for the lifetime of the packaging process.

A self-signed certificate proves that successive local builds came from the same key, but Windows will still report it as untrusted unless its public `.cer` certificate is installed into a trusted store. Public releases should replace this development certificate with a certificate from a trusted code-signing provider or Azure Trusted Signing.

## Project structure

```text
src/
  db/          SQLite schema and database access
  main/        Electron main process, preload bridge, and IPC handlers
  renderer/    React pages, shared UI components, charts, and styles
```

The renderer has no direct Node.js or database access. It communicates through the allow-listed API exposed by `src/main/preload.cjs`.
