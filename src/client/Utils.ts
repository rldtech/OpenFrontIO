import { ColorShortNames, LayerShortNames } from "./FlagInput";
import { LangSelector } from "./LangSelector";

export function renderTroops(troops: number): string {
  return renderNumber(troops / 10);
}

export function renderNumber(num: number): string {
  num = Math.max(num, 0);

  if (num >= 10_000_000) {
    const value = Math.floor(num / 100000) / 10;
    return value.toFixed(1) + "M";
  } else if (num >= 1_000_000) {
    const value = Math.floor(num / 10000) / 100;
    return value.toFixed(2) + "M";
  } else if (num >= 100000) {
    return Math.floor(num / 1000) + "K";
  } else if (num >= 10000) {
    const value = Math.floor(num / 100) / 10;
    return value.toFixed(1) + "K";
  } else if (num >= 1000) {
    const value = Math.floor(num / 10) / 100;
    return value.toFixed(2) + "K";
  } else {
    return Math.floor(num).toString();
  }
}

export function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");

  // Set canvas style to fill the screen
  canvas.style.position = "fixed";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.touchAction = "none";

  return canvas;
}
/**
 * A polyfill for crypto.randomUUID that provides fallback implementations
 * for older browsers, particularly Safari versions < 15.4
 */
export function generateCryptoRandomUUID(): string {
  // Type guard to check if randomUUID is available
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // Fallback using crypto.getRandomValues
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(
      /[018]/g,
      (c: number): string =>
        (
          c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16),
    );
  }

  // Last resort fallback using Math.random
  // Note: This is less cryptographically secure but ensures functionality
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (c: string): string => {
      const r: number = (Math.random() * 16) | 0;
      const v: number = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    },
  );
}

// Re-export translateText from LangSelector
export const translateText = (
  key: string,
  params: Record<string, string | number> = {},
): string => {
  const langSelector = document.querySelector("lang-selector") as LangSelector;
  if (!langSelector) {
    console.warn("LangSelector not found in DOM");
    return key;
  }

  // Wait for translations to be loaded
  if (
    !langSelector.translations ||
    Object.keys(langSelector.translations).length === 0
  ) {
    return key;
  }

  return langSelector.translateText(key, params);
};

export function renderPlayerFlag(flagCode: string, target: HTMLElement) {
  const reverseNameMap = Object.fromEntries(
    Object.entries(LayerShortNames).map(([k, v]) => [v, k]),
  );

  const reverseColorMap = Object.fromEntries(
    Object.entries(ColorShortNames).map(([k, v]) => [v, k]),
  );

  if (!flagCode.startsWith("ctmfg")) return;

  const code = flagCode.replace("ctmfg", "");
  const layers = code.split("_").map((segment) => {
    const [shortName, shortColor] = segment.split("-");
    const name = reverseNameMap[shortName] || shortName;
    const color = reverseColorMap[shortColor] || shortColor;
    return { name, color };
  });

  target.innerHTML = "";
  target.style.overflow = "hidden";
  target.style.position = "relative";
  target.style.aspectRatio = "3/4";

  for (const { name, color } of layers) {
    const mask = `/flags/custom/${name}.svg`;
    if (!mask) continue;

    const layer = document.createElement("div");
    layer.style.position = "absolute";
    layer.style.top = "0";
    layer.style.left = "0";
    layer.style.width = "100%";
    layer.style.height = "100%";

    const isSpecial = !color.startsWith("#");

    if (isSpecial) {
      layer.classList.add(`flag-color-${color}`);
    } else {
      layer.style.backgroundColor = color;
    }

    layer.style.maskImage = `url(${mask})`;
    layer.style.maskRepeat = "no-repeat";
    layer.style.maskPosition = "center";
    layer.style.maskSize = "contain";

    layer.style.webkitMaskImage = `url(${mask})`;
    layer.style.webkitMaskRepeat = "no-repeat";
    layer.style.webkitMaskPosition = "center";
    layer.style.webkitMaskSize = "contain";

    target.appendChild(layer);
  }
}
