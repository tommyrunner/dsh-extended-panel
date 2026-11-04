# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] — 2026-11-04

Color fixes for the parameter rows and the connection form; no API or config
changes, so a page refresh is enough for a directory install.

### Fixed

- The switch was invisible when off: its track used `bg-layer-3`, which is
  nearly the card fill on the settings page, and the knob was pure white. The
  track now mixes the label color into the background (theme-aware, with a
  solid fallback), gets an inset ring, and the knob carries a shadow — both
  states read clearly in light and dark themes. This covers the boolean
  parameter control and the MCP mount switch.
- `<select>` painted a hard white plate on dark cards because it used the
  native widget. It is now a themed control (custom caret, input-style plate)
  in both the parameter rows and the connection transport field.
- Disabled primary/danger buttons looked clickable; they now dim. The skill
  "save parameters" button still keeps its fill while saving, as requested.

## [1.0.0] — 2026-11-04

First public release. A DeepSeek Harness Settings section that turns the skill
list into something you can actually operate: read the session's skills, edit
each skill's own parameters and write them back, mount MCP servers live, and
inspect the plugin inventory.

### Added

- **扩展坞 settings section** with three tabs — Skills, MCP, Plugins — shaped
  like a coding agent's plugin manager: a list first, configuration on open.
- **Skill parameter editing** — reads `<skill dir>/agents/openai.yaml` and
  renders each `params` entry as the control its `type` asks for: `input`
  (default), `select` (inline or block list), `boolean` (a real switch).
- **Verified in-place writes** — only the `value:` line changes; `type`,
  `select`, unknown fields, comments, and every other line are preserved, the
  line count does not move, the write is idempotent and atomic (temp file +
  `rename`). After saving, the page re-reads the file and compares before
  claiming success.
- **Backward-compatible parameter format** — the legacy flat scalar
  (`KEY: 'value'`) is read *and* written as-is, so existing files need no
  migration; unknown fields in the object form are preserved for future use.
- **Live MCP connections** — add from a dialog (local command or online
  endpoint), edit, toggle, uninstall. Each saved connection mounts its own
  `@deepseek-ai/dsh-mcp-client` through the Cordis Loader; tools appear as
  `mcp__<name>__<tool>` with no restart, and connection health is joined from
  the plugin inventory.
- **Plugin inventory tab** — the Loader entries the profile actually runs, with
  search and a 60-row fold for long lists.
- **Sensible defaults** — the section refreshes on entry, skill groups collapse
  individually or all at once, skills and plugins are searchable, and a skill
  without `params` shows no parameters section at all.
- **Repository hygiene** — dependency-free `npm run check` (manifest, Loader
  patch, locale metadata, browser module shape), GitHub Actions CI on Node 22
  and 24, bilingual README with a screenshot, CONTRIBUTING, and MIT license.

### Known limitations

- Skills are read-only apart from their parameters: the Harness has no
  per-skill enable switch.
- The Plugins tab is read-only; no marketplace integration.
- The skill list needs an open session.
- Only the installed copy of a skill is edited; other copies need a manual sync.
- Parameter values are stored as plain text in the skill file and in the
  profile's settings patch, and the panel shows them in clear.
- Dark theme uses the same tokens but has not been verified in a real render.
