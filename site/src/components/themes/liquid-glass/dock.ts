import { element, own } from "./engine";
import { discordIcon, githubIcon, icon } from "./icons";

interface App {
  id: string;
  label: string;
  // The page the app stands for, so it gets the running dot while that page is open
  path?: string;
  run: () => void;
  glyph: () => string;
}

// A macOS Dock along the bottom of the screen, built from liquidglass.dev's <lg-dock>: a glass shelf
// whose lens magnifies the app under the pointer. The apps are QuACS's pages and links. The Calendar
// app shows today's date, the way the macOS one does, and the open page's app gets a dot under it.
export class Dock {
  private wrap: HTMLElement;
  private tip: HTMLElement;
  private buttons = new Map<string, HTMLElement>();
  private dayTimer = 0;

  constructor(
    container: HTMLElement,
    actions: {
      go: (path: string) => void;
      search: () => void;
      settings: () => void;
    }
  ) {
    const apps: App[] = [
      {
        id: "courses",
        label: "Courses",
        path: "/",
        run: () => actions.go("/"),
        glyph: () => icon("graduation-cap", "lg-app-glyph"),
      },
      {
        id: "calendar",
        label: "Schedule",
        path: "/schedule",
        run: () => actions.go("/schedule"),
        glyph: () => this.calendarFace(),
      },
      {
        id: "prerequisites",
        label: "Prerequisites",
        path: "/prerequisites",
        run: () => actions.go("/prerequisites"),
        glyph: () => icon("prerequisites", "lg-app-glyph"),
      },
      {
        id: "search",
        label: "Search Courses",
        run: actions.search,
        glyph: () => icon("search", "lg-app-glyph"),
      },
      {
        id: "settings",
        label: "Settings",
        run: actions.settings,
        glyph: () => icon("settings", "lg-app-glyph"),
      },
    ];
    const links: App[] = [
      {
        id: "discord",
        label: "QuACS Discord",
        run: () =>
          window.open("https://discord.gg/yXaHkwU", "_blank", "noopener"),
        glyph: () => discordIcon("lg-app-glyph"),
      },
      {
        id: "github",
        label: "QuACS on GitHub",
        run: () =>
          window.open("https://github.com/quacs/quacs", "_blank", "noopener"),
        glyph: () => githubIcon("lg-app-glyph"),
      },
    ];

    this.wrap = own(element("div", "lg-dock-wrap"));
    const dock = element("lg-dock", "lg-quacs-dock", { "aria-label": "Dock" });
    // A tap also focuses its button. Do not turn that into the library's mouse-hover lens:
    // its spring regenerates a displacement PNG every frame, right as navigation starts.
    // Native focus/click behavior and the keyboard's visible focus highlight still work.
    dock.addEventListener(
      "focusin",
      (event) => {
        if (
          event.target instanceof Element &&
          !event.target.matches(":focus-visible")
        ) {
          event.stopPropagation();
        }
      },
      true
    );
    dock.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType === "touch") {
          event.stopPropagation();
        }
      },
      true
    );
    for (const app of apps) {
      dock.append(this.button(app));
    }
    dock.append(element("span", "lg-dock-divider", { "aria-hidden": "true" }));
    for (const app of links) {
      dock.append(this.button(app));
    }
    this.tip = element("span", "lg-dock-tip", { "aria-hidden": "true" });
    this.wrap.append(dock, this.tip);
    container.append(this.wrap);
    // The date on the Calendar app turns over at midnight
    this.dayTimer = window.setInterval(() => this.refreshCalendar(), 60000);
  }

  destroy(): void {
    clearInterval(this.dayTimer);
    this.wrap.remove();
  }

  // Puts the running dot under the app for the open page
  setPath(path: string): void {
    this.buttons.forEach((button, id) => {
      const running =
        (id === "courses" &&
          (path === "/" || path.startsWith("/department"))) ||
        (id === "calendar" && path === "/schedule") ||
        (id === "prerequisites" && path === "/prerequisites");
      button.classList.toggle("lg-app-running", running);
    });
  }

  private button(app: App): HTMLElement {
    const button = element("button", `lg-app lg-app-${app.id}`, {
      type: "button",
      "aria-label": app.label,
    });
    button.innerHTML = app.glyph();
    button.addEventListener("click", app.run);
    button.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch") {
        this.showTip(button, app.label);
      }
    });
    button.addEventListener("focus", () => {
      if (button.matches(":focus-visible")) {
        this.showTip(button, app.label);
      }
    });
    button.addEventListener("pointerleave", this.hideTip);
    button.addEventListener("blur", this.hideTip);
    this.buttons.set(app.id, button);
    return button;
  }

  private calendarFace(): string {
    const now = new Date();
    const day = now
      .toLocaleDateString(undefined, { weekday: "short" })
      .toUpperCase();
    return `<span class="lg-cal-day">${day}</span><span class="lg-cal-date">${now.getDate()}</span>`;
  }

  private refreshCalendar(): void {
    const button = this.buttons.get("calendar");
    if (button) {
      const face = this.calendarFace();
      if (button.innerHTML !== face) {
        button.innerHTML = face;
      }
    }
  }

  // The app's name in a little label above it, like the macOS Dock. It lives outside the dock,
  // because the dock's magnifier clips whatever is inside it to the shelf.
  private showTip(button: HTMLElement, label: string): void {
    const shelf = this.wrap.getBoundingClientRect();
    const box = button.getBoundingClientRect();
    this.tip.textContent = label;
    this.tip.style.left = `${box.left + box.width / 2 - shelf.left}px`;
    this.tip.classList.add("lg-dock-tip-shown");
  }

  private hideTip = (): void => {
    this.tip.classList.remove("lg-dock-tip-shown");
  };
}
