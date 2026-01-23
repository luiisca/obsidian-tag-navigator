<script lang="ts">
  import { tagParts } from "src/ui/utils";

  export let tag: string;

  let parts = tagParts(tag);
  let label = parts.label;
  let title = parts.title;
</script>

<div class="flex-column">
  <p class="muted">{label ? label + "/" : ""}</p>
  <p>{title}</p>
</div>

<style>
  p {
    margin: 0;
  }

  .flex-column {
    display: flex;
    flex-direction: column;
  }

  .muted {
    opacity: 0.5;
  }
</style>
