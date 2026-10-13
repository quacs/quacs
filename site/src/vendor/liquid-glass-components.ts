/* eslint-disable */
// @ts-nocheck -- vendored JavaScript, kept as written; the Liquid Glass theme types what it uses
/*
 * Vendored from Liquid Glass for the Web (https://liquidglass.dev,
 * https://github.com/gentpan/liquidglass), lib/components.js v1.0.0 at commit 068ad22. The only change
 * is the engine import, "./liquid-glass.js" -> "./liquid-glass", since the engine is vendored as
 * liquid-glass.ts. Importing this file defines the <lg-*> custom elements. The Liquid Glass theme uses
 * them (components/themes/liquid-glass/). It is a .ts file only so ts-loader compiles its newer
 * syntax for webpack. Update it by pasting the new file below this header and changing that import.
 *
 * MIT License
 *
 * Copyright (c) 2026 gentpan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/**
 * components.js v1.0.0 — Liquid Glass web components.
 *
 *   <script type="module" src="https://liquidglass.dev/lib/components.js"></script>
 *   <lg-switch checked>Wi-Fi</lg-switch>
 *
 * Elements render into light DOM (no shadow root) so SVG filter references resolve against the
 * document and the page's fonts and tokens apply. Styles are injected once; theme them with the
 * --lg-* custom properties. Glass that floats over an image refracts an aligned copy of that image
 * (set `backdrop="<selector>"` or put `data-lg-backdrop` on an ancestor); with no known backdrop it
 * uses backdrop-filter: real refraction in Chromium, frosted blur elsewhere.
 *
 * Toast icons are from Lucide (ISC license).
 */
import { createGlass, createSpring, engine, reducedMotion } from './liquid-glass';

export { createGlass, createSpring, renderLensMap, engine, DEFAULTS } from './liquid-glass';

/* ------------------------------------------------------------------------------------------------ */
/* Styles                                                                                             */
/* ------------------------------------------------------------------------------------------------ */

