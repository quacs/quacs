import { browserEngine, element, own } from "./engine";

// One prepainted light moves on its own compositing layer. Updating inherited CSS variables on
// a pane instead invalidates its entire subtree, including the expensive refracted background.
export class PointerLight {
  private light = own(
    element("span", "lg-pointer-light", { "aria-hidden": "true" })
  );
  private glow = element("span", "lg-pointer-glow");
  private host: HTMLElement | null = null;
  private rect: DOMRect | null = null;
  private point: {
    x: number;
    y: number;
    target: EventTarget | null;
  } | null = null;
  private frame = 0;
  private settle = 0;
  private resize = new ResizeObserver(() => {
    this.rect = null;
  });

  constructor() {
    this.light.append(this.glow);
    document.addEventListener("pointermove", this.onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.hide);
    window.addEventListener("scroll", this.onScroll, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", this.onScroll);
  }

  scan(): void {
    this.rect = null;
    if (this.host && !this.host.isConnected) {
      this.hide();
      this.light.remove();
      this.host = null;
      this.resize.disconnect();
    }
  }

  destroy(): void {
    this.hide();
    clearTimeout(this.settle);
    this.settle = 0;
    document.documentElement.classList.remove("lg-pointer-moving");
    this.resize.disconnect();
    document.removeEventListener("pointermove", this.onMove);
    document.documentElement.removeEventListener("pointerleave", this.hide);
    window.removeEventListener("scroll", this.onScroll, { capture: true });
    window.removeEventListener("resize", this.onScroll);
    this.light.remove();
    this.host = null;
  }

  private onMove = (event: PointerEvent): void => {
    if (event.pointerType !== "mouse") {
      return;
    }
    // Keep the latest event while a frame is pending, so the light never follows stale input.
    this.point = { x: event.clientX, y: event.clientY, target: event.target };
    if (!this.frame) {
      this.frame = requestAnimationFrame(this.render);
    }
  };

  private render = (): void => {
    this.frame = 0;
    const point = this.point;
    const pane =
      point?.target instanceof Element
        ? point.target.closest<HTMLElement>(".lg-pane, .lg-btn")
        : null;
    if (!point || !pane?.isConnected) {
      this.hide();
      return;
    }
    if (pane !== this.host) {
      this.host = pane;
      this.rect = null;
      this.resize.disconnect();
      pane.append(this.light);
      this.resize.observe(pane);
    }
    const rect = this.rect ?? pane.getBoundingClientRect();
    this.rect = rect;
    this.glow.style.transform = `translate3d(${point.x - rect.left - 220}px, ${
      point.y - rect.top - 220
    }px, 0)`;
    this.light.style.opacity = "1";
    if (browserEngine === "blink") {
      // Chromium re-captures fixed SVG backdrops when the content below them animates. Native
      // frosting keeps the bar/Dock smooth during pointer motion; full optics return at rest.
      if (!this.settle) {
        document.documentElement.classList.add("lg-pointer-moving");
      }
      clearTimeout(this.settle);
      this.settle = window.setTimeout(() => {
        this.settle = 0;
        document.documentElement.classList.remove("lg-pointer-moving");
      }, 160);
    }
  };

  private hide = (): void => {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.point = null;
    this.light.style.opacity = "0";
  };

  private onScroll = (): void => {
    this.rect = null;
    this.hide();
  };
}
