import {
  createGlass,
  browserEngine,
  Glass,
  GlassOptics,
  LIMITED,
  own,
} from "./engine";

// How a pane gets its glass:
// "copy": it sits right on the pond, so it holds an aligned copy of the pond and bends that. This
//   works in every browser.
// "backdrop": it floats over the page (the navbar, menus, dialogs), so it bends whatever is behind
//   it with backdrop-filter. Only Chromium can bend a backdrop; other browsers get frosted glass.
type Mode = "copy" | "backdrop";

interface PaneKind {
  selector: string;
  mode: Mode;
  optics: GlassOptics;
  // Frosted: the pane bends a blurred copy of the pond (liquid-glass.css), for panes full of text
  frost?: boolean;
}

interface Pane {
  el: HTMLElement;
  kind: PaneKind;
  layer: HTMLElement | null;
  lens: HTMLElement | null;
  glass: Glass | null;
  width: number;
  height: number;
  settle: number;
  resizing: boolean;
}

// Optics follow liquidglass.dev's starting values: panels bend the pond in a narrow rim and stay flat
// in the middle so text reads; the menu bar is a glass rod that lenses across its whole height.
// Native background anchoring keeps the pond fixed while panes scroll. Dense panes use a pond
// blurred ahead of time, and the few small showpiece controls get the colour fringe.
export const PANE_REFRACTION = 28;
const PANEL: GlassOptics = {
  refraction: PANE_REFRACTION,
  bezel: 0.3,
  curvature: 4,
  // Full-size text panes keep the same bend and rim with one displacement pass. The tiny colour
  // fringe otherwise needs three full-pane passes whenever content above the glass animates.
  chroma: 0,
  blur: 0,
  specular: 0.5,
  specularWidth: 2,
  mapScale: 1,
};
const DENSE: GlassOptics = { ...PANEL, refraction: 36, chroma: 0 };
const PILL: GlassOptics = {
  refraction: 16,
  bezel: 0.85,
  curvature: 3,
  chroma: 0.12,
  blur: 0,
  specular: 0.65,
  specularWidth: 1.5,
  mapScale: 1,
};
const ROD: GlassOptics = {
  refraction: 20,
  bezel: 1,
  curvature: 2.5,
  chroma: 0,
  blur: 0.5,
  specular: 0.9,
  specularWidth: 2.5,
  mapScale: 1,
};
// The library's menus: frosted, with a bright rim
const MENU: GlassOptics = {
  refraction: 22,
  bezel: 0.35,
  curvature: 3,
  chroma: 0,
  blur: 6,
  specular: 0.8,
  specularWidth: 2.5,
  mapScale: 1,
};
const SHEET: GlassOptics = { ...MENU, refraction: 26, bezel: 0.3, blur: 10 };

const KINDS: PaneKind[] = [
  { selector: ".navbar.bg-light", mode: "backdrop", optics: ROD },
  { selector: ".dropdown-menu", mode: "backdrop", optics: MENU },
  { selector: ".modal-content", mode: "backdrop", optics: SHEET },
  {
    selector: ".unofficial-schedule-warning",
    mode: "copy",
    optics: DENSE,
    frost: true,
  },
  { selector: ".department-cards > .card", mode: "copy", optics: PANEL },
  { selector: ".card", mode: "copy", optics: DENSE, frost: true },
  { selector: ".jumbotron", mode: "copy", optics: DENSE, frost: true },
  { selector: ".schedule-select", mode: "copy", optics: PILL },
  { selector: ".calendar", mode: "copy", optics: DENSE, frost: true },
  { selector: ".footer", mode: "copy", optics: DENSE, frost: true },
];
const COPY_SELECTOR = KINDS.filter((k) => k.mode === "copy")
  .map((k) => k.selector)
  .join(", ");
// A pane inside one of these sits on other glass or on page content, not on the pond
const NOT_ON_POND = `${COPY_SELECTOR}, .modal, .navbar, .dropdown-menu`;
const FALLBACK = "blur(16px) saturate(1.8)";
// Course cards grow and shrink as they open; their lens is redrawn once they hold still
const SETTLE_MS = 160;
// The panes of glass: cards, dialogs, menus and the menu bar
export class Panes {
  private panes = new Map<HTMLElement, Pane>();
  private visible = new Set<Pane>();
  private intersection: IntersectionObserver | null;
  private resize: ResizeObserver | null;
  private destroyed = false;
  // The Control Centre's refraction slider scales the panes' bend
  private refractionScale = 1;

