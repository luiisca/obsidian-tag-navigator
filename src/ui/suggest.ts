import { autoUpdate, computePosition, flip } from "@floating-ui/dom";
import { debounce, MetadataCache, PopoverSuggest, Scope } from "obsidian";
import type { SettingsStore, WorkflowEntry } from "src/ui/stores";
import { WorkflowItem } from "src/ui/components"
import { mount } from "svelte";
import { get } from "svelte/store";

interface Suggestion<T> {
  value: T,
  el: HTMLElement,
}

type WindowEventHandler<K extends keyof WindowEventMap> = (ev: WindowEventMap[K]) => void;
type TWindowEvents = {
  [K in keyof WindowEventMap]?: WindowEventHandler<K>;
};

/**
    * Get suggestion values based on `targetEl.value` and render them inside `suggestionContainerEl`,
    * they will only be visible to the user after opening the popover on `this.render()`.
    *
    * Everything is controlled by event handlers added to both `targetEl` and `suggestionContainerEl`, all located in `this.setupEventListeners`
*/
abstract class BaseSuggest<T, E extends HTMLInputElement | HTMLButtonElement> extends PopoverSuggest<T> {
  suggestionContainerEl: HTMLDivElement;
  suggestionItemsContainerEl: HTMLDivElement;
  suggestionsContainerCreated: boolean;
  targetEl: E;
  suggestions: Suggestion<T>[] = [];
  selectedSuggestionIdx: number;
  suggestionSelected = false;
  renderSeparator = false;
  notFoundMsg = 'No match found';
  opened = false;

  private evHandlers: TWindowEvents | null = null;
  private autoUpdateCleanup: (() => void) | null = null;

  constructor(targetEl: E) {
    const app = window?.app
    if (!app) return;

    super(app);
    this.targetEl = targetEl;
    this.selectedSuggestionIdx = 0
    this.scope = new Scope();

    // create divs and add event handlers. Divs and event handlers removed in `this.destroy()`
    this.suggestionContainerEl = createDiv({
      cls: 'suggestion-container crn-suggestion-container',
    });
    this.suggestionItemsContainerEl = this.suggestionContainerEl.createDiv({
      cls: "suggestion crn-suggestion",
    })
    this.suggestionsContainerCreated = true;

    this.setupEventListeners();
  }

  // display popover list
  render(...props: unknown[]) {
    const suggestionValues = this.getSuggestions(this.targetEl.value, ...props)

    this.clear()

    // add global event handlers, cleaned in `this.close()`
    window?.app.keymap.pushScope(this.scope);
    // attached to the DOM, detached in `this.close()`
    window?.app.workspace.containerEl.appendChild(this.suggestionContainerEl);

    const position = () => computePosition(this.targetEl, this.suggestionContainerEl, {
      placement: "bottom-start",
      middleware: [flip()]
    }).then(({ x, y }) => {
      Object.assign(this.suggestionContainerEl.style, {
        left: `${x}px`,
        top: `${y + 5}px`
      });
    });
    this.autoUpdateCleanup = autoUpdate(this.targetEl, this.suggestionContainerEl, () => {
      position().catch(console.error);
    })

    if (suggestionValues.length <= 0) {
      const el = this.suggestionItemsContainerEl.createDiv({ cls: 'suggestion-empty crn-suggestion-empty' });
      if (el) {
        el.setText(this.notFoundMsg)
      }
    } else {
      this.renderSuggestions(suggestionValues)
    }

    this.opened = true
  }
  close() {
    // remove global event handlers, added in `this.render()`
    window?.app.keymap.popScope(this.scope);

    this.clear()
    this.suggestionContainerEl.detach();
    this.autoUpdateCleanup?.();
    this.autoUpdateCleanup = null;
    this.opened = false
  }
  destroy() {
    this.suggestionContainerEl.remove();
    if (this.evHandlers) {
      (Object.entries(this.evHandlers) as [keyof WindowEventMap, WindowEventHandler<keyof WindowEventMap>][]).forEach(([event, handler]) =>
        this.targetEl.removeEventListener(event, handler)
      );
    }
    this.evHandlers = null;
  }
  private clear() {
    this.suggestionItemsContainerEl.empty();
    this.suggestions = [];
  }

  private setupEventListeners() {
    // register element event handlers
    this.evHandlers = {
      blur: () => this.close(),
    };

    if (this.targetEl instanceof HTMLInputElement) {
      this.evHandlers.click = () => this.render();
      this.evHandlers.focus = () => this.render();
      this.evHandlers.input = debounce(() => {
        if (!this.suggestionSelected) {
          this.render()
        } else {
          this.suggestionSelected = false
        }
      }, 200, true)
    } else {
      this.evHandlers.click = () => {
        if (this.opened) {
          this.close()
        } else {
          this.render()
        }
      }
    }

    (Object.entries(this.evHandlers) as [keyof WindowEventMap, WindowEventHandler<keyof WindowEventMap>][]).forEach(([event, handler]) =>
      this.targetEl.addEventListener(event, handler)
    );

    // register global event handlers, loaded in this.setup, cleaned in this.close
    this.scope.register([], "ArrowUp", (ev) => {
      ev.preventDefault()
      this.highlightSuggestion(this.selectedSuggestionIdx - 1, true)
    });
    this.scope.register([], "ArrowDown", (ev) => {
      ev.preventDefault()
      this.highlightSuggestion(this.selectedSuggestionIdx + 1, true)
    })
    this.scope.register([], "Enter", (ev) => {
      ev.preventDefault()
      const suggestion = this.suggestions[this.selectedSuggestionIdx];
      this.selectSuggestion(suggestion.value, ev)
    })
    this.scope.register([], "Escape", () => this.close())

    // register suggestion items container event handlers
    this.suggestionItemsContainerEl.on("click", ".suggestion-item", (ev) => {
      ev.preventDefault()

      const suggestion = this.suggestions[this.selectedSuggestionIdx];
      if (this.selectedSuggestionIdx !== -1 && suggestion) {
        this.highlightSuggestion(this.selectedSuggestionIdx, false);
        this.selectSuggestion(suggestion.value, ev);
      }
    })
    this.suggestionItemsContainerEl.on("mousemove", ".suggestion-item", (ev, target) => {
      ev.preventDefault()

      const suggestionIdx = this.suggestions.findIndex(s => s.el === target)
      if (suggestionIdx !== -1) {
        this.highlightSuggestion(suggestionIdx, false);
      }
    })
    this.suggestionItemsContainerEl.on("mousedown", ".suggestion-item", (ev) => ev.preventDefault())
  }

