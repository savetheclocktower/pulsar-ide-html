const Path = require('path');
const { CompositeDisposable } = require('atom');
const { AutoLanguageClient } = require('@savetheclocktower/atom-languageclient');
const safeGet = require('just-safe-get');
const safeSet = require('just-safe-set');
const _extend = require('just-extend');
let extend = /** @type {_extend.default} */ (/** @type {unknown} */ (_extend))

/**
 * Like {@link safeGet} and {@link safeSet}, but deletes a key at a certain key
 * path.
 *
 * @param {Record<string, unknown>} obj
 * @param {string} keyPath
 * @returns {boolean}
 */
function safeDelete (obj, keyPath) {
  let parentKeyPath = keyPath.split('.');
  if (parentKeyPath.length === 0) {
    throw new Error(`Invalid key path`);
  }
  let property = parentKeyPath.pop();
  let parentObject = parentKeyPath.length === 0 ?
    obj :
    safeGet(obj, parentKeyPath.join('.'));
  return delete parentObject[property];
}

/** @type {Record<string, (value: unknown) => unknown>} */
const CONFIG_TRANSLATIONS = {
  // VS Code (and thus this language server) represents these as strings, but
  // we use arrays for such things.
  ['format.unformatted'](value) {
    return value.join(',');
  },
  ['format.contentUnformatted'](value) {
    return value.join(',');
  },
  ['format.extraLiners'](value) {
    return value.join(',');
  },

  // These are nullable settings. We don't have that in Pulsar, so we're
  // using `-1` to mean `null`.
  ['format.wrapAttributesIndentSize'](value) {
    return value === -1 ? null : value;
  },
  ['format.maxPreserveNewLines'](value) {
    return value === -1 ? null : value;
  }
};

/** @type {Record<string, string | null>} */
const CONFIG_RELOCATIONS = {
  // This is in its own namespace even though it's only to do with autocomplete.
  'completion.suggestHtml5': 'suggest.html5',
  // These are implemented on the frontend.
  'validate.enable': null,
  'completion.enable': null
};

/** @type {string[]} */
const CODE_ACTION_KINDS = [];
/** @type {string[]} */
const ROOT = Path.normalize(Path.join(__dirname, '..'));

/** @type {string[]} */
const DEFAULT_SCOPES = [
  "text.html.basic",
  "text.html.php",
  "text.html.handlebars",
  "text.html.liquid",
  "text.html.erb",
  "text.html.ejs"
];

class HTMLLanguageClient extends AutoLanguageClient {
  constructor (...args) {
    super(...args);

    this.enableLinting = true;
    this.enableAutocomplete = true;

    this.disposable = new CompositeDisposable();

    this.disposable.add(
      atom.config.observe(`${this.getPackageName()}.serverSettings.validate.enable`, (value) => {
        this.enableLinting = value;
      }),
      atom.config.observe(`${this.getPackageName()}.serverSettings.completion.enable`, (value) => {
        this.enableAutocomplete = value;
      })
    );
  }

  activate (...args) {
    return super.activate(...args);
  }

  deactivate (...args) {
    this.disposable.dispose();
    return super.deactivate(...args);
  }

  getLanguageName () { return 'HTML'; }
  getServerName () { return 'HTML Language Server'; }

  getPackageName () {
    return Path.basename(ROOT) ?? 'pulsar-ide-html';
  }

  getPathToServer() {
    return Path.join(ROOT, 'node_modules', '.bin', 'vscode-html-language-server');
  }

  getGrammarScopes () {
    let value = atom.config.get(`${this.getPackageName()}.scopes`);
    console.log('Returning:', value);
    return value || DEFAULT_SCOPES;
  }

  getKindsForCodeActionRequest (_editor, _range, diagnostics) {
    // If there are any diagnostic messages associated with this position in
    // the editor, don't add any kinds. The only things that should appear in
    // the menu are actions associated with fixing that diagnostic.
    if (diagnostics.length > 0) return [];

    // Otherwise the user has asked for code actions in some other section of
    // the editor that has no diagnostic message. We should present them with
    // all the possible actions they can do on this file.
    return CODE_ACTION_KINDS;
  }

  startServerProcess() {
    try {
      let bin = this.getPathToServer();
      this.logger.debug(`Starting bin at path: ${bin} with builtin node: ${process.versions.node}`);
      return super.spawnChildNode([bin, "--stdio"], {
        env: process.env,
        cwd: atom.project.getPaths()[0] || __dirname
      });
    } catch (err) {
      this.showStartupError(err);
      throw err;
    }
	}