  constructor() {
    this.intersection = new IntersectionObserver(
      (entries) => this.onIntersect(entries),
      { rootMargin: "60px 0px" }
    );
    this.resize = new ResizeObserver((entries) => this.onResize(entries));
  }

  destroy(): void {
    this.destroyed = true;
    // A disconnected IntersectionObserver would start again if anything called observe() on it
    this.intersection?.disconnect();
    this.resize?.disconnect();
    this.intersection = this.resize = null;
    this.panes.forEach((pane) => this.detach(pane));
    this.panes.clear();
  }

  scan(): void {
    if (this.destroyed) {
      return;
    }
    for (const kind of KINDS) {
      document.querySelectorAll<HTMLElement>(kind.selector).forEach((el) => {
        if (this.panes.has(el) || el.closest(".lg-glass")) {
          return;
        }
        if (kind.mode === "copy" && el.parentElement?.closest(NOT_ON_POND)) {
          return;
        }
        // A glass layer inside a scrolling pane (the semester menu) would scroll away with its
        // content, so those keep their frosted CSS background
        if (/auto|scroll/.test(getComputedStyle(el).overflowY)) {
          return;
        }
        const pane: Pane = {
          el,
          kind,
          layer: null,
          lens: null,
          glass: null,
          width: 0,
          height: 0,
          settle: 0,
          resizing: false,
        };
        this.panes.set(el, pane);
        if (kind.mode === "copy") {
          // Only panes near the screen get glass, so long pages stay smooth
          this.intersection?.observe(el);
        } else {
          this.attach(pane);
        }
      });
    }
    this.panes.forEach((pane, el) => {
      if (!el.isConnected) {
        this.intersection?.unobserve(el);
        this.detach(pane);
        this.panes.delete(el);
      }
    });
  }

  // 1 is the panes' own refraction; the Control Centre's slider moves it from 0 to about 1.7
  setRefractionScale(scale: number): void {
    this.refractionScale = scale;
    this.visible.forEach((pane) =>
      pane.glass?.update({ refraction: this.refractionOf(pane) })
    );
  }

  private refractionOf(pane: Pane): number {
    return (
      (pane.kind.optics.refraction ?? PANE_REFRACTION) * this.refractionScale
    );
  }

  private onIntersect(entries: IntersectionObserverEntry[]): void {
    // Measure every entering pane before inserting any layers. Alternating insertion and
    // offsetWidth reads forces the browser to lay out the page once for each pane.
    const boxes = new Map<
      Pane,
      { width: number; height: number; radius: number }
    >();
    for (const entry of entries) {
      const pane = this.panes.get(entry.target as HTMLElement);
      if (pane && entry.isIntersecting && !pane.layer) {
        boxes.set(pane, {
          width: pane.el.clientWidth,
          height: pane.el.clientHeight,
          radius:
            parseFloat(getComputedStyle(pane.el).borderTopLeftRadius) || 0,
        });
      }
    }
    for (const entry of entries) {
      const pane = this.panes.get(entry.target as HTMLElement);
      if (!pane) {
        continue;
      }
      if (entry.isIntersecting) {
        this.attach(pane, boxes.get(pane));
      } else {
        this.detach(pane);
      }
    }
  }

