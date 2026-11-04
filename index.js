/**
 * Host half of the Skills & MCP panel.
 *
 * The panel's Config holds the MCP connections the user wants. On activation —
 * and again whenever the volatile `servers` field changes — this plugin mounts
 * one `@deepseek-ai/dsh-mcp-client` instance per enabled connection, so editing
 * or removing a connection in the UI re-mounts that client without restarting
 * the Harness.
 *
 * Module resolution: a bundle installed from a local directory is linked, so
 * this file executes from its real workspace path, where the Harness's own
 * packages are not resolvable as bare specifiers. `@deepseek-ai/schemastery`
 * and `@deepseek-ai/dsh-mcp-client` are therefore resolved at runtime through
 * the profile and the installation instead of a static import.
 *
 * The browser half (`client.js`) owns all rendering: the skills list and the
 * MCP connection form.
 */

import { readFile, writeFile, rename } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

/** Package name, used by the loader row and by child entry ids. */
export const name = 'dsh-extended-panel';

/** The Loader service creates, updates, and removes the MCP child entries. */
export const inject = ['loader'];

/** Shipped MCP client package; resolved from the Harness installation. */
const MCP_MODULE = '@deepseek-ai/dsh-mcp-client';

/** Child entry id prefix; the browser half joins live status on this shape. */
const ENTRY_PREFIX = 'dsh-extended-panel-mcp-';

/** `serverName` grammar required by `@deepseek-ai/dsh-mcp-client`. */
const SERVER_NAME = /^[A-Za-z0-9_-]{1,32}$/;

/**
 * Directories whose `node_modules` can resolve the Harness's shipped packages:
 * the active profile first, then the application installation.
 * @returns {string[]} Directory candidates, most specific first.
 */
function anchors() {
  const list = [];
  if (process.env.DSH_PROFILE_DIR) list.push(process.env.DSH_PROFILE_DIR);
  const home = process.env.DSH_HOME;
  if (home) list.push(join(home, 'profiles', process.env.DSH_PROFILE ?? 'desktop'));
  if (process.resourcesPath) list.push(join(process.resourcesPath, 'app.asar', 'dsh'));
  if (typeof process.execPath === 'string') {
    list.push(join(dirname(process.execPath), '..', 'Resources', 'app.asar', 'dsh'));
  }
  return list;
}

/**
 * Import one package shipped with the Harness, resolving it from the profile or
 * the installation rather than from this bundle's own directory.
 * @param {string} specifier - Bare package specifier.
 * @returns {Promise<any>} The imported namespace.
 */
async function importShipped(specifier) {
  for (const dir of anchors()) {
    try {
      const resolved = createRequire(join(dir, 'package.json')).resolve(specifier);
      return await import(pathToFileURL(resolved).href);
    } catch {
      // try the next anchor
    }
  }
  // Works when the bundle is installed as a copied dependency.
  return await import(specifier);
}

/** Schemastery namespace, or `undefined` when it cannot be resolved. */
let z;
try {
  const namespace = await importShipped('@deepseek-ai/schemastery');
  z = namespace.default ?? namespace;
} catch {
  z = undefined;
}

/** Fields shared by both transports. */
const shared = z
  ? {
    serverName: z.string().required().pattern(SERVER_NAME).description('Namespace used in tool names: mcp__<serverName>__<tool>.'),
    enabled: z.boolean().default(true).description('Mount this connection.'),
    failOnStartupError: z.boolean().default(false).description('Refuse activation when the first connection fails.'),
  }
  : undefined;

/** One MCP connection the user configured. */
const Connection = z && shared
  ? z.union([
    z.object({
      ...shared,
      transport: z.const('stdio').default('stdio'),
      command: z.string().default('').description('Executable to launch.'),
      args: z.array(String).default([]).description('Arguments passed to the command.'),
      env: z.dict(String).default({}).description('Extra environment variables.'),
      cwd: z.string().default('').description('Working directory; empty keeps the default.'),
    }),
    z.object({
      ...shared,
      transport: z.const('streamable-http'),
      url: z.string().default('').description('Streamable HTTP endpoint.'),
      headers: z.dict(String).default({}).description('Extra request headers.'),
    }),
  ])
  : undefined;