const CSS = `
:where(:root) {
  --lg-accent: #0a84ff;
  --lg-on: #34c759;
  --lg-surface: #ffffff;
  --lg-track: #e5e7eb;
  --lg-track-off: #d1d5db;
  --lg-text: #111827;
  --lg-text-muted: #6b7280;
  --lg-on-glass: #ffffff;
  --lg-tint: rgb(255 255 255 / 0.14);
  --lg-tint-strong: rgb(255 255 255 / 0.5);
  --lg-indicator: rgb(255 255 255 / 0.6);
  --lg-shadow-1: 0 1px 3px rgba(0, 0, 0, 0.08);
  --lg-shadow-2: 0 4px 12px rgba(0, 0, 0, 0.1);
  --lg-radius-sm: 8px;
  --lg-radius: 12px;
  --lg-radius-lg: 16px;
  --lg-radius-xl: 24px;
  --lg-fallback: blur(16px) saturate(1.6);
  --lg-focus: #0a84ff;
}
lg-switch, lg-slider, lg-segmented, lg-button, lg-panel, lg-navbar, lg-menubar, lg-menu, lg-toast, lg-dock, lg-lens { box-sizing: border-box; }
:is(lg-switch, lg-slider, lg-segmented, lg-button, lg-panel, lg-navbar, lg-menubar, lg-menu, lg-toast, lg-dock, lg-lens) *,
:is(lg-switch, lg-slider, lg-segmented, lg-button, lg-panel, lg-navbar, lg-menubar, lg-menu, lg-toast, lg-dock, lg-lens) *::before,
:is(lg-switch, lg-slider, lg-segmented, lg-button, lg-panel, lg-navbar, lg-menubar, lg-menu, lg-toast, lg-dock, lg-lens) *::after { box-sizing: border-box; }

/* glass body over a backdrop */
.lg-surface { position: absolute; inset: calc(-1 * var(--lg-bleed, 16px)); pointer-events: none; z-index: 0; }
.lg-surface__glass { position: absolute; inset: 0; overflow: hidden; }
.lg-surface__glass--fallback { inset: auto; left: 0; top: 0; overflow: visible; backdrop-filter: var(--lg-fallback); -webkit-backdrop-filter: var(--lg-fallback); }
.lg-surface__copy { position: absolute; left: 0; top: 0; display: block; max-width: none; max-height: none; margin: 0; }
.lg-surface__shadow, .lg-surface__tint { position: absolute; left: 0; top: 0; }
.lg-surface__shadow { box-shadow: var(--lg-shadow-2); }
.lg-surface__tint { background: var(--lg-tint); }

/* overlay-copy controls */
.lg-refract { position: absolute; pointer-events: none; z-index: 1; background: var(--lg-surface); }
.lg-thumb { position: absolute; left: 0; top: 0; background: #ffffff; box-shadow: var(--lg-shadow-1); pointer-events: none; z-index: 3; }
.lg-lens-shadow { position: absolute; left: 0; top: 0; box-shadow: var(--lg-shadow-2); pointer-events: none; z-index: 2; opacity: 0; }

/* switch */
lg-switch { display: inline-flex; vertical-align: middle; color: var(--lg-text); }
.lg-switch__text { display: inline-flex; align-items: center; gap: 8px; }
.lg-switch__text svg { width: 16px; height: 16px; }
.lg-switch__label { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; cursor: pointer; }
.lg-switch__control { --p: 0; position: relative; flex: none; width: 64px; height: 28px; }
.lg-switch__input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 4; }
.lg-switch__track, .lg-switch__fill { border-radius: 14px; background: color-mix(in srgb, var(--lg-track-off), var(--lg-on) calc(var(--p) * 100%)); }
.lg-switch__track { position: absolute; inset: 0; }
.lg-switch__control .lg-refract { left: -16px; top: -16px; width: 96px; height: 60px; }
.lg-switch__fill { position: absolute; left: 16px; top: 16px; width: 64px; height: 28px; }
.lg-switch__input:focus-visible ~ .lg-thumb { outline: 2px solid var(--lg-focus); outline-offset: 2px; }
.lg-switch__input:disabled ~ * { opacity: 0.5; }
lg-switch[disabled] .lg-switch__label { cursor: default; }

/* slider */
lg-slider { display: inline-block; width: 240px; vertical-align: middle; }
.lg-slider__control { --t: 0; position: relative; height: 36px; }
.lg-slider__input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 4; }
.lg-slider__input::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 36px; height: 36px; }
.lg-slider__input::-moz-range-thumb { width: 36px; height: 36px; border: 0; }
.lg-slider__track { position: absolute; left: 0; right: 0; top: 15px; height: 6px; border-radius: 3px; background: var(--lg-track); overflow: hidden; }
.lg-slider__fill { position: absolute; left: 0; top: 0; bottom: 0; width: calc(18px + var(--t) * (100% - 36px)); background: var(--lg-accent); }
.lg-slider__control .lg-refract { inset: -16px; }
.lg-slider__control .lg-refract .lg-slider__track { left: 16px; right: 16px; top: 31px; }
.lg-slider__input:focus-visible ~ .lg-thumb { outline: 2px solid var(--lg-focus); outline-offset: 2px; }

/* segmented control */
lg-segmented { position: relative; display: inline-flex; padding: 4px; gap: 4px; border-radius: var(--lg-radius); background: var(--lg-track); vertical-align: middle; }
.lg-seg__option { position: relative; z-index: 0; display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 64px; height: 32px; padding: 0 12px;
  border: 0; border-radius: var(--lg-radius-sm); background: transparent; color: var(--lg-text-muted); font: inherit; font-size: 14px; font-weight: 500; line-height: 32px; white-space: nowrap; cursor: pointer; }
.lg-seg__option:focus-visible { outline: 2px solid var(--lg-focus); outline-offset: 2px; }
lg-segmented .lg-refract { inset: 0; display: flex; padding: 4px; gap: 4px; border-radius: var(--lg-radius); background: var(--lg-surface); }
lg-segmented .lg-refract .lg-seg__option { color: var(--lg-accent); cursor: default; }
lg-segmented .lg-lens-shadow { opacity: 1; box-shadow: var(--lg-shadow-1); }

/* button */
lg-button { display: inline-flex; vertical-align: middle; }
.lg-button__el { position: relative; isolation: isolate; display: inline-flex; text-decoration: none; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 20px;
  border: 0; border-radius: 22px; background: transparent; color: var(--lg-on-glass); font: inherit; font-size: 16px; font-weight: 600; white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.lg-button__el:hover { text-decoration: none; }
.lg-button__el:focus-visible { outline: 2px solid var(--lg-focus); outline-offset: 4px; }
.lg-button__el:disabled { opacity: 0.5; cursor: default; }
.lg-button__label { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 8px; }
lg-button[tone="tinted"] .lg-surface__tint { background: color-mix(in srgb, var(--lg-accent) 55%, transparent); }
lg-button[tone="light"] .lg-button__el { color: var(--lg-text); }
lg-button[tone="light"] .lg-surface__tint { background: var(--lg-tint-strong); }

/* panel */
lg-panel { position: relative; isolation: isolate; display: block; color: var(--lg-on-glass); }
.lg-panel__body { position: relative; z-index: 1; }
lg-panel[tone="light"] { color: var(--lg-text); }
lg-panel[tone="light"] .lg-surface__tint { background: var(--lg-tint-strong); }

/* navbar */
lg-navbar { position: relative; isolation: isolate; display: inline-flex; align-items: center; gap: 4px; padding: 4px; color: var(--lg-on-glass); }
lg-navbar > a, lg-navbar > button, .lg-nav__copy > span { position: relative; z-index: 2; display: inline-flex; align-items: center; gap: 8px; height: 36px; margin: 0; padding: 0 16px;
  border: 0; border-radius: 18px; background: transparent; color: inherit; font: inherit; font-size: 14px; font-weight: 500; line-height: 36px; text-decoration: none; white-space: nowrap; cursor: pointer; }
lg-navbar > a:hover { text-decoration: none; }
lg-navbar > :is(a, button):focus-visible { outline: 2px solid var(--lg-focus); outline-offset: 2px; }
.lg-nav__copy { position: absolute; inset: 0; z-index: 3; display: flex; align-items: center; gap: 4px; padding: 4px; pointer-events: none; background: var(--lg-indicator); }
.lg-nav__copy > span { color: var(--lg-text); }
lg-navbar[tone="light"] { color: var(--lg-text); }
lg-navbar[tone="light"] .lg-surface__tint { background: var(--lg-tint-strong); }
lg-navbar .lg-lens-shadow { opacity: 1; box-shadow: var(--lg-shadow-1); z-index: 1; }
lg-navbar > .lg-surface { z-index: 0; }

/* menubar and menus */
lg-menubar { position: relative; isolation: isolate; z-index: 10; display: flex; align-items: center; gap: 4px; height: 44px; padding: 0 12px; color: var(--lg-on-glass); font-size: 14px;
  text-shadow: 0 1px 3px rgb(0 0 0 / 0.35); --lg-tint: rgb(17 24 39 / 0.1); }
lg-menubar .lg-menu__panel { text-shadow: none; }
lg-menubar > :not(lg-menu):not(.lg-surface) { position: relative; z-index: 1; }
lg-menu { position: relative; z-index: 1; display: inline-flex; }
.lg-menu__trigger { height: 32px; padding: 0 12px; border: 0; border-radius: var(--lg-radius-sm); background: transparent; color: inherit; font: inherit; font-weight: 500; cursor: default; }
.lg-menu__trigger { border-radius: 16px; }
.lg-menu__trigger[aria-expanded="true"], .lg-menu__trigger:hover { background: rgb(255 255 255 / 0.2); }
.lg-menu__trigger:focus-visible { outline: 2px solid var(--lg-focus); outline-offset: 2px; }
.lg-menu__panel { position: absolute; left: 0; top: calc(100% + 10px); isolation: isolate; min-width: 220px; padding: 6px; color: var(--lg-text); }
.lg-menu__panel[hidden] { display: none; }
.lg-menu__panel .lg-surface__tint { background: rgb(255 255 255 / 0.55); }
.lg-menu__items { position: relative; z-index: 2; display: flex; flex-direction: column; }
.lg-menu__items > button, .lg-menu__copy > span { display: flex; align-items: center; justify-content: space-between; gap: 24px; height: 32px; padding: 0 12px; border: 0; border-radius: var(--lg-radius-sm);
  background: transparent; color: inherit; font: inherit; font-size: 14px; text-align: left; white-space: nowrap; cursor: default; }
.lg-menu__items > button:focus-visible { outline: none; }
.lg-menu__items > hr, .lg-menu__copy > hr { width: calc(100% - 24px); height: 1px; margin: 4px 12px; border: 0; background: rgb(0 0 0 / 0.1); }
.lg-menu__items kbd, .lg-menu__copy kbd { font: inherit; font-size: 12px; opacity: 0.6; }
.lg-menu__copy { position: absolute; inset: 6px; z-index: 1; display: flex; flex-direction: column; pointer-events: none; background: var(--lg-accent); color: #ffffff; border-radius: var(--lg-radius-sm); }
.lg-menu__copy > hr { opacity: 0; }
.lg-menu__panel .lg-lens-shadow { z-index: 1; box-shadow: none; }

/* toast */
.lg-toast-region { position: fixed; top: var(--lg-toast-top, 16px); left: 50%; z-index: 1000; display: flex; flex-direction: column; align-items: center; gap: 8px; transform: translateX(-50%); pointer-events: none; }
.lg-toast-region--local { position: absolute; }
lg-toast { position: relative; isolation: isolate; display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 20px 0 14px; color: var(--lg-on-glass); font-size: 14px; font-weight: 500; pointer-events: auto; }
lg-toast[tone="light"] { color: var(--lg-text); }
lg-toast[tone="light"] .lg-surface__tint { background: var(--lg-tint-strong); }
.lg-toast__icon, .lg-toast__text { position: relative; z-index: 1; display: inline-flex; }
.lg-toast__icon svg { width: 20px; height: 20px; }

/* dock */
lg-dock { position: relative; isolation: isolate; display: inline-flex; padding: 8px; }
.lg-dock__items { position: relative; z-index: 1; display: flex; gap: 8px; padding: 4px; }
.lg-dock__items > * { flex: none; }
lg-dock .lg-lens-shadow { z-index: 2; box-shadow: var(--lg-shadow-2); }

/* lens (magnifier) */
lg-lens { position: relative; display: block; overflow: hidden; touch-action: none; }
.lg-lens__content { position: relative; background: var(--lg-surface); will-change: filter; }
lg-lens .lg-lens-shadow { z-index: 2; opacity: 1; }

@media (prefers-reduced-transparency: reduce) {
  .lg-surface__tint { background: rgb(255 255 255 / 0.85); }
  lg-button, lg-panel, lg-navbar, lg-menubar, lg-toast { color: var(--lg-text); }
}
`;

