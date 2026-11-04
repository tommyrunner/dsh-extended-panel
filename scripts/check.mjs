#!/usr/bin/env node
/**
 * Dependency-free repository check.
 *
 * Verifies the bundle manifest, the Loader patch, the locale metadata, and the
 * shape of the browser module — the things a broken commit would break before
 * anyone installs the plugin. Runs locally (`npm run check`) and in CI.
 *
 * The Harness itself is not available here, so this cannot activation-test the
 * plugin; it checks everything that is checkable without a running Host.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];

function pass(message) {
  console.log(`ok   ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`FAIL ${message}`);
}

function step(message, run) {
  try {
    const value = run();
    if (value === false) fail(message);
    else pass(message);
  } catch (error) {
    fail(`${message} — ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function asyncStep(message, run) {
  try {
    const value = await run();
    if (value === false) fail(message);
    else pass(message);
  } catch (error) {
    fail(`${message} — ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ── layout ────────────────────────────────────────────────────────────────────
const requiredFiles = [
  'index.js',
  'client.js',
  'cordis.patch.yml',
  'icon.svg',
  'locale/en.json',
  'locale/zh.json',
  'README.md',
  'README.zh.md',
  'LICENSE',
  'CHANGELOG.md',
  'promo/home.png',
];
step('every shipped file exists', () => requiredFiles.every((file) => existsSync(join(root, file))));

// ── manifest ──────────────────────────────────────────────────────────────────
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
step('package name is dsh-extended-panel', () => manifest.name === 'dsh-extended-panel');
step('version is semver', () => /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version));
step('type is module', () => manifest.type === 'module');
step('exports the host and client entries', () => manifest.exports?.['.'] === './index.js' && manifest.exports?.['./client'] === './client.js');
step('exports locale resources and icon', () => manifest.exports?.['./locale/*.json'] === './locale/*.json' && manifest.exports?.['./icon'] === './icon.svg');
step('declares a bundle patch', () => manifest.dsh?.bundle?.patch === './cordis.patch.yml');
step('declares a web client', () => manifest.dsh?.client?.platform === 'web' && Array.isArray(manifest.dsh.client.inject));
step('ships every runtime file', () => {
  const shipped = new Set(manifest.files ?? []);
  return ['index.js', 'client.js', 'cordis.patch.yml', 'locale/*.json', 'icon.svg', 'promo/*.png'].every((file) => shipped.has(file));
});

// ── syntax ────────────────────────────────────────────────────────────────────
step('index.js parses', () => execFileSync(process.execPath, ['--check', join(root, 'index.js')], { stdio: 'pipe' }) && true);
step('client.js parses', () => execFileSync(process.execPath, ['--check', join(root, 'client.js')], { stdio: 'pipe' }) && true);

// ── loader patch ──────────────────────────────────────────────────────────────
const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8');
step('patch inserts the row under the package name', () => {
  return patch.includes('insert:')
    && patch.includes('id: dsh-extended-panel')
    && patch.includes(`name: '${manifest.name}'`);
});
step('patch declares a servers array', () => /servers:\s*\[\]/.test(patch));

// ── locale metadata ───────────────────────────────────────────────────────────
for (const locale of ['en', 'zh']) {
  step(`locale/${locale}.json carries display metadata`, () => {
    const data = JSON.parse(readFileSync(join(root, 'locale', `${locale}.json`), 'utf8'));
    return typeof data.meta?.title === 'string' && data.meta.title.length > 0
      && typeof data.meta?.description === 'string' && data.meta.description.length > 0;
  });
}

// ── dictionaries ──────────────────────────────────────────────────────────────
const clientSource = readFileSync(join(root, 'client.js'), 'utf8');
const dictionary = (name) => {
  const block = new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n    \\};`).exec(clientSource);
  if (block === null) throw new Error(`no ${name} dictionary`);
  return [...block[1].matchAll(/^ {6}([A-Za-z][\w]*):/gm)].map((match) => match[1]);
};

step('both dictionaries carry the same keys', () => {
  const en = dictionary('en').sort().join(',');
  const zh = dictionary('zh').sort().join(',');
  return en.length > 0 && en === zh;
});

step('every dictionary key is used by the page', () => {
  // `groupProject` / `phaseActive` style keys are built from a prefix at render
  // time, so their family prefix counts as a use.
  return dictionary('en').every((key) => {
    if (clientSource.includes(`t('${key}')`)) return true;
    const family = /^(group|phase)/.exec(key);
    return family !== null && clientSource.includes(`t('${family[1]}'`);
  });
});

// ── browser module shape ──────────────────────────────────────────────────────
let registered;
globalThis.window = {
  __ModuleLoader__: {
    load: (entry) => {
      registered = entry;
    },
  },
};

await asyncStep('client module registers under the package name', async () => {
  await import(pathToFileURL(join(root, 'client.js')).href);
  return registered !== undefined && registered.id === manifest.name;
});

await asyncStep('client module exports inject + apply', async () => {
  const reactStub = {
    createElement: () => null,
    useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
    useEffect: () => {},
    useRef: (init) => ({ current: init }),
    useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
  };
  const requireStub = (specifier) => {
    if (specifier === 'react') return reactStub;
    throw new Error(`unexpected client import: ${specifier}`);
  };
  const exported = registered.factory(requireStub);
  const services = ['slots', 'locale', 'configForms', 'sessions', 'remote', 'remote.skills', 'remote.pluginInventory', 'remote.workspaceFiles'];
  return typeof exported.apply === 'function'
    && Array.isArray(exported.inject)
    && services.every((service) => exported.inject.includes(service));
});

// ── summary ───────────────────────────────────────────────────────────────────
if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