  private attach(
    pane: Pane,
    box?: { width: number; height: number; radius: number }
  ): void {
    if (pane.layer || this.destroyed) {
      return;
    }
    const { el, kind } = pane;
    const layer = own(document.createElement("span"));
    layer.className = "lg-glass";
    layer.setAttribute("aria-hidden", "true");
    const tint = document.createElement("span");
    tint.className = "lg-glass-tint";
    const radius =
      box?.radius ??
      (parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0);
    if (kind.mode === "copy") {
      const lens = document.createElement("span");
      lens.className = "lg-glass-lens";
      const copy = document.createElement("span");
      copy.className = "lg-glass-copy";
      lens.append(copy);
      layer.append(lens, tint);
      el.prepend(layer);
      pane.lens = lens;
      pane.width = box?.width ?? el.clientWidth;
      pane.height = box?.height ?? el.clientHeight;
      this.resize?.observe(el);
      this.visible.add(pane);
      this.fitLens(pane, radius);
    } else {
      layer.append(tint);
      el.prepend(layer);
      pane.lens = layer;
      pane.glass = createGlass(layer, {
        ...kind.optics,
        mode: "backdrop",
        fit: true,
        clip: true,
        radius,
        fallback: FALLBACK,
      });
    }
    pane.layer = layer;
    el.classList.add("lg-pane", `lg-pane-${kind.mode}`);
    if (kind.mode === "copy") {
      this.refreshLens(pane);
    }
    if (kind.frost) {
      el.classList.add("lg-pane-frost");
    }
    if (kind.mode === "backdrop" && browserEngine !== "blink") {
      el.classList.add("lg-pane-frosted");
    }
  }

  private detach(pane: Pane): void {
    if (!pane.layer) {
      return;
    }
    clearTimeout(pane.settle);
    this.resize?.unobserve(pane.el);
    pane.glass?.destroy();
    pane.layer.remove();
    pane.el.classList.remove(
      "lg-pane",
      "lg-pane-copy",
      "lg-pane-backdrop",
      "lg-pane-frost",
      "lg-pane-frosted",
      "lg-pane-rim",
      "lg-pane-flat"
    );
    pane.layer = pane.lens = null;
    pane.glass = null;
    pane.resizing = false;
    this.visible.delete(pane);
  }

  // Gives a pane on the pond its lens, or takes it away where the browser can't afford one
  private fitLens(pane: Pane, radius?: number): void {
    const lens = pane.lens;
    if (!lens) {
      return;
    }
    // WebKit/Gecko run SVG displacement on the CPU. Pick a steady pond + CSS rim once rather
    // than dropping/restoring a costly lens (and changing the visible image) on every swipe.
    const afford = !LIMITED;
    if (afford && !pane.glass) {
      pane.glass = createGlass(lens, {
        ...pane.kind.optics,
        refraction: this.refractionOf(pane),
        width: pane.width,
        height: pane.height,
        radius:
          radius ??
          (parseFloat(getComputedStyle(pane.el).borderTopLeftRadius) || 0),
        hidden: true,
      });
    } else if (!afford && pane.glass) {
      pane.glass.destroy();
      pane.glass = null;
    }
  }

  // Resizing can regenerate a lens; scrolling never changes its filter or background treatment.
  private refreshLens(pane: Pane): void {
    const lens = pane.lens;
    if (!lens) {
      return;
    }
    const flat = !pane.glass;
    lens.style.willChange = pane.resizing || flat ? "auto" : "";
    pane.glass?.update({
      hidden: pane.resizing,
      width: pane.width,
      height: pane.height,
    });
    pane.el.classList.toggle("lg-pane-rim", pane.resizing || flat);
    pane.el.classList.toggle("lg-pane-flat", flat);
    // A clip path clips the flat pane's fixed child without turning it into a local containing
    // block. The image stays anchored to the viewport, including on mobile Safari.
    if (pane.layer && flat) {
      const radius =
        parseFloat(getComputedStyle(pane.el).borderTopLeftRadius) || 0;
      pane.layer.style.clipPath = `inset(0 round ${radius}px)`;
    }
  }

  // A pane that changes size (a course card opening) drops its lens until it holds still, then
  // gets a lens drawn for its new size
  private onResize(entries: ResizeObserverEntry[]): void {
    const sizes = entries.map((entry) => ({
      entry,
      width: (entry.target as HTMLElement).clientWidth,
      height: (entry.target as HTMLElement).clientHeight,
    }));
    for (const { entry, width, height } of sizes) {
      const pane = this.panes.get(entry.target as HTMLElement);
      const lens = pane?.lens;
      if (!pane || !lens) {
        continue;
      }
      if (width === pane.width && height === pane.height) {
        continue;
      }
      pane.width = width;
      pane.height = height;
      pane.resizing = true;
      this.refreshLens(pane);
      clearTimeout(pane.settle);
      pane.settle = window.setTimeout(() => {
        pane.resizing = false;
        this.fitLens(pane);
        this.refreshLens(pane);
      }, SETTLE_MS);
    }
  }
}
