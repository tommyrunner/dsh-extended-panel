# Contributing

Thanks for taking a look. This is a small, dependency-free Harness bundle, so the
loop is short: edit two JavaScript files, run the checks, install it into a
Harness profile and see it in the Web UI.

## Layout

| Path | What it is |
|---|---|
| `index.js` | Host half: reads the row's Config and mounts one `@deepseek-ai/dsh-mcp-client` per connection; writes skill-interface parameters into `agents/openai.yaml`. |
| `client.js` | Browser half: the Settings section (`settings.section`), its tabs, detail views, and the add-connection dialog. Hand-written `window.__ModuleLoader__` module — no build step. |
| `cordis.patch.yml` | The bundle patch that inserts the host row. |
| `locale/*.json` | Plugin display metadata shown by the plugin inventory. |
| `promo/` | Screenshots referenced by `README.md` / `README.zh.md`; keep them in sync when the UI changes. |
| `scripts/check.mjs` | Dependency-free check used by CI: manifest, patch, locales, client module shape. |

## Local checks

```bash
npm run check          # manifest + patch + locales + client module shape
npm pack --dry-run     # see exactly which files an install would receive
```

There is no bundler and no runtime dependency: `client.js` is plain JavaScript
that receives React from the Harness module table, and `index.js` resolves the
Harness's own packages at runtime from the active profile.

## Trying a change

1. Install the checkout as a bundle: Harness sidebar → **Plugins** → **Add** →
   absolute path of this directory → **Install** → **Enable**.
2. A `client.js` change shows up after a page refresh. An `index.js` change needs
   the bundle re-enabled or the Harness restarted (the Host imports the module
   once).
3. Keep the page inside the Harness UI — do not replace the app root, import
   other Harness client packages, or style with literal colors. Use the
   `--dsw-alias-*` theme tokens so light and dark themes both work.

## Style

- Plain ESM, no transpiler features beyond what Node 22 and the browser module
  table support.
- Prefer small pure helpers at the top of a file; keep rendering functions free
  of side effects, and register every resource inside `apply` with `ctx.effect`.
- Text that users see goes through the locale dictionary in `client.js`.
- Comments explain *why* a thing is the way it is, not what the code does.

## Pull requests

Run `npm run check` before pushing; CI runs it on Node 22 and 24 plus
`npm pack --dry-run`. Describe the user-visible behavior you changed and how you
verified it — for UI changes, a screenshot of the panel in both themes helps.
