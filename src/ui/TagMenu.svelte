<script lang="ts">
  import { TFile, Keymap } from "obsidian";
  import { onMount } from "svelte";
  import type { SettingsStore, TagMenuStore } from "./stores";
  import TagTitle from "./TagTitle.svelte";
  import Star from "./Star.svelte";

  interface Props {
    settingsStore: SettingsStore;
    viewStore: TagMenuStore;
  }
  const { settingsStore, viewStore }: Props = $props();

  const columnWidth = 250;
  const columnMargin = 20;
  const totalColumnWidth = columnWidth + columnMargin * 2;
  let clientWidth = $state(0);
  let columns = $derived(
    Math.max(1, Math.trunc(clientWidth / totalColumnWidth)),
  );
  let contentWidth = $derived(columns * totalColumnWidth);

  async function openFile(e: MouseEvent, file: TFile) {
    let inNewSplit = Keymap.isModEvent(e);
    const leaf = inNewSplit
      ? window.app.workspace.getLeaf(true)
      : window.app.workspace.getLeaf(false);
    await leaf.openFile(file, { active: true });
  }

  onMount(() => {
    // Ensures we've loaded everything when presented
    viewStore.selectTags($viewStore.selectedTags);
  });
</script>

<div bind:clientWidth class="tag-menu-container">
  <div style={"width: " + contentWidth + "px; margin: 0 auto;"}>
    <div class="path">
      <button class="link" onclick={(_) => viewStore.selectTags([])}>
        <TagTitle tag="All Tags" />
      </button>

      {#each $viewStore.selectedTags as tag, index}
        <div>›</div>
        <button
          class="link"
          onclick={(e) =>
            Keymap.isModEvent(e) === "tab"
              ? viewStore.selectTags([tag])
              : viewStore.selectTags(
                  $viewStore.selectedTags.slice(0, index + 1),
                )}
        >
          <TagTitle {tag} />
        </button>
      {/each}

      <p class="muted small" style="margin-left: 10px; align-self: flex-end;">
        {$viewStore.allMatchingFiles.length} notes
      </p>

      <div style="visibility: hidden;"><TagTitle tag="A/A" /></div>
      <!-- To keep height constant -->
    </div>

    <hr />

    <div>
      <div class="flex align-center flex-wrap vscroll">
        <p class="small muted label">Groups:</p>
        <div class="spacer"></div>

        {#each $viewStore.allGroups as label}
          <button
            style="display: flex; align-items: center;"
            class={$settingsStore.excludedGroups.includes(label)
              ? "btn muted"
              : "btn"}
            onclick={(_) => settingsStore.toggleExcludedGroup(label)}
          >
            {label}
            <a
              href={null}
              class={$settingsStore.favoriteGroups.includes(label)
                ? "star favorite"
                : "star slideout"}
              onclick={(e) => {
                e.stopPropagation();
                settingsStore.toggleFavoriteGroup(label);
              }}
            >
              <Star filled={$settingsStore.favoriteGroups.includes(label)} />
            </a>
          </button>
        {/each}
      </div>
      <div class="spacer"></div>
      <div
        class="flex align-center flex-wrap vscroll"
        style="padding-bottom: 2rem;"
      >
        <p class="small muted label">Tags:</p>
        <div class="spacer"></div>

        {#each $viewStore.allTags as label}
          <button
            style="display: flex; align-items: center;"
            class={$settingsStore.excludedTags.includes(label)
              ? "btn muted"
              : "btn"}
            onclick={(_) => settingsStore.toggleExcludedTag(label)}
          >
            {label}
            <a
              href={null}
              class={$settingsStore.favoriteTags.includes(label)
                ? "star favorite"
                : "star slideout"}
              onclick={(e) => {
                e.stopPropagation();
                settingsStore.toggleFavoriteTag(label);
              }}
            >
              <Star filled={$settingsStore.favoriteTags.includes(label)}></Star>
            </a>
          </button>
        {/each}
      </div>
    </div>

    <hr style="margin-top: 0px;" />

    {#if $viewStore.allMatchingFiles.length > 3}
      {#each $viewStore.groupsSorted as label}
        <div
          class="flex flex-wrap"
          style={"margin: 0 -" + columnMargin + "px;"}
        >
          {#each $viewStore.tagsSorted[label].slice(0, $viewStore.expandedGroups.includes(label) ? $viewStore.tagsSorted[label].length : columns) as tag}
            <div
              style={"margin: " +
                columnMargin +
                "px; width: " +
                columnWidth +
                "px;"}
            >
              <button
                class="flex align-bottom link"
                style="width: 100%;"
                onclick={(_) =>
                  viewStore.selectTags([...$viewStore.selectedTags, tag])}
              >
                <TagTitle {tag} inline={false} strong={true} />
                <div class="flex-spacer"></div>
                <span class="muted strong"
                  >{$viewStore.toShow[label][tag].files.length}</span
                >
              </button>

              {#if $viewStore.toShow[label][tag].files.length > 5}
                <ul>
                  {#each $viewStore.crossrefsSorted[label][tag].slice(0, 5) as tag2}
                    <li>
                      <button
                        class="intersection flex link"
                        style="width: 100%;"
                        onclick={(_) =>
                          viewStore.selectTags([
                            ...$viewStore.selectedTags,
                            tag,
                            tag2,
                          ])}
                      >
                        <div class="flex small">
                          <TagTitle tag={tag2} inline={true} />
                        </div>
                        <div class="flex-spacer"></div>
                        <span class="muted"
                          >{$viewStore.toShow[label][tag].crossrefs[tag2]}</span
                        >
                      </button>
                    </li>
                  {/each}
                </ul>

                <div class="spacer"></div>
              {/if}

              <ul>
                {#each $viewStore.toShow[label][tag].files.slice(0, 5) as file}
                  <li>
                    <button
                      class="small note cutoff link"
                      style={`width: 100%; max-width: ${columnWidth} px;`}
                      onclick={(e) => openFile(e, file)}
                    >
                      {file.basename}
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
        {#if $viewStore.tagsSorted[label].length > columns && label.length > 0}
          {#if !$viewStore.expandedGroups.includes(label)}
            <button
              class="small mutedLink"
              onclick={(_) => viewStore.toggleExpandedGroup(label)}
            >
              Show {$viewStore.tagsSorted[label].length - columns} more in {label}
            </button>
          {:else}
            <button
              class="small mutedLink"
              onclick={(_) => viewStore.toggleExpandedGroup(label)}
            >
              Show less in {label}
            </button>
          {/if}
        {/if}
        <hr />
      {/each}
    {/if}
    {#if $viewStore.selectedTags.length > 0}
      <strong>All notes</strong>
      <div class="spacer"></div>
      <ul>
        {#each $viewStore.allMatchingFiles as file}
          <li>
            <button
              class="note link"
              style="width: 100%;"
              onclick={(e) => openFile(e, file)}
            >
              {file.basename}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  :where(.tag-menu-container) button {
    align-items: unset;
    padding: 0;
    height: min-content;
    display: block;
    text-align: justify;
    background-color: transparent;
    cursor: pointer;
  }

  :where(.tag-menu-container) button:not(:focus-visible) {
    box-shadow: none;
  }

  p {
    margin: 0;
  }

  .path {
    display: flex;
    align-items: flex-end;
  }

  .path > * {
    margin: 0 5px;
  }

  .muted {
    opacity: 0.5;
  }

  .strong {
    font-weight: bold;
  }

  .small {
    font-size: 12px;
  }

  .label {
    white-space: nowrap;
    margin-right: 4px;
  }

  .flex {
    display: flex;
    justify-content: flex-start;
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

  .spacer {
    width: 10px;
    height: 10px;
  }

  .flex-spacer {
    flex-grow: 1;
    flex-shrink: 0;
    width: 5px;
  }

  .hscroll {
    max-width: 100%;
    overflow: auto;
  }

  .vscroll {
    /*to complement .btn's 10px margin, leaving 19px for .star to render without overflow */
    padding-right: 9px;
    row-gap: 6px;
    max-height: 30vh;
    overflow-y: auto;
  }

  .mutedLink {
    cursor: pointer;
    opacity: 0.5;
    transition: all 0.2 ease;
  }

  .mutedLink:hover {
    opacity: 1;
  }

  .link {
    cursor: pointer;

    background: transparent;
    border-radius: 3px;
    transition: all 0.25s ease;

    font-size: 14px;
  }

  .link:hover {
    background: var(--interactive-accent);
    color: var(--text-on-accent);

    padding-left: 4px;
  }

  .small {
    font-size: 13px;
  }

  ul {
    list-style: none;
    padding-left: 0;
    margin: 0;
  }

  li.intersection:before {
    content: "+";
    margin-right: 4px;
    opacity: 0.5;
  }

  button.note:before {
    content: "→";
    margin-right: 4px;
  }

  .cutoff {
    max-width: 250px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .btn {
    cursor: pointer;
    padding: 4px 10px;
    border-radius: 100px;
    border: 1px solid var(--interactive-accent);
    font-weight: bold;
    font-size: 12px;
    margin-right: 10px;

    position: relative;
    transition: all 0.2s ease;
  }

  .btn.muted {
    opacity: 1;
    background-color: var(--background-primary);
    border: 1px solid color-mix(in srgb, var(--text-on-accent), transparent 75%);
    color: color-mix(in srgb, var(--text-on-accent), transparent 75%);
  }

  .btn.muted:hover {
    background-color: color-mix(
      in srgb,
      var(--interactive-accent),
      var(--background-primary) 75%
    );
    color: color-mix(in srgb, var(--text-on-accent), transparent 75%);
  }

  .btn:hover {
    background: var(--interactive-accent);
    color: var(--text-on-accent);

    z-index: 10;
    /* This freezes the layout flow. */
    margin-right: -9px;
  }

  .btn:has(.favorite):hover {
    margin-right: 10px;
  }

  .btn:has(.star:hover) {
    background-color: var(--background-primary);
  }

  .star {
    width: 14px;
    height: 14px;
    margin-left: 5px;
  }

  .star.slideout {
    position: relative;
    left: -19px;
    margin-right: -19px;
    opacity: 0;
    pointer-events: none;
    transition: all 0.2s ease;
  }

  .btn:hover .star.slideout {
    opacity: 1;
    pointer-events: all;
    left: 0px;
    margin-right: 0;
  }
</style>
