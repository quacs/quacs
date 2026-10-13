import {
  createGlass,
  createSpring,
  element,
  Glass,
  GlassOptics,
  lerp,
  own,
  place,
  reducedMotion,
  Spring,
  Surface,
  SurfaceBody,
  toast,
} from "./engine";

// ---------- Buttons: <lg-button> glass capsules that squish when pressed ----------

// liquidglass.dev's <lg-button> optics
const BUTTON: GlassOptics = {
  refraction: 14,
  bezel: 0.8,
  curvature: 3,
  chroma: 0.12,
  specular: 0.6,
  specularWidth: 1.5,
};

interface Button {
  surface: Surface;
  press: Spring;
  down: () => void;
  up: () => void;
}

// Bootstrap buttons become the library's glass buttons: its glass body (Surface) goes under the
// label, and the glass grows wider and shorter while pressed. Buttons on the pond bend a copy of it
// (the frosted copy on frosted panes), so they bend in every browser; buttons in dialogs bend what is
// behind them where the browser can.
export class GlassButtons {
  private buttons = new Map<HTMLElement, Button>();
  private destroyed = false;

  destroy(): void {
    this.destroyed = true;
    this.buttons.forEach((button, el) => this.detach(el, button));
    this.buttons.clear();
  }

  scan(): void {
    if (this.destroyed) {
      return;
    }
    document.querySelectorAll<HTMLElement>(".btn").forEach((el) => {
      if (
        !this.buttons.has(el) &&
        !el.closest(".input-group, .navbar, .lg-cc, .lg-dock-wrap")
      ) {
        this.attach(el);
      }
    });
    this.buttons.forEach((button, el) => {
      if (!el.isConnected) {
        this.detach(el, button);
        this.buttons.delete(el);
      }
    });
  }

  private attach(el: HTMLElement): void {
    const tone = el.matches(".btn-primary, .btn-success, .btn-info")
      ? "tinted"
      : el.matches(".btn-danger, .btn-outline-danger")
      ? "danger"
      : "light";
    el.classList.add("lg-btn", `lg-btn-${tone}`);
    if (!el.closest(".modal, .dropdown-menu")) {
      el.setAttribute(
        "backdrop",
        el.closest(".lg-pane-frost, .card, .jumbotron, .calendar")
          ? "#lg-pond-frost"
          : "#lg-pond"
      );
    }
    const surface = new SurfaceBody(el, {
      radius: Infinity,
      bleed: 12,
      optics: BUTTON,
    });
    surface.attach();
    const press = createSpring(
      0,
      (p) => surface.setDelta({ x: -5 * p, y: 2 * p, w: 10 * p, h: -4 * p }),
      { stiffness: 600, damping: 36 }
    );
    const down = () => press.set(1);
    const up = () => press.set(0);
    el.addEventListener("pointerdown", down);
    for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
      el.addEventListener(type, up);
    }
    this.buttons.set(el, { surface, press, down, up });
  }

  private detach(el: HTMLElement, button: Button): void {
    el.removeEventListener("pointerdown", button.down);
    for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
      el.removeEventListener(type, button.up);
    }
    button.press.stop();
    button.surface.detach();
    button.surface.root.remove();
    el.removeAttribute("backdrop");
    el.classList.remove(
      "lg-btn",
      "lg-btn-tinted",
      "lg-btn-danger",
      "lg-btn-light"
    );
  }
}

// ---------- Switches: <lg-switch> ----------

interface Switch {
  input: HTMLInputElement;
  control: HTMLElement;
  thumb: HTMLElement;
  shadow: HTMLElement;
  glass: Glass;
  slide: Spring;
  press: Spring;
  x: number;
  velocity: number;
  p: number;
  down: () => void;
  up: () => void;
  change: () => void;
}

// Bootstrap's switches as liquidglass.dev's <lg-switch>, iOS style: the thumb is solid white at rest
// and turns into glass while pressed, growing and bending the track under it, then springs across.
// The real checkbox stays underneath, so labels, keyboards and Vue keep working.
export class GlassSwitches {
  private switches = new Map<HTMLElement, Switch>();
  private destroyed = false;

  destroy(): void {
    this.destroyed = true;
    this.switches.forEach((sw, host) => this.detach(host, sw));
    this.switches.clear();
  }

  scan(): void {
    if (this.destroyed) {
      return;
    }
    document
      .querySelectorAll<HTMLElement>(".custom-control.custom-switch")
      .forEach((host) => {
        const input = host.querySelector<HTMLInputElement>(
          "input.custom-control-input"
        );
        if (!this.switches.has(host) && input) {
          this.attach(host, input);
        }
      });
    this.switches.forEach((sw, host) => {
      if (!host.isConnected) {
        this.detach(host, sw);
        this.switches.delete(host);
      }
    });
    this.sync();
  }

  // Vue sets a checkbox's state without a change event when the store changes elsewhere
  sync(): void {
    this.switches.forEach((sw) => {
      const on = sw.input.checked ? 1 : 0;
      if (Math.abs(sw.x - on) > 0.001 || sw.slide.value !== on) {
        sw.slide.set(on);
      }
      sw.control.classList.toggle("lg-sw-disabled", sw.input.disabled);
    });
  }

