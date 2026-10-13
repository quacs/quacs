<template>
  <div v-if="place === 'overlay'" class="aero-bubbles" aria-hidden="true">
    <span
      v-for="bubble in bubbles"
      :key="bubble.id"
      class="aero-bubble"
      :style="{
        left: bubble.left + '%',
        width: bubble.size + 'px',
        height: bubble.size + 'px',
        animationDuration: bubble.rise + 's',
        animationDelay: -bubble.delay + 's',
      }"
      ><span
        class="aero-bubble-film"
        :style="{
          animationDuration: bubble.sway + 's',
          '--aero-sway': bubble.swayWidth + 'px',
        }"
      ></span
    ></span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

interface Bubble {
  id: number;
  left: number;
  size: number;
  rise: number;
  delay: number;
  sway: number;
  swayWidth: number;
}

// Soap bubbles that drift up behind the glass window. They sit under the page (z-index -1), so they
// never cover text, and they only exist when the OS allows motion.
@Component
export default class AeroDecor extends Vue {
  @Prop({ required: true }) readonly place!: string;

  bubbles: Bubble[] = Array.from({ length: 16 }, (_, id) => {
    const size = 16 + Math.round(Math.random() ** 2 * 84);
    const rise = 16 + Math.random() * 18 + size / 12;
    return {
      id,
      left: Math.random() * 96,
      size,
      rise,
      delay: Math.random() * rise,
      sway: 3 + Math.random() * 4,
      swayWidth: 8 + Math.random() * 22,
    };
  });
}
</script>

<style>
.aero-bubbles {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.aero-bubble {
  position: absolute;
  top: 100%;
  animation: aero-rise linear infinite;
  will-change: transform;
}

/* The film: a clear center, a bright rim, a faint rainbow sheen and a window-shaped highlight */
.aero-bubble-film {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(
      ellipse 30% 22% at 34% 28%,
      rgb(255 255 255 / 95%),
      rgb(255 255 255 / 0%) 70%
    ),
    radial-gradient(
      circle at 70% 76%,
      rgb(255 255 255 / 45%) 0,
      rgb(255 255 255 / 0%) 14%
    ),
    conic-gradient(
      from 210deg,
      rgb(120 220 255 / 22%),
      rgb(180 120 255 / 18%),
      rgb(255 160 200 / 20%),
      rgb(255 240 140 / 18%),
      rgb(130 255 190 / 22%),
      rgb(120 220 255 / 22%)
    ),
    radial-gradient(
      circle closest-side,
      rgb(255 255 255 / 0%) 78%,
      rgb(255 255 255 / 28%) 91%,
      rgb(255 255 255 / 70%) 98%,
      rgb(255 255 255 / 30%) 100%
    );
  box-shadow: inset 0 0 10px rgb(255 255 255 / 40%),
    0 0 8px rgb(200 255 230 / 25%);
  animation: aero-sway ease-in-out infinite alternate;
}

@keyframes aero-rise {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(calc(-100vh - 140px));
  }
}

@keyframes aero-sway {
  from {
    transform: translateX(calc(var(--aero-sway) * -1));
  }

  to {
    transform: translateX(var(--aero-sway));
  }
}

@media (prefers-reduced-motion: reduce) {
  .aero-bubbles {
    display: none;
  }
}
</style>
