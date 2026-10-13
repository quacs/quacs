// Line icons for the Liquid Glass theme's menu bar, Dock and Control Centre, 24px with 2px strokes.
// The ones marked Lucide are from Lucide (https://lucide.dev), as bundled with liquidglass.dev, under
// the ISC License:
//
//   Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT).
//   All other copyright (c) for Lucide are held by Lucide Contributors 2022.
//
//   Permission to use, copy, modify, and/or distribute this software for any purpose with or without
//   fee is hereby granted, provided that the above copyright notice and this permission notice
//   appear in all copies.
//
//   THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS
//   SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
//   AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
//   WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
//   NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
//   OF THIS SOFTWARE.
//
// The rest are drawn for QuACS in the same style.
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faDiscord, faGithub } from "@fortawesome/free-brands-svg-icons";

const PATHS: { [name: string]: string } = {
  // Lucide
  search: `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`,
  settings: `<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>`,
  wifi: `<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>`,
  battery: `<rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/>`,
  book: `<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>`,
  // Drawn for QuACS
  "wifi-off": `<path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><path d="M19 12.859a10 10 0 0 0-2.007-1.523"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764"/><path d="m2 2 20 20"/>`,
  "control-centre": `<rect x="3" y="4" width="18" height="7" rx="3.5"/><circle cx="16.5" cy="7.5" r="1.6"/><rect x="3" y="13" width="18" height="7" rx="3.5"/><circle cx="7.5" cy="16.5" r="1.6"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  "check-circle": `<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>`,
  "eye-off": `<path d="m3 3 18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5"/><path d="M6.5 6.6C4.2 8 2.6 10.2 2 12c1 2.5 5 7 10 7 1.9 0 3.6-.6 5-1.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>`,
  prerequisites: `<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M8.4 7.2 15.6 10.8"/><path d="M8.4 16.8 15.6 13.2"/>`,
  "graduation-cap": `<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12.2V17c3.5 2.7 8.5 2.7 12 0v-4.8"/><path d="M22 10v5.5"/>`,
};

// An inline line icon by name, sized by CSS (1em by default)
export function icon(name: string, className = "lg-icon"): string {
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS[name]}</svg>`;
}

// A battery icon filled to `level` (0 to 1)
export function batteryIcon(level: number, className = "lg-icon"): string {
  const fill = Math.max(1, Math.round(12 * level));
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS.battery}<rect x="4" y="9" width="${fill}" height="6" rx="1" fill="currentColor" stroke="none"/></svg>`;
}

// A Font Awesome brand icon (already part of QuACS) as inline SVG
function brand(definition: IconDefinition, className: string): string {
  const [width, height, , , path] = definition.icon;
  const d = Array.isArray(path) ? path.join(" ") : path;
  return `<svg class="${className}" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false"><path fill="currentColor" d="${d}"/></svg>`;
}

export const discordIcon = (className = "lg-icon"): string =>
  brand(faDiscord, className);
export const githubIcon = (className = "lg-icon"): string =>
  brand(faGithub, className);
