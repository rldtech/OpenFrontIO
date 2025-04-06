import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import Countries from "./data/countries.json";
const flagKey: string = "flag";

import disabled from "../../resources/images/DisabledIcon.svg";
import locked from "../../resources/images/Locked.svg";

import frame from "../../resources/flags/custom/frame.svg";

import center_circle from "../../resources/flags/custom/center_circle.svg";
import center_flower from "../../resources/flags/custom/center_flower.svg";
import center_hline from "../../resources/flags/custom/center_hline.svg";
import center_star from "../../resources/flags/custom/center_star.svg";
import center_vline from "../../resources/flags/custom/center_vline.svg";
import diag_bl from "../../resources/flags/custom/diag_bl.svg";
import diag_br from "../../resources/flags/custom/diag_br.svg";
import eu_star from "../../resources/flags/custom/eu_star.svg";
import flower_tc from "../../resources/flags/custom/flower_tc.svg";
import flower_tl from "../../resources/flags/custom/flower_tl.svg";
import flower_tr from "../../resources/flags/custom/flower_tr.svg";
import full from "../../resources/flags/custom/full.svg";
import half_b from "../../resources/flags/custom/half_b.svg";
import half_l from "../../resources/flags/custom/half_l.svg";
import half_r from "../../resources/flags/custom/half_r.svg";
import half_t from "../../resources/flags/custom/half_t.svg";
import laurel_wreath from "../../resources/flags/custom/laurel_wreath.svg";
import mini_tr_bl from "../../resources/flags/custom/mini_tr_bl.svg";
import mini_tr_br from "../../resources/flags/custom/mini_tr_br.svg";
import mini_tr_tl from "../../resources/flags/custom/mini_tr_tl.svg";
import mini_tr_tr from "../../resources/flags/custom/mini_tr_tr.svg";
import nato_emblem from "../../resources/flags/custom/nato_emblem.svg";
import octagram from "../../resources/flags/custom/octagram.svg";
import octagram_2 from "../../resources/flags/custom/octagram_2.svg";
import triangle_b from "../../resources/flags/custom/triangle_b.svg";
import triangle_bl from "../../resources/flags/custom/triangle_bl.svg";
import triangle_br from "../../resources/flags/custom/triangle_br.svg";
import triangle_l from "../../resources/flags/custom/triangle_l.svg";
import triangle_r from "../../resources/flags/custom/triangle_r.svg";
import triangle_t from "../../resources/flags/custom/triangle_t.svg";
import triangle_tl from "../../resources/flags/custom/triangle_tl.svg";
import triangle_tr from "../../resources/flags/custom/triangle_tr.svg";
import tricolor_b from "../../resources/flags/custom/tricolor_b.svg";
import tricolor_c from "../../resources/flags/custom/tricolor_c.svg";
import tricolor_l from "../../resources/flags/custom/tricolor_l.svg";
import tricolor_m from "../../resources/flags/custom/tricolor_m.svg";
import tricolor_r from "../../resources/flags/custom/tricolor_r.svg";
import tricolor_t from "../../resources/flags/custom/tricolor_t.svg";

import rocket from "../../resources/flags/custom/rocket.svg";
import rocket_mini from "../../resources/flags/custom/rocket_mini.svg";

import og from "../../resources/flags/custom/og.svg";
import og_plus from "../../resources/flags/custom/og_plus.svg";

import translator from "../../resources/flags/custom/translator.svg";

import beta_tester from "../../resources/flags/custom/beta_tester.svg";
import beta_tester_hole from "../../resources/flags/custom/beta_tester_hole.svg";

import admin_contributors from "../../resources/flags/custom/admin_contributors.svg";
import admin_shield from "../../resources/flags/custom/admin_shield.svg";
import admin_shield_r from "../../resources/flags/custom/admin_shield_r.svg";

import admin_evan from "../../resources/flags/custom/admin_evan.svg";

