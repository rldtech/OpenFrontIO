import { LitElement, css, html } from "lit";
import { customElement, query } from "lit/decorators.js";
import { translateText } from "../client/Utils";
import "./components/baseComponents/Button";
import "./components/baseComponents/Modal";

@customElement("news-modal")
export class NewsModal extends LitElement {
  @query("o-modal") private modalEl!: HTMLElement & {
    open: () => void;
    close: () => void;
  };

  static styles = css`
    .news-container {
      max-height: 60vh;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .news-content {
      color: #ddd;
      line-height: 1.5;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 1rem;
    }
  `;

  render() {
    return html`
      <o-modal title=${translateText("news.title")}>
        <div class="options-layout">
          <div class="options-section">
            <div class="news-container">
              <div class="news-content">
                <h3>Combat Mechanics Update</h3>
                <p>
                  Attack speed is influenced by the size of the attacking army,
                  terrain type, defender strength, and presence of a defense
                  post. Defender losses are based on their troop density (as
                  shown by the shield), while attacker losses are proportional
                  to defender losses and further affected by terrain, defense
                  posts, and whether the defender is a traitor.
                </p>
                <p>
                  The shield icon represents density: number of Troops per tile.
                </p>
              </div>
            </div>
          </div>
        </div>

        <o-button
          title=${translateText("common.close")}
          @click=${this.close}
          blockDesktop
        ></o-button>
      </o-modal>
    `;
  }

  public open() {
    this.requestUpdate();
    this.modalEl?.open();
  }

  private close() {
    this.modalEl?.close();
  }

  createRenderRoot() {
    return this; // light DOM
  }
}
