import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import Countries from "./data/countries.json";
const flagKey: string = "flag";

import frame from "../../resources/flags/custom/frame.svg";

import center_circle from "../../resources/flags/custom/center_circle.svg";
import full from "../../resources/flags/custom/full.svg";
import test from "../../resources/flags/custom/test.svg";

const FlagMap: Record<string, string> = {
  frame,
  center_circle,
  test,
  full,
};

const LayerShortNames: Record<string, string> = {
  center_circle: "cc",
  frame: "fr",
  full: "fu",
  test: "ts",
};

const ColorShortNames: Record<string, string> = {
  "#ff0000": "r", // red
  "#ffa500": "o", // orange
  "#ffff00": "y", // yellow
  "#008000": "g", // green
  "#00ffff": "c", // cyan
  "#0000ff": "b", // blue
  "#800080": "p", // purple
  "#ff69b4": "h", // hotpink
  "#a52a2a": "br", // brown
  "#808080": "gr", // gray
  "#000000": "bl", // black
  "#ffffff": "w", // white
  "#20b2aa": "t", // teal
  "#ff6347": "tm", // tomato
  "#4682b4": "sb", // steelblue
};

@customElement("flag-input")
export class FlagInput extends LitElement {
  @state() private flag: string = "";
  @state() private search: string = "";
  @state() private showModal: boolean = false;
  @state() private activeTab: "real" | "custom" = "real";
  @state() private selectedColor: string = "#ff0000";
  @state() private openColorIndex: number | null = null;

  private readonly colorOptions: string[] = [
    "#ff0000",
    "#ffa500",
    "#ffff00",
    "#008000",
    "#00ffff",
    "#0000ff",
    "#800080",
    "#ff69b4",
    "#a52a2a",
    "#808080",
    "#000000",
    "#ffffff",
    "#20b2aa",
    "#ff6347",
    "#4682b4",
  ];

  @state() private customLayers: { name: string; color: string }[] = [];

  private addLayer(name: string) {
    this.customLayers = [
      ...this.customLayers,
      { name, color: this.selectedColor },
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
  }

  createRenderRoot() {
    return this;
  }

  render() {
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
                class="text-white flex flex-col gap-[0.5rem] absolute top-[60px] left-[0px] w-[780%] h-[500px] max-h-[50vh] max-w-[87vw] bg-gray-900/80 backdrop-blur-md p-[10px] rounded-[8px] z-[3]"
              >
                <!-- タブボタン -->
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

                <!-- 実在する旗の表示 -->
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
                      <div class="grid grid-cols-3 gap-4 p-2 h-full">
                        <!-- 左：カラーパレットと素材選択 -->
                        <div
                          class="flex flex-col items-center gap-2 overflow-y-auto"
                        >
                          <!-- カラーパレット -->
                          <div class="flex flex-wrap gap-1 mb-2 justify-center">
                            ${this.colorOptions.map(
                              (color) => html`
                                <button
                                  class="w-6 h-6 rounded-full border-2 ${this
                                    .selectedColor === color
                                    ? "border-white"
                                    : "border-gray-400"}"
                                  style="background-color: ${color};"
                                  @click=${() => (this.selectedColor = color)}
                                  title=${color}
                                ></button>
                              `,
                            )}
                          </div>

                          <!-- 素材選択 -->
                          <p class="text-lg font-bold text-white">
                            Select a Layer
                          </p>

                          ${Object.entries(FlagMap).map(
                            ([name, src]) => html`
                              <button @click=${() => this.addLayer(name)}>
                                <div
                                  class="w-16 h-10 rounded"
                                  style="
        background-color: ${this.selectedColor};
        -webkit-mask: url(${src}) center / contain no-repeat;
        mask: url(${src}) center / contain no-repeat;
      "
                                  title=${name}
                                ></div>
                              </button>
                            `,
                          )}
                        </div>

                        <!-- 中央：プレビューとレイヤー一覧 -->
                        <div
                          class="col-span-2 flex flex-col items-center h-full overflow-hidden"
                        >
                          <!-- プレビュー -->
                          <p class="text-lg font-bold text-white mb-2">
                            Preview
                          </p>
                          <div
                            class="relative w-[160px] h-[100px] border border-gray-400 rounded bg-white"
                          >
                            ${this.customLayers.map(({ name, color }) => {
                              const src = FlagMap[name];
                              if (!src) return null;

                              return html`
                                <div
                                  class="absolute top-0 left-0 w-full h-full"
                                  style="
        background-color: ${color};
        -webkit-mask: url(${src}) center / contain no-repeat;
        mask: url(${src}) center / contain no-repeat;
      "
                                ></div>
                              `;
                            })}
                          </div>
                          <!-- コードボタン -->
                          <button
                            @click=${() => {
                              const code = this.encodeCustomFlag();
                              navigator.clipboard.writeText(code);
                              alert("Copied: " + code);
                              this.setFlag(code);
                            }}
                            class="mt-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-500"
                          >
                            Copy Flag Code
                          </button>

                          <!-- レイヤー一覧 -->
                          <div
                            class="mt-4 w-full max-h-[150px] overflow-y-auto"
                          >
                            <p class="text-lg font-bold text-white mb-2">
                              Layers
                            </p>
                            <ul class="text-white space-y-1">
                              ${this.customLayers.map(
                                ({ name, color }, index) => html`
                                  <li
                                    class="flex flex-col gap-1 py-1 px-2 bg-gray-800 rounded"
                                  >
                                    <div
                                      class="flex justify-between items-center"
                                    >
                                      <span class="flex items-center gap-2">
                                        <span
                                          class="inline-block w-4 h-4 rounded-full"
                                          style="background-color: ${color};"
                                        ></span>
                                        ${name}
                                      </span>
                                      <div class="flex gap-1">
                                        <button
                                          @click=${() =>
                                            this.moveLayerUp(index)}
                                          title="Move Up"
                                          class="text-sm px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
                                        >
                                          ↑
                                        </button>
                                        <button
                                          @click=${() =>
                                            this.moveLayerDown(index)}
                                          title="Move Down"
                                          class="text-sm px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
                                        >
                                          ↓
                                        </button>
                                        <button
                                          @click=${() =>
                                            this.toggleColorPicker(index)}
                                          title="Change Color"
                                          class="text-sm px-2 py-1 bg-blue-600 rounded hover:bg-blue-500 text-white"
                                        >
                                          Color
                                        </button>
                                        <button
                                          @click=${() =>
                                            this.removeLayer(index)}
                                          class="text-red-400 hover:text-red-600"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>

                                    <!-- カラーパレット（表示中のものだけ） -->
                                    ${this.openColorIndex === index
                                      ? html`
                                          <div
                                            class="flex flex-wrap gap-1 justify-start mt-1"
                                          >
                                            ${this.colorOptions.map(
                                              (c) => html`
                                                <button
                                                  class="w-3 h-3 rounded-full border ${color ===
                                                  c
                                                    ? "border-white"
                                                    : "border-gray-500"}"
                                                  style="background-color: ${c};"
                                                  @click=${() =>
                                                    this.updateLayerColor(
                                                      index,
                                                      c,
                                                    )}
                                                  title=${c}
                                                ></button>
                                              `,
                                            )}
                                          </div>
                                        `
                                      : ""}
                                  </li>
                                `,
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    `}
              </div>
            `
          : ""}
      </div>
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

          return html`
            <div
              class="absolute top-0 left-0 w-full h-full"
              style="
                background-color: ${color};
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