export const FlagMap: Record<string, string> = {
  frame,
  center_hline,
  center_vline,
  diag_br,
  diag_bl,
  triangle_tl,
  triangle_tr,
  triangle_bl,
  triangle_br,
  half_l,
  half_r,
  half_t,
  half_b,
  mini_tr_tl,
  mini_tr_tr,
  mini_tr_bl,
  mini_tr_br,
  triangle_t,
  triangle_l,
  triangle_b,
  triangle_r,
  tricolor_l,
  tricolor_c,
  tricolor_r,
  tricolor_t,
  tricolor_m,
  tricolor_b,
  center_circle,
  center_star,
  center_flower,
  flower_tl,
  flower_tc,
  flower_tr,
  nato_emblem,
  eu_star,
  laurel_wreath,
  octagram,
  octagram_2,
  beta_tester,
  beta_tester_hole,
  rocket,
  rocket_mini,
  admin_contributors,
  translator,
  og,
  og_plus,
  admin_shield,
  admin_shield_r,
  admin_evan,
  full,
};

export const LayerShortNames: Record<string, string> = {
  center_circle: "cc",
  center_hline: "ch",
  center_vline: "cv",
  center_star: "cs",
  center_flower: "cf",
  flower_tl: "ftl",
  flower_tc: "ftc",
  flower_tr: "ftr",
  diag_br: "dbr",
  diag_bl: "dbl",
  frame: "fr",
  full: "fu",
  triangle_tl: "ttl",
  triangle_bl: "tbl",
  triangle_tr: "ttr",
  triangle_br: "tbr",
  half_l: "hl",
  half_r: "hr",
  half_t: "ht",
  half_b: "hb",
  mini_tr_bl: "mtbl",
  mini_tr_br: "mtbr",
  mini_tr_tl: "mttl",
  mini_tr_tr: "mttr",
  triangle_t: "tt",
  triangle_l: "tl",
  triangle_b: "tb",
  triangle_r: "tr",
  tricolor_l: "tcl",
  tricolor_c: "tcc",
  tricolor_r: "tcr",
  tricolor_t: "tct",
  tricolor_m: "tcm",
  tricolor_b: "tcb",
  nato_emblem: "ne",
  eu_star: "es",
  laurel_wreath: "lw",
  octagram: "oc",
  octagram_2: "oc2",
  og: "og",
  og_plus: "ogp",
  beta_tester: "bt",
  beta_tester_hole: "bth",
  rocket: "rc",
  rocket_mini: "rcm",
  translator: "tlr",
  admin_shield: "as",
  admin_shield_r: "asr",
  admin_evan: "ae",
};

export const ColorShortNames: Record<string, string> = {
  "#ff0000": "r", // red
  "#ffa500": "o", // orange
  "#ffff00": "y", // yellow
  "#008000": "g", // green
  "#00ffff": "c", // cyan
  "#0000ff": "b", // blue
  "#000000": "bl", // black
  "#ffffff": "w", // white
  "#800080": "p", // purple
  "#ff69b4": "h", // hotpink
  "#a52a2a": "br", // brown
  "#808080": "gr", // gray
  "#20b2aa": "t", // teal
  "#ff6347": "tm", // tomato
  "#4682b4": "stb", // steelblue
  "#90ee90": "lg", // lightgreen
  "#8b0000": "dr", // darkred
  "#191970": "nv", // navy
  "#ffd700": "gd", // gold
  "#add8e6": "lb", // lightblue
  "#f5f5dc": "bc", // beige
  "#ffb6c1": "pk", // lightpink
  "#708090": "sl", // slategray
  "#00ff7f": "sg", // springgreen
  "#dc143c": "cr", // crimson
  "#ffbf00": "am", // amber
  "#3d9970": "ol", // olive green
  "#87ceeb": "sb", // sky blue
  "#6a5acd": "slb", // slate blue
  "#ff66cc": "rp", // rose pink
  "#36454f": "ch", // charcoal
  "#fffff0": "iv", // ivory

  rainbow: "rb", // dark rainbow animation
  "bright-rainbow": "brb", // bright rainbow animation
  "gold-glow": "gdg", // glowing gold animation
  "silver-glow": "svg", // glowing silver animation
  "copper-glow": "cpg", // glowing copper animation
  neon: "nn", // neon green pulse animation
  glitch: "gl", // fast glitch effect
  water: "wt", // soft blue breathing animation
};

let isDebug_: boolean = false;
const isEvan: boolean = false;
const isAdmin: boolean = false;
const isOg: boolean = false;
const isOg100: boolean = false;
const isSupporters: boolean = false;
const isBetaTester: boolean = false;
const isContributors: boolean = false;
const isTranslator: boolean = false;
const isWellKnownPlayer: boolean = false;
const isKnownPlayer: boolean = false;
const isSeenplayer: boolean = false;
const isLoginPlayer: boolean = false;

