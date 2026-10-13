/* eslint-disable */
// @ts-nocheck -- vendored JavaScript, kept as written; LiquidGlassDecor.vue types what it uses
/*
 * Vendored unchanged from Liquid Glass for the Web (https://liquidglass.dev,
 * https://github.com/gentpan/liquidglass), lib/liquid-glass.js v1.0.0 at commit 068ad22.
 * The Liquid Glass theme uses it (components/themes/LiquidGlassDecor.vue). It is a .ts file only so
 * ts-loader compiles its newer syntax for webpack. Update it by pasting the new file below this header
 * rather than editing it: its filter graph holds per-browser fixes its author measured.
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
 * liquid-glass.js v1.0.0 — refractive "liquid glass" for the web that renders the same in Chromium,
 * WebKit (Safari, every iOS browser) and Gecko (Firefox).
 *
 * The glass bends the element's OWN rendered pixels with an SVG feDisplacementMap referenced from
 * CSS `filter: url(#…)`. `backdrop-filter: url(#…)` would be simpler but only Chromium renders it,
 * so it is offered only as an opt-in enhancement (mode: 'backdrop').
 *
 * The displacement map is a small PNG generated at runtime from the lens shape: red/green hold the
 * horizontal/vertical bend, blue holds the rim highlight, alpha is the lens coverage. Outside the lens
 * the source passes through untouched, so text stays crisp, selectable and clickable.
 *
 * No dependencies. ES module.
 */

const NS = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';
const NEUTRAL = 128;
const MAP_CACHE_SIZE = 48;

export const DEFAULTS = Object.freeze({
  // Lens rectangle in CSS px, relative to the filtered element's border box.
  x: 0,
  y: 0,
  width: 120,
  height: 64,
  radius: 32,
  // Optics.
  refraction: 18, // maximum bend at the rim, CSS px
  bezel: 0.6, // curved rim width as a fraction of the lens half-size (min side); 1 = full dome
  curvature: 4, // rim profile exponent: 2 = circular, 4 = squircle-like, higher = steeper rim
  ior: 1.5, // index of refraction; shapes how quickly the bend fades from the rim inward
  invert: false, // false = convex lens (magnifies), true = concave (content pushed outward)
  chroma: 0.12, // colour fringe; blue bends (1 + chroma)x as far as red. 0 skips the extra passes
  blur: 0, // frost, CSS px
  specular: 0.45, // rim highlight 0..1. 0 skips the pass
  specularWidth: 2, // rim highlight width, CSS px
  lightAngle: -120, // degrees; 0 = light from the right, -90 = from the top. The lit rim is brightest, the far rim reflects dimly
  mapScale: 0, // map pixels per CSS px; 0 = devicePixelRatio capped at 2
});

// Keys that change the displacement map itself. Everything else (position, strength) is a cheap
// attribute update on an existing filter.
const MAP_KEYS = ['width', 'height', 'radius', 'bezel', 'curvature', 'ior', 'invert', 'specular', 'specularWidth', 'lightAngle'];

export const engine = detectEngine();

