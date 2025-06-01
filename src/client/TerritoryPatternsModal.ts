import type { TemplateResult } from "lit";
import { html, LitElement, render } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { UserMeResponse } from "../core/ApiSchemas";
import "./components/Difficulties";
import "./components/Maps";
import {
  PatternDecoder,
  territoryPatterns,
  TerritoryPatternStorage,
} from "./TerritoryPatterns";

@customElement("territory-patterns-modal")
export class TerritoryPatternsModal extends LitElement {
  @query("o-modal") private modalEl!: HTMLElement & {
    open: () => void;
    close: () => void;
  };

  @query("#territory-patterns-input-preview-button")
  private previewButton!: HTMLElement;

  @state() private selectedPattern =
    TerritoryPatternStorage.getSelectedPattern();

  @state() private buttonWidth: number = 100;

  @state() private lockedPatterns: string[] = [];
  @state() private lockedReasons: Record<string, string> = {};
  @state() private hoveredPattern: string | null = null;
  @state() private hoverPosition = { x: 0, y: 0 };

  @state() private roles: string[] = [];

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

  onUserMe(userMeResponse: UserMeResponse) {
    const { user, player } = userMeResponse;
    if (player) {
      const { publicId, roles } = player;
      if (roles) {
        this.roles = roles;
      }
    }
    this.requestUpdate();
  }

  private checkPatternPermission(roles: string[]) {
    const patterns = territoryPatterns.pattern ?? {};

    for (const [key, patternData] of Object.entries(patterns)) {
      const roleGroup: string[] | string | undefined = patternData.role_group;

      if (!roleGroup || (Array.isArray(roleGroup) && roleGroup.length === 0))
        continue;

      const groupList = Array.isArray(roleGroup) ? roleGroup : [roleGroup];

      if (groupList.includes("all")) {
        continue; // Allow all users
      }

      const isAllowed = groupList.some((required) => roles.includes(required));

      if (!isAllowed) {
        let reason: string;

        if (groupList.includes("donor")) {
          reason =
            "This pattern is available only to donors (money haters or early access supporters).";
        } else if (groupList.includes("staff")) {
          reason = "This pattern is available only to moderators and above.";
        } else {
          reason = `This pattern is available only to specific roles. (${groupList.join(", ")})`;
        }

        this.setLockedPatterns([key], reason);
      }
    }
  }

  createRenderRoot() {
    return this;
  }

