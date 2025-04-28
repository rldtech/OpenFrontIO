import { LitElement, html, render } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import territory_patterns from "../../resources/territory_patterns.json";
import "./components/Difficulties";
import "./components/Maps";

@customElement("territory-patterns-input")
export class territoryPatternsModal extends LitElement {
  @query("o-modal") private modalEl!: HTMLElement & {
    open: () => void;
    close: () => void;
  };

  @query("#territory-patterns-input_") private previewButton!: HTMLElement;

  @state() private selectedPattern =
    localStorage.getItem("territoryPattern") || "";

  @state() private buttonWidth: number = 100;

  private resizeObserver: ResizeObserver;

  constructor() {
    super();
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target.classList.contains("preview-container")) {
          this.buttonWidth = entry.contentRect.width;
        }
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      const containers = this.renderRoot.querySelectorAll(".preview-container");
      containers.forEach((container) => this.resizeObserver.observe(container));
      this.updatePreview();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver.disconnect();
  }

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <o-modal id="territoryPatternsModal" title="Select Territory Pattern">
        <div
          class="flex flex-wrap gap-4 p-2"
          style="justify-content: center; align-items: flex-start;"
        >
          ${Object.entries(territory_patterns.patterns).map(
            ([key, pattern]) => html`
              <button
                class="border p-2 rounded-lg shadow text-black dark:text-white text-left
      ${this.selectedPattern === key
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"}"
                style="flex: 0 1 calc(25% - 1rem); max-width: calc(25% - 1rem);"
                @click=${() => this.selectPattern(key)}
              >
                <div class="text-sm font-bold mb-1">${key}</div>
                <div
                  class="preview-container"
                  style="
      width: 100%;
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
    "
                >
                  ${(() => {
                    const cellCountX = pattern.tileWidth;
                    const cellCountY = pattern.tileHeight;
                    const cellSize = Math.floor(
                      this.buttonWidth / Math.max(cellCountX, cellCountY),
                    );

                    return html`
                      <div
                        style="
            display: grid;
            grid-template-columns: repeat(${cellCountX}, ${cellSize}px);
            grid-template-rows: repeat(${cellCountY}, ${cellSize}px);
            background-color: #ccc;
            padding: 2px;
            border-radius: 4px;
          "
                      >
                        ${pattern.pattern.flat().map(
                          (cell) => html`
                            <div
                              style="
                  background-color: ${cell === 1 ? "#000" : "transparent"};
                  border: 1px solid rgba(0, 0, 0, 0.1);
                  width: ${cellSize}px;
                  height: ${cellSize}px;
                  border-radius: 1px;
                "
                            ></div>
                          `,
                        )}
                      </div>
                    `;
                  })()}
                </div>
              </button>
            `,
          )}
        </div>
      </o-modal>
    `;
  }

  public open() {
    this.modalEl?.open();
  }

  public close() {
    this.modalEl?.close();
  }

  private selectPattern(patternKey: string) {
    this.selectedPattern = patternKey;
    localStorage.setItem("territoryPattern", patternKey);
    this.updatePreview();
    this.close();
  }

  private updatePreview() {
    if (!this.previewButton || !this.selectedPattern) return;

    const pattern = territory_patterns.patterns[this.selectedPattern];
    if (!pattern) return;

    const fixedHeight = 48;
    const fixedWidth = 48;
    const cellCountX = pattern.tileWidth;
    const cellCountY = pattern.tileHeight;

    const cellSize = Math.min(
      fixedHeight / cellCountY,
      fixedWidth / cellCountX,
    );

    const previewHTML = html`
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: ${fixedHeight}px;
          width: ${fixedWidth}px;
          background-color: #f0f0f0;
          border-radius: 4px;
          box-sizing: border-box;
          overflow: hidden;
          position: relative;
        "
      >
        <div
          style="
            display: grid;
            grid-template-columns: repeat(${cellCountX}, ${cellSize}px);
            grid-template-rows: repeat(${cellCountY}, ${cellSize}px);
            background-color: #ccc;
            padding: 2px;
            border-radius: 4px;
          "
        >
          ${pattern.pattern.flat().map(
            (cell) => html`
              <div
                style="
                  background-color: ${cell === 1 ? "#000" : "transparent"};
                  border: 1px solid rgba(0, 0, 0, 0.1);
                  width: ${cellSize}px;
                  height: ${cellSize}px;
                  border-radius: 1px;
                "
              ></div>
            `,
          )}
        </div>
      </div>
    `;

    render(previewHTML, this.previewButton);
  }
}
