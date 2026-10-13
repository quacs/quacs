<template>
  <div v-if="place === 'top'" class="sp-vents" aria-hidden="true">
    <span v-for="vent in vents" :key="vent" class="sp-vent" :class="vent">
      <span class="sp-puff"></span>
      <span class="sp-puff"></span>
      <span class="sp-puff"></span>
    </span>
  </div>

  <section
    v-else-if="place === 'bottom'"
    class="sp-panel"
    aria-label="Engine room gauges"
  >
    <figure class="sp-gauge" :title="`${credits} credits planned`">
      <svg
        viewBox="-60 -60 120 120"
        role="img"
        :aria-label="`Credit pressure: ${credits} credits`"
      >
        <defs>
          <radialGradient id="sp-bezel" cx=".38" cy=".3" r=".85">
            <stop offset="0" stop-color="#fff2b8" />
            <stop offset=".4" stop-color="#d5ae55" />
            <stop offset=".75" stop-color="#8f6420" />
            <stop offset="1" stop-color="#4a3008" />
          </radialGradient>
          <radialGradient id="sp-face" cx=".45" cy=".4" r=".75">
            <stop offset="0" stop-color="#fbf4df" />
            <stop offset=".8" stop-color="#eadcb4" />
            <stop offset="1" stop-color="#cdb98a" />
          </radialGradient>
          <linearGradient id="sp-glare" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fff" stop-opacity=".55" />
            <stop offset="1" stop-color="#fff" stop-opacity="0" />
          </linearGradient>
        </defs>
        <circle
          r="58"
          fill="url(#sp-bezel)"
          stroke="#2b1a08"
          stroke-width="1.2"
        />
        <circle r="51.5" fill="#2b1a08" />
        <circle r="50" fill="url(#sp-face)" />
        <path
          :d="arc(18, 24, 24, 43)"
          fill="none"
          stroke="#a31f16"
          stroke-width="5"
        />
        <g stroke="#3b2412" stroke-linecap="round">
          <line
            v-for="tick in creditTicks"
            :key="tick.v"
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            :stroke-width="tick.major ? 2 : 1"
          />
        </g>
        <g class="sp-dial-label">
          <text
            v-for="tick in majorCreditTicks"
            :key="'l' + tick.v"
            :x="tick.lx"
            :y="tick.ly"
            text-anchor="middle"
            dominant-baseline="central"
          >
            {{ tick.v }}
          </text>
        </g>
        <text class="sp-dial-title" y="17" text-anchor="middle">Credits</text>
        <text class="sp-dial-maker" y="27" text-anchor="middle">Pressure</text>
        <g
          class="sp-needle"
          :style="{ transform: `rotate(${creditAngle}deg)` }"
        >
          <path d="M -2.6 6 L 0 -42 L 2.6 6 Z" fill="#7a1010" />
          <path d="M -1.2 5 L 0 -40 L 1.2 5 Z" fill="#c4271c" />
        </g>
        <circle
          r="5.5"
          fill="url(#sp-bezel)"
          stroke="#2b1a08"
          stroke-width="1"
        />
        <ellipse
          cx="-8"
          cy="-24"
          rx="34"
          ry="20"
          fill="url(#sp-glare)"
          transform="rotate(-24)"
        />
      </svg>
      <figcaption>Credit Pressure</figcaption>
    </figure>

    <figure class="sp-gauge sp-clock" :title="clockTitle">
      <svg viewBox="-60 -60 120 120" role="img" :aria-label="clockTitle">
        <circle
          r="58"
          fill="url(#sp-bezel)"
          stroke="#2b1a08"
          stroke-width="1.2"
        />
        <circle r="51.5" fill="#2b1a08" />
        <circle r="50" fill="url(#sp-face)" />
        <g stroke="#3b2412" stroke-linecap="round">
          <line
            v-for="tick in clockTicks"
            :key="tick.i"
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            :stroke-width="tick.major ? 2 : 0.8"
          />
        </g>
        <g class="sp-dial-numeral">
          <text
            v-for="n in numerals"
            :key="n.label"
            :x="n.x"
            :y="n.y"
            text-anchor="middle"
            dominant-baseline="central"
          >
            {{ n.label }}
          </text>
        </g>
        <text class="sp-dial-maker" y="18" text-anchor="middle">
          QuACS &amp; Sons
        </text>
        <text class="sp-dial-maker" y="26" text-anchor="middle">
          Troy, N.Y.
        </text>
        <g class="sp-hand sp-hand-hour" :style="handStyle('hour')">
          <path
            d="M -2.2 5 L -1.6 -22 L 0 -27 L 1.6 -22 L 2.2 5 Z"
            fill="#2b1a08"
          />
        </g>
        <g class="sp-hand sp-hand-minute" :style="handStyle('minute')">
          <path
            d="M -1.6 6 L -1 -36 L 0 -41 L 1 -36 L 1.6 6 Z"
            fill="#2b1a08"
          />
        </g>
        <g class="sp-hand sp-hand-second" :style="handStyle('second')">
          <line y1="10" y2="-43" stroke="#a31f16" stroke-width="0.9" />
          <circle
            cy="-30"
            r="2.4"
            fill="none"
            stroke="#a31f16"
            stroke-width="0.9"
          />
        </g>
        <circle
          r="3.6"
          fill="url(#sp-bezel)"
          stroke="#2b1a08"
          stroke-width="0.8"
        />
        <ellipse
          cx="-8"
          cy="-24"
          rx="34"
          ry="20"
          fill="url(#sp-glare)"
          transform="rotate(-24)"
        />
      </svg>
      <figcaption>Chronometer</figcaption>
    </figure>

    <figure class="sp-gauge" :title="`${schedules} possible schedules`">
      <svg
        viewBox="-60 -60 120 120"
        role="img"
        :aria-label="`Schedules: ${schedules}`"
      >
        <circle
          r="58"
          fill="url(#sp-bezel)"
          stroke="#2b1a08"
          stroke-width="1.2"
        />
        <circle r="51.5" fill="#2b1a08" />
        <circle r="50" fill="url(#sp-face)" />
        <path
          :d="arc(0, 0.6, 3, 43)"
          fill="none"
          stroke="#a31f16"
          stroke-width="5"
        />
        <g stroke="#3b2412" stroke-linecap="round">
          <line
            v-for="tick in scheduleTicks"
            :key="tick.k"
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            :stroke-width="tick.major ? 2 : 1"
          />
        </g>
        <g class="sp-dial-label">
          <text
            v-for="tick in majorScheduleTicks"
            :key="'l' + tick.k"
            :x="tick.lx"
            :y="tick.ly"
            text-anchor="middle"
            dominant-baseline="central"
          >
            {{ tick.label }}
          </text>
        </g>
        <text class="sp-dial-title" y="17" text-anchor="middle">Schedules</text>
        <text class="sp-dial-maker" y="27" text-anchor="middle">Log Scale</text>
        <g
          class="sp-needle"
          :style="{ transform: `rotate(${scheduleAngle}deg)` }"
        >
          <path d="M -2.6 6 L 0 -42 L 2.6 6 Z" fill="#1d3d33" />
          <path d="M -1.2 5 L 0 -40 L 1.2 5 Z" fill="#3f8a72" />
        </g>
        <circle
          r="5.5"
          fill="url(#sp-bezel)"
          stroke="#2b1a08"
          stroke-width="1"
        />
        <ellipse
          cx="-8"
          cy="-24"
          rx="34"
          ry="20"
          fill="url(#sp-glare)"
          transform="rotate(-24)"
        />
      </svg>
      <figcaption>Schedule Output</figcaption>
    </figure>

    <p class="sp-nameplate">
      QuACS Patent Schedule Engine &middot; No. {{ semester }} &middot; Troy,
      N.Y.
    </p>
  </section>

  <div v-else-if="place === 'overlay'" class="sp-gears" aria-hidden="true">
    <svg
      v-for="side in trains"
      :key="side.name"
      class="sp-train"
      :class="'sp-train-' + side.name"
      :width="trainWidth"
      :height="viewportHeight"
      :viewBox="`0 0 ${trainWidth} ${viewportHeight}`"
    >
      <defs>
        <radialGradient :id="'sp-g-brass-' + side.name" cx=".35" cy=".3" r=".9">
          <stop offset="0" stop-color="#fff0b0" />
          <stop offset=".35" stop-color="#d7ae52" />
          <stop offset=".7" stop-color="#9a6c22" />
          <stop offset="1" stop-color="#5a3a0c" />
        </radialGradient>
        <radialGradient
          :id="'sp-g-copper-' + side.name"
          cx=".35"
          cy=".3"
          r=".9"
        >
          <stop offset="0" stop-color="#ffc79a" />
          <stop offset=".35" stop-color="#cf7a3f" />
          <stop offset=".7" stop-color="#8f4a1d" />
          <stop offset="1" stop-color="#4a2208" />
        </radialGradient>
        <radialGradient :id="'sp-g-steel-' + side.name" cx=".35" cy=".3" r=".9">
          <stop offset="0" stop-color="#f4f6f8" />
          <stop offset=".4" stop-color="#a9b0b8" />
          <stop offset=".75" stop-color="#5d646c" />
          <stop offset="1" stop-color="#2c3136" />
        </radialGradient>
      </defs>
      <g
        v-for="(gear, i) in side.gears"
        :key="i"
        :ref="side.name + '-gear'"
        :transform="`translate(${gear.x} ${gear.y}) rotate(${gear.angle})`"
      >
        <path
          :d="gear.path"
          fill-rule="evenodd"
          :fill="`url(#sp-g-${gear.metal}-${side.name})`"
          stroke="#24160a"
          stroke-width="1.4"
        />
        <circle
          :r="gear.hub"
          fill="none"
          stroke="rgb(0 0 0 / 35%)"
          stroke-width="2"
        />
        <circle
          v-for="b in gear.bolts"
          :key="b.i"
          :cx="b.x"
          :cy="b.y"
          r="2.2"
          fill="#3b2412"
        />
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Department } from "@/typings";
import { shortSemToLongSem } from "@/utilities";

