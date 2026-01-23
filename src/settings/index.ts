import Settings from "./Settings.svelte";
import { App, Plugin, PluginSettingTab } from 'obsidian';
import type { SettingsStore } from "src/ui/stores"
import { mount, unmount } from "svelte";

export class SettingsTab extends PluginSettingTab {
  private view: Record<string, unknown>;
  private settingsStore: SettingsStore

  constructor(plugin: Plugin & { app: App }, settingsStore: SettingsStore) {
    const app = plugin?.app as App;
    if (plugin && app) {
      super(app, plugin);
      this.settingsStore = settingsStore;
    }
  }

  display() {
    this.containerEl.empty();

    this.view = mount(Settings, {
      target: this.containerEl,
      props: {
        settingsStore: this.settingsStore,
      }
    })
  }
  hide() {
    super.hide()
    unmount(this.view)
  }
}