let styled = false;
function injectStyles() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const style = document.createElement('style');
  style.id = 'liquid-glass-components';
  style.textContent = CSS;
  document.head.prepend(style); // first, so page styles win at equal specificity
}

/* ------------------------------------------------------------------------------------------------ */
/* Helpers                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function el(tag, className, attrs) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

function place(node, x, y, w, h, r) {
  node.style.width = `${w}px`;
  node.style.height = `${h}px`;
  node.style.borderRadius = `${r}px`;
  node.style.transform = `translate(${x}px, ${y}px)`;
}

// Optics attributes: refraction, bezel, curvature, ior, chroma, blur, specular, specular-width, light-angle.
const OPTIC_ATTRS = { refraction: 'refraction', bezel: 'bezel', curvature: 'curvature', ior: 'ior', chroma: 'chroma', blur: 'blur', specular: 'specular', 'specular-width': 'specularWidth', 'light-angle': 'lightAngle' };
function optics(host, defaults) {
  const out = { ...defaults };
  for (const [attr, key] of Object.entries(OPTIC_ATTRS)) {
    const v = host.getAttribute(attr);
    if (v !== null && v !== '' && !Number.isNaN(Number(v))) out[key] = Number(v);
  }
  return out;
}

function radiusOf(host, fallback) {
  const v = host.getAttribute('radius');
  if (v === 'capsule') return Infinity;
  return v !== null && !Number.isNaN(Number(v)) ? Number(v) : fallback;
}

// Chroma sums three channel passes in premultiplied space; on a translucent copy that over-counts
// alpha, so glass over a transparent surface drops the fringe.
function isOpaque(node) {
  const bg = getComputedStyle(node).backgroundColor;
  if (!bg || bg === 'transparent') return false;
  const m = bg.match(/rgba?\(([^)]+)\)/);
  if (!m) return true;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  return parts.length < 4 || parseFloat(parts[3]) >= 1;
}

const ICONS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
};
function icon(name) {
  const body = ICONS[name];
  if (!body) return name ?? ''; // allow raw SVG markup
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/* ------------------------------------------------------------------------------------------------ */
/* Surface: glass body that refracts what is behind it                                                */
/* ------------------------------------------------------------------------------------------------ */

function resolveBackdrop(host) {
  const selector = host.getAttribute('backdrop');
  if (selector === 'none') return null;
  if (selector) return document.querySelector(selector);
  const scope = host.parentElement?.closest('[data-lg-backdrop]');
  if (!scope) return null;
  const inner = scope.getAttribute('data-lg-backdrop');
  return inner ? scope.querySelector(inner) : scope;
}

// A decorative copy of the backdrop: an <img> is cloned, anything else contributes its CSS background.
function cloneBackdrop(source) {
  let copy;
  if (source instanceof HTMLImageElement) {
    copy = source.cloneNode(false);
    copy.removeAttribute('id');
    copy.removeAttribute('class');
    copy.removeAttribute('data-lg-backdrop');
    copy.alt = '';
    copy.loading = 'eager';
    const cs = getComputedStyle(source);
    copy.style.objectFit = cs.objectFit;
    copy.style.objectPosition = cs.objectPosition;
  } else {
    copy = document.createElement('span');
    const cs = getComputedStyle(source);
    for (const k of ['backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat', 'backgroundOrigin', 'backgroundClip']) {
      copy.style[k] = cs[k];
    }
  }
  copy.classList.add('lg-surface__copy');
  copy.setAttribute('aria-hidden', 'true');
  return copy;
}

const surfaces = new Set();
let syncFrame = 0;
function requestSync() {
  if (syncFrame) return;
  syncFrame = requestAnimationFrame(() => {
    syncFrame = 0;
    for (const s of surfaces) s.update();
  });
}
if (typeof window !== 'undefined') {
  addEventListener('scroll', requestSync, { capture: true, passive: true });
  addEventListener('resize', requestSync);
}

/**
 * Glass body for `host` (which must be position: relative). Modes:
 *   copy     — an aligned copy of the backdrop image, refracted with filter: url(). Every engine.
 *   backdrop — backdrop-filter: url(). Chromium only.
 *   fallback — backdrop-filter blur, for WebKit/Gecko with no known backdrop.
 */
class Surface {
  constructor(host, { radius = 16, bleed = 16, optics: o = {}, owner = host } = {}) {
    this.host = host;
    this.owner = owner; // element carrying the backdrop attribute
    this.radius = radius;
    this.bleed = bleed;
    this.optics = o;
    this.delta = { x: 0, y: 0, w: 0, h: 0 };
    this.root = el('span', 'lg-surface', { 'aria-hidden': 'true' });
    this.root.style.setProperty('--lg-bleed', `${bleed}px`);
    this.shadow = el('span', 'lg-surface__shadow');
    this.layer = el('span', 'lg-surface__glass');
    this.tint = el('span', 'lg-surface__tint');
    this.root.append(this.shadow, this.layer, this.tint);
    host.prepend(this.root);
  }

  attach() {
    this.source = resolveBackdrop(this.owner);
    if (this.source) {
      this.mode = 'copy';
      this.copy = cloneBackdrop(this.source);
      this.layer.replaceChildren(this.copy);
      this.glass = createGlass(this.layer, { ...this.optics, clip: true });
      if (this.source instanceof HTMLImageElement && !this.source.complete) this.source.addEventListener('load', requestSync, { once: true });
    } else if (engine === 'blink') {
      this.mode = 'backdrop';
      this.glass = createGlass(this.layer, { ...this.optics, chroma: 0, mode: 'backdrop', clip: true });
    } else {
      this.mode = 'fallback';
      this.layer.classList.add('lg-surface__glass--fallback');
    }
    this.observer = new ResizeObserver(() => this.update());
    this.observer.observe(this.host);
    surfaces.add(this);
    this.update();
  }

  detach() {
    this.glass?.destroy();
    this.glass = null;
    this.observer?.disconnect();
    surfaces.delete(this);
    this.layer.classList.remove('lg-surface__glass--fallback');
    this.layer.removeAttribute('style');
    this.layer.replaceChildren();
    this.copy = null;
    this.mode = null;
    this.lastKey = this.alignKey = null;
  }

