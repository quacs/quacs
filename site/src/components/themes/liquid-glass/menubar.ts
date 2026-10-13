import {
  createGlass,
  createSpring,
  element,
  Glass,
  own,
  OWN,
  place,
  Spring,
} from "./engine";
import { batteryIcon, icon } from "./icons";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
}

// The navbar as a macOS menu bar, built like liquidglass.dev's <lg-navbar>: a highlighted copy of
// the links (dark text on a white drop) sits over the real ones, clipped to a glass lens that slides
// to the link under the pointer and stretches as it moves. Status items sit on the right: a Control
// Centre button, Wi-Fi (offline shows it struck through), the battery where the browser reports it,
// and a clock. The bar is dark glass with white text over the pond, and light glass with dark text
// while a pane passes under it, the way the macOS menu bar follows the wallpaper.
export class MenuBar {
  private nav: HTMLElement | null = null;
  private copy: HTMLElement | null = null;
  private shadow: HTMLElement | null = null;
  private glass: Glass | null = null;
  private status: HTMLElement | null = null;
  private clock: HTMLElement | null = null;
  private wifi: HTMLElement | null = null;
  private battery: HTMLElement | null = null;
  private batteryManager: BatteryManager | null = null;
  private links: HTMLElement[] = [];
  private rects: Rect[] = [];
  private signature = "";
  private hovered: HTMLElement | null = null;
  private target: Rect | null = null;
  private xs: Spring;
  private ws: Spring;
  private velocity = 0;
  private resize: ResizeObserver;
  private wide = window.matchMedia("(min-width: 1200px)");
  private clockTimer = 0;
  private toneFrame = 0;
  private destroyed = false;

  constructor(
    private readonly options: {
      // The Control Centre button was pressed; gets the button, so the panel can sit under it
      onControlCentre: (button: HTMLElement) => void;
      military: () => boolean;
    }
  ) {
    this.xs = createSpring(
      0,
      (_, velocity) => {
        this.velocity = velocity;
        this.render();
      },
      { stiffness: 380, damping: 30 }
    );
    this.ws = createSpring(0, () => this.render(), {
      stiffness: 380,
      damping: 30,
    });
    this.resize = new ResizeObserver(() => this.sync());
    this.wide.addEventListener("change", this.sync);
    window.addEventListener("scroll", this.queueTone, { passive: true });
    window.addEventListener("resize", this.queueTone);
    window.addEventListener("online", this.updateWifi);
    window.addEventListener("offline", this.updateWifi);
    this.clockTimer = window.setInterval(() => this.updateClock(), 10000);
  }

  destroy(): void {
    this.destroyed = true;
    this.detachNav();
    this.resize.disconnect();
    this.wide.removeEventListener("change", this.sync);
    window.removeEventListener("scroll", this.queueTone);
    window.removeEventListener("resize", this.queueTone);
    window.removeEventListener("online", this.updateWifi);
    window.removeEventListener("offline", this.updateWifi);
    this.batteryManager?.removeEventListener("levelchange", this.updateBattery);
    this.batteryManager?.removeEventListener(
      "chargingchange",
      this.updateBattery
    );
    clearInterval(this.clockTimer);
    cancelAnimationFrame(this.toneFrame);
    this.xs.stop();
    this.ws.stop();
  }

  scan(): void {
    if (this.destroyed) {
      return;
    }
    const nav = document.querySelector<HTMLElement>(".navbar.bg-light");
    if (nav !== this.nav) {
      this.detachNav();
      if (nav) {
        this.attachNav(nav);
      }
    }
    this.sync();
    this.queueTone();
  }

  // The page changed: the highlight goes back to the current page's link
  onRoute(): void {
    this.hovered = null;
    this.sync();
    this.queueTone();
  }

  // The status bar's Control Centre button, so the panel can say whether it is open
  get controlCentreButton(): HTMLElement | null {
    return this.status?.querySelector<HTMLElement>(".lg-cc-toggle") ?? null;
  }