function detectEngine() {
  if (typeof navigator === 'undefined') return 'unknown';
  const brands = navigator.userAgentData?.brands;
  if (brands?.some((b) => /Chromium/.test(b.brand))) return 'blink';
  const ua = navigator.userAgent;
  if (/Firefox\//.test(ua)) return 'gecko';
  // Every iOS browser is WebKit; their UAs carry CriOS/FxiOS rather than Chrome/Firefox.
  if (/AppleWebKit\//.test(ua) && !/Chrome\/|Chromium\/|Edg\//.test(ua)) return 'webkit';
  return /Chrome\//.test(ua) ? 'blink' : 'unknown';
}

/* ------------------------------------------------------------------------------------------------ */
/* Displacement map                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

const profileCache = new Map();

// Normalised bend m(s) for s = (distance from rim) / bezel in [0, 1], tabulated once per optics.
// The glass surface height is h(s) = (1 - (1 - s)^k)^(1/k). A vertical ray hitting a surface tilted
// by theta refracts to asin(sin(theta) / ior); the lateral offset grows with tan(theta - refracted).
function profileTable(curvature, ior) {
  const key = `${curvature}|${ior}`;
  let table = profileCache.get(key);
  if (table) return table;
  const N = 512;
  table = new Float32Array(N + 1);
  let max = 0;
  for (let i = 0; i <= N; i++) {
    const s = Math.min(i / N, 1 - 1e-6);
    const a = Math.pow(1 - s, curvature);
    const slope = Math.pow(1 - s, curvature - 1) * Math.pow(Math.max(1 - a, 1e-9), 1 / curvature - 1);
    const theta = Math.atan(slope);
    const refracted = Math.asin(Math.sin(theta) / ior);
    const bend = Math.tan(theta - refracted);
    table[i] = bend;
    if (bend > max) max = bend;
  }
  for (let i = 0; i <= N; i++) table[i] /= max || 1;
  table[N] = 0;
  profileCache.set(key, table);
  return table;
}

/**
 * Paint the displacement map for a lens into a canvas.
 * Returns { canvas, width, height, scale } — usable by the SVG path (as a data URL) and by WebGL
 * (as a texture), so both renderers share one optical model.
 */
export function renderLensMap(options = {}, scale = 1) {
  const p = { ...DEFAULTS, ...options };
  const w = Math.max(2, Math.round(p.width * scale));
  const h = Math.max(2, Math.round(p.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(w, h);
  const px = image.data;

  const sx = p.width / w; // CSS px per map pixel (x); equals 1 / scale up to rounding
  const sy = p.height / h;
  const hw = p.width / 2;
  const hh = p.height / 2;
  const r = Math.max(0, Math.min(p.radius, hw, hh));
  const bezel = Math.max(0.5, p.bezel * Math.min(hw, hh));
  const table = profileTable(p.curvature, p.ior);
  const N = table.length - 1;
  const rimWidth = Math.max(0.5, p.specularWidth);
  const aa = Math.max(sx, sy); // one map pixel of anti-aliasing at the rim
  const angle = (p.lightAngle * Math.PI) / 180;
  const lx = Math.cos(angle);
  const ly = Math.sin(angle);
  const dir = p.invert ? -1 : 1;

  // The rounded rectangle is symmetric in both axes: compute the top-left quadrant only and mirror
  // it, flipping the sign of the x bend across the vertical axis and of the y bend across the
  // horizontal axis. This keeps per-frame regeneration (squish, resize) inside the frame budget.
  const qw = Math.ceil(w / 2);
  const qh = Math.ceil(h / 2);
  for (let j = 0; j < qh; j++) {
    const y = (j + 0.5) * sy - hh; // <= 0
    for (let i = 0; i < qw; i++) {
      const x = (i + 0.5) * sx - hw; // <= 0
      // Signed distance to the rounded rectangle, evaluated on |p|.
      const qx = -x - (hw - r);
      const qy = -y - (hh - r);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const corner = Math.hypot(ox, oy);
      const dist = corner + Math.min(Math.max(qx, qy), 0) - r; // < 0 inside
      const alpha = Math.min(1, Math.max(0, 0.5 - dist / aa));
      if (alpha <= 0) continue; // transparent: composited over neutral grey in the filter

      // Outward normal on |p| (points away from the centre).
      let nx;
      let ny;
      if (qx > 0 && qy > 0) {
        nx = ox / corner;
        ny = oy / corner;
      } else if (qx > qy) {
        nx = 1;
        ny = 0;
      } else {
        nx = 0;
        ny = 1;
      }

      const inset = Math.max(0, -dist);
      const s = inset / bezel;
      const m = s >= 1 ? 0 : table[Math.min(N, Math.round(s * N))];
      // Convex glass samples from further inside (towards the centre) near the rim.
      const bx = Math.round(127 * m * nx * dir);
      const by = Math.round(127 * m * ny * dir);

      // Rim highlight: a crisp line plus a softer inner glow, brightest where the rim faces the
      // light, with a dimmer reflection on the far side.
      const crisp = Math.max(0, 1 - inset / rimWidth);
      const glow = Math.max(0, 1 - inset / (rimWidth * 5));
      const rim = p.specular * (crisp * crisp + 0.3 * glow * glow);
      const a = Math.round(alpha * 255);

      const i2 = w - 1 - i;
      const j2 = h - 1 - j;
      // top-left: outward normal (-nx, -ny); sample towards +x/+y (inward)
      write(px, (j * w + i) * 4, NEUTRAL + bx, NEUTRAL + by, rimLight(rim, -nx * lx - ny * ly), a);
      if (i2 !== i) write(px, (j * w + i2) * 4, NEUTRAL - bx, NEUTRAL + by, rimLight(rim, nx * lx - ny * ly), a);
      if (j2 !== j) write(px, (j2 * w + i) * 4, NEUTRAL + bx, NEUTRAL - by, rimLight(rim, -nx * lx + ny * ly), a);
      if (i2 !== i && j2 !== j) write(px, (j2 * w + i2) * 4, NEUTRAL - bx, NEUTRAL - by, rimLight(rim, nx * lx + ny * ly), a);
    }
  }
  ctx.putImageData(image, 0, 0);
  return { canvas, width: w, height: h, scale };
}

// Blue channel for a rim pixel: `facing` is n·L for its outward normal.
function rimLight(rim, facing) {
  const shade = 0.12 + 0.88 * (facing > 0 ? facing : -0.4 * facing);
  return NEUTRAL + Math.round(127 * Math.min(1, rim * shade));
}

function write(px, o, r, g, b, a) {
  px[o] = r;
  px[o + 1] = g;
  px[o + 2] = b;
  px[o + 3] = a;
}

const mapCache = new Map();

function mapKeyOf(p, scale) {
  return MAP_KEYS.map((k) => p[k]).join('|') + '|' + scale;
}

// Returns { key, url, decoded, ready }. The PNG is decoded through an <img> before the filter uses
// it: feImage loads data URLs asynchronously, and WebKit caches whatever the filter produced while
// the image was still missing (an empty result) until the filter id changes.
function lensMap(p, scale, key) {
  let entry = mapCache.get(key);
  if (entry) {
    mapCache.delete(key); // refresh LRU position
  } else {
    const url = renderLensMap(p, scale).canvas.toDataURL('image/png');
    entry = { key, url, decoded: false, ready: null };
    const img = new Image();
    img.src = url;
    entry.ready = img
      .decode()
      .catch(() => {})
      .then(() => {
        entry.decoded = true;
      });
    if (mapCache.size >= MAP_CACHE_SIZE) mapCache.delete(mapCache.keys().next().value);
  }
  mapCache.set(key, entry);
  return entry;
}

/* ------------------------------------------------------------------------------------------------ */
/* SVG filter                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

let svgRoot = null;

function defsNode() {
  if (svgRoot?.isConnected) return svgRoot.firstChild;
  svgRoot = document.createElementNS(NS, 'svg');
  svgRoot.setAttribute('aria-hidden', 'true');
  svgRoot.setAttribute('width', '0');
  svgRoot.setAttribute('height', '0');
  // Not display:none — filters inside a display:none <svg> stop resolving in some engines.
  svgRoot.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  svgRoot.appendChild(document.createElementNS(NS, 'defs'));
  document.body.appendChild(svgRoot);
  return svgRoot.firstChild;
}

function node(name, attrs) {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

const CHANNELS = [
  '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
  '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
  '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
];

// Filter graph (all coordinates are fractions of the element box — see bendScale):
//   map        = lens PNG over neutral grey (128 = no bend), only inside the lens rect
//   bend       = map with R/G squeezed towards 128 where the engine scales x and y differently
//   refracted  = feDisplacementMap(source, bend)           (x3 with per-channel scale when chroma > 0)
//   lit        = refracted + white * (2 * map.b - 1)        (rim highlight from the blue channel)
//   result     = (lit IN lensShape) OVER (source OUT lensShape)
function buildGraph(filter, p) {
  filter.replaceChildren();
  const lensRect = [];
  const add = (name, attrs, inLens) => {
    const n = node(name, attrs);
    filter.appendChild(n);
    if (inLens) lensRect.push(n);
    return n;
  };

  add('feFlood', { 'flood-color': 'rgb(128,128,128)', 'flood-opacity': '1', result: 'neutral' }, true);
  const image = add('feImage', { preserveAspectRatio: 'none', result: 'lensShape' }, true);
  add('feComposite', { in: 'lensShape', in2: 'neutral', operator: 'over', result: 'map' }, true);
  const aspect = engine === 'webkit' ? add('feColorMatrix', { in: 'map', type: 'matrix', result: 'bend' }, true) : null;
  const bendMap = aspect ? 'bend' : 'map';

  let source = 'SourceGraphic';
  let blur = null;
  if (p.blur > 0) {
    blur = add('feGaussianBlur', { in: 'SourceGraphic', result: 'frosted' });
    source = 'frosted';
  }

  const displace = [];
  if (p.chroma > 0) {
    CHANNELS.forEach((values, i) => {
      displace.push(add('feDisplacementMap', { in: source, in2: bendMap, xChannelSelector: 'R', yChannelSelector: 'G' }, true));
      add('feColorMatrix', { type: 'matrix', values, result: `ch${i}` }, true);
    });
    // Premultiplied sum: exact for opaque content, which is why the glass surface needs a background.
    add('feComposite', { in: 'ch0', in2: 'ch1', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'rg' }, true);
    add('feComposite', { in: 'rg', in2: 'ch2', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'refracted' }, true);
  } else {
    displace.push(
      add('feDisplacementMap', { in: source, in2: bendMap, xChannelSelector: 'R', yChannelSelector: 'G', result: 'refracted' }, true),
    );
  }

  let lit = 'refracted';
  if (p.specular > 0) {
    add('feColorMatrix', { in: 'map', type: 'matrix', values: `0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 2 0 ${-(2 * NEUTRAL) / 255}`, result: 'rim' }, true);
    add('feComposite', { in: 'rim', in2: 'refracted', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'lit' }, true);
    lit = 'lit';
  }

  add('feComposite', { in: lit, in2: 'lensShape', operator: 'in', result: 'lens' }, true);
  add('feComposite', { in: 'SourceGraphic', in2: 'lensShape', operator: 'out', result: 'outside' });
  add('feComposite', { in: 'lens', in2: 'outside', operator: 'over' });
  return { image, aspect, blur, displace, lensRect };
}

// With primitiveUnits="objectBoundingBox" (the only units WebKit renders — userSpaceOnUse turns the
// whole element blank), feDisplacementMap's `scale` is a fraction of the box, and each engine turns
// it into pixels differently (measured):
//   Blink:  x and y both use width
//   WebKit: x uses width, y uses height
//   Gecko:  x and y both use sqrt((w^2 + h^2) / 2)
// Returns the `scale` that bends `px` pixels on both axes, plus per-axis factors (<= 1) that squeeze
// the map's R/G channels where the engine would otherwise over-bend one axis.
function bendScale(px, w, h) {
  if (engine === 'webkit') {
    const m = Math.min(w, h);
    return { scale: (2 * px) / m, kx: m / w, ky: m / h };
  }
  if (engine === 'gecko') return { scale: (2 * px) / Math.sqrt((w * w + h * h) / 2), kx: 1, ky: 1 };
  return { scale: (2 * px) / w, kx: 1, ky: 1 };
}

function setRect(n, x, y, w, h) {
  n.setAttribute('x', x);
  n.setAttribute('y', y);
  n.setAttribute('width', w);
  n.setAttribute('height', h);
}

/* ------------------------------------------------------------------------------------------------ */
/* Controller                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

let uid = 0;

/**
 * Put a glass lens on `target`.
 *
 * mode 'content' (default): bends target's own pixels. Works everywhere. Put the thing to refract
 *   INSIDE target (or a decorative copy of it — see references/patterns.md).
 * mode 'backdrop': bends what is behind target via `backdrop-filter: url()`. Chromium only; other
 *   engines get `fallback` (a plain CSS backdrop-filter) instead.
 *
 * Options: everything in DEFAULTS, plus
 *   fit: true       lens follows target's own size (x = y = 0, width/height = border box)
 *   clip: true      clip target to the lens shape (overlay-copy pattern)
 *   fallback: str   backdrop-filter used by mode 'backdrop' outside Chromium
 *   sync: true      apply updates immediately instead of on the next animation frame
 *   hidden: true    no lens at all (filter removed; with clip, the element is clipped away).
 *                   Toggle with update({ hidden }) — e.g. a magnifier when the pointer leaves
 *
 * Lens coordinates are CSS px relative to target's border box; they are converted to fractions of
 * that box internally, and the filter output is clipped to it.
 */
export function createGlass(target, options = {}) {
  const base = `lg${++uid}`;
  const mode = options.mode ?? 'content';
  const fallback = options.fallback ?? 'blur(12px) saturate(1.6)';
  const p = { ...DEFAULTS, ...pick(options) };
  const flags = { fit: !!options.fit, clip: !!options.clip, sync: !!options.sync, hidden: !!options.hidden };
  const useBackdropURL = mode === 'backdrop' && engine === 'blink';
  const active = mode !== 'backdrop' || useBackdropURL;

  if (!active) {
    target.style.backdropFilter = fallback;
    target.style.webkitBackdropFilter = fallback;
  }

  const filter = node('filter', {
    filterUnits: 'objectBoundingBox',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    primitiveUnits: 'objectBoundingBox',
    // sRGB keeps 128 meaning "no bend"; the default linearRGB would shift every pixel.
    'color-interpolation-filters': 'sRGB',
  });
  if (active) defsNode().appendChild(filter);

  let graph = null;
  let structure = '';
  let wanted = ''; // key of the newest map requested
  let requested = 0; // request counter, so a slow decode never replaces a newer map
  let shown = { key: '', seq: -1 }; // map currently referenced by feImage
  let version = 0;
  let frame = 0;
  let settleTimers = [];
  let destroyed = false;
  let box = { width: target.offsetWidth, height: target.offsetHeight };

  // Filter coordinates are fractions of the element box, so every resize has to re-flush.
  const observer = active
    ? new ResizeObserver(() => {
        box = { width: target.offsetWidth, height: target.offsetHeight };
        schedule();
      })
    : null;
  observer?.observe(target);

  // Re-issue the filter id shortly after a map swap: WebKit loads its own copy of the data URL and
  // does not repaint the filter when that load lands.
  function settle() {
    settleTimers.forEach(clearTimeout);
    settleTimers = [60, 250].map((ms) => setTimeout(schedule, ms));
  }

  function show(entry, seq) {
    if (seq <= shown.seq || !graph) return false;
    graph.image.setAttribute('href', entry.url);
    graph.image.setAttributeNS(XLINK, 'xlink:href', entry.url);
    shown = { key: entry.key, seq };
    settle();
    return true;
  }

  function flush() {
    frame = 0;
    if (destroyed || !active) return;
    if (flags.hidden) {
      if (useBackdropURL) target.style.backdropFilter = '';
      else target.style.filter = '';
      if (flags.clip) target.style.clipPath = 'inset(50%)';
      return;
    }
    const W = box.width;
    const H = box.height;
    if (W < 1 || H < 1) return; // not laid out yet; the ResizeObserver will call back
    if (flags.fit) {
      p.x = 0;
      p.y = 0;
      p.width = W;
      p.height = H;
    }
    if (p.width < 1 || p.height < 1) return;

    const s = `${p.chroma > 0}|${p.blur > 0}|${p.specular > 0}`;
    if (s !== structure) {
      graph = buildGraph(filter, p);
      structure = s;
      shown = { key: '', seq: -1 };
      wanted = '';
    }

    const dpr = window.devicePixelRatio || 1;
    const scale = p.mapScale > 0 ? p.mapScale : Math.min(dpr, 2);
    // Snap the lens to device pixels: fractional sub-regions shimmer while the lens moves.
    const snap = (v) => Math.round(v * dpr) / dpr;
    const x = snap(p.x);
    const y = snap(p.y);
    const w = snap(p.width);
    const h = snap(p.height);

    const key = mapKeyOf(p, scale);
    if (wanted !== key) {
      wanted = key;
      const entry = lensMap(p, scale, key);
      const seq = ++requested;
      if (entry.decoded) show(entry, seq);
      // While a squish animation requests a new map every frame, show the newest map that has
      // finished decoding (stretched to the current rect) instead of waiting for the latest one.
      else entry.ready.then(() => !destroyed && show(entry, seq) && schedule());
    }
    if (flags.clip) {
      const r = Math.min(p.radius, w / 2, h / 2);
      target.style.clipPath = `inset(${y}px ${W - x - w}px ${H - y - h}px ${x}px round ${r}px)`;
    }
    if (!shown.key) return; // first map not ready yet: leave the element unfiltered

    for (const n of graph.lensRect) setRect(n, x / W, y / H, w / W, h / H);
    const { scale: k, kx, ky } = bendScale(p.refraction, W, H);
    const scales = graph.displace.length === 3 ? [k, k * (1 + p.chroma / 2), k * (1 + p.chroma)] : [k];
    graph.displace.forEach((n, i) => n.setAttribute('scale', scales[i]));
    if (graph.aspect) {
      graph.aspect.setAttribute('values', `${kx} 0 0 0 ${(1 - kx) / 2}  0 ${ky} 0 0 ${(1 - ky) / 2}  0 0 1 0 0  0 0 0 1 0`);
    }
    if (graph.blur) {
      graph.blur.setAttribute('stdDeviation', `${p.blur / W} ${p.blur / H}`);
      const pad = Math.ceil(p.refraction * (1 + p.chroma) + 3 * p.blur);
      setRect(graph.blur, (x - pad) / W, (y - pad) / H, (w + 2 * pad) / W, (h + 2 * pad) / H);
    }

    // WebKit caches filter output per filter id and keeps serving it after the graph changes;
    // a fresh id on every update forces it to re-read.
    filter.id = `${base}-v${++version}`;
    const ref = `url(#${filter.id})`;
    if (useBackdropURL) target.style.backdropFilter = ref;
    else target.style.filter = ref;
  }

  function schedule() {
    if (flags.sync) flush();
    else if (!frame) frame = requestAnimationFrame(flush);
  }

  schedule();

  return {
    /** Merge new lens geometry / optics. Moving the lens never regenerates the map. */
    update(next = {}) {
      const changes = pick(next);
      const hidden = next.hidden === undefined ? flags.hidden : !!next.hidden;
      // Skip no-op updates: every flush re-issues the filter id, which repaints the glass.
      if (hidden === flags.hidden && Object.keys(changes).every((k) => changes[k] === p[k])) return;
      Object.assign(p, changes);
      flags.hidden = hidden;
      schedule();
    },
    /** Apply pending changes now (e.g. before measuring or taking a screenshot). */
    flush() {
      if (frame) cancelAnimationFrame(frame);
      flush();
    },
    get params() {
      return { ...p };
    },
    get filterId() {
      return filter.id;
    },
    destroy() {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      settleTimers.forEach(clearTimeout);
      observer?.disconnect();
      filter.remove();
      target.style.filter = '';
      target.style.backdropFilter = '';
      target.style.webkitBackdropFilter = '';
      if (flags.clip) target.style.clipPath = '';
    },
  };
}

function pick(o) {
  const out = {};
  for (const k in DEFAULTS) if (o[k] !== undefined) out[k] = o[k];
  return out;
}

/* ------------------------------------------------------------------------------------------------ */
/* Motion                                                                                             */
/* ------------------------------------------------------------------------------------------------ */

export const reducedMotion =
  typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

/**
 * Critically-damped-ish spring for lens position and squish. `onUpdate(value, velocity)` runs every
 * frame until the spring settles. Honors prefers-reduced-motion by jumping straight to the target.
 */
export function createSpring(initial, onUpdate, { stiffness = 520, damping = 38, mass = 1 } = {}) {
  let value = initial;
  let velocity = 0;
  let target = initial;
  let frame = 0;
  let last = 0;

  function step(now) {
    // Fixed 1/120 s sub-steps: the animation keeps its duration when frames are slow or throttled,
    // and one long frame (a background tab coming back) cannot blow the integration up.
    let remaining = Math.min(0.1, (now - last) / 1000 || 1 / 60);
    last = now;
    while (remaining > 1e-6) {
      const dt = Math.min(1 / 120, remaining);
      const force = -stiffness * (value - target) - damping * velocity;
      velocity += (force / mass) * dt;
      value += velocity * dt;
      remaining -= dt;
    }
    if (Math.abs(velocity) < 0.01 && Math.abs(value - target) < 0.01) {
      value = target;
      velocity = 0;
      frame = 0;
      onUpdate(value, 0);
      return;
    }
    onUpdate(value, velocity);
    frame = requestAnimationFrame(step);
  }

  return {
    set(next, { immediate = false } = {}) {
      target = next;
      if (immediate || reducedMotion.matches) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        value = next;
        velocity = 0;
        onUpdate(value, 0);
        return;
      }
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(step);
      }
    },
    get value() {
      return value;
    },
    get target() {
      return target;
    },
    stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}
