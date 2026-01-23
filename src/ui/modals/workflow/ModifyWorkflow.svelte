<script lang="ts">
  import type { SettingsStore, WorkflowEntry } from "src/ui/stores";
  import { onDestroy, onMount } from "svelte";
  import { TagSuggest } from "src/ui/suggest";
  import { SettingItem } from "src/ui/components";
  import type { Modal } from "obsidian";

  interface Props {
    modalClass: Modal;
    settingsStore: SettingsStore;
    type: "add" | "edit";
    selectedTags?: string[];
    i?: number;
    cb?: (w: WorkflowEntry) => void;
  }

  let { modalClass, settingsStore, type, selectedTags, i, cb }: Props =
    $props();

  let inputEl: HTMLInputElement;
  let tagSuggestInstance: TagSuggest;

  let w = $derived($settingsStore.workflows.list[i ?? -1]) as
    | WorkflowEntry
    | undefined;
  let name = $derived(w?.name);
  let tags = $derived(w?.tags.join(" ") || selectedTags?.join(" "));

  const handleSave = () => {
    modalClass.close();

    const n = name?.trim();
    const t = tags
      ?.trim()
      .split(" ")
      .filter((t) => {
        const newT = t.trim();
        if (newT.length > 0) {
          return newT;
        }
      });

    if (n && t) {
      if (type === "add") {
        const newW = settingsStore.addWorkflow({
          name: n,
          tags: t,
        });

        if (newW) {
          cb?.(newW);
        }
      }
      if (type === "edit") {
        settingsStore.editWorkflow(n, t, i);
      }
    }
  };

  onMount(() => {
    if (!tagSuggestInstance) {
      tagSuggestInstance = new TagSuggest(inputEl);
    }

    // move cursor to end
    const len = inputEl.value.length;
    inputEl.setSelectionRange(len, len);
    // force scroll to the end
    inputEl.scrollLeft = inputEl.scrollWidth;
  });
  onDestroy(() => {
    tagSuggestInstance.destroy();
  });
</script>

<form id="workflow-form">
  <SettingItem name="Name">
    {#snippet control()}
      <input
        bind:value={name}
        type="text"
        spellcheck="false"
        autocapitalize="off"
        placeholder="reading"
      />
    {/snippet}
  </SettingItem>
  <SettingItem
    name="Tags"
    description="Space-separated list (e.g. #tag1 #tag2)"
  >
    {#snippet control()}
      <input
        bind:value={tags}
        bind:this={inputEl}
        type="text"
        spellcheck="false"
        autocapitalize="off"
        placeholder="#activity/reading"
      />
    {/snippet}
  </SettingItem>
</form>

<div class="modal-button-container">
  <button class="mod-cta" form="workflow-form" onclick={handleSave}>Save</button
  >
  <button onclick={() => modalClass.close()}>Cancel</button>
</div>