let MAX_LAYER = 50;

type LockReasonMap = Record<string, string>;

function checkPermission(): [string[], string[], LockReasonMap] {
  const lockedLayers_: string[] = [];
  const lockedColors_: string[] = [];
  const lockedReasons_: LockReasonMap = {};

  MAX_LAYER = 50;

  const lock = (list: string[], reason: string) => {
    for (const item of list) {
      lockedLayers_.push(item);
      lockedReasons_[item] = reason;
    }
  };

  const lockColor = (list: string[], reason: string) => {
    for (const color of list) {
      lockedColors_.push(color);
      lockedReasons_[color] = reason;
    }
  };

  if (isEvan || isDebug_) {
    MAX_LAYER = 50;
    return [lockedLayers_, lockedColors_, lockedReasons_];
  }

  lock(["admin_evan"], "Only Evan can use this layer");

  if (!isAdmin) {
    lock(["admin_shield", "admin_shield_r"], "Admin only");
  }

  if (isAdmin) {
    MAX_LAYER = 45;
  } else if (isContributors || isSupporters) {
    MAX_LAYER = 40;
  } else if (isOg || isOg100 || isTranslator || isBetaTester) {
    MAX_LAYER = 35;
  } else if (isWellKnownPlayer) {
    MAX_LAYER = 20;
  } else if (isKnownPlayer) {
    MAX_LAYER = 15;
  } else if (isSeenplayer) {
    MAX_LAYER = 10;
  } else if (isLoginPlayer) {
    MAX_LAYER = 5;
  } else {
    MAX_LAYER = 3;
  }

  if (!isContributors) {
    lock(["admin_contributors"], "Contributors only");
  }

  if (!isBetaTester) {
    lock(["beta_tester", "beta_tester_hole"], "Beta testers only");
  }

  if (!isSupporters) {
    lock(["rocket_mini", "rocket"], "Supporters only");
    lockColor(
      [
        "rainbow",
        "bright-rainbow",
        "gold-glow",
        "silver-glow",
        "copper-glow",
        "neon",
        "glitch",
        "water",
      ],
      "Supporters only",
    );
  } else {
    return [lockedLayers_, lockedColors_, lockedReasons_];
  }

  if (!isOg) {
    lock(["og_plus"], "OG players only");
  }

  if (!isOg100) {
    lock(["og"], "OG100 players only");
  }

  if (!isTranslator) {
    lock(["beta_tester", "beta_tester_hole"], "Beta testers only");
  }

  if (!isWellKnownPlayer) {
    lock(
      [
        "center_circle",
        "center_star",
        "center_flower",
        "flower_tc",
        "flower_tl",
        "flower_tr",
        "nato_emblem",
        "eu_star",
        "laurel_wreath",
        "octagram",
        "octagram_2",
      ],
      "Well-known players only",
    );
    lockColor(
      [
        "#ffd700",
        "#add8e6",
        "#f5f5dc",
        "#ffb6c1",
        "#708090",
        "#00ff7f",
        "#dc143c",
        "#ffbf00",
        "#3d9970",
        "#87ceeb",
        "#6a5acd",
        "#ff66cc",
        "#36454f",
        "#fffff0",
      ],
      "Well-known players only",
    );

    if (!isKnownPlayer) {
      lock(
        [
          "tricolor_b",
          "tricolor_c",
          "tricolor_l",
          "tricolor_m",
          "tricolor_r",
          "tricolor_t",
          "triangle_t",
          "triangle_l",
          "triangle_b",
          "triangle_r",
          "mini_tr_tr",
          "mini_tr_tl",
          "mini_tr_br",
          "mini_tr_bl",
        ],
        "Known players only",
      );
      lockColor(
        [
          "#800080",
          "#ff69b4",
          "#a52a2a",
          "#808080",
          "#20b2aa",
          "#ff6347",
          "#4682b4",
          "#90ee90",
          "#8b0000",
          "#191970",
        ],
        "Known players only",
      );

      if (!isSeenplayer) {
        lock(["half_l", "half_r", "half_b", "half_t"], "Seen players only");
        lockColor(["#ffa500", "#00ffff"], "Seen players only");

        if (!isLoginPlayer) {
          lock(
            ["triangle_br", "triangle_bl", "triangle_tr", "triangle_tl"],
            "Login required",
          );
          lockColor(["#ffff00", "#008000"], "Login required");
        }
      }
    }
  }
  return [lockedLayers_, lockedColors_, lockedReasons_];
}

