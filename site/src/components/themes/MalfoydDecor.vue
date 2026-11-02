<template>
  <div v-if="place === 'overlay'" class="mf-corner" aria-hidden="true">
    <div class="mf-bubble">{{ mood.line }}</div>
    <img class="mf-chibi" :src="mood.sprite" alt="" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

// Chibi Malfoyd stands in the corner and grades the current course set. She sneers at an empty
// one, pouts at a thin one, and blushes at a real one. The sprites are Richard Sun's (SOURCES.txt).
const MOODS = [
  {
    from: 0,
    sprite: require("@/assets/images/malfoyd/chibi-sneer.webp"),
    line: "An empty schedule? So you really never built anything.",
  },
  {
    from: 1,
    sprite: require("@/assets/images/malfoyd/chibi-pout.webp"),
    line: "Hmph. Call me when it's a real schedule.",
  },
  {
    from: 4,
    sprite: require("@/assets/images/malfoyd/chibi-blushing.webp"),
    line: "F-fine, it's a decent schedule. Not that I checked.",
  },
];

@Component
export default class MalfoydDecor extends Vue {
  @Prop({ required: true }) readonly place!: string;

  get selectedCount(): number {
    const schedule = this.$store.state.schedule;
    const set = schedule.courseSets[schedule.currentTerm]?.[
      schedule.currentCourseSet
    ] as { [crn: string]: boolean } | undefined;
    return set ? Object.values(set).filter(Boolean).length : 0;
  }

  get mood(): typeof MOODS[number] {
    const count = this.selectedCount;
    return MOODS.filter((mood) => count >= mood.from).slice(-1)[0];
  }
}
</script>

<style>
.mf-corner {
  position: fixed;
  right: 12px;
  bottom: 0;
  z-index: 1020;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  pointer-events: none;
}

/* A speech sticker: white, die-cut, with its tail toward her */
.mf-bubble {
  position: relative;
  max-width: 220px;
  margin-right: 24px;
  padding: 8px 12px;
  border-radius: 14px;
  background: var(--mf-white);
  box-shadow: var(--mf-mini-die);
  color: var(--mf-plum);
  font-size: 0.85rem;
  font-weight: 800;
  line-height: 1.3;
}

.mf-bubble::after {
  content: "";
  position: absolute;
  right: 18px;
  bottom: -9px;
  border: 6px solid transparent;
  border-top: 8px solid var(--mf-white);
  border-bottom: 0;
}

/* The sprite carries its own soft white edge; the lift makes it a sticker on the sheet. A fixed
height keeps the corner still when a mood swap changes the sprite's width. */
.mf-chibi {
  height: 130px;
  filter: drop-shadow(0 4px 4px rgb(58 29 71 / 25%));
}

@media (max-width: 991.98px) {
  .mf-bubble {
    display: none;
  }

  .mf-chibi {
    height: 74px;
  }
}
</style>