  private attach(host: HTMLElement, input: HTMLInputElement): void {
    const control = own(element("span", "lg-sw", { "aria-hidden": "true" }));
    const track = element("span", "lg-sw-track");
    const refract = element("span", "lg-sw-refract");
    refract.append(element("span", "lg-sw-fill"));
    const shadow = element("span", "lg-sw-shadow");
    const thumb = element("span", "lg-sw-thumb");
    control.append(track, refract, shadow, thumb);
    host.append(control);
    host.classList.add("lg-sw-host");
    const glass = createGlass(refract, {
      clip: true,
      refraction: 10,
      bezel: 0.9,
      curvature: 3,
      chroma: 0,
      specular: 0.7,
      specularWidth: 1.5,
    });
    const on = input.checked ? 1 : 0;
    const sw: Switch = {
      input,
      control,
      thumb,
      shadow,
      glass,
      x: on,
      velocity: 0,
      p: 0,
      slide: createSpring(
        on,
        (x, velocity) => {
          sw.x = x;
          sw.velocity = velocity;
          this.render(sw);
        },
        { stiffness: 420, damping: 30 }
      ),
      press: createSpring(
        0,
        (p) => {
          sw.p = p;
          this.render(sw);
        },
        { stiffness: 600, damping: 36 }
      ),
      down: () => {
        if (!input.disabled) {
          sw.press.set(1);
        }
      },
      up: () => sw.press.set(0),
      change: () => sw.slide.set(input.checked ? 1 : 0),
    };
    host.addEventListener("pointerdown", sw.down);
    for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
      host.addEventListener(type, sw.up);
    }
    input.addEventListener("change", sw.change);
    this.switches.set(host, sw);
    this.render(sw);
  }

  private detach(host: HTMLElement, sw: Switch): void {
    host.removeEventListener("pointerdown", sw.down);
    for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
      host.removeEventListener(type, sw.up);
    }
    sw.input.removeEventListener("change", sw.change);
    sw.slide.stop();
    sw.press.stop();
    sw.glass.destroy();
    sw.control.remove();
    host.classList.remove("lg-sw-host");
  }

  // <lg-switch>'s geometry: a 64x28 track, a 36x24 thumb at rest growing to 54x36 when pressed,
  // drawn 16px into a refraction layer that leaves the lens room to grow
  private render(sw: Switch): void {
    const stretch = Math.min(10, Math.abs(sw.velocity) * 1.6);
    const w = lerp(36, 54, sw.p) + stretch;
    const h = lerp(24, 36, sw.p) - stretch * 0.2;
    const left = 20 + 24 * sw.x - w / 2;
    const top = 14 - h / 2;
    sw.control.style.setProperty("--p", sw.x.toFixed(3));
    sw.glass.update({
      x: left + 16,
      y: top + 16,
      width: w,
      height: h,
      radius: h / 2,
    });
    place(sw.thumb, left, top, w, h, h / 2);
    place(sw.shadow, left, top, w, h, h / 2);
    sw.thumb.style.opacity = String(1 - sw.p);
    sw.shadow.style.opacity = String(sw.p);
  }
}

// ---------- Segmented controls: <lg-segmented> for short <select>s ----------

interface Segmented {
  select: HTMLSelectElement;
  control: HTMLElement & { value: string };
}

// A <select> with a couple of choices (Settings' 12 or 24 hour time) becomes the library's segmented
// control, whose selection is a springy glass lens. The select stays, hidden, and receives the
// choice as a change event, so Vue's v-model sees it.
export class SegmentedSelects {
  private controls = new Map<HTMLSelectElement, Segmented>();
  private destroyed = false;

  constructor(private readonly selector: string) {}

  destroy(): void {
    this.destroyed = true;
    this.controls.forEach((seg) => this.detach(seg));
    this.controls.clear();
  }

  scan(): void {
    if (this.destroyed) {
      return;
    }
    document
      .querySelectorAll<HTMLSelectElement>(this.selector)
      .forEach((select) => {
        if (!this.controls.has(select)) {
          this.attach(select);
        }
      });
    this.controls.forEach((seg, select) => {
      if (!select.isConnected) {
        this.detach(seg);
        this.controls.delete(select);
      }
    });
    this.sync();
  }

  sync(): void {
    this.controls.forEach(({ select, control }) => {
      if (control.value !== select.value) {
        control.value = select.value;
      }
    });
  }