@customElement("flag-input")
export class FlagInput extends LitElement {
  @state() private flag: string = "";
  @state() private search: string = "";
  @state() private showModal: boolean = false;
  @state() private activeTab: "real" | "custom" = "real";
  @state() private selectedColor: string = "#ff0000";
  @state() private openColorIndex: number | null = null;

  private readonly colorOptions: string[] = Object.keys(ColorShortNames);

  @state() private customLayers: { name: string; color: string }[] = [];

  @state() private hoveredColor: string | null = null;
  @state() private hoverPosition = { x: 0, y: 0 };
  @state() private hoverReason: string | null = null;

  private addLayer(name: string) {
    const totalLayers = this.customLayers.length;

    if (totalLayers >= MAX_LAYER) {
      alert(`You can only add up to ${MAX_LAYER} layers.`);
      return;
    }

    const newLayer = { name, color: this.selectedColor };
    this.customLayers = [
      this.customLayers[0],
      newLayer,
      ...this.customLayers.slice(1),
    ];
  }
  private removeLayer(index: number) {
    this.customLayers = this.customLayers.filter((_, i) => i !== index);
  }

  private moveLayerUp(index: number) {
    if (index === 0) return;
    const newLayers = [...this.customLayers];
    [newLayers[index - 1], newLayers[index]] = [
      newLayers[index],
      newLayers[index - 1],
    ];
    this.customLayers = newLayers;
  }

  private moveLayerDown(index: number) {
    if (index === this.customLayers.length - 1) return;
    const newLayers = [...this.customLayers];
    [newLayers[index], newLayers[index + 1]] = [
      newLayers[index + 1],
      newLayers[index],
    ];
    this.customLayers = newLayers;
  }

  private updateLayerColor(index: number, color: string) {
    const newLayers = [...this.customLayers];
    newLayers[index].color = color;
    this.customLayers = newLayers;
  }

  private toggleColorPicker(index: number) {
    this.openColorIndex = this.openColorIndex === index ? null : index;
  }

  static styles = css`
    @media (max-width: 768px) {
      .flag-modal {
        width: 80vw;
      }

      .dropdown-item {
        width: calc(100% / 3 - 15px);
      }
    }
  `;

  private handleSearch(e: Event) {
    this.search = String((e.target as HTMLInputElement).value);
  }

  private setFlag(flag: string) {
    if (flag == "xx") {
      flag = "";
    }
    this.flag = flag;
    this.showModal = false;
    this.storeFlag(flag);
  }

  public getCurrentFlag(): string {
    return this.flag;
  }

  private getStoredFlag(): string {
    const storedFlag = localStorage.getItem(flagKey);
    if (storedFlag) {
      return storedFlag;
    }
    return "";
  }

  private storeFlag(flag: string) {
    if (flag) {
      localStorage.setItem(flagKey, flag);
    } else if (flag === "") {
      localStorage.removeItem(flagKey);
    }
  }

  private dispatchFlagEvent() {
    this.dispatchEvent(
      new CustomEvent("flag-change", {
        detail: { flag: this.flag },
        bubbles: true,
        composed: true,
      }),
    );
  }

  connectedCallback() {
    super.connectedCallback();
    this.flag = this.getStoredFlag();
    this.dispatchFlagEvent();

    if (this.isCustomFlag(this.flag)) {
      this.customLayers = this.decodeCustomFlag(this.flag);
    } else {
      if (this.customLayers.length === 0) {
        this.customLayers = [
          { name: "full", color: "#ffffff" },
          { name: "frame", color: "#000000" },
        ];
      }
    }
  }

  createRenderRoot() {
    return this;
  }

  private lockedLayers: string[] = [];

  private lockedColors: string[] = [];

  private lockedReasons: Record<string, string> = {};

