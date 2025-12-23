# Repository Guidelines

## Project Structure & Module Organization
- `index.html` boots the game and wires scripts/styles.
- `styles.css` contains global styles for the page and canvas.
- `js/` holds the game logic, split by concern (e.g., `config.js`, `controls.js`, `gameplay.js`, `scene.js`, `audio.js`).
- `*.mp3` files are music/SFX assets; `icon.png` is the app icon.

## Build, Test, and Development Commands
- `python3 -m http.server` runs a simple local server for testing in a browser.
- Open `http://localhost:8000/index.html` to play locally.
- Directly opening `index.html` works for quick checks, but a server is recommended for consistent asset loading.

## Coding Style & Naming Conventions
- Indentation is 4 spaces; use semicolons.
- Prefer `const`/`let` over `var`.
- Use uppercase for shared constants (e.g., `CONFIG`), and camelCase for functions/variables.
- Keep modules focused by responsibility (audio, controls, gameplay, scene).

## Testing Guidelines
- No automated test framework is present.
- Validate changes manually: load the game, verify lane switching, jumping, obstacles, audio cues, and score updates.

## Commit & Pull Request Guidelines
- Commit history is minimal and uses short messages (e.g., “Update”). Keep commits concise and imperative.
- PRs should include a brief summary, testing notes (manual steps), and a screenshot or short clip for gameplay/UI changes.

## Assets & Configuration
- Update gameplay tuning in `js/config.js` (speed, BPM, spawn rates).
- When adding audio or images, prefer descriptive filenames and verify browser playback.
