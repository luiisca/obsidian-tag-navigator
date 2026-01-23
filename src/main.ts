import { App, Plugin, WorkspaceLeaf } from "obsidian"

import { VIEW_TYPE } from "./constants"
import CRNView from "./view"
import { createSettingsStore, createTagMenuStore } from "./ui/stores"
import type { SettingsStore, TagMenuStore } from "./ui/stores"
import { SettingsTab } from "src/settings"

declare global {
  interface Window {
    app: App
  }
}

export default class CrossNavPlugin extends Plugin {
  public settingsStore: SettingsStore
  public tagMenuStores: TagMenuStore[] = []
  private pendingWorkflows = new WeakMap<WorkspaceLeaf, string>();

  onunload(): void {
    this.app.workspace
      .getLeavesOfType(VIEW_TYPE)
      .forEach((leaf) => leaf.detach());

    this.tagMenuStores.forEach((s) => s.destroy())
  }

  async onload(): Promise<void> {
    this.settingsStore = await createSettingsStore(this)
    this.addSettingTab(new SettingsTab(this, this.settingsStore))

    this.registerView(
      VIEW_TYPE,
      (leaf: WorkspaceLeaf) => {
        const tagMenuStore = createTagMenuStore(
          this.settingsStore,
          this.pendingWorkflows.get(leaf) || ""
        );
        this.tagMenuStores.push(tagMenuStore);
        return new CRNView(leaf, this.settingsStore, tagMenuStore);
      }
    )

    const unsubSettingsStore = this.settingsStore.subscribe((s) => {
      this.saveData(s);

      const openViewCallback = async (initialWorkflowIdOverride?: string) => {
        const leaf = this.app.workspace.getLeaf(true);

        this.pendingWorkflows.set(leaf, initialWorkflowIdOverride ?? s.workflows.selected);

        await leaf.setViewState({
          type: VIEW_TYPE,
          active: true,
        });
        this.app.workspace.setActiveLeaf(leaf, true, true);
      }

      this.addCommand({
        id: "show-refnav-view",
        name: "Open Tag Navigator",
        callback: () => openViewCallback(),
      })

      if (s.workflows.enabled) {
        s.workflows.list.forEach((w) => {
          if (!w) return;

          this.addCommand({
            id: `show-refnav-view-${w.id}`,
            name: `Open Tag Navigator | ${w.name}`,
            callback: () => openViewCallback(w.id),
          })
        })
      }
    })

    this.register(unsubSettingsStore)
  }
}