  /**
      * Get suggestions based on input string and add them inside suggestionContainerEl,
      * they will only be visible to the user after opening the popover on this.render()
      */
  private renderSuggestions(values: T[]) {
    values.forEach(value => {
      if (value) {
        const el = this.suggestionItemsContainerEl.createDiv({ cls: 'suggestion-item crn-suggestion-item' });
        if (this.renderSeparator) {
          this.suggestionItemsContainerEl.createDiv({ cls: "menu-separator crn-menu-separator" })
        }
        if (el) {
          this.renderSuggestion(value, el);
          this.suggestions.push({ value, el })
        }
      }
    });

    this.selectedSuggestionIdx = 0;
    this.highlightSuggestion(0, false);
  }

  /**
      * update a suggestion element's classes to make it look selected
  */
  private highlightSuggestion(selectedIndex: number, scrollIntoView: boolean) {
    const normalizedIndex = wrapAround(selectedIndex, this.suggestions.length);

    const oldSelectedSuggestion = this.suggestions[this.selectedSuggestionIdx];
    const newSelectedSuggestion = this.suggestions[normalizedIndex];

    oldSelectedSuggestion.el.removeClass("is-selected");
    newSelectedSuggestion.el.addClass("is-selected");

    this.selectedSuggestionIdx = normalizedIndex;

    if (scrollIntoView) {
      newSelectedSuggestion.el.scrollIntoView(false);
    }
  }

  abstract getSuggestions(inputVal: string, ...props: unknown[]): T[];
}

export class TagSuggest extends BaseSuggest<string, HTMLInputElement> {
  getSuggestions(inputVal: string): string[] {
    const metadataCache = window.app.metadataCache as MetadataCache & { getTags: () => Record<string, number> }
    const searchTerm = inputVal.split(' ').slice().pop()

    const labels: string[] = [];
    const ungrouped: string[] = [];
    const tags = Object.keys((metadataCache).getTags()).filter((t) => t.toLowerCase().includes(searchTerm?.toLowerCase() ?? ""))
    tags.sort().forEach((t) => {
      if (!t.includes('/') && !tags.some((e) => e !== t && e.includes(t))) {
        ungrouped.push(t)
      } else {
        labels.push(t)
      }
    })

    return [...labels, ...ungrouped]
  }

  /**
      * Set content of each individual suggestion div element
      *
      * called for each suggestion item from getSuggestions() in renderSuggestions()
  */
  renderSuggestion(tag: string, el: HTMLElement): void {
    el.setText(tag);
  }

  selectSuggestion(value: string, _: KeyboardEvent | MouseEvent): void {
    const v = this.targetEl.value.split(' ')
    v.pop()
    v.push(value)
    this.targetEl.value = v.join(' ');
    this.targetEl.trigger("input");

    // move cursor to end 
    const len = this.targetEl.value.length
    this.targetEl.setSelectionRange(len, len)
    // force scroll to the end 
    this.targetEl.scrollLeft = this.targetEl.scrollWidth

    this.suggestionSelected = true;
    this.close();
  }
}

export class WorkflowSuggest extends BaseSuggest<WorkflowEntry | null, HTMLButtonElement> {
  private settingsStore: SettingsStore
  private onSelect: (w: WorkflowEntry) => void;
  public notFoundMsg = 'No saved workflows';

  constructor(targetEl: HTMLButtonElement, settingsStore: SettingsStore, onSelect: (w: WorkflowEntry) => void) {
    super(targetEl)
    this.settingsStore = settingsStore;
    this.onSelect = onSelect
    this.renderSeparator = true
  }

  getSuggestions(): (WorkflowEntry | null)[] {
    return get(this.settingsStore).workflows.list
  }

  /**
      * Set content of each individual suggestion div element
      *
      * called for each suggestion item from getSuggestions() in renderSuggestions()
  */
  renderSuggestion(w: WorkflowEntry, el: HTMLElement): void {
    mount(WorkflowItem, {
      target: el,
      props: {
        w
      }
    })
  }

  selectSuggestion(w: WorkflowEntry, _: KeyboardEvent | MouseEvent): void {
    this.onSelect(w)
    this.suggestionSelected = true;
    this.close();
  }
}

function wrapAround(value: number, size: number): number {
  if (value < 0) {
    return size - 1;
  }
  if (value >= size) {
    return 0
  }
  return value
}

