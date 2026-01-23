<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    name?: string | Snippet;
    description?: string | Snippet;
    isHeading?: boolean;
    type?: "dropdown" | "toggle" | undefined;
    style?: string;
    control?: Snippet;
  }

  let {
    name,
    description,
    isHeading = false,
    type = undefined,
    style = "",
    control,
  }: Props = $props();
</script>

<!-- doubles as section title thanks to `setting-item-heading` -->
<div
  class="setting-item"
  class:setting-item-heading={isHeading}
  class:mod-dropdown={type === "dropdown"}
  class:mod-toggle={type === "toggle"}
  style={`${style}; flex-wrap: nowrap;`}
>
  <div class="setting-item-info">
    {#if name}
      <div class="setting-item-name">
        {#if typeof name === "string"}
          {name}
        {:else}
          {@render name()}
        {/if}
      </div>
    {/if}
    {#if description}
      {#if typeof description === "string"}
        <div class="setting-item-description">
          {description}
        </div>
      {:else}
        <div class="setting-item-description">
          {@render description()}
        </div>
      {/if}
    {/if}
  </div>
  <div class="setting-item-control">
    {@render control?.()}
  </div>
</div>
