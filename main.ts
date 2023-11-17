import {Plugin, TFile, TFolder} from "obsidian"


export interface FileIndex {
	basenames: {[basename: string]: string},
	paths: string[],
}


export default class FileIndexPlugin extends Plugin {
	static FILE_IGNORE_PATH = "file-index-ignore.json"

	ignoreRegExps: RegExp[] = []

	async reloadIgnoreRegExps() {
		const ignoreFile = this.app.vault.getAbstractFileByPath(FileIndexPlugin.FILE_IGNORE_PATH)

		if(ignoreFile === null) {
			console.debug("[FileIndexPlugin] Ignore file does not exist, not ignoring anything:", FileIndexPlugin.FILE_IGNORE_PATH)
			this.ignoreRegExps = []
		}
		else if(ignoreFile instanceof TFolder) {
			console.debug("[FileIndexPlugin] Ignore file is actually a folder, not ignoring anything:", FileIndexPlugin.FILE_IGNORE_PATH)
			this.ignoreRegExps = []
		}
		else if(ignoreFile instanceof TFile) {
			const ignoreJSON = await this.app.vault.cachedRead(ignoreFile)
			const ignoreContents: string[] = JSON.parse(ignoreJSON)
			this.ignoreRegExps = ignoreContents.map((re) => new RegExp(re))
			console.debug("[FileIndexPlugin] Determined ignore list to be:", this.ignoreRegExps)
		}
		else {
			console.error("[FileIndexPlugin] Ignore file is of an unknown type, not doing anything:", FileIndexPlugin.FILE_IGNORE_PATH)
		}
	}

	async reloadIgnoreRegExpsIfIgnoreFileChanged(file: TFile) {
		if(file.path === FileIndexPlugin.FILE_IGNORE_PATH) {
			await this.reloadIgnoreRegExps()
		}
	}

	static FILE_INDEX_PATH = "file-index.json"

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
				console.warn("[FileIndexPlugin] Multiple files with the same basename detected:", basenames[basename], file.path)
			}
			basenames[basename] = file.path
		}

		paths.sort()

		const index: FileIndex = {basenames, paths}
		console.debug("[FileIndexPlugin] Determined index to be:", index)

		const indexContents = JSON.stringify(index, null, "\t")

		const indexFile = this.app.vault.getAbstractFileByPath(FileIndexPlugin.FILE_INDEX_PATH)
		if(indexFile === null) {
			console.debug("[FileIndexPlugin] File index does not exist, creating it right now at:", FileIndexPlugin.FILE_INDEX_PATH)
			await this.app.vault.create(FileIndexPlugin.FILE_INDEX_PATH, indexContents)
		}
		else if(indexFile instanceof TFolder) {
			console.debug("[FileIndexPlugin] Cannot create file index, as there's a folder at:", FileIndexPlugin.FILE_INDEX_PATH)
		}
		else if(indexFile instanceof TFile) {
			console.debug("[FileIndexPlugin] File index already exists, overwriting contents of:", FileIndexPlugin.FILE_INDEX_PATH)
			await this.app.vault.modify(indexFile, indexContents)
		}
		else {
			console.error("[FileIndexPlugin] File index is of an unknown type, not doing anything:", FileIndexPlugin.FILE_INDEX_PATH)
		}
	}

	#reloadIgnoreRegExpsIfIgnoreFileChangedBinding = this.reloadIgnoreRegExpsIfIgnoreFileChanged.bind(this)
	#recreateFileIndexBinding = this.recreateFileIndex.bind(this)

	async onload() {

		this.addCommand({
			id: 'recreate',
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