  render() {
    this.resetLockedPatterns();
    this.checkPatternPermission(this.roles);
    return html`
      ${this.hoveredPattern && this.lockedReasons[this.hoveredPattern]
        ? html`
            <div
              class="fixed z-[10000] px-3 py-2 rounded bg-black text-white text-sm pointer-events-none shadow-md"
              style="top: ${this.hoverPosition.y + 12}px; left: ${this
                .hoverPosition.x + 12}px;"
            >
              ${this.lockedReasons[this.hoveredPattern]}
            </div>
          `
        : null}
      <o-modal id="territoryPatternsModal" title="Select Territory Pattern">
        <div
          class="flex flex-wrap gap-4 p-2"
          style="justify-content: center; align-items: flex-start;"
        >
          ${Object.entries(territoryPatterns.pattern ?? {}).map(
            ([key, pattern]) => {
              const isLocked = this.isPatternLocked(key);
              const reason = this.lockedReasons[key] || "Locked";

              return html`
                <button
                  class="border p-2 rounded-lg shadow text-black dark:text-white text-left
                  ${this.selectedPattern === key
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"}
                  ${isLocked ? "opacity-50 cursor-not-allowed" : ""}"
                  style="flex: 0 1 calc(25% - 1rem); max-width: calc(25% - 1rem);"
                  @click=${() => !isLocked && this.selectPattern(key)}
                  @mouseenter=${(e: MouseEvent) =>
                    this.handleMouseEnter(key, e)}
                  @mousemove=${(e: MouseEvent) => this.handleMouseMove(e)}
                  @mouseleave=${() => this.handleMouseLeave()}
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
                      const decoder = new PatternDecoder(pattern.pattern);
                      const cellCountX = decoder.getTileWidth();
                      const cellCountY = decoder.getTileHeight();
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
                          ${(() => {
                            const tiles: TemplateResult[] = [];
                            for (let py = 0; py < cellCountY; py++) {
                              for (let px = 0; px < cellCountX; px++) {
                                const x = px * decoder.getScale();
                                const y = py * decoder.getScale();
                                const bit = decoder.isSet(x, y);
                                tiles.push(html`
                                  <div
                                    style="
                                    background-color: ${bit
                                      ? "#000"
                                      : "transparent"};
                                    border: 1px solid rgba(0, 0, 0, 0.1);
                                    width: ${cellSize}px;
                                    height: ${cellSize}px;
                                    border-radius: 1px;
                                  "
                                  ></div>
                                `);
                              }
                            }
                            return tiles;
                          })()}
                        </div>
                      `;
                    })()}
                  </div>
                </button>
              `;
            },
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
    TerritoryPatternStorage.setSelectedPattern(patternKey);
    const base64 = territoryPatterns.pattern[patternKey];
    if (base64) {
      TerritoryPatternStorage.setSelectedPatternBase64(base64.pattern);
    }
    this.updatePreview();
    this.close();
  }

  private updatePreview() {
    if (!this.previewButton) return;

    const pattern = this.selectedPattern
      ? territoryPatterns.pattern[this.selectedPattern]
      : null;
    if (!pattern) {
      const blankPreview = html`
        <div
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            height: 48px;
            width: 48px;
            background-color: #ffffff;
            border-radius: 4px;
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
            border: 1px solid #ccc;
          "
        >
          <div
            style="display: grid; grid-template-columns: repeat(2, 24px); grid-template-rows: repeat(2, 24px);"
          >
            <div
              style="background-color: #fff; border: 1px solid rgba(0, 0, 0, 0.1); width: 24px; height: 24px;"
            ></div>
            <div
              style="background-color: #fff; border: 1px solid rgba(0, 0, 0, 0.1); width: 24px; height: 24px;"
            ></div>
            <div
              style="background-color: #fff; border: 1px solid rgba(0, 0, 0, 0.1); width: 24px; height: 24px;"
            ></div>
            <div
              style="background-color: #fff; border: 1px solid rgba(0, 0, 0, 0.1); width: 24px; height: 24px;"
            ></div>
          </div>
        </div>
      `;
      render(blankPreview, this.previewButton);
      return;
    }

    const fixedHeight = 48;
    const fixedWidth = 48;
    const decoder = new PatternDecoder(pattern.pattern);
    const cellCountX = decoder.getTileWidth();
    const cellCountY = decoder.getTileHeight();

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
          ${(() => {
            const tiles: TemplateResult[] = [];
            for (let py = 0; py < cellCountY; py++) {
              for (let px = 0; px < cellCountX; px++) {
                const x = px * decoder.getScale();
                const y = py * decoder.getScale();
                const bit = decoder.isSet(x, y);
                tiles.push(html`
                  <div
                    style="
                      background-color: ${bit ? "#000" : "transparent"};
                      border: 1px solid rgba(0, 0, 0, 0.1);
                      width: ${cellSize}px;
                      height: ${cellSize}px;
                      border-radius: 1px;
                    "
                  ></div>
                `);
              }
            }
            return tiles;
          })()}
        </div>
      </div>
    `;

    render(previewHTML, this.previewButton);
  }

  private setLockedPatterns(lockedPatterns: string[], reason: string) {
    this.lockedPatterns.push(...lockedPatterns);
    for (const key of lockedPatterns) {
      this.lockedReasons[key] = reason;
    }
  }

  private resetLockedPatterns() {
    this.lockedPatterns = [];
    this.lockedReasons = {};
  }

  private isPatternLocked(patternKey: string): boolean {
    return this.lockedPatterns.includes(patternKey);
  }

  private handleMouseEnter(patternKey: string, event: MouseEvent) {
    if (this.isPatternLocked(patternKey)) {
      this.hoveredPattern = patternKey;
      this.hoverPosition = { x: event.clientX, y: event.clientY };
    }
  }

  private handleMouseMove(event: MouseEvent) {
    if (this.hoveredPattern) {
      this.hoverPosition = { x: event.clientX, y: event.clientY };
    }
  }

  private handleMouseLeave() {
    this.hoveredPattern = null;
  }
}
