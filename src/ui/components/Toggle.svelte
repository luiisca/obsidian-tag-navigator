<script lang="ts">
  interface Props {
    isEnabled: boolean;
    onChange: (value: boolean) => void;
  }

  let { isEnabled, onChange }: Props = $props();

  // let labelEl: HTMLLabelElement;
  // $effect(() => {
  //   if (labelEl) {
  //     // labelEl.tabIndex = 0;
  //     labelEl.onkeydown = (event) => {};
  //   }
  // });
</script>

<label
  class="checkbox-container"
  class:is-enabled={isEnabled}
  style="cursor: var(--cursor);"
  tabindex="0"
  onkeydown={(event) => {
    if (
      event.target === event.currentTarget &&
      (event.key === "Enter" || event.key === " ")
    ) {
      onChange(!isEnabled);
    }
  }}
>
  <input
    style="cursor: var(--cursor);"
    type="checkbox"
    tabindex="0"
    onchange={() => onChange(!isEnabled)}
  />
</label>
