<template>
  <div v-if="place === 'overlay'" class="lg-decor">
    <!-- The pond, for glass that bends a copy of it (buttons): the library copies these elements'
         backgrounds. They are never shown. -->
    <div id="lg-pond" class="lg-pond" aria-hidden="true"></div>
    <div
      id="lg-pond-frost"
      class="lg-pond lg-pond-frost"
      aria-hidden="true"
    ></div>
    <div ref="chrome" class="lg-chrome"></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { OWN } from "./liquid-glass/engine";
import { Panes, PANE_REFRACTION } from "./liquid-glass/panes";
import { MenuBar } from "./liquid-glass/menubar";
import { Menus } from "./liquid-glass/menus";
import {
  CalendarLens,
  CopyToasts,
  GlassButtons,
  GlassSwitches,
  SegmentedSelects,
} from "./liquid-glass/controls";
import { Dock } from "./liquid-glass/dock";
import { ControlCentre, QuacsStore } from "./liquid-glass/controlCentre";

interface Part {
  scan?(): void;
  destroy(): void;
}

// Liquid Glass in the style of macOS Tahoe, built on liquidglass.dev's engine and components
// (src/vendor/): glass panes that bend the duck pond, a menu bar with a sliding glass highlight and a
// clock, frosted menus, a Dock, a Control Centre, glass buttons, switches and segmented controls, a
// toast when a CRN is copied, and a magnifier over the calendar. Each part lives in liquid-glass/.
@Component
export default class LiquidGlassDecor extends Vue {
  @Prop({ required: true }) readonly place!: string;

  // Not reactive: these fields have no initial value, so Vue doesn't observe the parts
  parts?: Part[];
  panes?: Panes;
  menuBar?: MenuBar;
  switches?: GlassSwitches;
  segments?: SegmentedSelects;
  dock?: Dock;
  controlCentre?: ControlCentre;
  mutation?: MutationObserver;
  scanFrame?: number;
  lit?: HTMLElement | null;
  pointerFrame?: number;
  destroyed?: boolean;

  mounted(): void {
    if (this.place !== "overlay") {
      return;
    }
    document.addEventListener("pointermove", this.onPointerMove, {
      passive: true,
    });
    document.documentElement.addEventListener("pointerleave", this.unlight);
    const store = this.$store as unknown as QuacsStore;
    const chrome = this.$refs.chrome as HTMLElement;
    const parts: Part[] = [];
    this.parts = parts;
    // With "reduce transparency" on, the glass is solid (liquid-glass.css), so nothing bends
    const solid = window.matchMedia(
      "(prefers-reduced-transparency: reduce)"
    ).matches;
    if (!solid) {
      this.panes = new Panes();
      parts.push(this.panes, new CalendarLens());
    }
    this.menuBar = new MenuBar({
      onControlCentre: (button) => this.controlCentre?.toggle(button),
      military: () => store.state.settings.timePreference === "M",
    });
    this.switches = new GlassSwitches();
    this.segments = new SegmentedSelects("select#timePreference");
    this.dock = new Dock(chrome, {
      go: (path) => {
        if (this.$route.path !== path) {
          this.$router.push(path);
        }
      },
      search: () => this.focusSearch(),
      settings: () => this.$root.$emit("bv::show::modal", "settings-modal"),
    });
    this.controlCentre = new ControlCentre(chrome, store, (px) =>
      this.panes?.setRefractionScale(px / PANE_REFRACTION)
    );
    parts.push(
      this.menuBar,
      new Menus(() => this.menuBar?.scan()),
      new GlassButtons(),
      this.switches,
      this.segments,
      new CopyToasts(),
      this.dock,
      this.controlCentre
    );
    this.dock.setPath(this.$route.path);
    // Parts find their elements as Vue adds them; the theme's own additions don't count
    this.mutation = new MutationObserver((records) => {
      if (
        records.some(
          (record) => !(record.target as Element).closest?.(`[${OWN}]`)
        )
      ) {
        this.queueScan();
      }
    });
    this.mutation.observe(document.body, { childList: true, subtree: true });
    this.scan();
  }

  beforeDestroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.scanFrame ?? 0);
    cancelAnimationFrame(this.pointerFrame ?? 0);
    this.mutation?.disconnect();
    this.mutation = undefined;
    document.removeEventListener("pointermove", this.onPointerMove);
    document.documentElement.removeEventListener("pointerleave", this.unlight);
    this.unlight();
    for (const part of this.parts ?? []) {
      part.destroy();
    }
    this.parts = [];
  }

  queueScan(): void {
    if (!this.scanFrame && !this.destroyed) {
      this.scanFrame = requestAnimationFrame(() => {
        this.scanFrame = 0;
        this.scan();
      });
    }
  }

  scan(): void {
    if (this.destroyed) {
      return;
    }
    for (const part of this.parts ?? []) {
      part.scan?.();
    }
  }

  @Watch("$route")
  onRoute(): void {
    this.controlCentre?.close();
    this.dock?.setPath(this.$route.path);
    this.$nextTick(() => {
      this.menuBar?.onRoute();
      this.queueScan();
    });
  }

  // Settings that the Control Centre, Settings' switches and the menu bar's clock show
  get watchedSettings(): string {
    const state = this.$store.state;
    return [
      state.settings.timePreference,
      state.settings.hidePrerequisites,
      state.prerequisites.enableChecking,
    ].join("|");
  }

  @Watch("watchedSettings")
  onSettings(): void {
    this.controlCentre?.sync();
    this.menuBar?.updateClock();
    this.$nextTick(() => {
      this.switches?.sync();
      this.segments?.sync();
    });
  }

  // The Dock's search app: the navbar's search field, opening the collapsed navbar first
  focusSearch(): void {
    const field = document.querySelector<HTMLInputElement>("#search-bar");
    if (!field) {
      return;
    }
    if (field.getClientRects().length === 0) {
      document.querySelector<HTMLElement>(".navbar-toggler")?.click();
      window.setTimeout(() => field.focus(), 350);
    } else {
      field.focus();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- The pointer's light on the glass ----------

  onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== "mouse" || this.pointerFrame) {
      return;
    }
    const { clientX, clientY, target } = event;
    this.pointerFrame = requestAnimationFrame(() => {
      this.pointerFrame = 0;
      const pane =
        target instanceof Element
          ? target.closest<HTMLElement>(".lg-pane, .lg-btn")
          : null;
      if (pane !== this.lit) {
        this.unlight();
        this.lit = pane;
      }
      if (pane) {
        const box = pane.getBoundingClientRect();
        pane.style.setProperty("--lg-mx", `${clientX - box.left}px`);
        pane.style.setProperty("--lg-my", `${clientY - box.top}px`);
        pane.style.setProperty("--lg-lit", "1");
      }
    });
  }

  unlight(): void {
    if (this.lit) {
      this.lit.style.removeProperty("--lg-lit");
      this.lit = null;
    }
  }
}
</script>