  showStartupError (err) {
    this.errorNotification = atom.notifications.addError(
      `${this.getPackageName()}: ${this.getServerName()} language server cannot start`,
      {
        description: `Make sure the path to your Node binary is correct and is of version 18 or greater.\n\nIf \`node\` is in your \`PATH\` and Pulsar is not recognizing it, you may set the path to your Node binary in this package’s settings. Consult the README on the settings page for more information.`,
        detail: err.message,
        buttons: [
          {
            text: 'Open Settings',
            onDidClick: () => {
              atom.workspace.open(`atom://config/packages/${this.getPackageName()}`);
            }
          }
        ],
        dismissable: true
      }
    );
  }

  getConnectionType() {
    return /** @type {const} */ ('stdio');
  }

  getInitializeParams (...args) {
    let result = super.getInitializeParams(...args);
    result.initializationOptions = {
      provideFormatter: true
    };
    return result;
  }

  postInitialization (server) {
    // Ordinarily we'll just assume the server started successfully and that it
    // isn't worth informing the user about. But if the server was previously
    // in an error state…
    if (this.errorNotification) {
      // …dismiss that old notification (if it's still present)…
      this.errorNotification.dismiss();
      // …and tell the user that it's been fixed.
      atom.notifications.addSuccess(
        `${this.getPackageName()}: ${this.getServerName()} started`
      );
      this.errorNotification = null;
    }

    this._server = server;
  }

  getRootConfigurationKey () {
    console.log('HTML getRootConfigurationKey!');
    return `${this.getPackageName()}.serverSettings`;
  }

  mapConfigurationObject (config) {
    for (let [key, translator] of Object.entries(CONFIG_TRANSLATIONS)) {
      let value = safeGet(config, key);
      safeSet(config, key, translator(value));
    }

    for (let [oldKey, newKey] of Object.entries(CONFIG_RELOCATIONS)) {
      let value = safeGet(config, oldKey);
      safeDelete(config, oldKey);
      if (newKey !== null) {
        safeSet(config, newKey, value);
      }
    }

    return { html: config };
  }

  /**
   * @param {string} key
   * @param {Parameters<import('atom').Config['get']>[1]} options
   */
  getSetting (key, options = {}) {
    return atom.config.get(`${this.getPackageName()}.${key}`, options);
  }

  getScopedSettingsForKey(key, scopeName) {
    let schema = atom.config.getSchema(key);
    if (!schema) throw new Error(`Unknown config key: ${schema}`);

    let base = atom.config.get(key);
    if (!scopeName) return base;

    let scoped = atom.config.get(key, { scope: [scopeName] });

    if (schema?.type === 'object') {
      // For objects, do a deep-merge.
      return extend(true, {}, base, scoped);
    } else {
      return scoped ?? base;
    }
  }

  getEditorSettingsForKey (key, editor) {
    let schema = atom.config.getSchema(key);
    if (!schema) throw new Error(`Unknown config key: ${schema}`);

    let base = atom.config.get(key);
    if (!editor) return base;

    let grammar = editor.getGrammar();
    let scoped = atom.config.get(key, { scope: [grammar.scopeName] });

    if (schema?.type === 'object') {
      return { ...base, ...scoped };
    } else {
      return scoped ?? base;
    }
  }

  // AUTOCOMPLETE
  // ============

  provideAutocomplete (...args) {
    let result = super.provideAutocomplete(...args);
    let original = result.getSuggestions;
    result.getSuggestions = (...args) => {
      if (!this.enableAutocomplete) return Promise.resolve([]);
      return original(...args);
    };
    return result;
  }

  // LINTER
  // ======

  getLinterSettings (_editor) {
    return {};
  }

  shouldIgnoreMessage (_diagnostic, _editor, _range) {
    if (!this.enableLinting) return true;
    return false;
  }

  // SYMBOLS
  // =======

  getSymbolSettings (_editor) {
    return {};
  }

  shouldIgnoreSymbol (_symbol, _editor) {
    return false;
  }

  // INTENTIONS
  // ==========

  // This is annoying because it should be almost entirely a package-specific
  // concern. But `atom-languageclient` must be aware of this because there's
  // no concept of a “code” or “message type” in the `linter` service contract.
  // So we can't pull this off just by inspecting the linter messages; we have
  // to look at the original `Diagnostic` objects from the language server.
  getIntentionsForLinterMessage (_message, _editor) {
    // TODO: Once we find out if this server ever sends diagnostics, figure out
    // if any of them have associated code actions.
    return []
  }
}

module.exports = new HTMLLanguageClient();
