import { Modal } from 'obsidian';
import ModifyWorkflowComponent from './ModifyWorkflow.svelte';
import { mount } from "svelte";
import type { SettingsStore, WorkflowEntry } from "src/ui/stores";

export default class ModifyWorkflowModal extends Modal {
  constructor(settingsStore: SettingsStore, type: "add" | "edit" = "edit", selectedTags?: string[], i?: number, cb?: (w: WorkflowEntry) => void) {
    const app = window?.app
    if (!app) return;

    super(app);
    this.setTitle(type === 'add' ? 'Add workflow' : 'Edit workflow')

    const { contentEl } = this;

    // Create a div to mount the Svelte component
    const svelteContainer = contentEl.createDiv();

    // Instantiate the Svelte component
    mount(ModifyWorkflowComponent, {
      target: svelteContainer,
      props: {
        modalClass: this,
        settingsStore,
        type,
        selectedTags,
        i,
        cb,
      }
    });
  }
}

export function openEditWorkflowModal({ settingsStore, type, selectedTags, i, cb }: { settingsStore: SettingsStore, type?: "add" | "edit", selectedTags?: string[], i?: number, cb?: (w: WorkflowEntry) => void }) {
  new ModifyWorkflowModal(settingsStore, type, selectedTags, i, cb).open();
}

