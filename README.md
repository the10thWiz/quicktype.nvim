# quicktype.nvim

Adds quicktype convertion to neovim.

See (quicktype)[https://github.com/quicktype/quicktype] for more details

The only reason this is a Coc extension rather than a pure vim extension is because quicktype has
a typescript library.

## Install

`:CocInstall quicktype`

## Coc Command

`:CocCommand quicktype.jsonToCode`

Converts json into a structure ready for serialization and deserialization. This is intended for
copying and pasting a JSON object, typically an example response from an API. As such, the command
attempts to automatically retreive the object from the clipboard (or neovim's registers), and falls
back to opening a window.

Quicktype supports a variety of target languages, and this extension should automatically detect
the appropriate type from the syntax.

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
