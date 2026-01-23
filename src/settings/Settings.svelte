<script lang="ts">
  import type { SettingsStore, WorkflowEntry } from "src/ui/stores";
  import { SettingItem, Toggle } from "src/ui/components";
  import { openEditWorkflowModal } from "src/ui/modals/workflow";
  import { useIcon } from "src/ui/utils";

  interface Props {
    settingsStore: SettingsStore;
  }
  const { settingsStore }: Props = $props();
</script>

{#snippet setting(w: WorkflowEntry, i: number, trash: boolean)}
  <SettingItem>
    {#snippet name()}
      <span style={trash ? "opacity: 0.25" : ""}>{w.name}</span>
    {/snippet}
    {#snippet description()}
      <div
        class="setting-item-description flex flex-wrap"
        style={`${trash ? "opacity: 0.25" : ""}`}
      >
        {#each w.tags as t, i}
          <span>{t}</span>
          {#if i + 1 !== w.tags.length}
            <div style="margin: 0 3px;">›</div>
          {/if}
        {/each}
      </div>
    {/snippet}
    {#snippet control()}
      <div class="flex">
        <!-- edit -->
        <button
          class="clickable-icon extra-setting-button"
          aria-label={trash ? "Restore workflow" : "Edit workflow"}
          use:useIcon={trash ? "archive-restore" : "pen-line"}
          onclick={() =>
            trash
              ? settingsStore.restoreWorkflow(i)
              : openEditWorkflowModal({ settingsStore, i })}
        ></button>
        <!-- remove -->
        <button
          class="clickable-icon extra-setting-button"
          style={trash ? "color: var(--text-error);" : ""}
          aria-label={trash ? "Delete permanently" : "Trash"}
          use:useIcon={"trash-2"}
          onclick={() => settingsStore.removeWorkflow(i, trash)}
        ></button>
      </div>
    {/snippet}
  </SettingItem>
{/snippet}

<div class="setting-group">
  <SettingItem isHeading={true} name="Workflows" type="toggle">
    {#snippet control()}
      <button
        class="clickable-icon extra-setting-button"
        aria-label="Add workflow"
        use:useIcon={"plus"}
        onclick={() => openEditWorkflowModal({ settingsStore, type: "add" })}
      ></button>
      <Toggle
        onChange={settingsStore.toggleWorkflows}
        isEnabled={$settingsStore.workflows.enabled}
      />
    {/snippet}
  </SettingItem>
  <div class="setting-items">
    {#if $settingsStore.workflows.list.filter(Boolean).length <= 0 && $settingsStore.workflows.trash.filter(Boolean).length <= 0}
      <div>
        No workflows have been added. Workflows are presets for switching tag
        setups via the view or Command Palette.
      </div>
    {/if}
    {#each $settingsStore.workflows.list as w, i}
      {#if w}
        {@render setting(w, i, false)}
      {/if}
    {/each}
    {#each $settingsStore.workflows.trash as w, i}
      {#if w}
        {@render setting(w, i, true)}
      {/if}
    {/each}
  </div>
</div>

<style>
  .flex {
    display: flex;
    justify-content: flex-start;
  }

  .flex-wrap {
    flex-wrap: wrap;
  }
</style>