  private attach(select: HTMLSelectElement): void {
    const control = own(
      element("lg-segmented", "lg-seg-select", {
        label:
          document
            .querySelector(`label[for="${select.id}"]`)
            ?.textContent?.trim() ??
          select.getAttribute("aria-label") ??
          "",
        value: select.value,
      })
    ) as HTMLElement & { value: string };
    for (const option of select.options) {
      const button = element("button", "", { value: option.value });
      button.textContent = option.text;
      control.append(button);
    }
    control.addEventListener("change", (event) => {
      const value = (event as CustomEvent<{ value: string }>).detail.value;
      if (select.value !== value) {
        select.value = value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    select.classList.add("lg-replaced");
    select.after(control);
    this.controls.set(select, { select, control });
  }

  private detach({ select, control }: Segmented): void {
    control.remove();
    select.classList.remove("lg-replaced");
  }
}

// ---------- Toasts: toast() when a CRN is copied ----------

// The schedule page copies a CRN when it is clicked. Liquid Glass shows that as the library's toast,
// which drops in on a spring and stretches as it lands (liquid-glass.css hides the page's own notice).
export class CopyToasts {
  constructor() {
    document.addEventListener("click", this.onClick, true);
  }

  destroy(): void {
    document.removeEventListener("click", this.onClick, true);
    // The library adds a region for its toasts to the page; it makes a new one when needed
    document.querySelector(".lg-toast-region")?.remove();
  }

  private onClick = (event: Event): void => {
    const crn = (event.target as Element).closest?.(".crn-list .crn");
    if (crn) {
      toast(`Copied CRN ${crn.textContent?.trim()}`, { icon: "check" });
    }
  };
}

// ---------- The calendar's magnifier: <lg-lens> ----------

const LENS_W = 220;
const LENS_H = 132;

// A glass lens follows the pointer over the calendar and magnifies the small print of the classes
// under it, like liquidglass.dev's <lg-lens>. A dome lens (bezel 1) magnifies all of it, not just its
// rim. It shows for mouse pointers only, and hides while the page scrolls.
export class CalendarLens {
  private grid: HTMLElement | null = null;
  private glass: Glass | null = null;
  private shadow: HTMLElement | null = null;
  private xs: Spring;
  private ys: Spring;
  private presence: Spring;
  private shown = 0;
  private destroyed = false;

  constructor() {
    const follow = { stiffness: 260, damping: 26 };
    this.xs = createSpring(0, () => this.render(), follow);
    this.ys = createSpring(0, () => this.render(), follow);
    this.presence = createSpring(
      0,
      (value) => {
        this.shown = value;
        this.render();
      },
      { stiffness: 500, damping: 34 }
    );
    window.addEventListener("scroll", this.hide, { passive: true });
  }

  destroy(): void {
    this.destroyed = true;
    window.removeEventListener("scroll", this.hide);
    this.detach();
    this.xs.stop();
    this.ys.stop();
    this.presence.stop();
  }

  scan(): void {
    if (this.destroyed) {
      return;
    }
    const grid = document.querySelector<HTMLElement>(".calendar-grid");
    if (grid !== this.grid) {
      this.detach();
      if (grid) {
        this.attach(grid);
      }
    }
  }

  private attach(grid: HTMLElement): void {
    this.grid = grid;
    this.glass = createGlass(grid, {
      hidden: true,
      width: LENS_W,
      height: LENS_H,
      radius: LENS_H / 2,
      refraction: 26,
      bezel: 1,
      curvature: 2,
      chroma: 0,
      specular: 0.55,
      specularWidth: 2,
    });
    this.shadow = own(
      element("span", "lg-cal-lens-shadow", { "aria-hidden": "true" })
    );
    grid.parentElement?.append(this.shadow);
    grid.addEventListener("pointermove", this.onMove);
    grid.addEventListener("pointerleave", this.hide);
  }

  private detach(): void {
    if (!this.grid) {
      return;
    }
    this.grid.removeEventListener("pointermove", this.onMove);
    this.grid.removeEventListener("pointerleave", this.hide);
    this.glass?.destroy();
    this.shadow?.remove();
    this.glass = null;
    this.shadow = null;
    this.grid = null;
    this.shown = 0;
  }

  private onMove = (event: PointerEvent): void => {
    if (event.pointerType !== "mouse" || !this.grid) {
      return;
    }
    const box = this.grid.getBoundingClientRect();
    const fresh = this.shown < 0.05;
    this.xs.set(event.clientX - box.left, { immediate: fresh });
    this.ys.set(event.clientY - box.top, { immediate: fresh });
    this.presence.set(1);
  };

  private hide = (): void => {
    this.presence.set(0, { immediate: reducedMotion.matches });
  };

  private render(): void {
    const grid = this.grid;
    const glass = this.glass;
    const shadow = this.shadow;
    if (!grid || !glass || !shadow) {
      return;
    }
    if (this.shown < 0.02) {
      glass.update({ hidden: true });
      shadow.style.opacity = "0";
      return;
    }
    const scale = lerp(0.6, 1, this.shown);
    const w = LENS_W * scale;
    const h = LENS_H * scale;
    const x = Math.min(
      Math.max(this.xs.value - w / 2, 0),
      grid.clientWidth - w
    );
    const y = Math.min(
      Math.max(this.ys.value - h / 2, 0),
      grid.clientHeight - h
    );
    glass.update({ hidden: false, x, y, width: w, height: h, radius: h / 2 });
    place(shadow, x + grid.offsetLeft, y + grid.offsetTop, w, h, h / 2);
    shadow.style.opacity = String(this.shown);
  }
}
