export class UserSettings {
  private cache: Record<string, boolean>;

  constructor() {
    this.cache = {
      emojis: this.getFromStorage("settings.emojis", true),
      anonymousNames: this.getFromStorage("settings.anonymousNames", false),
      specialEffects: this.getFromStorage("settings.specialEffects", true),
      darkMode: this.getFromStorage("settings.darkMode", false),
      leftClickOpensMenu: this.getFromStorage(
        "settings.leftClickOpensMenu",
        false,
      ),
      focusLocked: this.getFromStorage("settings.focusLocked", true),
    };
  }

  private getFromStorage(key: string, defaultValue: boolean): boolean {
    const value = localStorage.getItem(key);
    if (value === "true") return true;
    if (value === "false") return false;
    return defaultValue;
  }

  private setToStorage(key: string, value: boolean) {
    localStorage.setItem(key, value ? "true" : "false");
  }

  emojis() {
    return this.cache.emojis;
  }
  anonymousNames() {
    return this.cache.anonymousNames;
  }
  fxLayer() {
    return this.cache.specialEffects;
  }
  darkMode() {
    return this.cache.darkMode;
  }
  leftClickOpensMenu() {
    return this.cache.leftClickOpensMenu;
  }
  focusLocked() {
    return false;
  } // Keep disabled if buggy

  toggleLeftClickOpenMenu() {
    this.cache.leftClickOpensMenu = !this.cache.leftClickOpensMenu;
    this.setToStorage(
      "settings.leftClickOpensMenu",
      this.cache.leftClickOpensMenu,
    );
  }

  toggleFocusLocked() {
    this.cache.focusLocked = !this.cache.focusLocked;
    this.setToStorage("settings.focusLocked", this.cache.focusLocked);
  }

  toggleEmojis() {
    this.cache.emojis = !this.cache.emojis;
    this.setToStorage("settings.emojis", this.cache.emojis);
  }

  toggleRandomName() {
    this.cache.anonymousNames = !this.cache.anonymousNames;
    this.setToStorage("settings.anonymousNames", this.cache.anonymousNames);
  }

  toggleFxLayer() {
    this.cache.specialEffects = !this.cache.specialEffects;
    this.setToStorage("settings.specialEffects", this.cache.specialEffects);
  }

  toggleDarkMode() {
    this.cache.darkMode = !this.cache.darkMode;
    this.setToStorage("settings.darkMode", this.cache.darkMode);
    if (this.cache.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
  setEmojis(value: boolean) {
    this.cache.emojis = value;
    this.setToStorage("settings.emojis", value);
  }

  setAnonymousNames(value: boolean) {
    this.cache.anonymousNames = value;
    this.setToStorage("settings.anonymousNames", value);
  }

  setFxLayer(value: boolean) {
    this.cache.specialEffects = value;
    this.setToStorage("settings.specialEffects", value);
  }

  setDarkMode(value: boolean) {
    this.cache.darkMode = value;
    this.setToStorage("settings.darkMode", value);
    if (value) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  setLeftClickOpensMenu(value: boolean) {
    this.cache.leftClickOpensMenu = value;
    this.setToStorage("settings.leftClickOpensMenu", value);
  }
}
export const userSettings = new UserSettings();
