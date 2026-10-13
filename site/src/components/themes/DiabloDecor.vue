<template>
  <div v-if="place === 'overlay'" class="d2-overlay">
    <div class="d2-brazier d2-brazier-left" aria-hidden="true"></div>
    <div class="d2-brazier d2-brazier-right" aria-hidden="true"></div>
    <div
      v-for="orb in orbs"
      :key="orb.kind"
      class="d2-orb"
      :class="['d2-orb-' + orb.kind, { 'd2-orb-critical': orb.critical }]"
    >
      <div class="d2-orb-art" aria-hidden="true">
        <div class="d2-orb-empty" :style="orb.globeBox"></div>
        <img
          class="d2-orb-globe"
          :src="orb.art.globe"
          alt=""
          :style="{ clipPath: `inset(${orb.cut}% 0 0 0)` }"
        />
        <img class="d2-orb-statue" :src="orb.art.statue" alt="" />
      </div>
      <div
        class="d2-orb-hit"
        tabindex="0"
        :aria-label="`${orb.label}. ${orb.detail}`"
        :style="orb.globeBox"
      ></div>
      <div class="d2-orb-label" aria-hidden="true">
        {{ orb.label }}<small>{{ orb.detail }}</small>
      </div>
    </div>
  </div>
  <div v-else-if="place === 'bottom'" class="d2-hearth">
    <router-link
      to="/"
      class="d2-hearth-portal"
      title="Town Portal: back to the course list"
      ><img :src="images.portal" alt="" /><span>Town Portal</span></router-link
    >
    <div class="d2-hearth-banner">
      <div class="d2-belt" aria-hidden="true">
        <img v-for="(potion, i) in images.belt" :key="i" :src="potion" alt="" />
      </div>
      <p>Best viewed at 800&times;600 with Lord of Destruction installed</p>
    </div>
    <button
      type="button"
      class="d2-hearth-waypoint"
      title="Waypoint: back to the top of the page"
      @click="toTop"
    >
      <img :src="images.waypoint" alt="" /><span>Waypoint</span>
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Department } from "@/typings";

interface OrbArt {
  statue: string;
  globe: string;
  // Size of the statue image, and where its globe is (centre and radius), in image pixels
  w: number;
  h: number;
  cx: number;
  cy: number;
  r: number;
}

interface Orb {
  kind: string;
  value: number;
  label: string;
  detail: string;
  critical: boolean;
  art: OrbArt;
  // How much of the globe image to clip from the top, in percent of its height
  cut: number;
  globeBox: { [prop: string]: string };
}

// The life and mana statues from Diablo II's control panel: the stone woman holding the life globe
// and the demon holding the mana globe. Each statue image has a hole where its globe shows, and the
// globe image under it empties from the top down, the way the game draws it.
const ART: { [kind: string]: OrbArt } = {
  life: {
    statue: require("@/assets/images/diablo/statue-life.png"),
    globe: require("@/assets/images/diablo/globe-life.png"),
    w: 212,
    h: 170,
    cx: 124.7,
    cy: 74.8,
    r: 72.4,
  },
  mana: {
    statue: require("@/assets/images/diablo/statue-mana.png"),
    globe: require("@/assets/images/diablo/globe-mana.png"),
    w: 211,
    h: 196,
    cx: 87.9,
    cy: 88.5,
    r: 72.4,
  },
};

const percent = (n: number): string => `${n.toFixed(2)}%`;

// The Diablo II HUD. The orbs follow the current course set: mana is how many schedules QuACS can
// still build for you, life drains as the workload climbs past 14 credits and drops to critical when
// every schedule has a conflict.
@Component
export default class DiabloDecor extends Vue {
  @Prop({ required: true }) readonly place!: string;

  images = {
    portal: require("@/assets/images/diablo/town-portal.gif"),
    waypoint: require("@/assets/images/diablo/waypoint.gif"),
    belt: [
      require("@/assets/images/diablo/potion-healing.gif"),
      require("@/assets/images/diablo/potion-superhealing.gif"),
      require("@/assets/images/diablo/potion-mana.gif"),
      require("@/assets/images/diablo/potion-rejuv.gif"),
    ],
  };

  get selectedCrns(): string[] {
    const schedule = this.$store.state.schedule;
    const set = schedule.courseSets[schedule.currentTerm]?.[
      schedule.currentCourseSet
    ] as { [crn: string]: boolean } | undefined;
    return set ? Object.keys(set).filter((crn) => set[crn]) : [];
  }

