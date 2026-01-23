import { setIcon } from "obsidian";

export function tagParts(tag: string): { tag: string, label?: string, title: string } {
  let temp = tag.slice()

  if (tag.startsWith("#")) {
    temp = temp.slice(1)
  }

  if (temp.contains('/')) {
    const split = temp.split('/')
    const label = split.shift()
    const title = split.join('/')

    return {
      tag: tag,
      label: label,
      title: title
    }
  } else {
    return {
      tag: tag,
      title: temp
    }
  }
}

export const useIcon = (node: HTMLElement, iconId: string) => {
  setIcon(node, iconId);

  return {
    update(newIconId: string) {
      setIcon(node, newIconId);
    },
  };
};