/**
 * Plugin config persisted through the profile patch.
 *
 * Without a resolvable schema the plugin still mounts whatever the patch
 * already stores; only the settings form cannot write, and the panel says so.
 */
export const Config = z && Connection
  ? z.object({
    /** `<skill>/agents/openai.yaml` absolute path → `params` values to write back. */
    skillParams: z
      .dict(z.dict(String))
      .default({})
      // Volatile for the same reason as `servers`: the settings page writes it
      // live and this plugin applies the values to the skill's file.
      .volatile()
      .description('Skill interface parameters to write into each agents/openai.yaml.'),
    servers: z
      .array(Connection)
      .default([])
      // Volatile so the settings page can write it live: the Loader commits the
      // new value and emits `loader/volatile-update` instead of restarting this
      // plugin, and `sync` below re-mounts the affected MCP instances.
      .volatile()
      .description('MCP connections to mount.'),
  })
  : undefined;

/**
 * Read one file map out of the resolved config, unwrapping the volatile ref.
 * @param {object|undefined} config - The resolved plugin config.
 * @returns {Record<string, Record<string, string>>} File path → parameter values.
 */
function skillParamsOf(config) {
  const field = config?.skillParams;
  const value = field !== null && typeof field === 'object' && typeof field.get === 'function' ? field.get() : field;
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

/** One YAML single-quoted scalar: literal text, so backslashes need no escaping. */
function yamlString(value) {
  return "'" + String(value).replace(/'/g, "''") + "'";
}

/**
 * Rewrite the `params:` block of an agent-interface YAML document.
 *
 * Supported shapes, both preserved as found:
 *
 *     params:
 *       LEGACY: 'value'              # flat scalar: rewritten in place
 *       KEY:                         # object form: only `value:` is rewritten
 *         value: 'value'
 *         type: input | select
 *         select: ['a', 'b']
 *         default: 'fallback'
 *
 * `type`, `select`, `default`, comments, and every other line stay untouched.
 *
 * @param {string} text - Current document text.
 * @param {Record<string, string>} params - Values to set, keyed by parameter name.
 * @returns {string} The patched document.
 */
function patchParamsBlock(text, params) {
  const entries = Object.entries(params).filter(([key, value]) => /^[A-Za-z0-9_]+$/.test(key) && typeof value === 'string');
  if (entries.length === 0) return text;
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const indentOf = (line) => /^(\s*)/.exec(line)[1].length;

  let start = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (/^params:\s*(#.*)?$/.test(lines[index])) {
      start = index;
      break;
    }
  }

  if (start < 0) {
    const block = ['params:'];
    for (const [key, value] of entries) block.push('  ' + key + ':', '    value: ' + yamlString(value));
    let end = lines.length;
    while (end > 0 && lines[end - 1] === '') end -= 1;
    return lines.slice(0, end).concat(block, lines.slice(end)).join(eol);
  }

  let blockEnd = start + 1;
  let baseIndent = 2;
  let seenChild = false;
  while (blockEnd < lines.length) {
    const line = lines[blockEnd];
    if (line.trim() === '') {
      blockEnd += 1;
      continue;
    }
    if (indentOf(line) === 0) break;
    if (!seenChild) {
      baseIndent = indentOf(line);
      seenChild = true;
    }
    blockEnd += 1;
  }
  const keyPrefix = ' '.repeat(baseIndent);
  const fieldPrefix = ' '.repeat(baseIndent + 2);

  for (const [key, value] of entries) {
    const keyPattern = new RegExp('^\\s{' + baseIndent + '}' + key + ':(.*)$');
    let keyIndex = -1;
    for (let index = start + 1; index < blockEnd; index += 1) {
      if (indentOf(lines[index]) === baseIndent && keyPattern.test(lines[index])) {
        keyIndex = index;
        break;
      }
    }
    if (keyIndex < 0) {
      lines.splice(blockEnd, 0, keyPrefix + key + ':', fieldPrefix + 'value: ' + yamlString(value));
      blockEnd += 2;
      continue;
    }
    const inline = keyPattern.exec(lines[keyIndex])[1].trim();
    if (inline.length > 0 && inline.charAt(0) !== '#') {
      // Legacy flat scalar: keep the shape the author chose.
      lines[keyIndex] = keyPrefix + key + ': ' + yamlString(value);
      continue;
    }
    let childEnd = keyIndex + 1;
    while (childEnd < blockEnd && (lines[childEnd].trim() === '' || indentOf(lines[childEnd]) > baseIndent)) childEnd += 1;
    // `type: boolean` keeps a YAML boolean instead of a quoted string.
    let isBoolean = false;
    for (let index = keyIndex + 1; index < childEnd; index += 1) {
      if (/^\s+type:\s*boolean\s*(#.*)?$/.test(lines[index])) {
        isBoolean = true;
        break;
      }
    }
    const literal = isBoolean ? (String(value).toLowerCase() === 'true' ? 'true' : 'false') : yamlString(value);
    let valueIndex = -1;
    for (let index = keyIndex + 1; index < childEnd; index += 1) {
      if (/^\s+value:(\s|$)/.test(lines[index])) {
        valueIndex = index;
        break;
      }
    }
    if (valueIndex >= 0) {
      lines[valueIndex] = ' '.repeat(indentOf(lines[valueIndex])) + 'value: ' + literal;
    } else {
      lines.splice(keyIndex + 1, 0, fieldPrefix + 'value: ' + literal);
      blockEnd += 1;
    }
  }
  return lines.join(eol);
}

/**
 * Write the configured parameter values into one agent-interface file.
 * @param {string} file - Absolute path to the `agents/openai.yaml` file.
 * @param {Record<string, string>} params - Values to write.
 * @param {object} logger - Host logger.
 * @returns {Promise<void>} Settles after the file is written, or after a logged skip.
 */
async function writeSkillParams(file, params, logger) {
  if (typeof file !== 'string' || !/\/agents\/openai\.yaml$/.test(file) || file.indexOf('/skills/') < 0) {
    logger?.warn?.('dsh-extended-panel: refusing to write unexpected path %s', String(file));
    return;
  }
  const values = Object.entries(params).filter(([key, value]) => /^[A-Za-z0-9_]+$/.test(key) && typeof value === 'string' && value.length > 0);
  if (values.length === 0) return;
  try {
    const before = await readFile(file, 'utf8');
    const after = patchParamsBlock(before, Object.fromEntries(values));
    if (after === before) return;
    const temporary = file + '.dsh-panel.tmp';
    await writeFile(temporary, after, 'utf8');
    await rename(temporary, file);
  } catch (error) {
    logger?.warn?.('dsh-extended-panel: writing %s failed: %s', file, String(error));
  }
}

/**
 * Project one panel connection onto `@deepseek-ai/dsh-mcp-client` config.
 * @param {object} connection - One entry of `config.servers`.
 * @returns {object} The child plugin config.
 */
function mcpConfig(connection) {
  if (connection.transport === 'streamable-http') {
    return {
      transport: 'streamable-http',
      serverName: connection.serverName,
      url: connection.url,
      headers: connection.headers ?? {},
      failOnStartupError: connection.failOnStartupError === true,
    };
  }
  return {
    transport: 'stdio',
    serverName: connection.serverName,
    command: connection.command,
    args: connection.args ?? [],
    env: connection.env ?? {},
    cwd: connection.cwd ?? '',
    failOnStartupError: connection.failOnStartupError === true,
  };
}

/**
 * Read the servers out of the resolved config, unwrapping the volatile ref.
 * @param {object|undefined} config - The resolved plugin config.
 * @returns {object[]} The configured connections.
 */
function serversOf(config) {
  const field = config?.servers;
  const value = field !== null && typeof field === 'object' && typeof field.get === 'function' ? field.get() : field;
  return Array.isArray(value) ? value : [];
}

/**
 * Whether one connection carries everything its transport needs.
 * @param {object} connection - One configured connection.
 * @returns {boolean} Whether it can be mounted.
 */
function mountable(connection) {
  if (connection === null || typeof connection !== 'object') return false;
  if (typeof connection.serverName !== 'string' || !SERVER_NAME.test(connection.serverName)) return false;
  if (connection.transport === 'streamable-http') return typeof connection.url === 'string' && connection.url.length > 0;
  return typeof connection.command === 'string' && connection.command.length > 0;
}

/** Same config, ignoring key order. */
function sameConfig(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

/**
 * Keep the mounted MCP clients equal to the configured connections.
 * @param {object} ctx - Cordis context carrying the loader service.
 * @param {object|undefined} config - The resolved plugin config.
 * @param {Map<string, object>} manual - Fallback mounts keyed by entry id.
 * @param {Set<string>} mounted - Entry ids this plugin currently owns.
 * @returns {Promise<void>} Settles after all mounts are queued.
 */
async function sync(ctx, config, manual, mounted) {
  const desired = new Map();
  for (const connection of serversOf(config)) {
    if (connection?.enabled === false || !mountable(connection)) continue;
    desired.set(ENTRY_PREFIX + connection.serverName, mcpConfig(connection));
  }

  // Drop fallback mounts that are no longer wanted.
  for (const [id, fiber] of [...manual]) {
    if (desired.has(id)) continue;
    manual.delete(id);
    try {
      fiber?.dispose?.();
    } catch {
      // already disposed
    }
  }

  for (const [id, childConfig] of desired) {
    const existing = ctx.loader.resolve(id);
    if (existing !== undefined) {
      mounted.add(id);
      if (sameConfig(existing.options?.config, childConfig)) continue;
      await ctx.loader.update(id, { id, name: MCP_MODULE, config: childConfig });
      continue;
    }
    if (manual.has(id)) {
      // A fallback mount cannot be updated in place; remount it.
      const fiber = manual.get(id);
      manual.delete(id);
      try {
        fiber?.dispose?.();
      } catch {
        // already disposed
      }
    }
    try {
      await ctx.loader.create({ id, name: MCP_MODULE, config: childConfig });
      mounted.add(id);
    } catch (error) {
      ctx.logger?.warn?.('dsh-extended-panel: loader entry %s failed (%s); mounting directly', id, String(error));
      const namespace = await importShipped(MCP_MODULE);
      const plugin = namespace.apply ?? namespace.default;
      const fiber = ctx.plugin(plugin, childConfig);
      manual.set(id, fiber);
      mounted.add(id);
    }
  }

  // Remove what a previous configuration mounted and this one does not want.
  for (const id of [...mounted]) {
    if (desired.has(id)) continue;
    mounted.delete(id);
    await ctx.loader.remove(id).catch(() => undefined);
  }
}

/**
 * Mount the configured MCP connections, and keep them in sync with live config edits.
 * @param {object} ctx - Cordis context carrying the loader service.
 * @param {object} config - The resolved plugin config.
 */
export function apply(ctx, config) {
  if (z === undefined) {
    ctx.logger?.warn?.('dsh-extended-panel: @deepseek-ai/schemastery was not resolvable; the settings form stays read-only');
  }

  const manual = new Map();
  const mounted = new Set();
  let queue = Promise.resolve();
  const schedule = () => {
    queue = queue
      .then(async () => {
        await sync(ctx, config, manual, mounted);
        // Skill-interface parameters: the panel writes them into this plugin's
        // Config, and this half persists them into each agents/openai.yaml.
        const params = skillParamsOf(config);
        for (const file of Object.keys(params)) await writeSkillParams(file, params[file] ?? {}, ctx.logger);
      })
      .catch((error) => {
        ctx.logger?.warn?.('dsh-extended-panel: applying settings failed: %s', String(error));
      });
    return queue;
  };

  void schedule();

  // A volatile-only write keeps this plugin running and reports the paths it
  // committed; every `servers` change re-syncs the mounted clients.
  const off = ctx.on('loader/volatile-update', () => {
    void schedule();
  });
  ctx.effect(() => off, 'dsh-extended-panel: volatile listener');

  ctx.effect(() => () => {
    queue = queue.then(async () => {
      for (const fiber of manual.values()) {
        try {
          fiber?.dispose?.();
        } catch {
          // already disposed
        }
      }
      manual.clear();
      for (const id of [...mounted]) await ctx.loader.remove(id).catch(() => undefined);
      mounted.clear();
    });
  }, 'dsh-extended-panel: remove mcp mounts');
}