interface GearSpec {
  teeth: number;
  // Direction from the previous gear's center to this one, in degrees (ignored for the first gear)
  toward: number;
  metal: "brass" | "copper" | "steel";
}

interface Gear {
  x: number;
  y: number;
  teeth: number;
  metal: string;
  path: string;
  hub: number;
  bolts: { i: number; x: number; y: number }[];
  // Angle = phase + ratio * the driving angle, in degrees
  phase: number;
  ratio: number;
  angle: number;
}

interface Train {
  name: string;
  gears: Gear[];
}

// A tick on a gauge dial: the line from (x1, y1) to (x2, y2), and where its label goes
interface TickLine {
  x1: string;
  y1: string;
  x2: string;
  y2: string;
  lx: string;
  ly: string;
}

interface CreditTick extends TickLine {
  v: number;
  major: boolean;
}

interface ScheduleTick extends TickLine {
  k: number;
  major: boolean;
  label: string;
}

interface ClockTick {
  i: number;
  major: boolean;
  x1: string;
  y1: string;
  x2: string;
  y2: string;
}

const MODULE = 5.2; // tooth size: the pitch diameter is MODULE * teeth
const TRAIN_WIDTH = 190;

// A spur gear outline centered on 0,0, with spoke windows and a bore cut out (fill-rule evenodd)
function gearPath(teeth: number, m: number): string {
  const r = (m * teeth) / 2;
  const tip = r + m;
  const root = r - 1.25 * m;
  const pitch = (2 * Math.PI) / teeth;
  const pt = (rad: number, a: number) =>
    `${(rad * Math.cos(a)).toFixed(2)} ${(rad * Math.sin(a)).toFixed(2)}`;
  let d = "";
  for (let k = 0; k < teeth; k++) {
    const c = k * pitch;
    const points = [
      [root, c - 0.5 * pitch],
      [root, c - 0.27 * pitch],
      [tip, c - 0.14 * pitch],
      [tip, c + 0.14 * pitch],
      [root, c + 0.27 * pitch],
    ];
    for (const [rad, a] of points) {
      d += (d ? " L " : "M ") + pt(rad, a);
    }
  }
  d += " Z";
  const outer = root - 1.8 * m;
  const inner = Math.max(r * 0.34, 2.6 * m);
  const windows = teeth >= 22 ? 6 : teeth >= 15 ? 5 : 0;
  for (let w = 0; w < windows; w++) {
    const span = ((2 * Math.PI) / windows) * 0.64;
    const a0 = (w * 2 * Math.PI) / windows + 0.3;
    const a1 = a0 + span;
    d +=
      ` M ${pt(outer, a0)} A ${outer} ${outer} 0 0 1 ${pt(outer, a1)}` +
      ` L ${pt(inner, a1)} A ${inner} ${inner} 0 0 0 ${pt(inner, a0)} Z`;
  }
  const bore = 1.1 * m;
  d += ` M ${bore} 0 A ${bore} ${bore} 0 1 0 ${-bore} 0 A ${bore} ${bore} 0 1 0 ${bore} 0 Z`;
  return d;
}

