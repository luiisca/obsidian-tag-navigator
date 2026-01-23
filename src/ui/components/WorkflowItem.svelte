<script lang="ts">
  import WorkflowItemTag from "./WorkflowItemTag.svelte";
  import type { WorkflowEntry } from "src/ui/stores";

  interface Props {
    w: WorkflowEntry;
  }
  const { w }: Props = $props();
</script>

<div class="flex flex-column">
  <div class="name">{w.name}</div>
  <div class="flex flex-wrap align-bottom tags">
    {#each w.tags as t, i}
      <WorkflowItemTag tag={t}></WorkflowItemTag>
      {#if i + 1 !== w.tags.length}
        <div style="margin: 0 5px 0 3px;">›</div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .flex {
    display: flex;
    justify-content: flex-start;
  }
  .flex-column {
    display: flex;
    flex-direction: column;
  }

  .align-bottom {
    align-items: flex-end;
  }

  .align-center {
    align-items: center;
  }

  .flex-wrap {
    flex-wrap: wrap;
  }

  .name {
    font-size: var(--font-ui-small);
    margin-bottom: var(--size-4-4);
  }

  .tags {
    font-size: var(--font-ui-smaller);
    row-gap: var(--size-4-2);
  }
</style>