  /** Grow/shift the glass relative to the host box (press squish, open animations). */
  setDelta(d) {
    Object.assign(this.delta, d);
    this.update();
  }

  update() {
    const W = this.host.offsetWidth;
    const H = this.host.offsetHeight;
    if (!W || !H) return;
    const d = this.delta;
    const x = this.bleed + d.x;
    const y = this.bleed + d.y;
    const w = Math.max(1, W + d.w);
    const h = Math.max(1, H + d.h);
    const r = Math.min(this.radius, w / 2, h / 2);
    const key = `${x}|${y}|${w}|${h}|${r}`;
    if (key !== this.lastKey) {
      this.lastKey = key;
      place(this.shadow, x, y, w, h, r);
      place(this.tint, x, y, w, h, r);
      if (this.mode === 'fallback') place(this.layer, x, y, w, h, r);
      else this.glass?.update({ x, y, width: w, height: h, radius: r });
    }
    if (this.mode === 'copy') this.align();
  }

  // Keep the backdrop copy registered with the real backdrop. Scrolling usually moves both together,
  // so most calls change nothing and write nothing.
  align() {
    const lr = this.layer.getBoundingClientRect();
    const sr = this.source.getBoundingClientRect();
    const key = `${sr.width}|${sr.height}|${sr.left - lr.left}|${sr.top - lr.top}`;
    if (key === this.alignKey) return;
    this.alignKey = key;
    this.copy.style.width = `${sr.width}px`;
    this.copy.style.height = `${sr.height}px`;
    this.copy.style.transform = `translate(${sr.left - lr.left}px, ${sr.top - lr.top}px)`;
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* Base element                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

class LgElement extends HTMLElement {
  connectedCallback() {
    injectStyles();
    if (!this._built) {
      this._built = true;
      this.build();
    }
    this.attach();
  }
  disconnectedCallback() {
    this.detach();
  }
  build() {}
  attach() {}
  detach() {}
}

// A native element that follows the pointer press: returns a spring 0..1.
function pressSpring(target, onUpdate) {
  const spring = createSpring(0, onUpdate, { stiffness: 600, damping: 36 });
  target.addEventListener('pointerdown', () => spring.set(1));
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) target.addEventListener(type, () => spring.set(0));
  return spring;
}

/* ------------------------------------------------------------------------------------------------ */
/* <lg-switch>                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

class LgSwitch extends LgElement {
  static observedAttributes = ['checked', 'disabled'];

  build() {
    const text = [...this.childNodes];
    const label = el('label', 'lg-switch__label');
    const control = el('span', 'lg-switch__control');
    this.input = el('input', 'lg-switch__input', { type: 'checkbox', role: 'switch' });
    this.input.checked = this.hasAttribute('checked');
    this.input.disabled = this.hasAttribute('disabled');
    for (const a of ['name', 'value', 'aria-label']) if (this.hasAttribute(a)) this.input.setAttribute(a, this.getAttribute(a));
    this.refract = el('span', 'lg-refract', { 'aria-hidden': 'true' });
    this.refract.append(el('span', 'lg-switch__fill'));
    this.shadow = el('span', 'lg-lens-shadow', { 'aria-hidden': 'true' });
    this.thumb = el('span', 'lg-thumb', { 'aria-hidden': 'true' });
    control.append(this.input, el('span', 'lg-switch__track', { 'aria-hidden': 'true' }), this.refract, this.shadow, this.thumb);
    if (text.some((n) => n.textContent.trim())) {
      const span = el('span', 'lg-switch__text');
      span.append(...text);
      label.append(span);
    }
    label.append(control);
    this.replaceChildren(label);

    this.x = this.input.checked ? 1 : 0;
    this.v = 0;
    this.p = 0;
    this.xs = createSpring(this.x, (val, vel) => {
      this.x = val;
      this.v = vel;
      this.render();
    }, { stiffness: 420, damping: 30 });
    pressSpring(this.input, (val) => {
      this.p = val;
      this.render();
    });
    this.input.addEventListener('change', () => this.xs.set(this.input.checked ? 1 : 0));
  }

  attach() {
    this.glass = createGlass(this.refract, { clip: true, ...optics(this, { refraction: 10, bezel: 0.9, curvature: 3, chroma: isOpaque(this.refract) ? 0.2 : 0, specular: 0.7, specularWidth: 1.5 }) });
    this.render();
  }

  detach() {
    this.glass?.destroy();
    this.glass = null;
  }

  attributeChangedCallback(name) {
    if (!this.input) return;
    if (name === 'checked') {
      this.input.checked = this.hasAttribute('checked');
      this.xs.set(this.input.checked ? 1 : 0);
    } else this.input.disabled = this.hasAttribute('disabled');
  }

  get checked() {
    return this.input ? this.input.checked : this.hasAttribute('checked');
  }
  set checked(v) {
    this.toggleAttribute('checked', !!v);
  }

  render() {
    if (!this.glass) return;
    const stretch = Math.min(10, Math.abs(this.v) * 1.6);
    const w = lerp(36, 54, this.p) + stretch;
    const h = lerp(24, 36, this.p) - stretch * 0.2;
    const left = 20 + 24 * this.x - w / 2;
    const top = 14 - h / 2;
    this.firstChild.lastChild.style.setProperty('--p', this.x.toFixed(3));
    this.glass.update({ x: left + 16, y: top + 16, width: w, height: h, radius: h / 2 });
    place(this.thumb, left, top, w, h, h / 2);
    place(this.shadow, left, top, w, h, h / 2);
    this.thumb.style.opacity = String(1 - this.p);
    this.shadow.style.opacity = String(this.p);
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* <lg-slider>                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

class LgSlider extends LgElement {
  static observedAttributes = ['value', 'disabled'];

  build() {
    this.control = el('div', 'lg-slider__control');
    this.input = el('input', 'lg-slider__input', { type: 'range' });
    for (const a of ['min', 'max', 'step', 'name']) if (this.hasAttribute(a)) this.input.setAttribute(a, this.getAttribute(a));
    this.input.setAttribute('aria-label', this.getAttribute('label') ?? this.getAttribute('aria-label') ?? '');
    this.input.value = this.getAttribute('value') ?? this.input.value;
    this.input.disabled = this.hasAttribute('disabled');
    const track = () => {
      const t = el('span', 'lg-slider__track');
      t.append(el('span', 'lg-slider__fill'));
      return t;
    };
    this.refract = el('span', 'lg-refract', { 'aria-hidden': 'true' });
    this.refract.append(track());
    this.shadow = el('span', 'lg-lens-shadow', { 'aria-hidden': 'true' });
    this.thumb = el('span', 'lg-thumb', { 'aria-hidden': 'true' });
    const visibleTrack = track();
    visibleTrack.setAttribute('aria-hidden', 'true');
    this.control.append(this.input, visibleTrack, this.refract, this.shadow, this.thumb);
    this.replaceChildren(this.control);

    this.t = this.fraction();
    this.v = 0;
    this.p = 0;
    this.ts = createSpring(this.t, (val, vel) => {
      this.t = val;
      this.v = vel;
      this.render();
    }, { stiffness: 900, damping: 50 });
    pressSpring(this.input, (val) => {
      this.p = val;
      this.render();
    });
    this.input.addEventListener('input', () => this.ts.set(this.fraction()));
  }

  fraction() {
    const min = Number(this.input.min || 0);
    const max = Number(this.input.max || 100);
    return clamp((this.input.valueAsNumber - min) / (max - min || 1), 0, 1);
  }

  attach() {
    // Softer than the switch: the fill under the glass has to stay readable as a value.
    this.glass = createGlass(this.refract, { clip: true, ...optics(this, { refraction: 6, bezel: 0.9, curvature: 3, chroma: isOpaque(this.refract) ? 0.15 : 0, specular: 0.7, specularWidth: 1.5 }) });
    this.observer = new ResizeObserver(() => this.render());
    this.observer.observe(this);
    this.render();
  }

  detach() {
    this.glass?.destroy();
    this.glass = null;
    this.observer?.disconnect();
  }

  attributeChangedCallback(name) {
    if (!this.input) return;
    if (name === 'value') {
      this.input.value = this.getAttribute('value');
      this.ts.set(this.fraction());
    } else this.input.disabled = this.hasAttribute('disabled');
  }

  get value() {
    return this.input ? this.input.valueAsNumber : Number(this.getAttribute('value'));
  }
  set value(v) {
    this.setAttribute('value', String(v));
  }

  render() {
    if (!this.glass) return;
    const width = this.control.clientWidth;
    const stretch = Math.min(10, Math.abs(this.v) * 1.2);
    const w = lerp(36, 52, this.p) + stretch;
    const h = lerp(24, 34, this.p) - stretch * 0.2;
    const left = 18 + this.t * (width - 36) - w / 2;
    const top = 18 - h / 2;
    this.control.style.setProperty('--t', this.t.toFixed(4));
    this.glass.update({ x: left + 16, y: top + 16, width: w, height: h, radius: h / 2 });
    place(this.thumb, left, top, w, h, h / 2);
    place(this.shadow, left, top, w, h, h / 2);
    this.thumb.style.opacity = String(1 - this.p);
    this.shadow.style.opacity = String(this.p);
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* <lg-segmented>                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

class LgSegmented extends LgElement {
  build() {
    this.setAttribute('role', 'radiogroup');
    if (this.hasAttribute('label')) this.setAttribute('aria-label', this.getAttribute('label'));
    this.buttons = [...this.querySelectorAll(':scope > button')];
    const copy = el('span', 'lg-refract', { 'aria-hidden': 'true' });
    for (const b of this.buttons) {
      b.type = 'button';
      b.classList.add('lg-seg__option');
      b.setAttribute('role', 'radio');
      b.addEventListener('click', () => this.select(this.buttons.indexOf(b), { emit: true }));
    }
    this.refract = copy;
    this.fillCopy();
    this.shadow = el('span', 'lg-lens-shadow', { 'aria-hidden': 'true' });
    this.append(copy, this.shadow);
    this.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      this.select(this.index + step, { emit: true, focus: true });
    });
    const initial = this.getAttribute('value');
    let i = this.buttons.findIndex((b) => (initial !== null ? (b.value || b.textContent.trim()) === initial : b.getAttribute('aria-checked') === 'true'));
    this.index = Math.max(0, i);
    this.x = 0;
    this.v = 0;
    this.xs = createSpring(0, (val, vel) => {
      this.x = val;
      this.v = vel;
      this.render();
    }, { stiffness: 380, damping: 28 });
  }

  attach() {
    // Thin bezel: the label under the glass must stay legible, only the rim should bend.
    this.glass = createGlass(this.refract, { clip: true, ...optics(this, { refraction: 5, bezel: 0.35, curvature: 4, chroma: isOpaque(this.refract) ? 0.2 : 0, specular: 0.6, specularWidth: 1.5 }) });
    this.observer = new ResizeObserver(() => this.select(this.index, { immediate: true }));
    this.observer.observe(this);
    this.select(this.index, { immediate: true });
  }

  detach() {
    this.glass?.destroy();
    this.glass = null;
    this.observer?.disconnect();
  }

  fillCopy() {
    this.refract.replaceChildren(
      ...this.buttons.map((b) => {
        const c = el('span', 'lg-seg__option');
        c.innerHTML = b.innerHTML;
        return c;
      }),
    );
  }

  /** Call after changing option labels so the glass copy matches again. */
  refresh() {
    this.fillCopy();
    this.select(this.index, { immediate: true });
  }