// Lays out a train in which each gear meshes with the one before it, and works out each gear's
// phase so its teeth sit in the gaps of its neighbor
function buildTrain(
  start: { x: number; y: number },
  specs: GearSpec[]
): Gear[] {
  const gears: Gear[] = [];
  specs.forEach((spec, i) => {
    const r = (MODULE * spec.teeth) / 2;
    let x = start.x;
    let y = start.y;
    let phase = 0;
    let ratio = 1;
    if (i > 0) {
      const prev = gears[i - 1];
      const prevR = (MODULE * prev.teeth) / 2;
      const phi = (spec.toward * Math.PI) / 180;
      x = prev.x + (prevR + r) * Math.cos(phi);
      y = prev.y + (prevR + r) * Math.sin(phi);
      const prevPhase = (prev.phase * Math.PI) / 180;
      phase =
        phi +
        Math.PI +
        (prev.teeth / spec.teeth) * (phi - prevPhase) -
        Math.PI / spec.teeth;
      phase = (phase * 180) / Math.PI;
      ratio = (-prev.ratio * prev.teeth) / spec.teeth;
    }
    const hubR = Math.max(r * 0.34, 2.6 * MODULE) - 1;
    const boltCount = spec.teeth >= 22 ? 6 : 4;
    const boltR = 1.1 * MODULE + 5;
    gears.push({
      x,
      y,
      teeth: spec.teeth,
      metal: spec.metal,
      path: gearPath(spec.teeth, MODULE),
      hub: hubR,
      bolts: Array.from({ length: boltCount }, (_, b) => ({
        i: b,
        x: boltR * Math.cos((b * 2 * Math.PI) / boltCount),
        y: boltR * Math.sin((b * 2 * Math.PI) / boltCount),
      })),
      phase,
      ratio,
      angle: phase,
    });
  });
  return gears;
}