  render() {
    isDebug_ = true;
    const result = checkPermission();
    this.lockedLayers = Array.isArray(result[0]) ? result[0] : [result[0]];
    this.lockedColors = Array.isArray(result[1]) ? result[1] : [result[1]];
    this.lockedReasons = result[2] || {};
    return html`
      <div class="flex relative">
        <button
          @click=${() => (this.showModal = true)}
          class="border p-[4px] rounded-lg flex cursor-pointer border-black/30 dark:border-gray-300/60 bg-white/70 dark:bg-[rgba(55,65,81,0.7)]"
          title="Pick a flag!"
        >
          ${this.renderFlagPreview(this.flag)}
        </button>

        ${this.showModal
          ? html`
              <div
                class="text-white flex flex-col gap-[0.5rem] absolute top-[60px] left-[0px] w-[880%] h-[500px] max-h-[50vh] max-w-[87vw] bg-gray-900/80 backdrop-blur-md p-[10px] rounded-[8px] z-[3]"
              >
                <!-- tab  -->
                <div class="flex gap-2 mb-2">
                  <button
                    class="px-4 py-1 rounded-lg font-bold ${this.activeTab ===
                    "real"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 text-black"}"
                    @click=${() => (this.activeTab = "real")}
                  >
                    Real Flags
                  </button>
                  <button
                    class="px-4 py-1 rounded-lg font-bold ${this.activeTab ===
                    "custom"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 text-black"}"
                    @click=${() => (this.activeTab = "custom")}
                  >
                    Custom Flags
                  </button>
                </div>

                ${this.activeTab === "real"
                  ? html`
                      <input
                        class="h-[2rem] border-none text-center border border-gray-300 rounded-xl shadow-sm text-2xl text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:border-gray-300/60 dark:bg-gray-700 dark:text-white"
                        type="text"
                        placeholder="Search..."
                        @change=${this.handleSearch}
                        @keyup=${this.handleSearch}
                      />
                      <div
                        class="flex flex-wrap justify-evenly gap-[1rem] overflow-y-auto overflow-x-hidden"
                      >
                        ${Countries.filter(
                          (country) =>
                            country.name
                              .toLowerCase()
                              .includes(this.search.toLowerCase()) ||
                            country.code
                              .toLowerCase()
                              .includes(this.search.toLowerCase()),
                        ).map(
                          (country) => html`
                            <button
                              @click=${() => this.setFlag(country.code)}
                              class="text-center cursor-pointer border-none bg-none opacity-70 sm:w-[calc(33.3333%-15px)] w-[calc(100%/3-15px)] md:w-[calc(100%/4-15px)]"
                            >
                              <img
                                class="country-flag w-full h-auto"
                                src="/flags/${country.code}.svg"
                              />
                              <span class="country-name">${country.name}</span>
                            </button>
                          `,
                        )}
                      </div>
                    `
                  : html`
                      <div class="grid grid-cols-[1fr_2fr] gap-4 p-2 h-full">
                        <!-- left -->
                        <div
                          class="flex flex-col items-center gap-2 overflow-y-auto max-h-[calc(50vh-4rem)]"
                        >
                          <div class="flex flex-wrap gap-1 mb-2 justify-center">
                            ${this.colorOptions.map((color) => {
                              const isLocked =
                                this.lockedColors.includes(color);
                              const isSpecial = !color.startsWith("#");
                              const colorClass = isSpecial
                                ? `flag-color-${color}`
                                : "";
                              const inlineStyle = isSpecial
                                ? ""
                                : `background-color: ${color};`;
                              const isSelected = this.selectedColor === color;
                              return html`
                                <button
                                  class="w-4 h-4 rounded-full border-2 relative
        ${isSelected ? "border-white" : "border-gray-400"}
        ${isLocked ? "opacity-40 cursor-not-allowed" : ""}
        ${colorClass}"
                                  style=${inlineStyle}
                                  @click=${() =>
                                    !isLocked && (this.selectedColor = color)}
                                  @mouseenter=${(e: MouseEvent) => {
                                    if (isLocked) {
                                      this.hoveredColor = color;
                                    }
                                  }}
                                  @mousemove=${(e: MouseEvent) => {
                                    if (isLocked) {
                                      this.hoverPosition = {
                                        x: e.clientX,
                                        y: e.clientY,
                                      };
                                    }
                                  }}
                                  @mouseleave=${() => {
                                    this.hoveredColor = null;
                                  }}
                                  title=${color}
                                >
                                  ${isLocked
                                    ? html`<img
                                        src=${locked}
                                        alt="Locked"
                                        class="absolute top-1/2 left-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                      />`
                                    : ""}
                                </button>
                              `;
                            })}
                          </div>

                          <p class="text-lg font-bold text-white self-start">
                            Select a Layer
                          </p>

                          ${this.customLayers.length >= MAX_LAYER
                            ? html`
                                <p
                                  class="text-sm text-red-400 self-start -mt-1 mb-2"
                                >
                                  You've reached the maximum number of
                                  layers.<br />
                                  Please remove some to add new ones.
                                </p>
                              `
                            : null}

                          <div
                            class="grid grid-cols-2 gap-2 w-full max-h-[300px] overflow-y-auto pr-1 mb-2"
                          >
                            ${Object.entries(FlagMap)
                              .filter(
                                ([name]) => name !== "frame" && name !== "full",
                              )
                              .map(([name, src]) => {
                                const isLocked =
                                  this.lockedLayers.includes(name);
                                const isDisabled =
                                  !isLocked &&
                                  this.customLayers.length >= MAX_LAYER;

                                const isSpecial =
                                  !this.selectedColor.startsWith("#");
                                const colorClass = isSpecial
                                  ? `flag-color-${this.selectedColor}`
                                  : "";
                                const colorStyle = isSpecial
                                  ? ""
                                  : `background-color: ${this.selectedColor};`;

                                const reason = isLocked
                                  ? this.lockedReasons[name] || "Locked"
                                  : isDisabled
                                    ? `You can only add up to ${MAX_LAYER} layers.`
                                    : "";

                                return html`
                                  <button
                                    @click=${() => {
                                      if (!isLocked && !isDisabled)
                                        this.addLayer(name);
                                    }}
                                    class="p-1 border border-gray-600 rounded-md transition relative 
                                      ${isLocked || isDisabled
                                      ? "opacity-40 cursor-not-allowed"
                                      : "hover:border-white"}"
                                    ?disabled=${isLocked || isDisabled}
                                    @mouseenter=${(e: MouseEvent) => {
                                      if (reason) {
                                        this.hoveredColor = name;
                                        this.hoverReason = reason;
                                        this.hoverPosition = {
                                          x: e.clientX,
                                          y: e.clientY,
                                        };
                                      }
                                    }}
                                    @mousemove=${(e: MouseEvent) => {
                                      if (reason) {
                                        this.hoverPosition = {
                                          x: e.clientX,
                                          y: e.clientY,
                                        };
                                      }
                                    }}
                                    @mouseleave=${() => {
                                      this.hoveredColor = null;
                                    }}
                                  >
                                    <div
                                      class="w-full h-14 rounded relative"
                                      title=${name}
                                    >
                                      <!-- black frame background -->
                                      <div
                                        class="absolute inset-0 rounded"
                                        style="
                                          background-color: black;
                                          -webkit-mask: url(${FlagMap.frame}) center / contain no-repeat;
                                          mask: url(${FlagMap.frame}) center / contain no-repeat;
                                        "
                                      ></div>

                                      <!-- selected color mask -->
                                      <div
                                        class="absolute inset-0 rounded ${colorClass}"
                                        style="
                                          ${colorStyle}
                                          -webkit-mask: url(${src}) center / contain no-repeat;
                                          mask: url(${src}) center / contain no-repeat;
                                        "
                                      ></div>
                                    </div>

                                    ${isLocked
                                      ? html`<img
                                          src=${locked}
                                          alt="Locked"
                                          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 opacity-60 drop-shadow-md pointer-events-none"
                                        />`
                                      : isDisabled
                                        ? html`<img
                                            src=${disabled}
                                            alt="Disabled"
                                            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 opacity-60 drop-shadow-md pointer-events-none"
                                          />`
                                        : null}
                                  </button>
                                `;
                              })}
                          </div>
                        </div>

                        <!-- right -->
                        <div
                          class="flex flex-col items-center h-full overflow-hidden max-h-[calc(50vh-4rem)]"
                        >
                          <p class="text-lg font-bold text-white mb-2">
                            Preview
                          </p>
                          <div
                            class="relative w-[160px] h-[100px] min-w-[160px] min-h-[100px] max-w-[160px] max-h-[100px] flex-shrink-0 border border-gray-400 rounded bg-white"
                          >
                            ${this.customLayers.map(({ name, color }) => {
                              const src = FlagMap[name];
                              if (!src) return null;
                              console.log("color", color);
                              const isSpecial = !color.startsWith("#");
                              const colorClass = isSpecial
                                ? `flag-color-${color}`
                                : "";
                              const bgStyle = isSpecial
                                ? ""
                                : `background-color: ${color};`;

                              return html`
                                <div
                                  class="absolute top-0 left-0 w-full h-full ${colorClass}"
                                  style="
        ${bgStyle}
        -webkit-mask: url(${src}) center / contain no-repeat;
        mask: url(${src}) center / contain no-repeat;
      "
                                ></div>
                              `;
                            })}
                          </div>

                          <button
                            @click=${() => {
                              const code = this.encodeCustomFlag();
                              navigator.clipboard.writeText(code);
                              console.log("Copied: " + code);
                              this.setFlag(code);
                            }}
                            class="mt-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-500"
                          >
                            Copy Flag Code
                          </button>

                          <div
                            class="mt-4 w-full max-h-[300px] overflow-y-auto mb-2"
                          >
                            <p class="text-lg font-bold text-white mb-2">
                              Layers (${this.customLayers.length})
                            </p>
                            <ul class="text-white space-y-1">
                              ${this.customLayers.map((_, i, arr) => {
                                const index = arr.length - 1 - i;
                                const { name, color } = arr[index];
                                const isFixed =
                                  name === "full" || name === "frame";

                                const isSpecial = !color.startsWith("#");
                                const colorClass = isSpecial
                                  ? `flag-color-${color}`
                                  : "";
                                const inlineStyle = isSpecial
                                  ? ""
                                  : `background-color: ${color};`;

                                return html`
                                  <li
                                    class="flex flex-col gap-1 py-1 px-2 bg-gray-800 rounded"
                                  >
                                    <div
                                      class="flex justify-between items-center"
                                    >
                                      <span class="flex items-center gap-2">
                                        <span
                                          class="inline-block w-4 h-4 rounded-full ${colorClass}"
                                          style=${inlineStyle}
                                        ></span>
                                        ${name}
                                        ${isFixed
                                          ? html`<span
                                              class="text-xs text-gray-400"
                                              >(fixed)</span
                                            >`
                                          : ""}
                                      </span>
                                      <div class="flex gap-1">
                                        ${!isFixed
                                          ? html`
                                              ${index > 1 &&
                                              this.customLayers[index - 1]
                                                .name !== "full"
                                                ? html`
                                                    <button
                                                      @click=${() =>
                                                        this.moveLayerUp(index)}
                                                      title="Move Up"
                                                      class="text-sm px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
                                                    >
                                                      ↓
                                                    </button>
                                                  `
                                                : ""}
                                              ${index <
                                                this.customLayers.length - 2 &&
                                              this.customLayers[index + 1]
                                                .name !== "frame"
                                                ? html`
                                                    <button
                                                      @click=${() =>
                                                        this.moveLayerDown(
                                                          index,
                                                        )}
                                                      title="Move Down"
                                                      class="text-sm px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
                                                    >
                                                      ↑
                                                    </button>
                                                  `
                                                : ""}
                                              <button
                                                @click=${() =>
                                                  this.removeLayer(index)}
                                                class="text-red-400 hover:text-red-600"
                                              >
                                                Remove
                                              </button>
                                            `
                                          : null}
                                        <button
                                          @click=${() =>
                                            this.toggleColorPicker(index)}
                                          title="Change Color"
                                          class="text-sm px-2 py-1 bg-blue-600 rounded hover:bg-blue-500 text-white"
                                        >
                                          Color
                                        </button>
                                      </div>
                                    </div>

                                    ${this.openColorIndex === index
                                      ? html`
                                          <div
                                            class="flex flex-wrap gap-1 justify-start mt-1"
                                          >
                                            ${this.colorOptions.map((color) => {
                                              const isLocked =
                                                this.lockedColors.includes(
                                                  color,
                                                );
                                              const isSpecial =
                                                !color.startsWith("#");
                                              const colorClass = isSpecial
                                                ? `flag-color-${color}`
                                                : "";
                                              const inlineStyle = isSpecial
                                                ? ""
                                                : `background-color: ${color};`;

                                              return html`
                                                <button
                                                  class="w-3 h-3 rounded-full border-2 relative
                      ${this.selectedColor === color
                                                    ? "border-white"
                                                    : "border-gray-400"}
                      ${isLocked ? "opacity-40 cursor-not-allowed" : ""}
                      ${colorClass}"
                                                  style=${inlineStyle}
                                                  @click=${() => {
                                                    if (
                                                      !isLocked &&
                                                      this.openColorIndex !==
                                                        null
                                                    ) {
                                                      this.updateLayerColor(
                                                        this.openColorIndex,
                                                        color,
                                                      );
                                                    }
                                                  }}
                                                  @mouseenter=${(
                                                    e: MouseEvent,
                                                  ) => {
                                                    if (isLocked) {
                                                      this.hoveredColor = color;
                                                    }
                                                  }}
                                                  @mousemove=${(
                                                    e: MouseEvent,
                                                  ) => {
                                                    if (isLocked) {
                                                      this.hoverPosition = {
                                                        x: e.clientX,
                                                        y: e.clientY,
                                                      };
                                                    }
                                                  }}
                                                  @mouseleave=${() => {
                                                    this.hoveredColor = null;
                                                  }}
                                                  title=${color}
                                                >
                                                  ${isLocked
                                                    ? html`<img
                                                        src=${locked}
                                                        alt="Locked"
                                                        class="absolute top-1/2 left-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                                      />`
                                                    : ""}
                                                </button>
                                              `;
                                            })}
                                          </div>
                                        `
                                      : ""}
                                  </li>
                                `;
                              })}
                            </ul>
                          </div>
                        </div>
                      </div>
                    `}
              </div>
            `
          : ""}
      </div>
      ${this.hoveredColor && this.lockedReasons[this.hoveredColor]
        ? html`
            <div
              class="fixed z-50 px-3 py-2 rounded bg-black text-white text-sm pointer-events-none shadow-md"
              style="top: ${this.hoverPosition.y + 12}px; left: ${this
                .hoverPosition.x + 12}px;"
            >
              ${this.lockedReasons[this.hoveredColor]}
            </div>
          `
        : null}
    `;
  }

  private encodeCustomFlag(): string {
    return (
      "ctmfg" +
      this.customLayers
        .map(({ name, color }) => {
          const shortName = LayerShortNames[name] || name;
          const shortColor = ColorShortNames[color] || color.replace("#", "");
          return `${shortName}-${shortColor}`;
        })
        .join("_")
    );
  }

  private isCustomFlag(flag: string): boolean {
    return flag.startsWith("ctmfg");
  }

  private decodeCustomFlag(code: string): { name: string; color: string }[] {
    if (!this.isCustomFlag(code)) return [];

    const short = code.replace("ctmfg", "");
    const reverseNameMap = Object.fromEntries(
      Object.entries(LayerShortNames).map(([k, v]) => [v, k]),
    );
    const reverseColorMap = Object.fromEntries(
      Object.entries(ColorShortNames).map(([k, v]) => [v, k]),
    );

    return short.split("_").map((segment) => {
      const [shortName, shortColor] = segment.split("-");
      const name = reverseNameMap[shortName] || shortName;
      const color = reverseColorMap[shortColor] || `#${shortColor}`;
      return { name, color };
    });
  }

  private renderFlagPreview(flag: string) {
    if (!this.isCustomFlag(flag)) {
      return html`<img class="size-[48px]" src="/flags/${flag || "xx"}.svg" />`;
    }

    const layers = this.decodeCustomFlag(flag);
    return html`
      <div
        class="size-[48px] relative border border-gray-300 rounded overflow-hidden bg-white"
      >
        ${layers.map(({ name, color }) => {
          const src = FlagMap[name];
          if (!src) return null;

          const isSpecial = !color.startsWith("#");
          const colorClass = isSpecial ? `flag-color-${color}` : "";
          const bgStyle = isSpecial ? "" : `background-color: ${color};`;

          return html`
            <div
              class="absolute top-0 left-0 w-full h-full ${colorClass}"
              style="
                ${bgStyle}
                -webkit-mask: url(${src}) center / contain no-repeat;
                mask: url(${src}) center / contain no-repeat;
              "
            ></div>
          `;
        })}
      </div>
    `;
  }
}