  updateClock(): void {
    if (!this.clock) {
      return;
    }
    const now = new Date();
    const day = now.toLocaleDateString(undefined, { weekday: "short" });
    const time = now.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: !this.options.military(),
    });
    this.clock.textContent = `${day} ${time}`;
    this.clock.setAttribute("datetime", now.toISOString());
  }

  private attachNav(nav: HTMLElement): void {
    this.nav = nav;
    nav.classList.add("lg-menubar");
    this.copy = own(
      element("span", "lg-nav-copy navbar-nav", { "aria-hidden": "true" })
    );
    this.shadow = own(
      element("span", "lg-nav-shadow", { "aria-hidden": "true" })
    );
    nav.append(this.shadow, this.copy);
    this.glass = createGlass(this.copy, {
      clip: true,
      hidden: true,
      refraction: 8,
      bezel: 0.6,
      curvature: 3,
      chroma: 0,
      specular: 0.7,
      specularWidth: 1.5,
    });
    this.buildStatus(nav);
    nav.addEventListener("pointerover", this.onOver);
    nav.addEventListener("pointerleave", this.onLeave);
    nav.addEventListener("focusin", this.onOver);
    nav.addEventListener("focusout", this.onLeave);
    this.resize.observe(nav);
  }

  private detachNav(): void {
    const nav = this.nav;
    if (!nav) {
      return;
    }
    this.resize.unobserve(nav);
    nav.removeEventListener("pointerover", this.onOver);
    nav.removeEventListener("pointerleave", this.onLeave);
    nav.removeEventListener("focusin", this.onOver);
    nav.removeEventListener("focusout", this.onLeave);
    nav.classList.remove("lg-menubar", "lg-menubar-light");
    this.glass?.destroy();
    this.copy?.remove();
    this.shadow?.remove();
    this.status?.remove();
    this.glass = null;
    this.copy = this.shadow = this.status = null;
    this.clock = this.wifi = this.battery = null;
    this.nav = null;
    this.signature = "";
    this.target = null;
  }

  private buildStatus(nav: HTMLElement): void {
    const status = own(element("span", "lg-menubar-status"));
    const cc = element("button", "lg-menubar-item lg-cc-toggle", {
      type: "button",
      "aria-label": "Control Centre",
      title: "Control Centre",
      "aria-expanded": "false",
      "aria-haspopup": "dialog",
    });
    cc.innerHTML = icon("control-centre");
    cc.addEventListener("click", () => this.options.onControlCentre(cc));
    const wifi = element("span", "lg-menubar-item lg-wifi", { role: "img" });
    const battery = element("span", "lg-menubar-item lg-battery", {
      role: "img",
    });
    battery.hidden = true;
    const clock = element("time", "lg-menubar-item lg-clock");
    status.append(cc, wifi, battery, clock);
    nav.append(status);
    this.status = status;
    this.wifi = wifi;
    this.battery = battery;
    this.clock = clock;
    this.updateWifi();
    this.updateClock();
    // Chromium reports the battery; elsewhere the icon stays hidden
    const getBattery = (
      navigator as Navigator & { getBattery?: () => Promise<BatteryManager> }
    ).getBattery;
    getBattery
      ?.call(navigator)
      .then((manager) => {
        if (this.destroyed) {
          return;
        }
        this.batteryManager = manager;
        manager.addEventListener("levelchange", this.updateBattery);
        manager.addEventListener("chargingchange", this.updateBattery);
        this.updateBattery();
      })
      .catch(() => {
        // No battery to show
      });
  }

  private updateWifi = (): void => {
    if (!this.wifi) {
      return;
    }
    const online = navigator.onLine;
    this.wifi.innerHTML = icon(online ? "wifi" : "wifi-off");
    const label = online ? "Online" : "Offline";
    this.wifi.setAttribute("aria-label", label);
    this.wifi.title = label;
  };

  private updateBattery = (): void => {
    const manager = this.batteryManager;
    if (!this.battery || !manager) {
      return;
    }
    const percent = Math.round(manager.level * 100);
    this.battery.innerHTML = batteryIcon(manager.level);
    const label = `Battery ${percent}%${manager.charging ? ", charging" : ""}`;
    this.battery.setAttribute("aria-label", label);
    this.battery.title = label;
    this.battery.hidden = false;
  };

  // Lines the highlighted copy up with the links. The copy is rebuilt only when a link's text or
  // place changes, so rebuilding never triggers another rebuild.
  private sync = (): void => {
    const nav = this.nav;
    if (!nav || !this.copy) {
      return;
    }
    if (!this.wide.matches) {
      this.links = [];
      this.rects = [];
      this.signature = "";
      this.copy.replaceChildren();
      this.goTo(null);
      return;
    }
    const box = nav.getBoundingClientRect();
    const links = [
      ...nav.querySelectorAll<HTMLElement>(".navbar-nav .nav-link"),
    ].filter(
      (link) =>
        !link.classList.contains("disabled") &&
        !link.closest(`[${OWN}]`) &&
        link.getClientRects().length > 0
    );
    const rects = links.map((link) => {
      const r = link.getBoundingClientRect();
      return {
        x: r.left - box.left,
        y: r.top - box.top,
        w: r.width,
        h: r.height,
      };
    });
    const signature = links
      .map(
        (link, i) =>
          `${link.textContent}@${Math.round(rects[i].x)},${Math.round(
            rects[i].y
          )},${Math.round(rects[i].w)},${Math.round(rects[i].h)}`
      )
      .join("|");
    this.links = links;
    this.rects = rects;
    if (signature !== this.signature) {
      this.signature = signature;
      this.copy.replaceChildren(
        ...links.map((link, i) => this.cloneLink(link, rects[i]))
      );
    }
    this.goTo(this.hovered ?? this.restingLink(), !this.target);
  };

  private cloneLink(link: HTMLElement, rect: Rect): HTMLElement {
    const clone = link.cloneNode(true) as HTMLElement;
    // The copy is only drawn, so it keeps none of the link's ids, behavior or hooks (test
    // selectors like svg[data-icon=cog] and data-cy must still find just the real link)
    for (const node of [clone, ...clone.querySelectorAll<HTMLElement>("*")]) {
      for (const name of [
        "id",
        "href",
        "role",
        "aria-expanded",
        "aria-haspopup",
        "tabindex",
        "title",
        "data-cy",
        "data-icon",
        "data-prefix",
      ]) {
        node.removeAttribute(name);
      }
    }
    clone.classList.remove("active");
    clone.classList.add("lg-nav-copy-link");
    clone.style.cssText = `position:absolute;left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px;margin:0`;
    return clone;
  }

  // Where the highlight rests: an open menu's title, or the current page's link
  private restingLink(): HTMLElement | null {
    return (
      this.links.find(
        (link) =>
          link.getAttribute("aria-expanded") === "true" ||
          link.classList.contains("active")
      ) ?? null
    );
  }

  private goTo(link: HTMLElement | null, immediate = false): void {
    const i = link ? this.links.indexOf(link) : -1;
    const rect = i >= 0 ? this.rects[i] : null;
    const wasShown = !!this.target;
    this.target = rect;
    if (!rect) {
      this.render();
      return;
    }
    this.xs.set(rect.x, { immediate: immediate || !wasShown });
    this.ws.set(rect.w, { immediate: immediate || !wasShown });
    this.render();
  }

  private render(): void {
    const glass = this.glass;
    const shadow = this.shadow;
    if (!glass || !shadow) {
      return;
    }
    const target = this.target;
    if (!target) {
      glass.update({ hidden: true });
      shadow.style.opacity = "0";
      return;
    }
    const stretch = Math.min(14, Math.abs(this.velocity) * 0.025);
    const w = this.ws.value + stretch;
    const h = target.h - stretch * 0.2;
    const x = this.xs.value - stretch / 2;
    const y = target.y + (target.h - h) / 2;
    glass.update({ hidden: false, x, y, width: w, height: h, radius: h / 2 });
    place(shadow, x, y, w, h, h / 2);
    shadow.style.opacity = "1";
  }

  private onOver = (event: Event): void => {
    const link = (event.target as Element).closest<HTMLElement>(".nav-link");
    if (link && this.links.includes(link)) {
      this.hovered = link;
      this.goTo(link);
    }
  };

  private onLeave = (event: Event): void => {
    const next = (event as FocusEvent).relatedTarget as Node | null;
    if (event.type === "focusout" && next && this.nav?.contains(next)) {
      return;
    }
    this.hovered = null;
    this.goTo(this.restingLink());
  };

  private queueTone = (): void => {
    if (!this.toneFrame && !this.destroyed) {
      this.toneFrame = requestAnimationFrame(this.updateTone);
    }
  };

  // Light glass and dark text while a pane is behind the bar, dark glass and white text over the pond
  private updateTone = (): void => {
    this.toneFrame = 0;
    const nav = this.nav;
    if (!nav) {
      return;
    }
    const box = nav.getBoundingClientRect();
    const y = box.top + box.height / 2;
    const overPane = [0.12, 0.5, 0.88].some((share) => {
      const behind = document
        .elementsFromPoint(box.left + box.width * share, y)
        .find((el) => !nav.contains(el) && !el.closest(`[${OWN}]`));
      return !!behind?.closest(".lg-pane-copy, .modal-content");
    });
    nav.classList.toggle("lg-menubar-light", overPane);
  };
}
