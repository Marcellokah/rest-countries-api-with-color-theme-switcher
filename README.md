# REST Countries with Theme Switcher

A lightweight vanilla JavaScript implementation of the Frontend Mentor "REST Countries API with color theme switcher" challenge.

This project includes:

- Fetching countries from the REST Countries API with a local `data.json` fallback.
- Search (name / capital / native name) with highlighting and debounced input.
- Filter by region (options populated dynamically from data).
- Country detail page with border-country navigation and neighbor flags.
- Dark / light theme toggle persisted to `localStorage` and announced for screen readers.
- Accessibility improvements: skip links, landmarks, aria attributes, keyboard navigation.
- A small smoke test to validate key files.

## Preview locally

Requirements:
- VS Code (recommended) and the Live Server extension (or any static server).
- Node.js (optional, only for running the included smoke test).

To preview with Live Server:
1. Open the project folder in VS Code.
2. Right-click `index.html` and choose **Open with Live Server**.

Or run a simple static server from PowerShell (Python must be installed):

```powershell
# from project root
python -m http.server 5500
# then open http://localhost:5500/index.html
```

## Run smoke tests

If you have Node installed you can run the lightweight smoke test that verifies the basic files and key IDs exist:

```powershell
node ./scripts/smoke.js
```

Or via npm script:

```powershell
npm run smoke
```

Exit code 0 means all checks passed.

## Project structure

- `index.html` — Home page with search, filter and countries grid.
- `country.html` — Detail view for a selected country.
- `data.json` — Local fallback with all country data.
- `css/styles.css` — Styles and theme variables.
- `js/script.js` — All client-side logic.
- `scripts/smoke.js` — Minimal smoke test.

## Accessibility

This version includes several accessibility improvements:
- Skip-to-content link and `role="main"` landmarks.
- ARIA labels for controls and a polite live region for theme announcements.
- Focus styles for keyboard navigation.