const LEFT: GearSpec[] = [
  { teeth: 32, toward: 0, metal: "brass" },
  { teeth: 14, toward: 58, metal: "copper" },
  { teeth: 24, toward: 118, metal: "brass" },
  { teeth: 12, toward: 40, metal: "steel" },
  { teeth: 36, toward: 112, metal: "brass" },
  { teeth: 16, toward: 50, metal: "copper" },
];
// The right train is laid out as if it were on the left, then mirrored by CSS
const RIGHT: GearSpec[] = [
  { teeth: 28, toward: 0, metal: "copper" },
  { teeth: 12, toward: 62, metal: "steel" },
  { teeth: 30, toward: 116, metal: "brass" },
  { teeth: 14, toward: 46, metal: "copper" },
  { teeth: 26, toward: 120, metal: "brass" },
];

// Engine-room decorations for the Steampunk theme: steam from the navbar's pipe, a panel of live
// gauges above the footer, and gear trains in the margins that mesh and turn as you scroll.
@Component
export default class SteampunkDecor extends Vue {
  @Prop({ required: true }) readonly place!: string;

  vents = ["sp-vent-a", "sp-vent-b"];
  trainWidth = TRAIN_WIDTH;
  viewportHeight = window.innerHeight;
  trains: Train[] = [
    { name: "left", gears: buildTrain({ x: -24, y: 240 }, LEFT) },
    { name: "right", gears: buildTrain({ x: -16, y: 300 }, RIGHT) },
  ];
  frame = 0;
  startTime = 0;
  clockStart = new Date();

  // ---------- Gauges ----------

  get selectedCrns(): Set<number> {
    const schedule = this.$store.state.schedule;
    const set = schedule.courseSets[schedule.currentTerm]?.[
      schedule.currentCourseSet
    ] as { [crn: string]: boolean } | undefined;
    return new Set(
      set
        ? Object.keys(set)
            .filter((crn) => set[crn])
            .map(Number)
        : []
    );
  }

