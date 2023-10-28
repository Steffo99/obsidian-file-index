import {Plugin, TFile, TFolder} from "obsidian"


export interface SteffoFileIndex {
	basenames: {[basename: string]: string},
	paths: string[],
}


export default class SteffoFileIndexPlugin extends Plugin {
	static FILE_INDEX_PATH = "steffo-file-index.json"

	async recreateFileIndex() {
		const files = this.app.vault.getFiles()

		const basenames: {[basename: string]: string} = {}
		const paths = []

		for(const file of files) {
			paths.push(file.path)
			basenames[file.basename] = file.path
		}

		paths.sort()

		const index: SteffoFileIndex = {basenames, paths}
		const indexContents = JSON.stringify(index, null, "\t")

		const indexFile = this.app.vault.getAbstractFileByPath(SteffoFileIndexPlugin.FILE_INDEX_PATH)
		if(indexFile instanceof TFolder) {
			console.error("Cannot create file index, as there's a folder at:", SteffoFileIndexPlugin.FILE_INDEX_PATH)
			return
		}
		else if(indexFile instanceof TFile) {
			console.info("File index already exists, overwriting contents of:", SteffoFileIndexPlugin.FILE_INDEX_PATH)
			await this.app.vault.modify(indexFile, indexContents)
		}
		else {
			console.info("File index does not exist, creating it right now at:", SteffoFileIndexPlugin.FILE_INDEX_PATH)
			await this.app.vault.create(SteffoFileIndexPlugin.FILE_INDEX_PATH, indexContents)
		}
	}

	recreateFileIndexBinding = this.recreateFileIndex.bind(this)

	async onload() {
		this.addCommand({
			id: 'steffo-file-index-recreate',
			name: 'Force file index recreation',
			callback: this.recreateFileIndex.bind(this)
		})

		this.app.vault.on("create", this.recreateFileIndexBinding)
		this.app.vault.on("delete", this.recreateFileIndexBinding)
		this.app.vault.on("rename", this.recreateFileIndexBinding)
	}

	onunload() {
		this.app.vault.off("create", this.recreateFileIndexBinding)
		this.app.vault.off("delete", this.recreateFileIndexBinding)
		this.app.vault.off("rename", this.recreateFileIndexBinding)
	}
}
