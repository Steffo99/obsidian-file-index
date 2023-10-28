# Obsidian File Index

This [Obsidian] plugin creates and keeps updated a `steffo-file-index.json` file at the root of your Vault, containing a list of all file paths and a map of all basenames to file paths.

```json
{
	"paths": [
		"README.md",
		"Garas/moto.md",
		"Garas/auto.md"
	],
	"basenames": {
		"moto": "Garas/moto.md",
		"auto": "Garas/auto.md"
	}
}
```

Useful to externally render Wikilinks with no knowledge of the file structure of the vault, for example in [Obsiview].

> [#WARNING]
> 
> May have some trouble distinguishing between files with the same basename, but in different folders.
