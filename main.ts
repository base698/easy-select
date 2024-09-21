import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			//span.dataview.inline-field-key
			//span.dataview.inline-field-value
			//span.dataview.inline-field
			console.log(evt.srcElement);
			if (evt.srcElement.className.contains('inline-field')) {
			    new SampleModal(this.app,evt.srcElement).open();
			}


		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

function getExcerciseSetting(contentEl:HTMLElement, changeFn:(arg: string)=>void): Setting {
        return new Setting(contentEl)
            .setName("Choose an option")
            .addDropdown(dropdown => dropdown
                .addOption("Bench", "Bench")
                .addOption("Deadlift", "Deadlift")
                .addOption("Straight Bar Curl", "Straight Bar Curl")
                .addOption("Squat", "Squat")
                .addOption("Pushups", "Pushups")
                .addOption("Run", "Run")
                .addOption("Bike", "Bike")
                .addOption("Arnold Press", "Arnold Press")
			    .onChange(changeFn));
}


function getNumberSetting(contentEl:HTMLElement, s:number, e:number, step:number, val: number,changeFn:(arg: number)=>void): Setting {
        return new Setting(contentEl)
            .setName("Choose an option")
			.addSlider(slider => slider
				.setLimits(s, e, step)
				.setValue(val)
				.setDynamicTooltip()
				.onChange(changeFn));
}

class SampleModal extends Modal {
	el: HTMLElement
	result: string

	constructor(app: App, el: HTMLElement) {
		super(app);
		this.el = el;
		if(this.el.parentElement != null && (this.el.className.contains('key') 
			|| this.el.className.contains('value'))) {
			this.el = this.el.parentElement;
		}
	}

	onOpen() {
		const {contentEl} = this;
		// handle cm-hmd-barelink
		//contentEl.createEl("h1", { text: "Select an option" });

		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) {
		    const editor = activeView.editor;
		    const cursor = editor.getCursor();
		    const line = editor.getLine(cursor.line);

		    let num = /(\d+)/.exec(line);
			  let val;
			  if(num) {
				val = parseInt(num[1],10);
			  } else {
				val = 0;
			  }

			if(line.contains('Excercise')) {
			  getExcerciseSetting(contentEl, (value:string) => {
				this.result = value;
			  });
			} else if(line.contains('Weight')) {
			  getNumberSetting(contentEl, 0,500, 2.5, val, (value:number) => {
				this.result = `${value}`;
			  });
			} else if(line.contains('Sets') || line.contains('Reps')) {
			  getNumberSetting(contentEl, 0,50, 1, val, (value:number) => {
				this.result = `${value}`;
			  });
			} else {
				this.close();
			}
		}

	}

	onClose() {
		const {contentEl} = this;
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView && this.result) {
		    const editor = activeView.editor;
		    const cursor = editor.getCursor();
		    const line = editor.getLine(cursor.line);
		    
			const updatedLine = `${line.slice(0,line.indexOf('::'))}:: ${this.result}]`
		    
		    // Replace the entire line
		    editor.replaceRange(updatedLine, 
		        { line: cursor.line, ch: 0 }, 
		        { line: cursor.line, ch: line.length }
		    );
		}
			
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
