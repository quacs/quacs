<template>
  <div v-if="place === 'bottom'" class="flappy-perch">
    <button
      type="button"
      class="flappy-perch-duck"
      title="Tap"
      aria-label="Play QuACSy Bird"
      @click="playing = true"
    ></button>
    <FlappyGame v-if="playing" @close="playing = false" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

// The easter egg: a pixel duck perched on the footer's ground. Clicking it, or typing "flap"
// anywhere outside a text field, starts QuACSy Bird.
@Component({
  components: {
    FlappyGame: () => import("@/components/themes/FlappyGame.vue"),
  },
})
export default class FlappyDecor extends Vue {
  @Prop({ required: true }) readonly place!: string;

  playing = false;
  typed = "";

  mounted(): void {
    if (this.place === "bottom") {
      window.addEventListener("keydown", this.onKey);
    }
  }

  beforeDestroy(): void {
    window.removeEventListener("keydown", this.onKey);
  }

  onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (
      this.playing ||
      event.key.length !== 1 ||
      (target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)))
    ) {
      return;
    }
    this.typed = (this.typed + event.key.toLowerCase()).slice(-4);
    if (this.typed === "flap") {
      this.typed = "";
      this.playing = true;
    }
  }
}
</script>

<style>
.flappy-perch {
  position: relative;
  height: 0;
}

/* The duck stands on the ground line at the top of the footer, bobbing and flapping */
.flappy-perch-duck {
  position: absolute;
  bottom: -3rem;
  left: max(1rem, 6vw);
  z-index: 2;
  width: 81px;
  height: 72px;
  padding: 0;
  border: 0;
  background: url("../../assets/images/flappy/duck-strip.png") 0 0 / 243px 72px
    no-repeat;
  image-rendering: pixelated;
  cursor: pointer;
}

.flappy-perch-duck::after {
  content: "";
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  width: 228px;
  height: 72px;
  transform: translateX(-30%);
  background: url("../../assets/images/flappy/tap.png") center / contain
    no-repeat;
  image-rendering: pixelated;
  opacity: 0%;
  transition: opacity 0.2s;
  pointer-events: none;
}

.flappy-perch-duck:hover::after,
.flappy-perch-duck:focus-visible::after {
  opacity: 100%;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes flappy-flap {
    to {
      background-position: -243px 0;
    }
  }

  @keyframes flappy-bob {
    50% {
      transform: translateY(-8px);
    }
  }

  .flappy-perch-duck {
    animation: flappy-flap 0.36s steps(3) infinite,
      flappy-bob 0.9s ease-in-out infinite;
  }
}
</style>