  get credits(): number {
    const selected = this.selectedCrns;
    if (selected.size === 0) {
      return 0;
    }
    let total = 0;
    for (const dept of this.$store.state.departments as Department[]) {
      for (const course of dept.courses) {
        if (course.sections.some((section) => selected.has(section.crn))) {
          total += Math.min(...course.sections.map((s) => s.credMin));
        }
      }
    }
    return total;
  }

  get schedules(): number {
    return this.$store.getters["schedule/numSchedules"] ?? 0;
  }

  get semester(): string {
    return shortSemToLongSem()(process.env.VUE_APP_CURR_SEM);
  }

  // Dials sweep 270 degrees, from -135 (lower left) to 135 (lower right)
  dialAngle(fraction: number): number {
    return -135 + 270 * Math.min(1, Math.max(0, fraction));
  }

  get creditAngle(): number {
    return this.dialAngle(this.credits / 24);
  }

  get scheduleAngle(): number {
    return this.dialAngle(Math.log10(Math.max(1, this.schedules)) / 3);
  }

  polar(deg: number, r: number): { x: number; y: number } {
    const a = ((deg - 90) * Math.PI) / 180;
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  }

  // An arc along the dial between two values on a 0..max scale
  arc(from: number, to: number, max: number, r: number): string {
    const a = this.polar(this.dialAngle(from / max), r);
    const b = this.polar(this.dialAngle(to / max), r);
    const large = ((to - from) / max) * 270 > 180 ? 1 : 0;
    return `M ${a.x.toFixed(2)} ${a.y.toFixed(
      2
    )} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  }

  tick(deg: number, major: boolean, inner: number): TickLine {
    const o = this.polar(deg, 47);
    const i = this.polar(deg, major ? inner - 3 : inner);
    const l = this.polar(deg, inner - 11);
    return {
      x1: o.x.toFixed(2),
      y1: o.y.toFixed(2),
      x2: i.x.toFixed(2),
      y2: i.y.toFixed(2),
      lx: l.x.toFixed(2),
      ly: l.y.toFixed(2),
    };
  }

  get creditTicks(): CreditTick[] {
    return Array.from({ length: 25 }, (_, v) => ({
      v,
      major: v % 4 === 0,
      ...this.tick(this.dialAngle(v / 24), v % 4 === 0, 42),
    }));
  }

  get majorCreditTicks(): CreditTick[] {
    return this.creditTicks.filter((t) => t.major);
  }

  get majorScheduleTicks(): ScheduleTick[] {
    return this.scheduleTicks.filter((t) => t.major);
  }

  get scheduleTicks(): ScheduleTick[] {
    const ticks: ScheduleTick[] = [];
    for (let decade = 0; decade <= 3; decade++) {
      for (let k = 1; k <= (decade === 3 ? 1 : 9); k++) {
        const value = k * 10 ** decade;
        const major = k === 1;
        ticks.push({
          k: value,
          major,
          label: value >= 1000 ? "1k" : String(value),
          ...this.tick(this.dialAngle(Math.log10(value) / 3), major, 42),
        });
      }
    }
    return ticks;
  }

  get clockTicks(): ClockTick[] {
    return Array.from({ length: 60 }, (_, i) => {
      const o = this.polar(i * 6, 47);
      const inner = this.polar(i * 6, i % 5 === 0 ? 41 : 44);
      return {
        i,
        major: i % 5 === 0,
        x1: o.x.toFixed(2),
        y1: o.y.toFixed(2),
        x2: inner.x.toFixed(2),
        y2: inner.y.toFixed(2),
      };
    });
  }

  get numerals(): { label: string; x: string; y: string }[] {
    const labels = [
      "XII",
      "I",
      "II",
      "III",
      "IIII",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
    ];
    return labels.map((label, i) => {
      const p = this.polar(i * 30, 34);
      return { label, x: p.x.toFixed(2), y: p.y.toFixed(2) };
    });
  }

  get clockTitle(): string {
    return "Chronometer, showing the time when the page loaded and ticking on from there";
  }

  // Clock hands turn with CSS animations started at the current time, so no timer has to run
  handStyle(hand: "hour" | "minute" | "second"): { [key: string]: string } {
    const d = this.clockStart;
    const seconds = d.getSeconds() + d.getMilliseconds() / 1000;
    const minutes = d.getMinutes() + seconds / 60;
    const hours = (d.getHours() % 12) + minutes / 60;
    const elapsed = {
      second: seconds,
      minute: minutes * 60,
      hour: hours * 3600,
    }[hand];
    const angle = {
      second: seconds * 6,
      minute: minutes * 6,
      hour: hours * 30,
    }[hand];
    return {
      "--sp-start": `${angle}deg`,
      animationDelay: `-${elapsed.toFixed(2)}s`,
    };
  }

  // ---------- Gears ----------

  // The gears are only shown on wide layouts (see the CSS), so they only turn there
  wide = window.matchMedia("(min-width: 1200px)");
  reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  mounted(): void {
    if (this.place !== "overlay") {
      return;
    }
    window.addEventListener("resize", this.onResize);
    this.startTime = performance.now();
    this.updateLoop();
  }

  beforeDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    window.removeEventListener("resize", this.onResize);
  }

  onResize(): void {
    this.viewportHeight = window.innerHeight;
    this.updateLoop();
  }

  // Turns the gears only while they are visible and motion is allowed. With reduced motion they
  // stay still, scrolling included.
  updateLoop(): void {
    const run = this.wide.matches && !this.reduceMotion.matches;
    if (run && !this.frame) {
      this.frame = requestAnimationFrame(this.tickGears);
    } else if (!run && this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  tickGears(now: number): void {
    this.setAngles((now - this.startTime) / 1000);
    this.frame = requestAnimationFrame(this.tickGears);
  }

  // The driving angle: a slow idle turn plus a full turn for every 1500px scrolled
  setAngles(seconds: number): void {
    const drive = seconds * 4 + (window.scrollY / 1500) * 360;
    for (const train of this.trains) {
      const refs = this.$refs[train.name + "-gear"] as
        | SVGGElement[]
        | undefined;
      train.gears.forEach((gear, i) => {
        const angle = gear.phase + gear.ratio * drive;
        refs?.[i]?.setAttribute(
          "transform",
          `translate(${gear.x} ${gear.y}) rotate(${angle.toFixed(2)})`
        );
      });
    }
  }
}
</script>

<style>
/* ---------- Steam ---------- */
/* Steam can rise above the vents, but never past the sides of the page */
.sp-vents {
  position: relative;
  z-index: 2;
  height: 0;
  overflow-x: clip;
  pointer-events: none;
}

.sp-vent {
  position: absolute;
  top: -22px;
  width: 0;
  height: 0;
}

.sp-vent-a {
  left: 18%;
}

.sp-vent-b {
  right: 9%;
}

.sp-puff {
  position: absolute;
  bottom: 0;
  left: -14px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgb(255 255 255 / 75%),
    rgb(255 255 255 / 0%) 70%
  );
  opacity: 0%;
  filter: blur(3px);
}

/* ---------- Engine-room panel ---------- */
.sp-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: center;
  gap: 1.5rem 3rem;
  max-width: 900px;
  margin: 2.5rem auto 0;
  padding: 1.4rem 1.5rem 1.1rem;
  border: 7px solid transparent;
  border-radius: 10px;
  background: radial-gradient(
        circle at 40% 35%,
        #fff4c8 0 1px,
        #d9b25c 1.8px,
        #6b4a14 3px,
        rgb(0 0 0 / 35%) 3.6px,
        rgb(0 0 0 / 0%) 4.2px
      )
      border-box -1px 0 / 26px 9px repeat-x,
    radial-gradient(
        circle at 40% 35%,
        #fff4c8 0 1px,
        #d9b25c 1.8px,
        #6b4a14 3px,
        rgb(0 0 0 / 35%) 3.6px,
        rgb(0 0 0 / 0%) 4.2px
      )
      border-box 12px 100% / 26px 9px repeat-x,
    repeating-linear-gradient(
        90deg,
        rgb(255 255 255 / 3%) 0 1px,
        rgb(0 0 0 / 5%) 1px 3px
      )
      padding-box,
    linear-gradient(180deg, #3a3a3a, #232323 60%, #1a1a1a) padding-box,
    linear-gradient(
        180deg,
        #f5df98 0%,
        #d5ae55 32%,
        #a5782a 56%,
        #e6c776 78%,
        #9a6c22 100%
      )
      border-box;
  box-shadow: 0 0 0 1px #1c120a, 0 12px 28px rgb(0 0 0 / 60%);
}

.sp-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
}

.sp-gauge svg {
  width: 150px;
  height: 150px;
  filter: drop-shadow(0 6px 8px rgb(0 0 0 / 60%));
}

.sp-gauge figcaption {
  margin-top: 0.4rem;
  padding: 2px 12px 3px;
  border-radius: 3px;
  background: linear-gradient(
    180deg,
    #f5df98 0%,
    #d5ae55 32%,
    #a5782a 56%,
    #e6c776 78%,
    #9a6c22 100%
  );
  box-shadow: 0 0 0 1px #2b1a08, 0 2px 4px rgb(0 0 0 / 55%);
  color: #2b1a08;
  font-family: cinzel, georgia, serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 0 rgb(255 240 200 / 70%);
}

.sp-clock svg {
  width: 168px;
  height: 168px;
}

.sp-dial-label text {
  fill: #3b2412;
  font-family: "Crimson Pro", georgia, serif;
  font-size: 8.5px;
  font-weight: 700;
}

.sp-dial-numeral text {
  fill: #2b1a08;
  font-family: "Crimson Pro", georgia, serif;
  font-size: 9px;
  font-weight: 700;
}

.sp-dial-title {
  fill: #3b2412;
  font-family: cinzel, georgia, serif;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.6px;
}

.sp-dial-maker {
  fill: #6b4f33;
  font-family: "Special Elite", "Courier New", monospace;
  font-size: 5px;
  letter-spacing: 0.3px;
}

.sp-needle {
  transition: transform 1.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sp-hand {
  transform: rotate(var(--sp-start));
}

.sp-nameplate {
  flex-basis: 100%;
  margin: 0.2rem 0 0;
  text-align: center;
}

.sp-panel .sp-nameplate {
  width: fit-content;
  max-width: 100%;
  margin: 0.2rem auto 0;
  padding: 3px 18px 4px;
  border-radius: 3px;
  background: linear-gradient(
    180deg,
    #f5df98 0%,
    #d5ae55 32%,
    #a5782a 56%,
    #e6c776 78%,
    #9a6c22 100%
  );
  box-shadow: 0 0 0 1px #2b1a08, 0 2px 4px rgb(0 0 0 / 55%);
  color: #2b1a08;
  font-family: "Special Elite", "Courier New", monospace;
  font-size: 0.82rem;
  text-shadow: 0 1px 0 rgb(255 240 200 / 70%);
}

/* ---------- Gears ---------- */
.sp-gears {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.sp-train {
  position: absolute;
  top: 0;
  overflow: hidden;
  filter: drop-shadow(4px 6px 5px rgb(0 0 0 / 65%));
}

.sp-train-left {
  left: 0;
}

.sp-train-right {
  right: 0;
  transform: scaleX(-1);
}

@media (max-width: 1199.98px) {
  .sp-gears {
    display: none;
  }
}

@media (max-width: 767.98px) {
  .sp-gauge svg {
    width: 120px;
    height: 120px;
  }

  .sp-clock svg {
    width: 132px;
    height: 132px;
  }

  .sp-panel {
    gap: 1rem 1.5rem;
    margin-right: 1rem;
    margin-left: 1rem;
  }
}

@keyframes sp-puff {
  0% {
    opacity: 0%;
    transform: translate(0, 0) scale(0.4);
  }

  8% {
    opacity: 85%;
  }

  30% {
    opacity: 0%;
    transform: translate(var(--sp-drift, 10px), -70px) scale(2.6);
  }

  100% {
    opacity: 0%;
    transform: translate(var(--sp-drift, 10px), -70px) scale(2.6);
  }
}

@keyframes sp-hand {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .sp-puff {
    animation: sp-puff 7s ease-out infinite;
  }

  .sp-puff:nth-child(2) {
    --sp-drift: -8px;

    animation-delay: 0.4s;
  }

  .sp-puff:nth-child(3) {
    --sp-drift: 16px;

    animation-delay: 0.8s;
  }

  .sp-vent-b .sp-puff {
    animation-duration: 9s;
  }

  .sp-hand-second {
    animation: sp-hand 60s steps(60) infinite;
  }

  .sp-hand-minute {
    animation: sp-hand 3600s linear infinite;
  }

  .sp-hand-hour {
    animation: sp-hand 43200s linear infinite;
  }
}
</style>
