import { element, own } from "./engine";

// One prepainted light moves on its own compositing layer. Updating inherited CSS variables on
// a pane instead invalidates its entire subtree, including the expensive refracted background.
export class PointerLight {
  private light = own(
    element("span", "lg-pointer-light", { "aria-hidden": "true" })
  );
  private glow = element("span", "lg-pointer-glow");
  private host: HTMLElement | null = null;
  private point: {
    x: number;
    y: number;
    target: EventTarget | null;
  } | null = null;
  private frame = 0;

  constructor() {
    this.light.append(this.glow);
    document.addEventListener("pointermove", this.onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.hide);
    window.addEventListener("scroll", this.hide, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", this.hide);
  }

  scan(): void {
    if (this.host && !this.host.isConnected) {
      this.hide();
      this.light.remove();
      this.host = null;
    }
  }

  destroy(): void {
    this.hide();
    document.removeEventListener("pointermove", this.onMove);
    document.documentElement.removeEventListener("pointerleave", this.hide);
    window.removeEventListener("scroll", this.hide, { capture: true });
    window.removeEventListener("resize", this.hide);
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
    // A sibling can move this pane without resizing it. Read fresh geometry once per frame,
    // before writes, so the light also follows layout changes that do not produce scroll events.
    const rect = pane.getBoundingClientRect();
    if (pane !== this.host) {
      this.host = pane;
      pane.append(this.light);
    }
    this.glow.style.transform = `translate3d(${point.x - rect.left - 220}px, ${
      point.y - rect.top - 220
    }px, 0)`;
    this.light.style.opacity = "1";
  };

  private hide = (): void => {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.point = null;
    this.light.style.opacity = "0";
  };
}
