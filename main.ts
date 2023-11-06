import {Plugin, TFile, TFolder} from "obsidian"


export interface SteffoFileIndex {
	basenames: {[basename: string]: string},
	paths: string[],
}


export default class SteffoFileIndexPlugin extends Plugin {
	static FILE_IGNORE_PATH = "steffo-file-index-ignore.json"

	ignoreRegExps: RegExp[] = []

	async reloadIgnoreRegExps() {
		const ignoreFile = this.app.vault.getAbstractFileByPath(SteffoFileIndexPlugin.FILE_IGNORE_PATH)

		if(ignoreFile === null) {
			console.debug("[SteffoFileIndexPlugin] Ignore file does not exist, not ignoring anything:", SteffoFileIndexPlugin.FILE_IGNORE_PATH)
			this.ignoreRegExps = []
		}
		else if(ignoreFile instanceof TFolder) {
			console.debug("[SteffoFileIndexPlugin] Ignore file is actually a folder, not ignoring anything:", SteffoFileIndexPlugin.FILE_IGNORE_PATH)
			this.ignoreRegExps = []
		}
		else if(ignoreFile instanceof TFile) {
			const ignoreJSON = await this.app.vault.cachedRead(ignoreFile)
			const ignoreContents: string[] = JSON.parse(ignoreJSON)
			this.ignoreRegExps = ignoreContents.map((re) => new RegExp(re))
			console.debug("[SteffoFileIndexPlugin] Determined ignore list to be:", this.ignoreRegExps)
		}
		else {
			console.error("[SteffoFileIndexPlugin] Ignore file is of an unknown type, not doing anything:", SteffoFileIndexPlugin.FILE_IGNORE_PATH)
		}
	}

	async reloadIgnoreRegExpsIfIgnoreFileChanged(file: TFile) {
		if(file.path === SteffoFileIndexPlugin.FILE_IGNORE_PATH) {
			await this.reloadIgnoreRegExps()
		}
	}

	static FILE_INDEX_PATH = "steffo-file-index.json"

	async recreateFileIndex() {
		const files = this.app.vault.getFiles()

		const basenames: {[basename: string]: string} = {}
		const paths = []

		for(const file of files) {
			let ignored = false
			for(const regexp of this.ignoreRegExps) {
				if(file.path.match(regexp)) {
					ignored = true
					break
				}
			}
			if(ignored) {
				continue
			}

			paths.push(file.path)

			const basename = file.basename.toLocaleLowerCase()
			if(basenames.hasOwnProperty(basename)) {
				console.warn("[SteffoFileIndexPlugin] Multiple files with the same basename detected:", basenames[basename], file.path)
			}
			basenames[basename] = file.path
		}

		paths.sort()

		const index: SteffoFileIndex = {basenames, paths}
		console.debug("[SteffoFileIndexPlugin] Determined index to be:", index)

		const indexContents = JSON.stringify(index, null, "\t")

		const indexFile = this.app.vault.getAbstractFileByPath(SteffoFileIndexPlugin.FILE_INDEX_PATH)
		if(indexFile === null) {
			console.debug("[SteffoFileIndexPlugin] File index does not exist, creating it right now at:", SteffoFileIndexPlugin.FILE_INDEX_PATH)
			await this.app.vault.create(SteffoFileIndexPlugin.FILE_INDEX_PATH, indexContents)
		}
		else if(indexFile instanceof TFolder) {
			console.debug("[SteffoFileIndexPlugin] Cannot create file index, as there's a folder at:", SteffoFileIndexPlugin.FILE_INDEX_PATH)
		}
		else if(indexFile instanceof TFile) {
			console.debug("[SteffoFileIndexPlugin] File index already exists, overwriting contents of:", SteffoFileIndexPlugin.FILE_INDEX_PATH)
			await this.app.vault.modify(indexFile, indexContents)
		}
		else {
			console.error("[SteffoFileIndexPlugin] File index is of an unknown type, not doing anything:", SteffoFileIndexPlugin.FILE_INDEX_PATH)
		}
	}

	#reloadIgnoreRegExpsIfIgnoreFileChangedBinding = this.reloadIgnoreRegExpsIfIgnoreFileChanged.bind(this)
	#recreateFileIndexBinding = this.recreateFileIndex.bind(this)

	async onload() {

		this.addCommand({
			id: 'steffo-file-index-recreate',
			name: 'Force file index recreation',
			callback: this.recreateFileIndex.bind(this)
		})

		this.app.workspace.onLayoutReady(async () => {
			await this.reloadIgnoreRegExps()
			await this.recreateFileIndex()

			this.registerEvent(
				this.app.vault.on("create", this.#reloadIgnoreRegExpsIfIgnoreFileChangedBinding)
			)
			this.registerEvent(
				this.app.vault.on("delete", this.#reloadIgnoreRegExpsIfIgnoreFileChangedBinding)
			)
			this.registerEvent(
				this.app.vault.on("rename", this.#reloadIgnoreRegExpsIfIgnoreFileChangedBinding)
			)

			this.registerEvent(
				this.app.vault.on("create", this.#recreateFileIndexBinding)
			)
			this.registerEvent(
				this.app.vault.on("delete", this.#recreateFileIndexBinding)
			)
			this.registerEvent(
				this.app.vault.on("rename", this.#recreateFileIndexBinding)
			)
		})
	}

	onunload() {

	}
}
