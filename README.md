# pulsar-ide-html package

Visual Studio Code’s CSS language server in [Pulsar](https://pulsar-edit.dev). Uses [vscode-langservers-extracted](https://www.npmjs.com/package/vscode-langservers-extracted).

Features:

* Completion (via the builtin `autocomplete-plus`)
* Symbol listing and navigation (via the builtin `symbols-view`, or in an outline via [`pulsar-outline-view`](https://web.pulsar-edit.dev/packages/pulsar-outline-view))
* Highlighting references (put your cursor on a token and see all other usages of that token; used via [`pulsar-find-references`](https://web.pulsar-edit.dev/packages/pulsar-find-references))
* “Hover” information about the tag or attribute under the cursor or mouse pointer (via [`pulsar-hover`](https://web.pulsar-edit.dev/packages/pulsar-hover))
* Code formatting (via [`pulsar-code-format`](https://web.pulsar-edit.dev/packages/pulsar-code-format))
* Ability to rename both the opening and closing tag at once (via [`pulsar-refactor`](https://web.pulsar-edit.dev/packages/pulsar-refactor))
* Can also act intelligently in embedded `style` and `script` blocks, including diagnostics (via [`linter`](https://web.pulsar-edit.dev/packages/linter) and [`linter-ui-default`](https://web.pulsar-edit.dev/packages/linter-ui-default))

## Configuration

> [!TIP]
> Soon `pulsar-ide-html` will be able to use Pulsar’s built-in version of Node. For now, though, the built-in version is too old; you’ll have to tell the language server the path to your local version of Node.

A recent version of Node should be used. The version of Node inherited from your shell environment will usually suffice; if Pulsar fails to find it, you may specify it in the “Path To Node Binary” configuration field.

The settings under the “Server Settings” section correspond almost exactly to the settings exposed by the language server. No restart of the editor is required after a change in settings.
