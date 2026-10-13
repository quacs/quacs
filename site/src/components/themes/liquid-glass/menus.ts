import {
  createGlass,
  createSpring,
  element,
  Glass,
  own,
  place,
  Spring,
} from "./engine";

interface Menu {
  el: HTMLElement;
  copy: HTMLElement;
  shadow: HTMLElement;
  glass: Glass;
  rows: Spring;
  item: HTMLElement | null;
  y: number;
  velocity: number;
  open: boolean;
}

// The navbar's dropdowns as liquidglass.dev's <lg-menu>: when a menu opens, a white-on-blue copy of
// its items fills it, clipped to a glass lens that slides to the item under the pointer
export class Menus {
  private menus = new Map<HTMLElement, Menu>();
  private resize: ResizeObserver;
  private destroyed = false;

  // Called when a menu opens or closes, so the menu bar can move its highlight to the menu's title
  constructor(private readonly onToggle: () => void) {
    this.resize = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const menu = this.menus.get(entry.target as HTMLElement);
        if (menu) {
          this.onResize(menu);
        }
      }
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.resize.disconnect();
    this.menus.forEach((menu) => this.detach(menu));
    this.menus.clear();
  }

  scan(): void {
    if (this.destroyed) {
      return;
    }
    document
      .querySelectorAll<HTMLElement>(".navbar .dropdown-menu")
      .forEach((el) => {
        if (!this.menus.has(el)) {
          this.attach(el);
        }
      });
    this.menus.forEach((menu, el) => {
      if (!el.isConnected) {
        this.detach(menu);
        this.menus.delete(el);
      }
    });
  }

  private attach(el: HTMLElement): void {
    const copy = own(element("div", "lg-menu-copy", { "aria-hidden": "true" }));
    const shadow = own(
      element("span", "lg-menu-shadow", { "aria-hidden": "true" })
    );
    el.append(shadow, copy);
    const glass = createGlass(copy, {
      clip: true,
      hidden: true,
      refraction: 6,
      bezel: 0.5,
      curvature: 3,
      chroma: 0.15,
      specular: 0.4,
      specularWidth: 1.5,
    });
    const menu: Menu = {
      el,
      copy,
      shadow,
      glass,
      item: null,
      y: 0,
      velocity: 0,
      open: false,
      rows: createSpring(
        0,
        (y, velocity) => {
          menu.y = y;
          menu.velocity = velocity;
          this.render(menu);
        },
        { stiffness: 520, damping: 36 }
      ),
    };
    el.classList.add("lg-menu");
    el.addEventListener("pointerover", this.onOver);
    el.addEventListener("focusin", this.onOver);
    el.addEventListener("pointerleave", this.onLeave);
    this.menus.set(el, menu);
    this.resize.observe(el);
  }

  private detach(menu: Menu): void {
    this.resize.unobserve(menu.el);
    menu.el.removeEventListener("pointerover", this.onOver);
    menu.el.removeEventListener("focusin", this.onOver);
    menu.el.removeEventListener("pointerleave", this.onLeave);
    menu.el.classList.remove("lg-menu");
    menu.rows.stop();
    menu.glass.destroy();
    menu.copy.remove();
    menu.shadow.remove();
  }

  // A menu shows (or hides) by changing size: fill the copy with its current items when it opens
  private onResize(menu: Menu): void {
    const open = menu.el.offsetHeight > 0;
    if (open && !menu.open) {
      menu.copy.replaceChildren(
        ...[...menu.el.children]
          .filter((child) => child !== menu.copy && child !== menu.shadow)
          .filter((child) => !child.classList.contains("lg-glass"))
          .map((child) => this.cloneRow(child as HTMLElement))
      );
    }
    if (!open) {
      this.highlight(menu, null);
    }
    if (open !== menu.open) {
      menu.open = open;
      this.onToggle();
    }
  }

  private cloneRow(row: HTMLElement): HTMLElement {
    const clone = row.cloneNode(true) as HTMLElement;
    for (const node of [clone, ...clone.querySelectorAll<HTMLElement>("*")]) {
      for (const name of ["id", "href", "role", "tabindex", "aria-current"]) {
        node.removeAttribute(name);
      }
    }
    return clone;
  }

  private items(menu: Menu): HTMLElement[] {
    return [...menu.el.querySelectorAll<HTMLElement>(".dropdown-item")].filter(
      (item) =>
        !menu.copy.contains(item) && !item.classList.contains("disabled")
    );
  }

  private onOver = (event: Event): void => {
    const el = event.currentTarget as HTMLElement;
    const menu = this.menus.get(el);
    const item = (event.target as Element).closest<HTMLElement>(
      ".dropdown-item"
    );
    if (menu && item && this.items(menu).includes(item)) {
      this.highlight(menu, item);
    }
  };

  private onLeave = (event: Event): void => {
    const menu = this.menus.get(event.currentTarget as HTMLElement);
    if (menu) {
      this.highlight(menu, null);
    }
  };

  private highlight(menu: Menu, item: HTMLElement | null): void {
    const wasOn = !!menu.item;
    menu.item = item;
    if (!item) {
      menu.glass.update({ hidden: true });
      menu.shadow.style.opacity = "0";
      return;
    }
    menu.rows.set(item.offsetTop, { immediate: !wasOn });
    this.render(menu);
  }

  private render(menu: Menu): void {
    const item = menu.item;
    if (!item) {
      return;
    }
    const stretch = Math.min(6, Math.abs(menu.velocity) * 0.01);
    const w = item.offsetWidth + stretch;
    const h = item.offsetHeight + stretch * 0.5;
    const x = item.offsetLeft - stretch / 2;
    const y = menu.y - stretch * 0.25;
    const r = parseFloat(getComputedStyle(item).borderTopLeftRadius) || 8;
    menu.glass.update({ hidden: false, x, y, width: w, height: h, radius: r });
    place(menu.shadow, x, y, w, h, r);
    menu.shadow.style.opacity = "1";
  }
}
