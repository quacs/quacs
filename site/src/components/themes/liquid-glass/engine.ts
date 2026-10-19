// The vendored Liquid Glass engine and components (src/vendor/), with types for the parts the theme
// uses. Importing this module defines the library's <lg-*> custom elements.
import * as engineModule from "@/vendor/liquid-glass";
import * as componentsModule from "@/vendor/liquid-glass-components";

export interface GlassOptics {
  // Lens rectangle in CSS px, relative to the filtered element's border box
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  // Strongest bend, at the rim, in CSS px
  refraction?: number;
  // Width of the curved rim, as a share of half the short side (1 is a full dome)
  bezel?: number;
  curvature?: number;
  chroma?: number;
  blur?: number;
  specular?: number;
  specularWidth?: number;
  mapScale?: number;
}

export interface GlassOptions extends GlassOptics {
  // "backdrop" bends what is behind the element (Chromium only; other browsers get the fallback)
  mode?: "content" | "backdrop";
  // The lens follows the element's own size
  fit?: boolean;
  // Clips the element to the lens
  clip?: boolean;
  fallback?: string;
  hidden?: boolean;
}

export interface Glass {
  update(next: GlassOptics & { hidden?: boolean }): void;
  destroy(): void;
}

export interface Spring {
  set(next: number, options?: { immediate?: boolean }): void;
  readonly value: number;
  stop(): void;
}

// The library's glass body: spans it prepends to a host element (a shadow, the glass, a tint)
export interface Surface {
  readonly root: HTMLElement;
  readonly mode: "copy" | "backdrop" | "fallback" | null;
  attach(): void;
  detach(): void;
  update(): void;
  // Grows or shifts the glass relative to the host box (the press squish)
  setDelta(delta: { x?: number; y?: number; w?: number; h?: number }): void;
}

const engine = engineModule as unknown as {
  createGlass(target: HTMLElement, options?: GlassOptions): Glass;
  createSpring(
    initial: number,
    onUpdate: (value: number, velocity: number) => void,
    options?: { stiffness?: number; damping?: number }
  ): Spring;
  engine: "blink" | "webkit" | "gecko" | "unknown";
  reducedMotion: { matches: boolean };
};

const components = componentsModule as unknown as {
  Surface: new (
    host: HTMLElement,
    options: { radius?: number; bleed?: number; optics?: GlassOptics }
  ) => Surface;
  toast(
    message: string,
    options?: { icon?: string; duration?: number; backdrop?: string }
  ): { close(): void; element: HTMLElement };
};

export const createGlass = engine.createGlass;
export const createSpring = engine.createSpring;
export const browserEngine = engine.engine;
export const reducedMotion = engine.reducedMotion;
export const SurfaceBody = components.Surface;
export const toast = components.toast;

// Safari and Firefox run these filters on the processor rather than the graphics card, and WebKit
// breaks very large filtered areas into tiles, so the theme does less there
export const LIMITED = browserEngine !== "blink";

// Primary touch input, rather than viewport width: desktop windows keep their full live glass.
export const touchOnly = window.matchMedia(
  "(hover: none) and (pointer: coarse)"
);

// Sizes and moves an element the way the library does for its shadows and thumbs
export function place(
  node: HTMLElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  node.style.width = `${w}px`;
  node.style.height = `${h}px`;
  node.style.borderRadius = `${r}px`;
  node.style.transform = `translate(${x}px, ${y}px)`;
}

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

// An element with classes and attributes; custom tags (the library's <lg-*>) come back as HTMLElement
export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  attrs?: { [name: string]: string }
): HTMLElementTagNameMap[K];
export function element(
  tag: string,
  className: string,
  attrs?: { [name: string]: string }
): HTMLElement;
export function element(
  tag: string,
  className: string,
  attrs: { [name: string]: string } = {}
): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  for (const name in attrs) {
    node.setAttribute(name, attrs[name]);
  }
  return node;
}

// The theme marks the elements it adds, so its MutationObserver can ignore its own changes
export const OWN = "data-lg-own";

export function own<T extends HTMLElement>(node: T): T {
  node.setAttribute(OWN, "");
  return node;
}
