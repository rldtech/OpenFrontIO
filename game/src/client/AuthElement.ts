import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { consolex } from "../core/Consolex";

interface UserData {
  loggedIn: boolean;
  discordId?: string;
  metadata?: {
    username: string;
    avatar: string;
    lastLogin: string;
  };
}

@customElement("auth-element")
export class AuthElement extends LitElement {
  @state() private userData: UserData | null = null;
  @state() private loading: boolean = true;

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.checkUserStatus();
  }

  private async checkUserStatus(): Promise<void> {
    try {
      const response = await fetch("/api/user");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.userData = data.loggedIn ? data : null;
    } catch (error) {
      consolex.error("Error checking user status:", error);
      this.userData = null;
    } finally {
      this.loading = false;
    }
  }

  render() {
    if (this.loading) {
      return html`
        <div
          class="max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto mt-4 flex justify-center"
        >
          <div class="text-lg">Loading...</div>
        </div>
      `;
    }

    if (!this.userData) {
      return html`
        <div class="max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto mt-4">
          <a
            href="/auth/discord"
            class="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white p-3 sm:p-4 lg:p-5 font-medium text-lg sm:text-xl lg:text-2xl rounded-lg border-none cursor-pointer transition-colors duration-300 flex justify-center"
          >
            Login with Discord
          </a>
        </div>
      `;
    }

    const { metadata } = this.userData;
    const lastLoginDate = new Date(metadata.lastLogin).toLocaleDateString();

    return html`
      <div class="max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto mt-4">
        <div
          class="w-full p-4 md:p-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl"
        >
          <div class="flex items-center gap-4">
            ${metadata.avatar
              ? html`
                  <img
                    src="https://cdn.discordapp.com/avatars/${this.userData
                      .discordId}/${metadata.avatar}.png"
                    alt="Profile"
                    class="w-12 h-12 rounded-full"
                  />
                `
              : ""}
            <div class="flex flex-col">
              <div class="text-lg font-semibold">
                Welcome, ${metadata.username}!
              </div>
              <div class="text-sm text-blue-100">
                Last login: ${lastLoginDate}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