  get value() {
    const b = this.buttons?.[this.index];
    return b ? b.value || b.textContent.trim() : this.getAttribute('value');
  }
  set value(v) {
    const i = this.buttons.findIndex((b) => (b.value || b.textContent.trim()) === String(v));
    if (i >= 0) this.select(i);
  }

  select(i, { emit = false, focus = false, immediate = false } = {}) {
    const n = this.buttons.length;
    if (!n) return;
    const next = (i + n) % n;
    const changed = next !== this.index;
    this.index = next;
    this.buttons.forEach((b, j) => {
      b.setAttribute('aria-checked', String(j === next));
      b.tabIndex = j === next ? 0 : -1;
    });
    if (focus) this.buttons[next].focus();
    this.xs.set(this.buttons[next].offsetLeft, { immediate });
    if (emit && changed) this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: this.value, index: next } }));
  }

  widthAt(pos) {
    const lefts = this.buttons.map((b) => b.offsetLeft);
    if (lefts.length < 2) return this.buttons[0].offsetWidth;
    let i = 0;
    while (i < lefts.length - 2 && pos > lefts[i + 1]) i++;
    const f = clamp((pos - lefts[i]) / (lefts[i + 1] - lefts[i] || 1), 0, 1);
    return lerp(this.buttons[i].offsetWidth, this.buttons[i + 1].offsetWidth, f);
  }

  render() {
    if (!this.glass) return;
    const first = this.buttons[0];
    const stretch = Math.min(12, Math.abs(this.v) * 0.02);
    const w = this.widthAt(this.x) + stretch;
    const h = first.offsetHeight - stretch * 0.25;
    const left = this.x - stretch / 2;
    const top = first.offsetTop + (first.offsetHeight - h) / 2;
    const r = parseFloat(getComputedStyle(first).borderTopLeftRadius) || 8;
    this.glass.update({ x: left, y: top, width: w, height: h, radius: r });
    place(this.shadow, left, top, w, h, r);
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* <lg-button>                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

class LgButton extends LgElement {
  static observedAttributes = ['disabled'];

  build() {
    const href = this.getAttribute('href');
    this.button = href ? el('a', 'lg-button__el', { href }) : el('button', 'lg-button__el', { type: this.getAttribute('type') ?? 'button' });
    if (href && this.hasAttribute('target')) this.button.setAttribute('target', this.getAttribute('target'));
    if (!href) this.button.disabled = this.hasAttribute('disabled');
    if (this.hasAttribute('aria-label')) this.button.setAttribute('aria-label', this.getAttribute('aria-label'));
    const label = el('span', 'lg-button__label');
    label.append(...this.childNodes);
    this.button.append(label);
    this.replaceChildren(this.button);
    this.surface = new Surface(this.button, { owner: this, radius: radiusOf(this, Infinity), bleed: 12, optics: optics(this, { refraction: 14, bezel: 0.8, curvature: 3, chroma: 0.12, specular: 0.6, specularWidth: 1.5 }) });
    pressSpring(this.button, (p) => this.surface.setDelta({ x: -5 * p, y: 2 * p, w: 10 * p, h: -4 * p }));
  }
  attach() {
    this.surface.attach();
  }
  detach() {
    this.surface.detach();
  }
  attributeChangedCallback() {
    if (this.button) this.button.disabled = this.hasAttribute('disabled');
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* <lg-panel>                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

class LgPanel extends LgElement {
  build() {
    const body = el('div', 'lg-panel__body');
    body.append(...this.childNodes);
    this.append(body);
    this.surface = new Surface(this, { radius: radiusOf(this, 24), bleed: 4, optics: optics(this, { refraction: 24, bezel: 0.3, curvature: 4, chroma: 0.1, blur: 2, specular: 0.5, specularWidth: 2 }) });
  }
  attach() {
    this.surface.attach();
  }
  detach() {
    this.surface.detach();
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* <lg-navbar>                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

class LgNavbar extends LgElement {
  build() {
    this.setAttribute('role', this.getAttribute('role') ?? 'navigation');
    this.links = [...this.querySelectorAll(':scope > a, :scope > button')];
    this.copy = el('span', 'lg-nav__copy', { 'aria-hidden': 'true' });
    this.fillCopy();
    for (const a of this.links) {
      a.addEventListener('pointerenter', () => this.moveTo(this.links.indexOf(a)));
      a.addEventListener('focus', () => this.moveTo(this.links.indexOf(a)));
      a.addEventListener('click', () => this.setCurrent(this.links.indexOf(a)));
    }
    this.shadow = el('span', 'lg-lens-shadow', { 'aria-hidden': 'true' });
    this.append(this.copy, this.shadow);
    this.addEventListener('pointerleave', () => this.moveTo(this.current));
    this.addEventListener('focusout', (e) => {
      if (!this.contains(e.relatedTarget)) this.moveTo(this.current);
    });
    this.current = Math.max(0, this.links.findIndex((a) => a.getAttribute('aria-current') === 'page'));
    this.surface = new Surface(this, { radius: radiusOf(this, Infinity), bleed: 8, optics: optics(this, { refraction: 16, bezel: 0.8, curvature: 3, chroma: 0.1, blur: 1, specular: 0.55, specularWidth: 1.5 }) });
    this.x = 0;
    this.v = 0;
    this.xs = createSpring(0, (val, vel) => {
      this.x = val;
      this.v = vel;
      this.render();
    }, { stiffness: 380, damping: 30 });
  }

  attach() {
    this.surface.attach();
    this.glass = createGlass(this.copy, { clip: true, refraction: 8, bezel: 0.6, curvature: 3, chroma: 0, specular: 0.7, specularWidth: 1.5 });
    this.observer = new ResizeObserver(() => this.moveTo(this.target ?? this.current, true));
    this.observer.observe(this);
    this.moveTo(this.current, true);
  }

  detach() {
    this.surface.detach();
    this.glass?.destroy();
    this.glass = null;
    this.observer?.disconnect();
  }

  fillCopy() {
    this.copy.replaceChildren(
      ...this.links.map((a) => {
        const c = el('span');
        c.innerHTML = a.innerHTML;
        return c;
      }),
    );
  }

  /** Call after changing link text (e.g. a language switch) so the glass copy matches again. */
  refresh() {
    this.fillCopy();
    this.moveTo(this.target ?? this.current, true);
  }

  setCurrent(i) {
    this.links.forEach((a, j) => (j === i ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    this.current = i;
    this.moveTo(i);
  }

  moveTo(i, immediate = false) {
    const a = this.links[i];
    if (!a) return;
    this.target = i;
    this.xs.set(a.offsetLeft, { immediate });
  }

  widthAt(pos) {
    const lefts = this.links.map((a) => a.offsetLeft);
    if (lefts.length < 2) return this.links[0].offsetWidth;
    let i = 0;
    while (i < lefts.length - 2 && pos > lefts[i + 1]) i++;
    const f = clamp((pos - lefts[i]) / (lefts[i + 1] - lefts[i] || 1), 0, 1);
    return lerp(this.links[i].offsetWidth, this.links[i + 1].offsetWidth, f);
  }

  render() {
    if (!this.glass || !this.links.length) return;
    const first = this.links[0];
    const stretch = Math.min(14, Math.abs(this.v) * 0.025);
    const w = this.widthAt(this.x) + stretch;
    const h = first.offsetHeight - stretch * 0.2;
    const left = this.x - stretch / 2;
    const top = first.offsetTop + (first.offsetHeight - h) / 2;
    this.glass.update({ x: left, y: top, width: w, height: h, radius: h / 2 });
    place(this.shadow, left, top, w, h, h / 2);
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* <lg-menubar> and <lg-menu>                                                                         */
/* ------------------------------------------------------------------------------------------------ */

class LgMenubar extends LgElement {
  build() {
    this.setAttribute('role', 'menubar');
    // A glass rod: the bend spans the whole height, so the backdrop visibly lenses across the bar.
    this.surface = new Surface(this, { radius: radiusOf(this, Infinity), bleed: 8, optics: optics(this, { refraction: 20, bezel: 1, curvature: 2.5, chroma: 0.2, blur: 0.5, specular: 0.9, specularWidth: 2.5 }) });
    this.addEventListener('keydown', (e) => {
      const menus = [...this.querySelectorAll(':scope > lg-menu')];
      const i = menus.findIndex((m) => m.contains(document.activeElement));
      if (i < 0) return;
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const wasOpen = menus[i].open;
      menus[i].close();
      const next = menus[(i + step + menus.length) % menus.length];
      next.trigger.focus();
      if (wasOpen) next.show();
    });
  }
  attach() {
    this.surface.attach();
  }
  detach() {
    this.surface.detach();
  }
}

let openMenu = null;
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => {
    if (openMenu && !openMenu.contains(e.target)) openMenu.close();
  });
}

class LgMenu extends LgElement {
  build() {
    const items = [...this.childNodes];
    this.trigger = el('button', 'lg-menu__trigger', { type: 'button', role: 'menuitem', 'aria-haspopup': 'menu', 'aria-expanded': 'false' });
    this.trigger.textContent = this.getAttribute('label') ?? '';
    this.panel = el('div', 'lg-menu__panel', { role: 'menu' });
    this.panel.hidden = true;
    this.list = el('div', 'lg-menu__items');
    this.list.append(...items);
    this.items = [...this.list.querySelectorAll(':scope > button')];
    this.copy = el('div', 'lg-menu__copy', { 'aria-hidden': 'true' });
    for (const node of this.list.children) {
      if (node.tagName === 'HR') {
        this.copy.append(el('hr'));
        continue;
      }
      node.type = 'button';
      node.setAttribute('role', 'menuitem');
      node.tabIndex = -1;
      const shortcut = node.getAttribute('data-shortcut');
      if (shortcut) node.insertAdjacentHTML('beforeend', `<kbd>${shortcut}</kbd>`);
      const c = el('span');
      c.innerHTML = node.innerHTML;
      this.copy.append(c);
    }
    this.shadow = el('span', 'lg-lens-shadow', { 'aria-hidden': 'true' });
    this.panel.append(this.list, this.copy, this.shadow);
    this.replaceChildren(this.trigger, this.panel);
    this.surface = new Surface(this.panel, { owner: this, radius: radiusOf(this, 18), bleed: 8, optics: optics(this, { refraction: 22, bezel: 0.35, curvature: 3, chroma: 0.15, blur: 6, specular: 0.8, specularWidth: 2.5 }) });

    this.trigger.addEventListener('click', () => (this.open ? this.close() : this.show()));
    this.trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.show();
        this.focusItem(0);
      }
    });
    this.trigger.addEventListener('pointerenter', () => {
      if (openMenu && openMenu !== this && openMenu.parentElement === this.parentElement) this.show();
    });
    this.panel.addEventListener('keydown', (e) => {
      const i = this.items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.focusItem(i + (e.key === 'ArrowDown' ? 1 : -1));
      } else if (e.key === 'Escape') {
        this.close();
        this.trigger.focus();
      } else if (e.key === 'Tab') this.close();
    });
    for (const [i, item] of this.items.entries()) {
      item.addEventListener('pointerenter', () => this.highlight(i));
      item.addEventListener('focus', () => this.highlight(i));
      item.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('select', { bubbles: true, detail: { item, value: item.value || item.textContent.trim() } }));
        this.close();
        this.trigger.focus();
      });
    }
    this.panel.addEventListener('pointerleave', () => this.highlight(-1));

    this.row = { y: 0, v: 0, on: 0 };
    this.ys = createSpring(0, (val, vel) => {
      this.row.y = val;
      this.row.v = vel;
      this.renderRow();
    }, { stiffness: 520, damping: 36 });
    this.os = createSpring(0, (val) => {
      this.panel.style.opacity = String(clamp(val, 0, 1));
      this.surface.setDelta({ h: -(1 - val) * this.panel.offsetHeight * 0.35 });
      if (val <= 0.001 && !this.open) this.panel.hidden = true;
    }, { stiffness: 520, damping: 34 });
  }

  attach() {
    this.lens = createGlass(this.copy, { clip: true, hidden: true, refraction: 6, bezel: 0.5, curvature: 3, chroma: 0.15, specular: 0.4, specularWidth: 1.5 });
  }

  detach() {
    this.close();
    this.surface.detach();
    this.lens?.destroy();
    this.lens = null;
  }

  show() {
    if (this.open) return;
    if (openMenu && openMenu !== this) openMenu.close();
    openMenu = this;
    this.open = true;
    this.panel.hidden = false;
    this.trigger.setAttribute('aria-expanded', 'true');
    if (!this.surface.mode) this.surface.attach();
    this.surface.update();
    this.os.set(1);
  }

  close() {
    if (!this.open) return;
    this.open = false;
    if (openMenu === this) openMenu = null;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.highlight(-1);
    this.os.set(0);
  }

  focusItem(i) {
    const n = this.items.length;
    if (!n) return;
    this.items[(i + n) % n].focus();
  }

  highlight(i) {
    const item = this.items[i];
    this.row.index = i;
    if (!item) {
      this.lens?.update({ hidden: true });
      this.shadow.style.opacity = '0';
      this.row.on = 0;
      return;
    }
    const y = item.offsetTop;
    this.ys.set(y, { immediate: !this.row.on });
    this.row.on = 1;
  }

  renderRow() {
    const item = this.items[this.row.index];
    if (!item || !this.lens) return;
    const stretch = Math.min(6, Math.abs(this.row.v) * 0.01);
    const w = item.offsetWidth + stretch;
    const h = item.offsetHeight + stretch * 0.5;
    const x = item.offsetLeft - stretch / 2;
    const y = this.row.y - stretch * 0.25;
    // the copy sits 6px inside the panel (its padding), so lens coords are relative to the copy
    this.lens.update({ hidden: false, x, y, width: w, height: h, radius: 8 });
    place(this.shadow, x + 6, y + 6, w, h, 8);
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* <lg-toast> and toast()                                                                             */
/* ------------------------------------------------------------------------------------------------ */

class LgToast extends LgElement {
  build() {
    this.setAttribute('role', 'status');
    const text = el('span', 'lg-toast__text');
    text.append(...this.childNodes);
    const children = [text];
    const name = this.getAttribute('icon');
    if (name) {
      const i = el('span', 'lg-toast__icon');
      i.innerHTML = icon(name);
      children.unshift(i);
    }
    this.replaceChildren(...children);
    this.surface = new Surface(this, { radius: radiusOf(this, Infinity), bleed: 16, optics: optics(this, { refraction: 14, bezel: 0.8, curvature: 3, chroma: 0.15, blur: 1, specular: 0.6, specularWidth: 1.5 }) });
  }
  attach() {
    this.surface.attach();
  }
  detach() {
    this.surface.detach();
  }
}

const regions = new WeakMap();
function regionFor(container) {
  let region = regions.get(container);
  if (region?.isConnected) return region;
  region = el('div', 'lg-toast-region', { 'aria-live': 'polite' });
  if (container !== document.body) {
    region.classList.add('lg-toast-region--local');
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  }
  container.append(region);
  regions.set(container, region);
  return region;
}

/**
 * Show a glass toast. Returns { close() }.
 *   toast('Saved', { icon: 'check' | 'info' | 'alert' | 'bell' | '<svg…>', duration: 2600,
 *                    container: element, tone: 'dark' | 'light', backdrop: selector })
 * Inside a container marked data-lg-backdrop the toast refracts that backdrop in every engine.
 */
export function toast(message, { icon: name = 'check', duration = 2600, container = document.body, tone, backdrop } = {}) {
  injectStyles();
  const region = regionFor(container);
  const t = el('lg-toast', null, name ? { icon: name } : {});
  if (tone) t.setAttribute('tone', tone);
  if (backdrop) t.setAttribute('backdrop', backdrop);
  t.textContent = message;
  region.prepend(t);

  let y = -64;
  const place = (val, vel) => {
    y = val;
    t.style.transform = `translateY(${val}px)`;
    t.style.opacity = String(clamp(1 + val / 64, 0, 1));
    const stretch = Math.min(16, Math.abs(vel) * 0.03);
    t.surface?.setDelta({ x: -stretch / 2, w: stretch, h: -stretch * 0.3, y: stretch * 0.15 });
  };
  const spring = createSpring(y, place, { stiffness: 380, damping: 22 });
  place(y, 0);
  requestAnimationFrame(() => spring.set(0));

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    spring.set(-64);
    setTimeout(() => t.remove(), reducedMotion.matches ? 0 : 600);
  };
  if (duration > 0) setTimeout(close, duration);
  t.addEventListener('click', close);
  return { close, element: t };
}

/* ------------------------------------------------------------------------------------------------ */
/* <lg-dock>                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

class LgDock extends LgElement {
  build() {
    this.items = el('div', 'lg-dock__items');
    this.items.append(...this.childNodes);
    this.shadow = el('span', 'lg-lens-shadow', { 'aria-hidden': 'true' });
    this.append(this.items, this.shadow);
    this.surface = new Surface(this, { radius: radiusOf(this, 24), bleed: 4, optics: optics(this, { refraction: 18, bezel: 0.5, curvature: 4, chroma: 0.1, blur: 2, specular: 0.5, specularWidth: 2 }) });
    this.pos = 0;
    this.presence = 0;
    this.ps = createSpring(0, (val) => {
      this.presence = val;
      this.render();
    }, { stiffness: 500, damping: 34 });
    this.xs = createSpring(0, (val) => {
      this.pos = val;
      this.render();
    }, { stiffness: 700, damping: 40 });
    this.addEventListener('pointermove', (e) => {
      const r = this.items.getBoundingClientRect();
      const x = e.clientX - r.left;
      this.xs.set(x, { immediate: this.presence < 0.05 });
      this.ps.set(1);
    });
    this.addEventListener('pointerleave', () => this.ps.set(0));
    this.addEventListener('focusin', (e) => {
      const r = this.items.getBoundingClientRect();
      const b = e.target.getBoundingClientRect();
      this.xs.set(b.left - r.left + b.width / 2, { immediate: this.presence < 0.05 });
      this.ps.set(1);
    });
    this.addEventListener('focusout', (e) => {
      if (!this.contains(e.relatedTarget)) this.ps.set(0);
    });
  }

  attach() {
    this.surface.attach();
    // A dome (bezel 1) magnifies the whole disc, not just its rim.
    this.lens = createGlass(this.items, { hidden: true, refraction: 16, bezel: 1, curvature: 2, chroma: 0, specular: 0.6, specularWidth: 1.5 });
  }

  detach() {
    this.surface.detach();
    this.lens?.destroy();
    this.lens = null;
  }

  render() {
    if (!this.lens) return;
    const p = this.presence;
    if (p < 0.02) {
      this.lens.update({ hidden: true });
      this.shadow.style.opacity = '0';
      return;
    }
    const H = this.items.offsetHeight;
    const size = H * lerp(0.7, 1, p);
    const x = clamp(this.pos - size / 2, 0, this.items.offsetWidth - size);
    const y = (H - size) / 2;
    this.lens.update({ hidden: false, x, y, width: size, height: size, radius: size / 2 });
    place(this.shadow, x + this.items.offsetLeft, y + this.items.offsetTop, size, size, size / 2);
    this.shadow.style.opacity = String(p);
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* <lg-lens>                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

class LgLens extends LgElement {
  build() {
    this.content = el('div', 'lg-lens__content');
    this.content.append(...this.childNodes);
    this.shadow = el('span', 'lg-lens-shadow', { 'aria-hidden': 'true' });
    this.append(this.content, this.shadow);
    const num = (a, d) => (this.hasAttribute(a) ? Number(this.getAttribute(a)) : d);
    this.size = { w: num('width', num('size', 160)), h: num('height', num('size', 160)) };
    this.rest = { x: num('x', 50) / 100, y: num('y', 50) / 100 };
    this.pos = { x: 0, y: 0 };
    this.press = 0;
    this.xs = createSpring(0, (v) => {
      this.pos.x = v;
      this.render();
    }, { stiffness: 260, damping: 26 });
    this.ys = createSpring(0, (v) => {
      this.pos.y = v;
      this.render();
    }, { stiffness: 260, damping: 26 });
    this.ps = createSpring(0, (v) => {
      this.press = v;
      this.render();
    }, { stiffness: 600, damping: 36 });
    const follow = (e, immediate) => {
      const r = this.getBoundingClientRect();
      this.xs.set(e.clientX - r.left, { immediate });
      this.ys.set(e.clientY - r.top, { immediate });
    };
    this.addEventListener('pointermove', (e) => follow(e, false));
    this.addEventListener('pointerdown', (e) => {
      this.ps.set(1);
      follow(e, false);
    });
    this.addEventListener('pointerup', () => this.ps.set(0));
    this.addEventListener('pointerleave', () => {
      this.ps.set(0);
      this.goHome();
    });
  }

  attach() {
    const r = Math.min(this.size.w, this.size.h) / 2;
    this.glass = createGlass(this.content, { ...optics(this, { refraction: 26, bezel: 0.6, curvature: 4, chroma: 0.15, specular: 0.5, specularWidth: 2 }), radius: radiusOf(this, r) });
    this.observer = new ResizeObserver(() => this.goHome(true));
    this.observer.observe(this);
    this.goHome(true);
  }

  detach() {
    this.glass?.destroy();
    this.glass = null;
    this.observer?.disconnect();
  }

  goHome(immediate = false) {
    this.xs.set(this.clientWidth * this.rest.x, { immediate });
    this.ys.set(this.clientHeight * this.rest.y, { immediate });
  }

  /** Change size and optics at runtime: { width, height, radius, refraction, bezel, … }. */
  configure(next = {}) {
    if (next.width) this.size.w = next.width;
    if (next.height) this.size.h = next.height;
    if (next.radius !== undefined) this.setAttribute('radius', String(next.radius));
    const { width, height, radius, ...rest } = next;
    this.glass?.update(rest);
    this.render();
  }

  /** Move the lens programmatically (content coordinates, px). */
  moveTo(x, y) {
    this.xs.set(x);
    this.ys.set(y);
  }

  render() {
    if (!this.glass) return;
    const w = this.size.w * (1 + 0.08 * this.press);
    const h = this.size.h * (1 - 0.05 * this.press);
    const x = clamp(this.pos.x - w / 2, 0, this.clientWidth - w);
    const y = clamp(this.pos.y - h / 2, 0, this.clientHeight - h);
    const r = Math.min(radiusOf(this, Math.min(this.size.w, this.size.h) / 2), w / 2, h / 2);
    this.glass.update({ x, y, width: w, height: h, radius: r });
    place(this.shadow, x, y, w, h, r);
  }
}

/* ------------------------------------------------------------------------------------------------ */

const ELEMENTS = {
  'lg-switch': LgSwitch,
  'lg-slider': LgSlider,
  'lg-segmented': LgSegmented,
  'lg-button': LgButton,
  'lg-panel': LgPanel,
  'lg-navbar': LgNavbar,
  'lg-menubar': LgMenubar,
  'lg-menu': LgMenu,
  'lg-toast': LgToast,
  'lg-dock': LgDock,
  'lg-lens': LgLens,
};
if (typeof customElements !== 'undefined') {
  for (const [name, ctor] of Object.entries(ELEMENTS)) if (!customElements.get(name)) customElements.define(name, ctor);
}

export { LgSwitch, LgSlider, LgSegmented, LgButton, LgPanel, LgNavbar, LgMenubar, LgMenu, LgToast, LgDock, LgLens, Surface };
