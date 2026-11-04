/**
 * Browser half of the Skills & MCP panel.
 *
 * One page in the Web UI's Settings (`settings.section`), shaped like the
 * Harness's own management pages — and like a coding agent's plugin manager:
 *
 *   list view  ── three tabs (Skills / MCP / Plugins) with search, grouping,
 *                 and a real mount switch on every MCP row
 *      │ click a row
 *      ▼
 *   detail view ── « back », the item's title, then its configuration: a skill
 *                 shows what it does and where it lives, an MCP server shows its
 *                 transport form
 *
 * Data: skills come from the session-addressed `skills/list` Remote; MCP
 * connections are this plugin's own Config, written through `configForms`, and
 * the Host half mounts one live `@deepseek-ai/dsh-mcp-client` per saved server.
 *
 * No Harness client package is imported: React comes from the module table and
 * every control is local, styled with `--dsw-alias-*` theme tokens.
 */
window.__ModuleLoader__.load({
  id: 'dsh-extended-panel',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;

    const NS = 'dsh-extended-panel';
    const ENTRY_ID = 'dsh-extended-panel';
    const MCP_MODULE = '@deepseek-ai/dsh-mcp-client';
    const MCP_ENTRY_PREFIX = 'dsh-extended-panel-mcp-';
    const SLOT = 'settings.section';

    const en = {
      title: 'Extensions',
      description: 'The skills this session can use, the MCP connections you mount, and the plugins this profile loads.',
      tabSkills: 'Skills',
      tabMcp: 'MCP',
      tabPlugins: 'Plugins',
      searchSkills: 'Search skills',
      searchPlugins: 'Search plugins',
      searchMcp: 'Search MCP servers',
      refresh: 'Refresh',
      edit: 'Edit',
      details: 'Details',
      expandAll: 'Expand all',
      showAll: 'Show all',
      collapseAll: 'Collapse all',
      paramsTitle: 'Parameters',
      paramsHint: 'Values written into this skill\'s agents/openai.yaml in place. Only this copy is edited; other copies of the skill need a manual sync.',
      paramsReadError: 'Could not read agents/openai.yaml: ',
      paramsSave: 'Save parameters',
      paramsSaved: 'Saved and verified in the file.',
      paramsStaged: 'Settings saved, but the file still shows the old values. The Host half may not be running the new code (restart the Harness), or another copy of the skill is the one you are looking at.',
      paramsFile: 'File',
      paramsSaveFailed: 'The deployment did not accept these values.',
      paramsFile: 'File',
      paramsSecretNote: 'Values are stored as plain text in the skill file and in this profile\'s settings patch.',
      paramEmpty: '(empty)',
      back: 'Back',
      skillsHint: 'Skills the current session can load with /name, from its agent catalog.',
      skillsEmpty: 'No skill is visible to this session. Open a conversation, then refresh.',
      skillsError: 'Could not read the skill catalog: ',
      groupProject: 'Project',
      groupPersonal: 'Personal',
      groupBundled: 'Bundled',
      groupOther: 'Other',
      groupServers: 'Servers',
      userOnly: 'user only',
      copied: 'Copied',
      copyPath: 'Copy path',
      skillInvoke: 'Invoke it from a conversation by typing ',
      whenToUse: 'Use when',
      location: 'Location',
      mcpEmpty: 'No MCP connection yet. Add one to mount a server.',
      addConnection: 'Add connection',
      addSubtitle: 'Connect one MCP server: run a local command, or point at an online endpoint.',
      modeLocal: 'Local command',
      modeOnline: 'Online endpoint',
      cancel: 'Cancel',
      add: 'Add',
      nameInvalid: 'Use 1–32 letters, digits, underscores or dashes for the name.',
      nameTaken: 'That name is already used by another connection.',
      needTarget: 'Fill in the command or the endpoint URL.',
      tipsLocal: 'The command runs as a child process; credential-shaped variables are scrubbed from its inherited environment.',
      tipsOnline: 'The endpoint must speak MCP over streamable HTTP.',
      removeConnection: 'Uninstall',
      save: 'Save',
      saving: 'Saving…',
      discard: 'Discard',
      saved: 'Saved; the Host applies it now.',
      saveFailed: 'The deployment did not accept these values.',
      readOnly: 'This deployment stores settings read-only.',
      unavailable: 'The Host half is not loaded, so connections cannot be configured right now.',
      name: 'Name',
      nameHint: 'Namespace used in tool names; letters, digits, _ and - only.',
      transport: 'Transport',
      command: 'Command',
      args: 'Arguments (one per line)',
      env: 'Environment (KEY=VALUE, one per line)',
      cwd: 'Working directory (optional)',
      url: 'Endpoint URL',
      headers: 'Headers (KEY=VALUE, one per line)',
      mount: 'Mount',
      invalid: 'Each connection needs a unique name, plus a command or an endpoint URL.',
      toolNameHint: 'Tools appear as',
      pluginsHint: 'Plugins loaded by this Harness profile, read from the loader inventory.',
      pluginsEmpty: 'No plugin matches this search.',
      phaseActive: 'active',
      phaseFailed: 'failed',
      phaseIdle: 'idle',
      phaseLoading: 'loading',
    };

    const zh = {
      title: '扩展坞',
      description: '当前会话可用的技能、即时挂载的 MCP 连接，以及本 profile 已加载的插件。',
      tabSkills: '技能',
      tabMcp: 'MCP',
      tabPlugins: '插件',
      searchSkills: '搜索技能',
      searchPlugins: '搜索插件',
      searchMcp: '搜索 MCP 服务器',
      refresh: '刷新',
      edit: '编辑',
      details: '详情',
      expandAll: '全部展开',
      showAll: '显示全部',
      collapseAll: '全部折叠',
      paramsTitle: '参数',
      paramsHint: '这些值会就地写回该技能的 agents/openai.yaml。只改这一份，其它副本（如 ~/.codex/skills）需手动同步。',
      paramsReadError: '读取 agents/openai.yaml 失败：',
      paramsSave: '保存参数',
      paramsSaved: '已保存，并已在文件中确认。',
      paramsStaged: '设置已保存，但文件里仍是旧值：可能 host 半还没加载新代码（需要重启 Harness），或你看的是另一份副本。',
      paramsFile: '文件',
      paramsSaveFailed: '本部署没有接受这些值。',
      paramsFile: '文件',
      paramsSecretNote: '这些值以明文存放在技能文件和本 profile 的设置补丁里。',
      paramEmpty: '（空）',
      back: '返回',
      skillsHint: '当前会话可以用 /名称 加载的技能，来自该会话 agent 的技能目录。',
      skillsEmpty: '当前会话看不到任何技能。打开一个对话后刷新。',
      skillsError: '读取技能目录失败：',
      groupProject: '项目',
      groupPersonal: '个人',
      groupBundled: '内置',
      groupOther: '其他',
      groupServers: '服务器',
      userOnly: '仅用户可调用',
      copied: '已复制',
      copyPath: '复制路径',
      skillInvoke: '在对话里输入该名称即可调用：',
      whenToUse: '适用场景',
      location: '位置',
      mcpEmpty: '还没有 MCP 连接。添加一条即可挂载服务器。',
      addConnection: '添加连接',
      addSubtitle: '接入一个 MCP 服务器：运行本地命令，或连接线上地址。',
      modeLocal: '本地命令',
      modeOnline: '线上地址',
      cancel: '取消',
      add: '添加',
      nameInvalid: '名称需为 1–32 位字母、数字、下划线或短横线。',
      nameTaken: '该名称已被其它连接占用。',
      needTarget: '请填写启动命令或端点地址。',
      tipsLocal: '命令会以子进程启动；继承环境里形如 *_KEY / *_TOKEN 的变量会被清洗掉。',
      tipsOnline: '端点需支持 MCP streamable HTTP。',
      removeConnection: '卸载',
      save: '保存',
      saving: '保存中…',
      discard: '放弃修改',
      saved: '已保存，Host 正在应用。',
      saveFailed: '本部署没有接受这些值。',
      readOnly: '本部署的设置为只读。',
      unavailable: 'Host 半未加载，暂时无法配置连接。',
      name: '名称',
      nameHint: '工具名的命名空间，仅允许字母、数字、下划线和短横线。',
      transport: '传输方式',
      command: '启动命令',
      args: '参数（每行一个）',
      env: '环境变量（KEY=VALUE，每行一个）',
      cwd: '工作目录（可选）',
      url: '端点地址',
      headers: '请求头（KEY=VALUE，每行一个）',
      mount: '挂载',
      invalid: '每条连接都需要唯一名称，以及启动命令或端点地址。',
      toolNameHint: '工具名形如',
      pluginsHint: '当前 Harness profile 已加载的插件，读自 Loader 清单（只读）。',
      pluginsEmpty: '没有匹配的插件。',
      phaseActive: '运行中',
      phaseFailed: '失败',
      phaseIdle: '空闲',
      phaseLoading: '加载中',
    };

    const TOKEN = {
      labelPrimary: 'var(--dsw-alias-label-primary, currentColor)',
      labelSecondary: 'var(--dsw-alias-label-secondary, currentColor)',
      labelTertiary: 'var(--dsw-alias-label-tertiary, currentColor)',
      onPrimary: 'var(--dsw-alias-label-primary-foreground, #fff)',
      border: 'var(--dsw-alias-border-l3, rgba(127,127,127,.35))',
      cardFill: 'var(--dsw-alias-settings-card-fill, transparent)',
      cardStroke: 'var(--dsw-alias-settings-card-stroke, rgba(127,127,127,.3))',
      bgLayer3: 'var(--dsw-alias-bg-layer-3, rgba(127,127,127,.14))',
      moduleBg: 'var(--dsw-alias-bg-module-platform, rgba(127,127,127,.06))',
      hoverSolid: 'var(--dsw-alias-interactive-bg-hover-solid, rgba(127,127,127,.12))',
      hoverDanger: 'var(--dsw-alias-interactive-bg-hover-danger, rgba(214,69,69,.1))',
      error: 'var(--dsw-alias-state-error-primary, #d64545)',
      success: 'var(--dsw-alias-state-success-primary, #2f9e63)',
      warn: 'var(--dsw-alias-state-warn-primary, #c98a1a)',
      buttonFill: 'var(--dsw-alias-button-primary-fill, #4b8bf5)',
      buttonHover: 'var(--dsw-alias-button-primary-hover, #3f7be0)',
      radiusXs: 'var(--dsw-radius-xs, 4px)',
      radiusSm: 'var(--dsw-radius-sm, 6px)',
      radiusMd: 'var(--dsw-radius-md, 8px)',
      radiusLg: 'var(--dsw-radius-lg, 12px)',
      radiusXl: 'var(--dsw-radius-xl, 16px)',
      dialogFill: 'var(--dsw-alias-bg-layer-1, #fff)',
      elevation: 'var(--dsw-elevation-prominent, 0 18px 48px rgba(0,0,0,.28))',
    };

    const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

    /** Text input matching the Settings form fields. */
    const inputStyle = {
      boxSizing: 'border-box',
      width: '100%',
      height: 40,
      padding: '0 14px',
      fontSize: 13,
      lineHeight: '20px',
      color: TOKEN.labelPrimary,
      background: TOKEN.bgLayer3,
      border: '.5px solid ' + TOKEN.border,
      borderRadius: TOKEN.radiusMd,
      outline: 'none',
      fontFamily: 'inherit',
    };
    const textareaStyle = Object.assign({}, inputStyle, {
      height: 'auto',
      minHeight: 72,
      padding: '10px 14px',
      resize: 'vertical',
      fontFamily: mono,
    });
    const searchStyle = Object.assign({}, inputStyle, {
      width: 200,
      height: 32,
      padding: '0 10px',
      fontSize: 12.5,
    });
    const fieldLabel = { display: 'grid', gap: 5, fontSize: 12, color: TOKEN.labelSecondary };
    /** Compact control used inside the skill-parameter rows. */
    const paramControlStyle = Object.assign({}, inputStyle, { height: 32, fontSize: 12, fontFamily: mono });
    const hint = { margin: 0, fontSize: 12, lineHeight: '18px', color: TOKEN.labelTertiary };
    /** Secondary line used for metadata under a control. */
    const tinyHint = Object.assign({}, hint, { fontSize: 11 });
    const cardStyle = {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: '12px 14px',
      border: '.5px solid ' + TOKEN.cardStroke,
      background: TOKEN.cardFill,
      borderRadius: TOKEN.radiusXl,
      boxSizing: 'border-box',
    };
    const rowsStyle = { display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0 0', padding: 0, listStyle: 'none' };
    const rowHead = { display: 'flex', alignItems: 'center', gap: 10 };
    const rowIdentity = { display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 };
    const rowName = { color: TOKEN.labelPrimary, fontSize: 14, fontWeight: 500, lineHeight: '22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
    const rowDesc = {
      margin: 0,
      color: TOKEN.labelTertiary,
      fontSize: 12,
      lineHeight: '18px',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    };
    const rowActions = { display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto', flex: 'none' };
    const iconStyle = {
      width: 36,
      height: 36,
      flex: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: TOKEN.radiusMd,
      background: TOKEN.moduleBg,
      color: TOKEN.labelSecondary,
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1,
    };
    const listHeadTitle = { margin: 0, color: TOKEN.labelPrimary, fontSize: 14, fontWeight: 500, lineHeight: '22px' };
    const listHeadCount = { color: TOKEN.labelSecondary, fontSize: 12, lineHeight: '18px' };
    const detailTitle = { margin: 0, color: TOKEN.labelPrimary, fontSize: 18, fontWeight: 600, lineHeight: '26px' };
    const detailDesc = { margin: 0, color: TOKEN.labelSecondary, fontSize: 13, lineHeight: '22px' };
    const detailGrid = { display: 'flex', flexDirection: 'column', gap: 16 };
    const backdropStyle = {
      position: 'fixed',
      inset: 0,
      zIndex: 2400,
      background: 'rgba(0, 0, 0, .32)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      boxSizing: 'border-box',
    };
    const dialogStyle = {
      boxSizing: 'border-box',
      width: 'min(560px, 100%)',
      maxHeight: 'min(78vh, 100%)',
      overflowY: 'auto',
      display: 'grid',
      gap: 14,
      padding: '20px 22px',
      borderRadius: TOKEN.radiusXl,
      background: TOKEN.dialogFill,
      border: '.5px solid ' + TOKEN.border,
      boxShadow: TOKEN.elevation,
    };
    const dialogTitle = { margin: 0, fontSize: 17, fontWeight: 600, lineHeight: '24px', color: TOKEN.labelPrimary };
    const factRow = { display: 'flex', gap: 12, alignItems: 'baseline', padding: '9px 0', borderBottom: '.5px solid ' + TOKEN.border };
    const factKey = { flex: 'none', width: 96, color: TOKEN.labelTertiary, fontSize: 12, lineHeight: '18px' };
    const factValue = { flex: 1, minWidth: 0, color: TOKEN.labelPrimary, fontSize: 12.5, lineHeight: '18px', wordBreak: 'break-word' };

    /** Row-level action button (native row buttons are 28px tall). */
    function smallButton(kind) {
      const base = {
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 28,
        padding: '0 10px',
        fontSize: 12,
        lineHeight: '18px',
        fontFamily: 'inherit',
        cursor: 'pointer',
        borderRadius: TOKEN.radiusSm,
        border: '.5px solid ' + TOKEN.border,
        background: 'transparent',
        color: TOKEN.labelPrimary,
        whiteSpace: 'nowrap',
      };
      if (kind === 'danger') return Object.assign({}, base, { border: 'none', color: TOKEN.error });
      return base;
    }

    /** Page-level button, matching the native settings buttons. */
    function buttonStyle(kind) {
      const base = {
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        height: 36,
        padding: '0 14px',
        fontSize: 14,
        lineHeight: '22px',
        fontFamily: 'inherit',
        cursor: 'pointer',
        borderRadius: TOKEN.radiusMd,
        border: 'none',
        background: 'transparent',
        color: TOKEN.labelPrimary,
        whiteSpace: 'nowrap',
      };
      if (kind === 'primary') return Object.assign({}, base, { background: TOKEN.buttonFill, color: TOKEN.onPrimary });
      if (kind === 'secondary') return Object.assign({}, base, { border: '.5px solid ' + TOKEN.border });
      if (kind === 'dashed') {
        return Object.assign({}, base, {
          width: '100%',
          height: 44,
          border: '1px dashed ' + TOKEN.border,
          borderRadius: TOKEN.radiusLg,
          color: TOKEN.labelSecondary,
          fontSize: 13,
          marginTop: 12,
        });
      }
      if (kind === 'danger') return Object.assign({}, base, { color: TOKEN.error });
      if (kind === 'link') return Object.assign({}, base, { height: 28, padding: '0 10px', fontSize: 12, color: TOKEN.labelTertiary });
      return base;
    }

    function hoverable(kind) {
      const resting = kind === 'primary' ? TOKEN.buttonFill : 'transparent';
      let active = TOKEN.hoverSolid;
      if (kind === 'primary') active = TOKEN.buttonHover;
      else if (kind === 'danger') active = TOKEN.hoverDanger;
      return {
        onMouseEnter: (event) => {
          const target = event.currentTarget;
          if (target.disabled) return;
          target.style.background = active;
        },
        onMouseLeave: (event) => {
          event.currentTarget.style.background = resting;
        },
      };
    }

    function linesOf(value) {
      return Array.isArray(value) ? value.join('\n') : '';
    }
    function parseLines(text) {
      return text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
    }
    function dictOf(value) {
      return Object.entries(value || {}).map((pair) => pair[0] + '=' + pair[1]).join('\n');
    }
    function parseDict(text) {
      const out = {};
      const lines = text.split('\n');
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index].trim();
        if (line.length === 0) continue;
        const at = line.indexOf('=');
        if (at <= 0) continue;
        out[line.slice(0, at).trim()] = line.slice(at + 1).trim();
      }
      return out;
    }
    function emptyDraft() {
      return {
        serverName: '',
        transport: 'stdio',
        enabled: true,
        failOnStartupError: false,
        command: '',
        argsText: '',
        envText: '',
        cwd: '',
        url: '',
        headersText: '',
      };
    }
    function draftOf(server) {
      const value = server || {};
      return {
        serverName: String(value.serverName || ''),
        transport: value.transport === 'streamable-http' ? 'streamable-http' : 'stdio',
        enabled: value.enabled !== false,
        failOnStartupError: value.failOnStartupError === true,
        command: String(value.command || ''),
        argsText: linesOf(value.args),
        envText: dictOf(value.env),
        cwd: String(value.cwd || ''),
        url: String(value.url || ''),
        headersText: dictOf(value.headers),
      };
    }
    function serverOf(draft) {
      if (draft.transport === 'streamable-http') {
        return {
          transport: 'streamable-http',
          serverName: draft.serverName.trim(),
          enabled: draft.enabled,
          failOnStartupError: draft.failOnStartupError,
          url: draft.url.trim(),
          headers: parseDict(draft.headersText),
        };
      }
      return {
        transport: 'stdio',
        serverName: draft.serverName.trim(),
        enabled: draft.enabled,
        failOnStartupError: draft.failOnStartupError,
        command: draft.command.trim(),
        args: parseLines(draft.argsText),
        env: parseDict(draft.envText),
        cwd: draft.cwd.trim(),
      };
    }
    function draftProblem(rows) {
      const names = {};
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const name = row.serverName.trim();
        if (!/^[A-Za-z0-9_-]{1,32}$/.test(name)) return true;
        if (names[name] === true) return true;
        names[name] = true;
        const blank = row.transport === 'streamable-http' ? row.url.trim() === '' : row.command.trim() === '';
        if (blank) return true;
      }
      return false;
    }
    /** Unquote one YAML scalar written inline. */
    function parseScalar(raw) {
      let value = String(raw || '').trim();
      if (value.length >= 2 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      } else if (value.length >= 2 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
        value = value.slice(1, -1).replace(/''/g, "'");
      }
      // JSON-style escaped slashes carry no meaning in these values.
      return value.replace(/\\\//g, '/');
    }

    /** Split one inline flow sequence (`[a, 'b']`) into its items. */
    function parseFlowList(raw) {
      const inner = String(raw || '').trim().replace(/^\[/, '').replace(/\]$/, '');
      return inner.split(',').map((item) => parseScalar(item)).filter((item) => item.length > 0);
    }

    /**
     * Read the `params:` block of an agent-interface YAML document.
     *
     * One parameter is either the legacy flat scalar (`KEY: value`, rendered as
     * an input) or an object that keeps the value beside UI metadata:
     *
     *     params:
     *       FIGMA_API_KEY:
     *         value: 'figd_…'
     *         type: input            # input | select, defaults to input
     *       MODE:
     *         value: 'dark'
     *         type: select
     *         select: ['light', 'dark']
     *
     * @param {string} text - Document text.
     * @returns {Array<{key: string, value: string, type: string, select: string[], scalar: boolean}>|null} Parsed parameters.
     */
    function parseParamsBlock(text) {
      const lines = String(text || '').split(/\r?\n/);
      let start = -1;
      for (let index = 0; index < lines.length; index += 1) {
        if (/^params:\s*(#.*)?$/.test(lines[index])) {
          start = index;
          break;
        }
      }
      if (start < 0) return null;

      const indentOf = (line) => (/^(\s*)/.exec(line)[1].length);
      const rows = [];
      let index = start + 1;
      while (index < lines.length) {
        const line = lines[index];
        if (line.trim() === '' || line.trim().charAt(0) === '#') { index += 1; continue; }
        const indent = indentOf(line);
        if (indent === 0) break;
        const match = /^\s+([A-Za-z0-9_]+):(.*)$/.exec(line);
        if (match === null) { index += 1; continue; }
        const key = match[1];
        const inline = match[2].trim();
        if (inline.length > 0 && inline.charAt(0) !== '#') {
          rows.push({ key: key, value: parseScalar(inline), type: 'input', select: [], scalar: true });
          index += 1;
          continue;
        }
        // Object form: read its children until the indent returns to this level.
        const entry = { key: key, value: '', type: 'input', select: [], scalar: false };
        index += 1;
        while (index < lines.length) {
          const child = lines[index];
          if (child.trim() === '') { index += 1; continue; }
          if (indentOf(child) <= indent) break;
          const field = /^\s+([A-Za-z0-9_]+):(.*)$/.exec(child);
          if (field === null) { index += 1; continue; }
          const name = field[1];
          const rest = field[2].trim();
          if (name === 'value') {
            entry.value = parseScalar(rest);
          } else if (name === 'type') {
            entry.type = parseScalar(rest) || 'input';

          } else if (name === 'select') {
            if (rest.length > 0) {
              entry.select = parseFlowList(rest);
            } else {
              const items = [];
              let lookahead = index + 1;
              while (lookahead < lines.length) {
                const item = /^\s*-\s*(.*)$/.exec(lines[lookahead]);
                if (item === null || indentOf(lines[lookahead]) <= indent) break;
                items.push(parseScalar(item[1]));
                lookahead += 1;
              }
              entry.select = items;
              index = lookahead - 1;
            }
          }
          index += 1;
        }
        if (entry.type === 'boolean') entry.value = String(entry.value).toLowerCase() === 'true' ? 'true' : 'false';
        rows.push(entry);
      }
      return rows.length === 0 ? null : rows;
    }

    function basename(path) {
      if (typeof path !== 'string' || path.length === 0) return '';
      const parts = path.split('/').filter((part) => part.length > 0);
      const tail = parts.length === 0 ? '' : parts[parts.length - 1];
      return tail === 'SKILL.md' && parts.length > 1 ? parts[parts.length - 2] : tail;
    }
    function groupOf(skill, cwd) {
      const path = skill.path || '';
      if (cwd && path.indexOf(cwd) === 0) return 'project';
      if (path.indexOf('/.dsh/skills/') >= 0 || path.indexOf('/.agents/skills/') >= 0) return 'personal';
      return 'bundled';
    }
    function createStore(compute) {
      let snapshot = compute();
      const listeners = new Set();
      return {
        getSnapshot: () => snapshot,
        subscribe: (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        publish: () => {
          const next = compute();
          if (next === snapshot) return;
          snapshot = next;
          listeners.forEach((listener) => listener());
        },
      };
    }

    /** Small metadata chip, the native "自定义" tag shape. */
    function Tag(props) {
      return h('span', {
        style: {
          border: '.5px solid ' + TOKEN.border,
          borderRadius: TOKEN.radiusXs,
          color: TOKEN.labelSecondary,
          flex: 'none',
          padding: '1px 6px',
          fontSize: 11,
          lineHeight: '16px',
          whiteSpace: 'nowrap',
        },
      }, props.children);
    }

    /** Status dot, the native credential-dot shape. */
    function Dot(props) {
      let color = TOKEN.labelTertiary;
      if (props.tone === 'ok') color = TOKEN.success;
      else if (props.tone === 'bad') color = TOKEN.error;
      else if (props.tone === 'warn') color = TOKEN.warn;
      return h('span', {
        'aria-hidden': 'true',
        style: { boxSizing: 'border-box', width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flex: 'none' },
      });
    }

    function Switch(props) {
      const on = props.checked === true;
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': on,
        'aria-label': props.label,
        disabled: props.disabled,
        onClick: props.onToggle,
        style: {
          flex: 'none',
          width: 34,
          height: 20,
          borderRadius: 999,
          border: 'none',
          padding: 2,
          cursor: props.disabled ? 'default' : 'pointer',
          background: on ? TOKEN.buttonFill : TOKEN.bgLayer3,
          opacity: props.disabled ? 0.4 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: on ? 'flex-end' : 'flex-start',
          transition: 'background .15s',
        },
      }, h('span', { style: { width: 16, height: 16, borderRadius: '50%', background: '#fff', display: 'block' } }));
    }

    function SearchBox(props) {
      return h('input', {
        type: 'text',
        value: props.value,
        placeholder: props.placeholder,
        onChange: (event) => props.onChange(event.target.value),
        style: searchStyle,
      });
    }

    function Tabs(props) {
      return h('div', { style: { display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' } },
        props.items.map((tab) => h('button', {
          key: tab.id,
          type: 'button',
          onClick: () => props.onSelect(tab.id),
          style: {
            boxSizing: 'border-box',
            cursor: 'pointer',
            border: 'none',
            background: props.tab === tab.id ? TOKEN.bgLayer3 : 'transparent',
            color: props.tab === tab.id ? TOKEN.labelPrimary : TOKEN.labelTertiary,
            fontFamily: 'inherit',
            fontSize: 13,
            lineHeight: '20px',
            padding: '5px 12px',
            borderRadius: TOKEN.radiusMd,
            display: 'inline-flex',
            gap: 6,
            alignItems: 'center',
          },
        }, tab.label, h('span', { style: { fontSize: 11, color: TOKEN.labelTertiary } }, String(tab.count)))));
    }

    /** Hover/click behaviour shared by the clickable list cards. */
    function cardInteraction(onOpen) {
      return {
        role: 'button',
        tabIndex: 0,
        cursor: 'pointer',
        onClick: onOpen,
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen();
          }
        },
        onMouseEnter: (event) => { event.currentTarget.style.background = TOKEN.hoverSolid; },
        onMouseLeave: (event) => { event.currentTarget.style.background = TOKEN.cardFill; },
      };
    }

    function SkillRow(props) {
      const skill = props.skill;
      const t = props.t;
      const initial = String(skill.name || '?').slice(0, 1).toUpperCase();
      const desc = skill.description || skill.whenToUse || '';
      const open = () => props.onOpen(skill);
      return h('li', { style: { listStyle: 'none' } },
        h('div', Object.assign({}, cardInteraction(open), { style: Object.assign({}, cardStyle, { cursor: 'pointer' }) }),
          h('div', { style: rowHead },
            h('span', { style: iconStyle }, initial),
            h('span', { style: rowIdentity },
              h('span', { style: rowName }, '/' + (skill.name || '')),
              skill.modelInvocable === false ? h(Tag, null, t('userOnly')) : null),
            h('span', { style: rowActions },
              h('button', Object.assign({
                type: 'button',
                style: smallButton(),
                onClick: (event) => { event.stopPropagation(); open(); },
              }, hoverable('secondary')), t('details')))),
          desc ? h('p', { style: rowDesc }, desc) : null));
    }

    function McpRow(props) {
      const server = props.server;
      const t = props.t;
      let tone = 'muted';
      if (props.status === 'connected') tone = 'ok';
      else if (props.status === 'failed') tone = 'bad';
      else if (props.status === 'pending') tone = 'warn';
      const target = server.transport === 'streamable-http' ? (server.url || 'streamable-http') : (server.command || 'stdio');
      const open = () => props.onOpen();
      return h('li', { style: { listStyle: 'none' } },
        h('div', Object.assign({}, cardInteraction(open), { style: Object.assign({}, cardStyle, { cursor: 'pointer' }) }),
          h('div', { style: rowHead },
            h('span', { style: iconStyle }, h('svg', {
              width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
              strokeWidth: 1.7, strokeLinecap: 'round',
            },
              h('path', { d: 'M9 7V4M15 7V4' }),
              h('path', { d: 'M6 7h12v5a6 6 0 0 1-12 0V7Z' }),
              h('path', { d: 'M12 18v3' }))),
            h('span', { style: rowIdentity },
              h('span', { style: rowName }, server.serverName || '—'),
              h(Tag, null, server.transport === 'streamable-http' ? 'http' : 'stdio'),
              h(Dot, { tone: tone })),
            h('span', { style: rowActions },
              h('span', { onClick: (event) => event.stopPropagation() },
                h(Switch, {
                  checked: server.enabled !== false,
                  disabled: props.disabled,
                  label: t('mount'),
                  onToggle: () => props.onToggle(),
                })),
              h('button', Object.assign({
                type: 'button',
                style: smallButton(),
                onClick: (event) => { event.stopPropagation(); open(); },
              }, hoverable('secondary')), t('edit')),
              h('button', Object.assign({
                type: 'button',
                style: smallButton('danger'),
                disabled: props.disabled,
                onClick: (event) => { event.stopPropagation(); props.onRemove(); },
              }, hoverable('danger')), t('removeConnection')))),
          h('p', { style: Object.assign({}, rowDesc, { fontFamily: mono, fontSize: 11.5 }) }, target)));
    }

    function Field(props) {
      return h('label', { style: fieldLabel },
        h('span', null, props.label),
        props.children,
        props.hint ? h('span', { style: hint }, props.hint) : null);
    }

    function SkillDetail(props) {
      const t = props.t;
      const skill = props.skill;
      const [copied, setCopied] = React.useState(false);
      const [params, setParams] = React.useState(null);
      const [paramsState, setParamsState] = React.useState({ status: 'loading', file: '', error: '' });
      const [values, setValues] = React.useState({});
      const [notice, setNotice] = React.useState('');
      const [saving, setSaving] = React.useState(false);

      const dir = String(skill.path || '').replace(/\/[^/]*$/, '');
      const interfaceFile = dir + '/agents/openai.yaml';

      const load = async () => {
        const result = await props.readSkillInterface(skill.path);
        if (result === undefined || result.status !== 'ok') {
          setParams(null);
          setParamsState({ status: 'error', file: (result && result.file) || interfaceFile, error: (result && result.error) || '' });
          return;
        }
        const rows = parseParamsBlock(result.text);
        const next = {};
        (rows || []).forEach((row) => { next[row.key] = row.value; });
        setParams(rows);
        setValues(next);
        setParamsState({ status: rows === null ? 'none' : 'ok', file: result.file || interfaceFile, error: '' });
      };

      React.useEffect(() => { void load(); }, [skill.path]);

      const submit = async () => {
        setSaving(true);
        setNotice('');
        const submitted = Object.assign({}, values);
        try {
          const accepted = await props.saveSkillParams(requestedFile(), submitted);
          if (!accepted) {
            setNotice(t('paramsSaveFailed'));
            return;
          }
          // The Host writes the file on its own turn; re-read and compare so the
          // page never claims a write it did not observe.
          await new Promise((resolve) => { setTimeout(resolve, 700); });
          const readBack = await props.readSkillInterface(skill.path);
          const rows = readBack && readBack.status === 'ok' ? parseParamsBlock(readBack.text) : null;
          const applied = rows !== null && Object.keys(submitted).every((key) => {
            const row = rows.filter((entry) => entry.key === key)[0];
            return row !== undefined && row.value === submitted[key];
          });
          setNotice(applied ? t('paramsSaved') : t('paramsStaged'));
          await load();
        } finally {
          setSaving(false);
        }
      };

      const requestedFile = () => paramsState.file || interfaceFile;

      const facts = [];
      if (skill.path) {
        facts.push(h('div', { key: 'path', style: factRow },
          h('span', { style: factKey }, t('location')),
          h('span', { style: Object.assign({}, factValue, { fontFamily: mono, fontSize: 11.5 }) }, skill.path)));
      }
      if (skill.whenToUse) {
        facts.push(h('div', { key: 'when', style: factRow },
          h('span', { style: factKey }, t('whenToUse')),
          h('span', { style: factValue }, skill.whenToUse)));
      }

      const paramRows = [];
      if (paramsState.status === 'ok' && params !== null) {
        const edit = (key, value) => {
          const next = Object.assign({}, values);
          next[key] = value;
          setValues(next);
        };
        params.forEach((row) => {
          const key = row.key;
          const current = values[key] === undefined ? '' : values[key];
          const listed = row.type === 'select'
            ? Array.from(new Set((row.select || []).concat([current]).filter((item) => item.length > 0)))
            : [];
          const choices = row.type === 'select' && current === '' ? [''].concat(listed) : listed;
          let control;
          if (row.type === 'boolean') {
            // `value: true|false` renders as a switch; the file keeps a YAML boolean.
            control = h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 8 } },
              h(Switch, {
                checked: current === 'true',
                label: key,
                onToggle: () => edit(key, current === 'true' ? 'false' : 'true'),
              }),
              h('code', { style: { fontSize: 11.5, color: TOKEN.labelTertiary, fontFamily: mono } }, current === 'true' ? 'true' : 'false'));
          } else if (row.type === 'select' && choices.length > 0) {
            control = h('select', {
              style: Object.assign({}, paramControlStyle, { appearance: 'auto' }),
              value: current,
              onChange: (event) => edit(key, event.target.value),
            }, choices.map((choice) => h('option', { key: choice, value: choice }, choice === '' ? t('paramEmpty') : choice)));
          } else {
            control = h('input', {
              type: 'text',
              value: current,
              onChange: (event) => edit(key, event.target.value),
              style: paramControlStyle,
              spellCheck: false,
            });
          }
          paramRows.push(h('div', {
            key: key,
            style: { display: 'grid', gridTemplateColumns: 'minmax(150px, 220px) minmax(0, 1fr)', gap: 10, alignItems: 'center' },
          },
            h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 } },
              h('code', { style: { fontSize: 11.5, color: TOKEN.labelSecondary, fontFamily: mono, wordBreak: 'break-all' } }, key),
              row.type === 'select' || row.type === 'boolean' ? h(Tag, null, row.type) : null),
            control));
        });
      }

      // No params block, no parameters section: a skill without `params` shows
      // no title, no hint and no empty state at all.
      let paramCard = null;
      if (paramsState.status === 'ok' && paramRows.length > 0) {
        paramCard = h('section', { style: cardStyle },
          h('div', { style: { display: 'grid', gap: 3 } },
            h('h4', { style: { margin: 0, fontSize: 13, fontWeight: 500, color: TOKEN.labelPrimary } }, t('paramsTitle')),
            h('p', { style: hint }, t('paramsHint'))),
          h('div', { style: { display: 'grid', gap: 8 } }, paramRows),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
            h('span', { style: tinyHint }, t('paramsFile')),
            h('code', { style: { fontFamily: mono, fontSize: 11, color: TOKEN.labelSecondary, wordBreak: 'break-all' } }, requestedFile())),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' } },
            h('button', Object.assign({
              type: 'button',
              // While saving only the label changes: same fill, same text colour,
              // no hover repaint.
              style: Object.assign({}, buttonStyle('primary'), saving ? { opacity: 1, cursor: 'default' } : {}),
              disabled: saving,
              onClick: submit,
            }, saving ? {} : hoverable('primary')), saving ? t('saving') : t('paramsSave')),
            h('button', Object.assign({
              type: 'button',
              style: smallButton(),
              disabled: saving,
              onClick: () => { setNotice(''); void load(); },
            }, hoverable('secondary')), t('refresh')),
            notice ? h('span', { style: Object.assign({}, hint, { color: notice === t('paramsStaged') ? TOKEN.warn : TOKEN.labelTertiary }) }, notice) : null),
          h('p', { style: tinyHint }, t('paramsSecretNote')));
      } else if (paramsState.status === 'error') {
        // A genuine read failure is still worth a single line; a missing block is not.
        paramCard = h('section', { style: cardStyle },
          h('p', { style: Object.assign({}, hint, { color: TOKEN.error }) }, t('paramsReadError') + (paramsState.error || '')));
      }

      return h('div', { style: detailGrid },
        h(BackBar, { t: t, onBack: props.onBack }),
        h('div', { style: { display: 'grid', gap: 8 } },
          h('h3', { style: detailTitle }, '/' + (skill.name || '')),
          skill.description ? h('p', { style: detailDesc }, skill.description) : null),
        facts,
        h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
          h('span', { style: hint }, t('skillInvoke')),
          h('code', { style: { fontSize: 12, padding: '2px 7px', borderRadius: 6, background: TOKEN.bgLayer3, color: TOKEN.labelPrimary } }, '/' + (skill.name || '')),
          skill.path ? h('button', Object.assign({
            type: 'button',
            style: smallButton(),
            onClick: () => {
              const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
              if (clipboard && typeof clipboard.writeText === 'function') {
                clipboard.writeText(skill.path).then(() => setCopied(true), () => undefined);
              }
            },
          }, hoverable('secondary')), copied ? t('copied') : t('copyPath')) : null),
        paramCard);
    }

    function BackBar(props) {
      return h('div', null,
        h('button', {
          type: 'button',
          onClick: props.onBack,
          style: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: TOKEN.labelTertiary, font: 'inherit', fontSize: 12.5 },
        }, '‹ ' + props.t('back')));
    }

    function McpDetail(props) {
      const t = props.t;
      const [draft, setDraft] = React.useState(() => draftOf(props.server));
      const [notice, setNotice] = React.useState('');
      const [saving, setSaving] = React.useState(false);
      const patch = (next) => setDraft(Object.assign({}, draft, next));
      const invalid = draftProblem([draft]);
      const blocked = !props.writable || saving;

      const submit = async () => {
        setSaving(true);
        try {
          const accepted = await props.onSave(serverOf(draft));
          if (accepted) {
            setNotice(t('saved'));
            props.onBack();
          } else {
            setNotice(t('saveFailed'));
          }
        } finally {
          setSaving(false);
        }
      };

      const transportField = h(Field, { label: t('transport') },
        h('select', {
          style: Object.assign({}, inputStyle, { appearance: 'auto' }),
          value: draft.transport,
          onChange: (event) => patch({ transport: event.target.value }),
        },
          h('option', { value: 'stdio' }, 'stdio'),
          h('option', { value: 'streamable-http' }, 'streamable-http')));

      const body = draft.transport === 'stdio'
        ? h('div', { style: { display: 'grid', gap: 12 } },
          h(Field, { label: t('command') },
            h('input', { style: inputStyle, value: draft.command, onChange: (event) => patch({ command: event.target.value }) })),
          h(Field, { label: t('args') },
            h('textarea', { style: textareaStyle, value: draft.argsText, onChange: (event) => patch({ argsText: event.target.value }) })),
          h(Field, { label: t('env') },
            h('textarea', { style: textareaStyle, value: draft.envText, onChange: (event) => patch({ envText: event.target.value }) })),
          h(Field, { label: t('cwd') },
            h('input', { style: inputStyle, value: draft.cwd, onChange: (event) => patch({ cwd: event.target.value }) })))
        : h('div', { style: { display: 'grid', gap: 12 } },
          h(Field, { label: t('url') },
            h('input', { style: inputStyle, value: draft.url, onChange: (event) => patch({ url: event.target.value }) })),
          h(Field, { label: t('headers') },
            h('textarea', { style: textareaStyle, value: draft.headersText, onChange: (event) => patch({ headersText: event.target.value }) })));

      return h('div', { style: detailGrid },
        h(BackBar, { t: t, onBack: props.onBack }),
        h('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 } },
          h('div', { style: { display: 'grid', gap: 6, minWidth: 0 } },
            h('h3', { style: detailTitle }, draft.serverName || t('addConnection')),
            h('p', { style: hint }, t('toolNameHint') + ' mcp__' + (draft.serverName || '<name>') + '__<tool>')),
          h('div', { style: { display: 'flex', gap: 8, flex: 'none' } },
            props.canRemove ? h('button', {
              type: 'button',
              style: buttonStyle('danger'),
              disabled: blocked,
              onClick: async () => {
                setSaving(true);
                try {
                  await props.onRemove();
                  props.onBack();
                } finally {
                  setSaving(false);
                }
              },
            }, t('removeConnection')) : null)),
        h('div', { style: { display: 'grid', gap: 12, paddingTop: 4 } },
          h('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) minmax(160px, 1fr)', gap: 12 } },
            h(Field, { label: t('name'), hint: t('nameHint') },
              h('input', { style: inputStyle, value: draft.serverName, onChange: (event) => patch({ serverName: event.target.value }) })),
            transportField),
          body),
        h('div', { style: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', paddingTop: 4 } },
          h('button', {
            type: 'button',
            style: buttonStyle('primary'),
            onClick: submit,
            disabled: blocked || invalid,
          }, saving ? t('saving') : t('save')),
          h('button', {
            type: 'button',
            style: buttonStyle(),
            disabled: blocked,
            onClick: () => { setDraft(draftOf(props.server)); setNotice(''); },
          }, t('discard')),
          invalid ? h('span', { style: Object.assign({}, hint, { color: TOKEN.error }) }, t('invalid')) : null,
          notice ? h('span', { style: hint }, notice) : null),
        props.readOnlyNote ? h('p', { style: hint }, props.readOnlyNote) : null);
    }

    /** Collapsible group header: chevron, label, count. */
    function GroupHead(props) {
      return h('button', {
        type: 'button',
        onClick: props.onToggle,
        'aria-expanded': props.collapsed !== true,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          margin: '18px 0 0',
          padding: 0,
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          color: 'inherit',
          font: 'inherit',
        },
      },
        h('svg', {
          width: 14,
          height: 14,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: TOKEN.labelTertiary,
          strokeWidth: 2,
          strokeLinecap: 'round',
          style: { transform: props.collapsed === true ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' },
        }, h('path', { d: 'M6 9l6 6 6-6' })),
        h('h4', { style: listHeadTitle }, props.label),
        h('span', { style: listHeadCount }, String(props.count)));
    }

    function PluginRow(props) {
      const entry = props.entry;
      const t = props.t;
      const phase = entry.fiberPhase || 'idle';
      let tone = 'muted';
      if (phase === 'active') tone = 'ok';
      else if (phase === 'failed') tone = 'bad';
      else if (phase === 'loading' || phase === 'pending') tone = 'warn';
      const phaseLabel = t('phase' + phase.slice(0, 1).toUpperCase() + phase.slice(1)) || phase;
      return h('li', { style: { listStyle: 'none' } },
        h('div', { style: cardStyle },
          h('div', { style: rowHead },
            h('span', { style: iconStyle }, String(entry.moduleName || '?').slice(0, 1).toUpperCase()),
            h('span', { style: rowIdentity },
              h('span', { style: rowName }, entry.entryId || entry.moduleName || ''),
              h(Tag, null, phaseLabel),
              h(Dot, { tone: tone }))),
          h('p', { style: Object.assign({}, rowDesc, { fontFamily: mono, fontSize: 11.5 }) }, entry.moduleName || '')));
    }

    /** Modal "add connection" dialog: local command or online endpoint. */
    function AddConnectionDialog(props) {
      const t = props.t;
      const [mode, setMode] = React.useState('stdio');
      const [draft, setDraft] = React.useState(() => emptyDraft());
      const [error, setError] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const patch = (next) => setDraft(Object.assign({}, draft, next));

      React.useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape') props.onCancel(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, []);

      const modeButton = (id, label) => h('button', {
        key: id,
        type: 'button',
        onClick: () => { setMode(id); setError(''); },
        style: {
          boxSizing: 'border-box',
          cursor: 'pointer',
          border: 'none',
          background: mode === id ? TOKEN.bgLayer3 : 'transparent',
          color: mode === id ? TOKEN.labelPrimary : TOKEN.labelTertiary,
          fontFamily: 'inherit',
          fontSize: 13,
          lineHeight: '20px',
          padding: '5px 12px',
          borderRadius: TOKEN.radiusMd,
        },
      }, label);

      const field = (label, control, hintText) => h(Field, { label: label, hint: hintText }, control);

      const submit = async () => {
        const name = draft.serverName.trim();
        if (!/^[A-Za-z0-9_-]{1,32}$/.test(name)) {
          setError(t('nameInvalid'));
          return;
        }
        if (props.existing.indexOf(name) >= 0) {
          setError(t('nameTaken'));
          return;
        }
        const server = serverOf(Object.assign({}, draft, { transport: mode }));
        const needsTarget = mode === 'streamable-http' ? server.url.length === 0 : server.command.length === 0;
        if (needsTarget) {
          setError(t('needTarget'));
          return;
        }
        setBusy(true);
        setError('');
        try {
          const accepted = await props.onSubmit(server);
          if (!accepted) setError(t('saveFailed'));
        } finally {
          setBusy(false);
        }
      };

      const body = mode === 'stdio'
        ? [
          field(t('command'), h('input', {
            style: inputStyle,
            value: draft.command,
            onChange: (event) => patch({ command: event.target.value }),
          })),
          field(t('args'), h('textarea', {
            style: textareaStyle,
            value: draft.argsText,
            onChange: (event) => patch({ argsText: event.target.value }),
          })),
          field(t('env'), h('textarea', {
            style: textareaStyle,
            value: draft.envText,
            onChange: (event) => patch({ envText: event.target.value }),
          })),
          field(t('cwd'), h('input', {
            style: inputStyle,
            value: draft.cwd,
            onChange: (event) => patch({ cwd: event.target.value }),
          })),
        ]
        : [
          field(t('url'), h('input', {
            style: inputStyle,
            value: draft.url,
            onChange: (event) => patch({ url: event.target.value }),
          })),
          field(t('headers'), h('textarea', {
            style: textareaStyle,
            value: draft.headersText,
            onChange: (event) => patch({ headersText: event.target.value }),
          })),
        ];

      return h('div', {
        style: backdropStyle,
        onClick: (event) => { if (event.target === event.currentTarget) props.onCancel(); },
      },
        h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': t('addConnection'), style: dialogStyle },
          h('div', { style: { display: 'grid', gap: 4 } },
            h('h3', { style: dialogTitle }, t('addConnection')),
            h('p', { style: hint }, t('addSubtitle'))),
          h('div', { style: { display: 'flex', gap: 6, padding: '2px 0' } },
            modeButton('stdio', t('modeLocal')),
            modeButton('streamable-http', t('modeOnline'))),
          h('div', { style: { display: 'grid', gap: 12 } },
            field(t('name'), h('input', {
              style: inputStyle,
              value: draft.serverName,
              onChange: (event) => patch({ serverName: event.target.value }),
            }), t('nameHint')),
            body),
          error ? h('p', { style: Object.assign({}, hint, { color: TOKEN.error }) }, error) : null,
          h('p', { style: tinyHint }, mode === 'stdio' ? t('tipsLocal') : t('tipsOnline')),
          h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 2 } },
            h('button', Object.assign({ type: 'button', style: buttonStyle('secondary'), onClick: props.onCancel }, hoverable('secondary')), t('cancel')),
            h('button', Object.assign({ type: 'button', style: buttonStyle('primary'), disabled: busy, onClick: submit }, busy ? {} : hoverable('primary')), busy ? t('saving') : t('add')))));
    }

    function Panel(props) {
      const t = props.t;
      const state = React.useSyncExternalStore(props.store.subscribe, props.store.getSnapshot);
      const [tab, setTab] = React.useState('skills');
      const [query, setQuery] = React.useState('');
      const [open, setOpen] = React.useState(null);
      const [collapsed, setCollapsed] = React.useState({});
      const [showAllPlugins, setShowAllPlugins] = React.useState(false);
      const [adding, setAdding] = React.useState(false);

      // The Settings shell mounts this page each time the section is opened, so
      // arriving here re-reads the catalog and the loader inventory — the same
      // work the Refresh button does, without a click.
      React.useEffect(() => {
        props.refresh();
      }, []);

      const isCollapsed = (id) => collapsed[id] === true;
      const toggleGroup = (id) => setCollapsed(Object.assign({}, collapsed, { [id]: !isCollapsed(id) }));
      const toggleAll = (ids) => {
        const collapseThem = ids.filter((id) => !isCollapsed(id)).length > 0;
        const next = Object.assign({}, collapsed);
        ids.forEach((id) => { next[id] = collapseThem; });
        setCollapsed(next);
      };

      const servers = state.servers || [];
      const skills = state.skills || { status: 'idle', items: [] };
      const plugins = state.plugins || [];
      const sessionOptions = state.sessionOptions || [];
      const selected = sessionOptions.filter((option) => option.id === state.sessionId)[0];
      const cwd = selected ? selected.cwd : '';

      const statusOf = (serverName) => {
        const rows = (state.mcp && state.mcp.rows) || [];
        const entry = rows.filter((row) => row.entryId === MCP_ENTRY_PREFIX + serverName)[0];
        if (entry === undefined) return 'absent';
        if (entry.fiberPhase === 'active') return 'connected';
        if (entry.fiberPhase === 'failed') return 'failed';
        if (entry.fiberPhase === 'loading' || entry.fiberPhase === 'pending' || entry.fiberPhase === 'unloading') return 'pending';
        return 'absent';
      };

      const writable = state.writable === true;
      const formReady = state.formStatus === 'ready';

      const saveServers = async (next) => props.save(next);

      const toggled = async (index) => {
        const next = servers.map((server, at) => (at === index ? Object.assign({}, server, { enabled: server.enabled === false }) : server));
        const accepted = await saveServers(next);
        if (accepted) props.refresh();
      };

      const removed = async (index) => {
        const next = servers.filter((server, at) => at !== index);
        const accepted = await saveServers(next);
        if (accepted) props.refresh();
      };

      if (open !== null && open.kind === 'skill') {
        return h(SkillDetail, {
          t: t,
          skill: open.skill,
          readSkillInterface: props.readSkillInterface,
          saveSkillParams: props.saveSkillParams,
          onBack: () => setOpen(null),
        });
      }

      if (open !== null && open.kind === 'mcp') {
        const index = open.index;
        const existing = index < servers.length ? servers[index] : undefined;
        return h(McpDetail, {
          key: 'mcp:' + String(index) + ':' + JSON.stringify(existing || null),
          t: t,
          server: existing,
          canRemove: existing !== undefined,
          writable: writable && formReady,
          readOnlyNote: !formReady ? t('unavailable') : (!writable ? t('readOnly') : ''),
          onSave: async (server) => {
            const next = servers.slice();
            if (existing === undefined) next.push(server);
            else next[index] = server;
            const accepted = await saveServers(next);
            if (accepted) props.refresh();
            return accepted;
          },
          onRemove: async () => {
            const next = servers.filter((server, at) => at !== index);
            const accepted = await saveServers(next);
            if (accepted) props.refresh();
            return accepted;
          },
          onBack: () => setOpen(null),
        });
      }

      const header = h('header', { style: { display: 'grid', gap: 4, padding: '2px 0 14px' } },
        h('h2', { style: { margin: 0, fontSize: 16, fontWeight: 600, lineHeight: '24px', color: TOKEN.labelPrimary } }, t('title')),
        h('p', { style: Object.assign({}, hint, { fontSize: 12.5 }) }, t('description')));

      const notes = [];
      if (tab === 'skills') {
        if (skills.status === 'loading') notes.push(h('p', { key: 'l', style: hint }, '…'));
        if (skills.status === 'error') notes.push(h('p', { key: 'e', style: Object.assign({}, hint, { color: TOKEN.error }) }, t('skillsError') + (skills.error || '')));
        if (skills.status === 'ready' && (skills.items || []).length === 0) notes.push(h('p', { key: 'n', style: hint }, t('skillsEmpty')));
      } else if (tab === 'mcp') {
        if (!formReady) notes.push(h('p', { key: 'h', style: hint }, t('unavailable')));
        if (formReady && !writable) notes.push(h('p', { key: 'r', style: hint }, t('readOnly')));
        if (servers.length === 0) notes.push(h('p', { key: 'n', style: hint }, t('mcpEmpty')));
      }

      let list = null;
      let hintLine = '';
      let groupIds = [];

      if (tab === 'skills') {
        hintLine = t('skillsHint');
        const needle = query.trim().toLowerCase();
        const filtered = (skills.items || []).filter((skill) => {
          if (needle.length === 0) return true;
          const name = String(skill.name || '').toLowerCase();
          const desc = String(skill.description || '').toLowerCase();
          return name.indexOf(needle) >= 0 || desc.indexOf(needle) >= 0;
        });
        const order = ['project', 'personal', 'bundled'];
        const groups = order.map((group) => ({
          group: group,
          items: filtered.filter((skill) => groupOf(skill, cwd) === group),
        })).filter((entry) => entry.items.length > 0);
        groupIds = groups.map((entry) => 'skill:' + entry.group);
        list = h('div', null, groups.map((entry) => h('div', { key: entry.group },
          h(GroupHead, {
            label: t('group' + entry.group.slice(0, 1).toUpperCase() + entry.group.slice(1)),
            count: entry.items.length,
            collapsed: isCollapsed('skill:' + entry.group),
            onToggle: () => toggleGroup('skill:' + entry.group),
          }),
          isCollapsed('skill:' + entry.group) ? null : h('ul', { style: rowsStyle }, entry.items.map((skill, index) => h(SkillRow, {
            key: (skill.name || '') + index,
            t: t,
            skill: skill,
            onOpen: () => setOpen({ kind: 'skill', skill: skill }),
          }))))));
      } else if (tab === 'mcp') {
        hintLine = t('toolNameHint') + ' mcp__<name>__<tool>';
        const needle = query.trim().toLowerCase();
        const filtered = servers
          .map((server, index) => ({ server: server, index: index }))
          .filter((entry) => {
            if (needle.length === 0) return true;
            return String(entry.server.serverName || '').toLowerCase().indexOf(needle) >= 0;
          });
        groupIds = ['mcp'];
        list = h('div', null,
          h(GroupHead, {
            label: t('groupServers'),
            count: servers.length,
            collapsed: isCollapsed('mcp'),
            onToggle: () => toggleGroup('mcp'),
          }),
          isCollapsed('mcp') ? null : h('ul', { style: rowsStyle }, filtered.map((entry) => h(McpRow, {
            key: entry.server.serverName + entry.index,
            t: t,
            server: entry.server,
            status: statusOf(entry.server.serverName),
            disabled: !writable || !formReady,
            onOpen: () => setOpen({ kind: 'mcp', index: entry.index }),
            onToggle: () => toggled(entry.index),
            onRemove: () => removed(entry.index),
          }))),
          isCollapsed('mcp') ? null : h('button', {
            type: 'button',
            style: buttonStyle('dashed'),
            disabled: !writable || !formReady,
            onClick: () => setAdding(true),
          }, '+ ' + t('addConnection')));
      } else {
        hintLine = t('pluginsHint');
        const needle = query.trim().toLowerCase();
        const filtered = plugins.filter((entry) => {
          if (needle.length === 0) return true;
          const id = String(entry.entryId || '').toLowerCase();
          const module = String(entry.moduleName || '').toLowerCase();
          return id.indexOf(needle) >= 0 || module.indexOf(needle) >= 0;
        });
        groupIds = ['plugins'];
        list = filtered.length === 0
          ? null
          : h('div', null,
            h(GroupHead, {
              label: t('tabPlugins'),
              count: filtered.length,
              collapsed: isCollapsed('plugins'),
              onToggle: () => toggleGroup('plugins'),
            }),
            isCollapsed('plugins') ? null : h('ul', { style: rowsStyle }, (showAllPlugins ? filtered : filtered.slice(0, 60)).map((entry, index) => h(PluginRow, {
              key: (entry.entryId || '') + index,
              t: t,
              entry: entry,
            }))),
            isCollapsed('plugins') || showAllPlugins || filtered.length <= 60 ? null : h('button', {
              type: 'button',
              style: buttonStyle('dashed'),
              onClick: () => setShowAllPlugins(true),
            }, '+ ' + t('showAll') + ' · ' + filtered.length));
        if (filtered.length === 0) notes.push(h('p', { key: 'p', style: hint }, t('pluginsEmpty')));
      }

      const toolbar = h('div', {
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 0 10px' },
      },
        h(Tabs, {
          t: t,
          tab: tab,
          items: [
            { id: 'skills', label: t('tabSkills'), count: (skills.items || []).length },
            { id: 'mcp', label: t('tabMcp'), count: servers.length },
            { id: 'plugins', label: t('tabPlugins'), count: plugins.length },
          ],
          onSelect: (next) => { setTab(next); setQuery(''); },
        }),
        h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
          groupIds.length === 0 ? null : h('button', Object.assign({
            type: 'button',
            style: buttonStyle('link'),
            onClick: () => toggleAll(groupIds),
          }, hoverable('secondary')), groupIds.filter((id) => isCollapsed(id)).length === groupIds.length ? t('expandAll') : t('collapseAll')),
          h(SearchBox, {
            value: query,
            placeholder: tab === 'skills' ? t('searchSkills') : (tab === 'mcp' ? t('searchMcp') : t('searchPlugins')),
            onChange: setQuery,
          }),
          tab === 'mcp' ? h('button', Object.assign({
            type: 'button',
            style: buttonStyle('primary'),
            disabled: !writable || !formReady,
            onClick: () => setAdding(true),
          }, (!writable || !formReady) ? {} : hoverable('primary')), t('addConnection')) : null,
          h('button', Object.assign({ type: 'button', style: buttonStyle('secondary'), onClick: props.refresh }, hoverable('secondary')), t('refresh'))));

      return h('div', { style: { display: 'grid', gap: 0, padding: '2px 0 12px' } },
        header,
        toolbar,
        hintLine ? h('p', { style: Object.assign({}, hint, { paddingBottom: 2 }) }, hintLine) : null,
        notes,
        list,
        adding ? h(AddConnectionDialog, {
          t: t,
          existing: servers.map((server) => String(server.serverName || '')),
          onCancel: () => setAdding(false),
          onSubmit: async (server) => {
            const accepted = await saveServers(servers.concat([server]));
            if (accepted) {
              setAdding(false);
              props.refresh();
            }
            return accepted;
          },
        }) : null);
    }

    // `remote.skills` is served by the session-controller + api-remotes rows the
    // Web bundle mounts, so the skills list needs no Host code of its own.
    const inject = ['slots', 'locale', 'configForms', 'sessions', 'remote', 'remote.skills', 'remote.pluginInventory', 'remote.workspaceFiles'];

    function apply(ctx) {
      const t = ctx.locale.bind(NS);
      ctx.effect(() => ctx.locale.register(NS, { en: en, zh: zh }), 'dsh-extended-panel: dictionaries');

      const form = ctx.configForms.get(ENTRY_ID);
      const skillsRemote = ctx.remote.skills;
      const inventoryRemote = ctx.remote.pluginInventory;
      const filesRemote = ctx.remote.workspaceFiles;
      const sessions = ctx.sessions;
      const remotes = ctx.remote;

      const state = {
        skills: { status: 'idle', items: [], error: '' },
        mcp: { rows: [] },
        plugins: [],
        sessionId: undefined,
      };

      function sessionSnapshot() {
        const snapshot = sessions.list && sessions.list.getSnapshot ? sessions.list.getSnapshot() : undefined;
        return { ids: (snapshot && snapshot.ids) || [], byId: (snapshot && snapshot.byId) || {} };
      }

      function sessionOptions() {
        const current = sessionSnapshot();
        return current.ids.map((id) => {
          const row = current.byId[id] || {};
          const cwd = typeof row.cwd === 'string' ? row.cwd : '';
          return {
            id: id,
            cwd: cwd,
            label: (cwd ? basename(cwd) : '') || id.slice(0, 12),
          };
        });
      }

      function defaultSessionId() {
        const current = sessionSnapshot();
        const retained = current.ids.filter((id) => ((current.byId[id] || {}).retainedBy || {}).mainView > 0);
        if (retained.length > 0) return retained[0];
        return current.ids.length > 0 ? current.ids[current.ids.length - 1] : undefined;
      }

      const store = createStore(() => {
        const snapshot = form.getSnapshot();
        const value = snapshot.value || {};
        return {
          formStatus: snapshot.status,
          writable: snapshot.writable === true,
          revision: snapshot.revision,
          servers: Array.isArray(value.servers) ? value.servers : [],
          skills: state.skills,
          mcp: state.mcp,
          plugins: state.plugins,
          sessionId: state.sessionId,
          sessionOptions: sessionOptions(),
        };
      });

      const unsubscribe = form.subscribe(() => store.publish());
      ctx.effect(() => () => unsubscribe(), 'dsh-extended-panel: form subscription');

      async function loadSkills() {
        if (skillsRemote === undefined) {
          state.skills = { status: 'error', items: [], error: 'skills Remote is absent' };
          store.publish();
          return;
        }
        if (state.sessionId === undefined) state.sessionId = defaultSessionId();
        const sessionId = state.sessionId;
        if (sessionId === undefined) {
          state.skills = { status: 'ready', items: [], error: '' };
          store.publish();
          return;
        }
        state.skills = { status: 'loading', items: state.skills.items, error: '' };
        store.publish();
        const abort = new AbortController();
        try {
          const result = await sessions.using(sessionId, { source: 'extendedPanel', signal: abort.signal }, async () => {
            return await skillsRemote.list({ sessionId: sessionId }, abort.signal);
          });
          if (result && result.ok === false) {
            throw new Error((result.error && (result.error.message || result.error.code)) || 'unknown error');
          }
          const items = (result && result.value && result.value.skills) || [];
          state.skills = { status: 'ready', items: items, error: '' };
        } catch (error) {
          state.skills = { status: 'error', items: [], error: String((error && error.message) || error) };
        }
        store.publish();
      }

      async function loadInventory() {
        if (inventoryRemote === undefined) return;
        try {
          const result = await inventoryRemote.list();
          const entries = (result && result.value && result.value.entries) || (result && result.entries) || [];
          state.plugins = entries.map((entry) => ({
            entryId: entry.entryId || '',
            moduleName: entry.moduleName || '',
            fiberPhase: entry.fiberPhase || null,
          }));
          state.mcp = {
            rows: state.plugins
              .filter((entry) => entry.moduleName === MCP_MODULE)
              .map((entry) => ({ entryId: entry.entryId, fiberPhase: entry.fiberPhase })),
          };
          store.publish();
        } catch (error) {
          // Inventory is diagnostic only; the form still works without it.
        }
      }

      function refresh() {
        if (state.sessionId === undefined) state.sessionId = defaultSessionId();
        void loadSkills();
        void loadInventory();
      }

      /**
       * Read one skill's `agents/openai.yaml` through the workspace-files Remote,
       * which accepts absolute paths outside the workspace root.
       * @param {string} skillPath - Absolute path of the skill's SKILL.md.
       * @returns {Promise<{status: string, file: string, text?: string, error?: string}>} The document or a failure.
       */
      /**
       * Read one text file through the workspace-files Remote, page by page.
       * @param {string} sessionId - Session whose workspace scope answers the call.
       * @param {string} file - Absolute path; files outside the workspace are allowed.
       * @returns {Promise<string>} The complete document text.
       */
      async function readTextFile(sessionId, file) {
        let text = '';
        let offset = 1;
        for (let page = 0; page < 6; page += 1) {
          // The Remote takes (sessionId, path, range); an empty range is the defaults.
          const response = await filesRemote.read(sessionId, file, { offset: offset });
          if (response && response.ok === false) {
            throw new Error((response.error && (response.error.message || response.error.code)) || 'read failed');
          }
          const result = response && response.value !== undefined ? response.value : response;
          const chunk = result && typeof result.text === 'string' ? result.text : '';
          text = text.length === 0 ? chunk : text + '\n' + chunk;
          if (result === undefined || result.eof !== false || !result.lines) break;
          offset = (result.offset || offset) + result.lines;
        }
        if (text.trim().length === 0) throw new Error('the file read back empty');
        return text;
      }

      /**
       * Read one skill's `agents/openai.yaml` through the workspace-files Remote,
       * which accepts absolute paths outside the workspace root.
       * @param {string} skillPath - Absolute path of the skill's SKILL.md.
       * @returns {Promise<{status: string, file: string, text?: string, error?: string}>} The document or a failure.
       */
      async function readSkillInterface(skillPath) {
        const dir = String(skillPath || '').replace(/\/[^/]*$/, '');
        const file = dir + '/agents/openai.yaml';
        if (filesRemote === undefined) return { status: 'error', file: file, error: 'workspaceFiles Remote is absent' };
        const sessionId = state.sessionId ?? defaultSessionId();
        if (sessionId === undefined) return { status: 'error', file: file, error: 'no session is open' };
        try {
          const text = await readTextFile(sessionId, file);
          return { status: 'ok', file: file, text: text };
        } catch (error) {
          return { status: 'error', file: file, error: String((error && error.message) || error) };
        }
      }

      /**
       * Stage parameter values for one skill file; the Host half writes them.
       * @param {string} file - Absolute path of the `agents/openai.yaml`.
       * @param {Record<string, string>} values - Parameter values.
       * @returns {Promise<boolean>} Whether the Host accepted the write.
       */
      async function saveSkillParams(file, values) {
        const snapshot = form.getSnapshot();
        const value = snapshot.value || {};
        const current = value.skillParams !== null && typeof value.skillParams === 'object' && !Array.isArray(value.skillParams) ? value.skillParams : {};
        const next = Object.assign({}, current, { [file]: values });
        try {
          return await form.mutate([{ op: 'set', path: ['skillParams'], value: next }]);
        } catch (error) {
          return false;
        }
      }

      async function save(servers) {
        try {
          return await form.mutate([{ op: 'set', path: ['servers'], value: servers }]);
        } catch (error) {
          return false;
        }
      }

      ctx.effect(() => {
        refresh();
        const offList = sessions.list && typeof sessions.list.subscribe === 'function'
          ? sessions.list.subscribe(() => {
            const options = sessionOptions();
            const present = options.filter((option) => option.id === state.sessionId).length > 0;
            if (!present) {
              state.sessionId = defaultSessionId();
              store.publish();
              void loadSkills();
              return;
            }
            store.publish();
          })
          : undefined;
        const offManager = remotes && typeof remotes.$on === 'function'
          ? remotes.$on('plugin-manager/changed', () => void loadInventory())
          : undefined;
        return () => {
          if (typeof offList === 'function') offList();
          if (typeof offManager === 'function') offManager();
        };
      }, 'dsh-extended-panel: initial reads');

      // Registered unconditionally: when the Host half is loaded its Config is the
      // page's data, and when it is not the page still explains that state instead
      // of disappearing without a trace.
      // A first-class Settings section: it gets the sidebar entry, and the page
      // owns its header, tab bar, and detail views. The section carries no
      // config of its own, so `inject` stays empty and the page receives its
      // store and actions through the closure below.
      ctx.effect(() => ctx.slots.inject(SLOT, () => ctx.slots.register({
        name: SLOT,
        id: 'dsh-extended-panel',
        order: 13,
        label: () => t('title'),
        locale: NS,
        inject: () => ({}),
      }, () => h(Panel, {
        t: t,
        store: store,
        save: save,
        refresh: refresh,
        readSkillInterface: readSkillInterface,
        saveSkillParams: saveSkillParams,
      }))), 'dsh-extended-panel: settings section');
    }

    return { inject: inject, apply: apply };
  },
});
