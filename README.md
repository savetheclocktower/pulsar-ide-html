# pulsar-ide-html package

Visual Studio Code’s HTML language server in [Pulsar](https://pulsar-edit.dev). Uses [@t1ckbase/vscode-langservers-extracted](https://www.npmjs.com/package/@t1ckbase/vscode-langservers-extracted).

Features:

* Completion (via the builtin `autocomplete-plus`)
* Symbol listing and navigation (via the builtin `symbols-view`, or in an outline via [`pulsar-outline-view`](https://packages.pulsar-edit.dev/packages/pulsar-outline-view))
* Highlighting references (put your cursor on a token and see all other usages of that token; used via [`pulsar-find-references`](https://packages.pulsar-edit.dev/packages/pulsar-find-references))
* “Hover” information about the tag or attribute under the cursor or mouse pointer (via [`pulsar-hover`](https://packages.pulsar-edit.dev/packages/pulsar-hover))
* Code formatting (via [`pulsar-code-format`](https://packages.pulsar-edit.dev/packages/pulsar-code-format))
* Ability to rename both the opening and closing tag at once (via [`pulsar-refactor`](https://packages.pulsar-edit.dev/packages/pulsar-refactor))
* Can also act intelligently in embedded `style` and `script` blocks, including diagnostics (via [`linter`](https://packages.pulsar-edit.dev/packages/linter) and [`linter-ui-default`](https://packages.pulsar-edit.dev/packages/linter-ui-default))

## Configuration

The settings under the “Server Settings” section correspond almost exactly to the settings exposed by the language server. No restart of the editor is required after a change in settings.
