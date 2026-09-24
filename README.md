# Text Trendz

Every text tool, one fast workspace. 221 free text tools across 20
categories — counters, case converters, cleaners, formatters, generators,
encoders/decoders, extractors, SEO helpers, social-media limit checkers,
developer tools (JSON/CSV/XML/SQL/regex), number/code converters, readability
scores, business & student tools, and more.

Everything runs **entirely in the browser**. Nothing is uploaded, there's no
account, no API key, and no backend — it's a static site.

## Two homepage directions, switchable

The site ships with both original design directions, toggleable from the bar
at the top of the page:

- **Workbench** — sidebar of categories with a live tool workspace and stats
  panel; compact, app-like.
- **Broadsheet** — big editorial type, huge numbers, tabbed tool groups
  (Count / Social / Case / Clean).

Both views share the same live state (your text, the open tool, theme,
accent color), so switching views never loses your work.

## Project structure

```
index.html        Page shell — both layouts' markup
css/styles.css     Design tokens (light/dark, 4 accent colors) + layout CSS
js/engine.js       Pure, dependency-free implementations of all 221 tools
js/data.js         Categories, platform limits, quick actions, search/stats helpers
js/app.js          State management, rendering and event wiring for both layouts
favicon.svg
```

No build step, no dependencies, no package manager. Just static files.

## Run locally

```
python3 -m http.server 8000
# then open http://localhost:8000
```

Or open `index.html` directly in a browser (everything is same-origin,
relative paths only).

## Deploy

This is a plain static site — deploy the repository root as-is to any static
host:

- **Vercel**: import the repo, framework preset "Other", no build command,
  output directory `.` (the defaults work with zero config).
- **Netlify**: publish directory `.`, no build command.
- **GitHub Pages**: enable Pages on this repo, source = root of the default
  branch.
- Any static file host / CDN / `nginx` — just serve the files as-is.

## Browser support

Uses standard modern browser APIs: Unicode property escapes in regex,
`Intl.Segmenter`, `crypto.subtle`, `crypto.randomUUID`, `TextEncoder`/
`TextDecoder`, `DOMParser`. Works in current Chrome, Firefox, Safari and Edge.