  // Credits planned: the smallest credit value of each course with a selected section
  get credits(): number {
    const selected = new Set(this.selectedCrns.map(Number));
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

  get orbs(): Orb[] {
    const planning = this.selectedCrns.length > 0;
    const conflicted = planning && this.schedules === 0;
    let life = 100 - Math.max(0, this.credits - 14) * 10;
    if (conflicted) {
      life = Math.min(life, 12);
    }
    life = Math.max(6, Math.min(100, life));
    const mana = !planning
      ? 100
      : Math.round(
          Math.max(4, Math.min(100, 30 * Math.log10(this.schedules + 1)))
        );
    return [
      this.orb(
        "life",
        life,
        `Life: ${life} / 100`,
        conflicted
          ? "Every schedule has a conflict"
          : `${this.credits} credits planned`,
        life < 25
      ),
      this.orb(
        "mana",
        mana,
        `Mana: ${mana} / 100`,
        planning
          ? `${this.schedules} possible schedule${
              this.schedules === 1 ? "" : "s"
            }`
          : "Pick some courses",
        false
      ),
    ];
  }

  orb(
    kind: string,
    value: number,
    label: string,
    detail: string,
    critical: boolean
  ): Orb {
    const art = ART[kind];
    const surface = art.cy + art.r - 2 * art.r * (value / 100);
    return {
      kind,
      value,
      label,
      detail,
      critical,
      art,
      cut: (100 * surface) / art.h,
      globeBox: {
        left: percent((100 * (art.cx - art.r)) / art.w),
        top: percent((100 * (art.cy - art.r)) / art.h),
        width: percent((200 * art.r) / art.w),
        height: percent((200 * art.r) / art.h),
      },
    };
  }

  toTop(): void {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
</script>

<style>
/* ---------- Kurast temple braziers in the margins ---------- */

/* 30 frames of Diablo II's temple torch, 62 x 139 pixels each, side by side */
.d2-brazier {
  --d2-brazier-scale: 2;

  position: fixed;
  top: calc(50% - 69.5px * var(--d2-brazier-scale));
  z-index: 0;
  width: calc(62px * var(--d2-brazier-scale));
  height: calc(139px * var(--d2-brazier-scale));
  pointer-events: none;
}

.d2-brazier::after {
  content: "";
  position: absolute;
  inset: 0;
  background: url("../../assets/images/diablo/kurast-brazier.png") 0 0 /
    calc(1860px * var(--d2-brazier-scale)) 100% no-repeat;
  image-rendering: pixelated;
}

/* Firelight on the granite around the flame */
.d2-brazier::before {
  content: "";
  position: absolute;
  top: -35%;
  left: 50%;
  width: 260%;
  height: 90%;
  transform: translateX(-50%);
  background: radial-gradient(
    closest-side,
    rgb(255 150 40 / 32%),
    rgb(255 110 20 / 12%) 55%,
    rgb(255 90 0 / 0%)
  );
}

.d2-brazier-left {
  left: calc(var(--d2-gutter) / 2 - 31px * var(--d2-brazier-scale));
}

.d2-brazier-right {
  right: calc(var(--d2-gutter) / 2 - 31px * var(--d2-brazier-scale));
}

/* ---------- Life and mana statues ---------- */
.d2-orb {
  --d2-orb-scale: 1;

  position: fixed;
  bottom: 0;
  z-index: 1031;
  pointer-events: none;
}

.d2-orb-life {
  left: 0;
  width: calc(212px * var(--d2-orb-scale));
}

.d2-orb-mana {
  right: 0;
  width: calc(211px * var(--d2-orb-scale));
}

.d2-orb-art {
  position: relative;
  filter: drop-shadow(0 0 10px rgb(0 0 0 / 85%));
}

.d2-orb-art img {
  display: block;
  width: 100%;
  height: auto;
}

.d2-orb-statue {
  position: relative;
}

.d2-orb-globe {
  position: absolute;
  top: 0;
  left: 0;
  transition: clip-path 1.2s ease;
}

/* What shows above the liquid: Diablo II leaves the empty part see-through, so only a dark glass
tint keeps the globe's shape */
.d2-orb-empty {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle at 62% 38%,
    rgb(40 40 46 / 55%),
    rgb(0 0 0 / 80%) 72%
  );
}

.d2-orb-hit {
  position: absolute;
  border-radius: 50%;
  pointer-events: auto;
}

.d2-orb-hit:focus-visible {
  outline: 2px solid var(--d2-gold);
  outline-offset: 2px;
}

.d2-orb-label {
  position: absolute;
  bottom: calc(100% + 6px);
  padding: 0.35rem 0.7rem;
  background: rgb(0 0 0 / 85%);
  color: #fff;
  font-family: "Exocet Blizzard", "Cinzel", serif;
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  text-align: center;
  white-space: nowrap;
  opacity: 0%;
  transition: opacity 0.15s;
}

.d2-orb-life .d2-orb-label {
  left: 8px;
}

.d2-orb-mana .d2-orb-label {
  right: 8px;
}

.d2-orb-label small {
  display: block;
  color: #c7b377;
  font-size: 0.72rem;
}

.d2-orb-hit:hover ~ .d2-orb-label,
.d2-orb-hit:focus-visible ~ .d2-orb-label {
  opacity: 100%;
}

/* ---------- Hearth: the fan-site row above the footer ---------- */
.d2-hearth {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
}

.d2-hearth-portal,
.d2-hearth-waypoint {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 0;
  background: none;
  color: #c7b377 !important;
  font-family: "Exocet Blizzard", "Cinzel", serif;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-decoration: none !important;
}

.d2-hearth-portal img {
  width: 90px;
  height: 120px;
  mix-blend-mode: screen;
}

.d2-hearth-waypoint img {
  width: 150px;
  height: 75px;
  mix-blend-mode: screen;
}

.d2-hearth-portal:hover,
.d2-hearth-waypoint:hover {
  color: #ffb347 !important;
  text-shadow: 0 0 6px #ff7a00;
}

.d2-hearth-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.d2-hearth-banner p {
  margin: 0.5rem 0 0;
  color: #8f8f8f;
  font-family: "Exocet Blizzard", "Cinzel", serif;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

.d2-belt {
  display: flex;
  gap: 3px;
  padding: 4px;
  border: 1px solid #3b3122;
  background: #000;
}

.d2-belt img {
  width: 42px;
  height: 42px;
  border: 1px solid #1d170e;
  image-rendering: pixelated;
}

@media (max-width: 1439.98px) {
  .d2-brazier {
    --d2-brazier-scale: 1;
  }

  .d2-orb {
    --d2-orb-scale: 0.8;
  }
}

/* No margins for the braziers, or not enough height to keep them clear of the statues */
@media (max-width: 1199.98px), (max-height: 699.98px) {
  .d2-brazier {
    display: none;
  }
}

@media (max-width: 1199.98px) {
  .d2-orb {
    --d2-orb-scale: 0.62;
  }
}

/* Short screens (a phone on its side): small statues keep clear of the navbar */
@media (max-height: 559.98px) {
  .d2-orb {
    --d2-orb-scale: 0.5;
  }
}

@media (max-width: 767.98px) {
  .d2-orb {
    --d2-orb-scale: 0.42;
  }

  .d2-hearth {
    flex-wrap: wrap;
    justify-content: center;
  }

  .d2-hearth-banner {
    order: -1;
    width: 100%;
  }
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes d2-brazier-burn {
    to {
      background-position: calc(-1860px * var(--d2-brazier-scale)) 0;
    }
  }

  @keyframes d2-firelight {
    0%,
    100% {
      opacity: 100%;
    }

    30% {
      opacity: 80%;
    }

    55% {
      opacity: 95%;
    }

    75% {
      opacity: 72%;
    }
  }

  @keyframes d2-heartbeat {
    0%,
    100% {
      filter: brightness(100%);
    }

    15% {
      filter: brightness(165%);
    }

    30% {
      filter: brightness(100%);
    }

    45% {
      filter: brightness(140%);
    }
  }

  .d2-brazier::after {
    animation: d2-brazier-burn 2.2s steps(30) infinite;
  }

  .d2-brazier::before {
    animation: d2-firelight 1.7s ease-in-out infinite;
  }

  .d2-brazier-right::after,
  .d2-brazier-right::before {
    animation-delay: -0.9s;
  }

  .d2-orb-critical .d2-orb-globe {
    animation: d2-heartbeat 1.1s ease-in-out infinite;
  }
}
</style>
