<div align="center">

# Obsidian File Index

Obsidian plugin to create a metadata file about the files present in the Vault

</div>

## About

This [Obsidian] plugin creates and keeps updated a `file-index.json` file at the root of your Vault, containing a list of all file paths and a map of all basenames to file paths.

Useful to externally render Wikilinks with no knowledge of the file structure of the vault, for example in [Obsiview].

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

[Obsidian]: https://obsidian.md/
[Obsiview]: https://github.com/Steffo99/obsiview

## Ignore

Files can be excluded by the index by adding a `file-index-ignore.json` file at the root of your Vault, containing a JSON array of regular expressions that will prevent matching files from being added to the list:

```json
[
	"^Garas",
	".*HelloWorld.*"
]
```

## Known issues

> [!WARNING]
> 
> May have some trouble distinguishing between files with the same basename, but in different folders.
