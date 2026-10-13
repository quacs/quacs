import { element, own } from "./engine";
import { icon } from "./icons";
import { PANE_REFRACTION } from "./panes";

// The parts of the QuACS store the Control Centre reads and changes
export interface QuacsStore {
  state: {
    settings: { timePreference: string; hidePrerequisites: boolean };
    prerequisites: { enableChecking: boolean };
  };
  commit(type: string, payload?: unknown): void;
}

interface SwitchElement extends HTMLElement {
  checked: boolean;
}

interface SliderElement extends HTMLElement {
  readonly value: number;
}

const REFRACTION_KEY = "liquid-glass-refraction";
const GLASS_KEY = "liquid-glass-glass";
const GLASS_ATTRIBUTE = "data-lg-glass";

function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function save(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // Storage can be blocked; the choice then lasts until the page reloads
  }
}

// The macOS Control Centre, opened from the menu bar: a dark glass panel (liquidglass.dev's
// <lg-panel>) of the library's own controls. Its switches are real QuACS settings; the slider sets
// how far the panes bend the pond, and Clear or Tinted glass picks how much the panes frost over,
// like the Liquid Glass setting iOS 26.1 added.
export class ControlCentre {
  private panel: HTMLElement;
  private time: SwitchElement;
  private checking: SwitchElement;
  private hide: SwitchElement;
  private readout: HTMLElement;
  private button: HTMLElement | null = null;
  private open = false;
  private closeTimer = 0;

  constructor(
    container: HTMLElement,
    private readonly store: QuacsStore,
    private readonly onRefraction: (px: number) => void
  ) {
    const state = store.state;
    this.panel = own(
      element("lg-panel", "lg-cc", {
        radius: "24",
        // Frosted more than the library's panels, since it floats over text
        blur: "14",
        role: "dialog",
        "aria-label": "Control Centre",
      })
    );
    this.panel.hidden = true;
    const title = element("div", "lg-cc-title");
    title.textContent = "Control Centre";
    const rows = element("div", "lg-cc-rows");
    this.time = this.switch(
      "clock",
      "24-Hour Time",
      state.settings.timePreference === "M",
      (on) => store.commit("settings/setTimePreference", on ? "M" : "S")
    );
    this.checking = this.switch(
      "check-circle",
      "Check Prerequisites",
      state.prerequisites.enableChecking,
      (on) => store.commit("prerequisites/togglePrerequisiteChecking", on)
    );
    this.hide = this.switch(
      "eye-off",
      "Hide Unmet Prerequisites",
      state.settings.hidePrerequisites,
      (on) => store.commit("settings/toggleHiddenPrerequisites", on)
    );
    rows.append(this.time, this.checking, this.hide);

    const px = this.storedRefraction();
    const refractionLabel = element("div", "lg-cc-label");
    const refractionName = element("span", "");
    refractionName.textContent = "Refraction";
    this.readout = element("span", "lg-cc-value");
    refractionLabel.append(refractionName, this.readout);
    const slider = element("lg-slider", "lg-cc-slider", {
      min: "0",
      max: "48",
      value: String(px),
      label: "Refraction",
    }) as SliderElement;
    slider.addEventListener("input", () => this.setRefraction(slider.value));

    const glassLabel = element("div", "lg-cc-label");
    const glassName = element("span", "");
    glassName.textContent = "Glass";
    glassLabel.append(glassName);
    const tinted = load(GLASS_KEY) === "tinted";
    const glass = element("lg-segmented", "lg-cc-segmented", {
      label: "Glass",
      value: tinted ? "tinted" : "clear",
    });
    for (const [value, text] of [
      ["clear", "Clear"],
      ["tinted", "Tinted"],
    ]) {
      const option = element("button", "", { value });
      option.textContent = text;
      glass.append(option);
    }
    glass.addEventListener("change", (event) => {
      const value = (event as CustomEvent<{ value: string }>).detail.value;
      this.setGlass(value === "tinted");
      save(GLASS_KEY, value);
    });

    this.panel.append(title, rows, refractionLabel, slider, glassLabel, glass);
    container.append(this.panel);
    this.setRefraction(px, false);
    this.setGlass(tinted);
    this.sync();
  }

  destroy(): void {
    this.close();
    clearTimeout(this.closeTimer);
    this.panel.remove();
    document.documentElement.removeAttribute(GLASS_ATTRIBUTE);
  }

  // The store changed (here or elsewhere): the switches follow it
  sync(): void {
    const state = this.store.state;
    this.time.checked = state.settings.timePreference === "M";
    this.checking.checked = state.prerequisites.enableChecking;
    this.hide.checked = state.settings.hidePrerequisites;
    // Hiding courses needs prerequisite checking, as in Settings
    this.hide.toggleAttribute("disabled", !state.prerequisites.enableChecking);
  }

  toggle(button: HTMLElement): void {
    this.button = button;
    if (this.open) {
      this.close();
    } else {
      this.show();
    }
  }

  close = (): void => {
    if (!this.open) {
      return;
    }
    this.open = false;
    this.panel.classList.remove("lg-cc-open");
    this.button?.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", this.onOutside, true);
    document.removeEventListener("keydown", this.onKey);
    this.closeTimer = window.setTimeout(() => {
      this.panel.hidden = true;
    }, 220);
  };

  private show(): void {
    const anchor =
      document.querySelector<HTMLElement>(".navbar.bg-light") ?? this.button;
    if (anchor) {
      const box = anchor.getBoundingClientRect();
      this.panel.style.top = `${box.bottom + 10}px`;
      this.panel.style.right = `${Math.max(
        12,
        document.documentElement.clientWidth - box.right
      )}px`;
    }
    clearTimeout(this.closeTimer);
    this.panel.hidden = false;
    requestAnimationFrame(() => this.panel.classList.add("lg-cc-open"));
    this.open = true;
    this.button?.setAttribute("aria-expanded", "true");
    document.addEventListener("pointerdown", this.onOutside, true);
    document.addEventListener("keydown", this.onKey);
    this.sync();
  }

  private onOutside = (event: Event): void => {
    const target = event.target as Node;
    if (!this.panel.contains(target) && !this.button?.contains(target)) {
      this.close();
    }
  };

  private onKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      this.close();
      this.button?.focus();
    }
  };

  private switch(
    iconName: string,
    text: string,
    checked: boolean,
    onChange: (on: boolean) => void
  ): SwitchElement {
    const sw = element(
      "lg-switch",
      "",
      checked ? { checked: "" } : {}
    ) as SwitchElement;
    sw.innerHTML = `${icon(iconName)}<span>${text}</span>`;
    sw.addEventListener("change", () => onChange(sw.checked));
    return sw;
  }

  private storedRefraction(): number {
    const stored = Number(load(REFRACTION_KEY));
    return load(REFRACTION_KEY) !== null && stored >= 0 && stored <= 48
      ? stored
      : PANE_REFRACTION;
  }

  private setRefraction(px: number, remember = true): void {
    this.readout.textContent = `${px} px`;
    this.onRefraction(px);
    if (remember) {
      save(REFRACTION_KEY, String(px));
    }
  }

  private setGlass(tinted: boolean): void {
    if (tinted) {
      document.documentElement.setAttribute(GLASS_ATTRIBUTE, "tinted");
    } else {
      document.documentElement.removeAttribute(GLASS_ATTRIBUTE);
    }
  }
}
