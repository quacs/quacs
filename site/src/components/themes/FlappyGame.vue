<template>
  <div
    class="flappy-game"
    role="dialog"
    aria-modal="true"
    aria-label="QuACSy Bird. Press space, click or tap to flap. Press Escape to close."
    @pointerdown.prevent="press"
  >
    <canvas
      ref="canvas"
      class="flappy-canvas"
      :width="W"
      :height="H"
      :style="{ width: W * scale + 'px', height: H * scale + 'px' }"
    ></canvas>
    <button
      ref="closeButton"
      type="button"
      class="flappy-close"
      title="Close (Esc)"
      @pointerdown.stop
      @click="close"
    >
      &times;
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

const W = 288;
const H = 512;
const BASE_Y = 400;
const PIPE_W = 52;
const PIPE_H = 320;
const GAP = 100;
const SPACING = 156;
const SPEED = 120; // px per second, pipes and ground
const GRAVITY = 900; // px per second squared
const FLAP = -280; // px per second
const MAX_FALL = 320;
const BIRD_X = 62;
const BIRD_W = 27;
const BIRD_H = 24;
const STEP = 1 / 60;
const BEST_KEY = "quacsy-bird-best";

type State = "ready" | "playing" | "dying" | "over";
interface Pipe {
  x: number;
  gapY: number; // top of the gap
  scored: boolean;
}

const IMAGES = {
  day: require("@/assets/images/flappy/background-day.png"),
  night: require("@/assets/images/flappy/background-night.png"),
  base: require("@/assets/images/flappy/base.png"),
  pipe: require("@/assets/images/flappy/pipe-green.png"),
  duck: require("@/assets/images/flappy/duck-strip.png"),
  title: require("@/assets/images/flappy/title.png"),
  splash: require("@/assets/images/flappy/splash.png"),
  board: require("@/assets/images/flappy/scoreboard.png"),
  replay: require("@/assets/images/flappy/replay.png"),
  digitsBig: require("@/assets/images/flappy/digits-big.png"),
  digitsSmall: require("@/assets/images/flappy/digits-small.png"),
  bronze: require("@/assets/images/flappy/medal_bronze.png"),
  silver: require("@/assets/images/flappy/medal_silver.png"),
  gold: require("@/assets/images/flappy/medal_gold.png"),
  platinum: require("@/assets/images/flappy/medal_platinum.png"),
};
const SOUNDS = {
  wing: require("@/assets/sounds/flappy/wing.mp3"),
  point: require("@/assets/sounds/flappy/point.mp3"),
  hit: require("@/assets/sounds/flappy/hit.mp3"),
  die: require("@/assets/sounds/flappy/die.mp3"),
  swoosh: require("@/assets/sounds/flappy/swoosh.mp3"),
};
type ImageName = keyof typeof IMAGES;
type SoundName = keyof typeof SOUNDS;

// The Flappy Bird easter egg, with the QuACS duck as the bird. The art and sounds are the original
// game's; the physics follow FlapPyBird's reconstruction of it.
@Component
export default class FlappyGame extends Vue {
  W = W;
  H = H;
  scale = 1;

  images: { [name: string]: HTMLImageElement } = {};
  sounds: { [name: string]: AudioBuffer } = {};
  audio: AudioContext | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  frame = 0;
  last = 0;
  acc = 0;

  state: State = "ready";
  time = 0;
  stateTime = 0;
  night = false;
  birdY = 220;
  vy = 0;
  rot = 0;
  noseUpFor = 0;
  groundX = 0;
  pipes: Pipe[] = [];
  score = 0;
  best = 0;
  flash = 0;
  newBest = false;

  mounted(): void {
    try {
      this.best = Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch (e) {
      this.best = 0;
    }
    const canvas = this.$refs.canvas as HTMLCanvasElement;
    this.ctx = canvas.getContext("2d");
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }
    this.fit();
    window.addEventListener("resize", this.fit);
    window.addEventListener("keydown", this.onKey);
    document.addEventListener("visibilitychange", this.onVisibility);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      this.audio = new AudioCtx();
      for (const [name, url] of Object.entries(SOUNDS)) {
        fetch(url)
          .then((r) => r.arrayBuffer())
          .then((data) => this.audio?.decodeAudioData(data))
          .then((buffer) => {
            if (buffer) this.sounds[name] = buffer;
          })
          .catch(() => undefined);
      }
    }
    let loading = 0;
    for (const [name, url] of Object.entries(IMAGES)) {
      const img = new Image();
      loading++;
      img.onload = img.onerror = () => {
        loading--;
        if (loading === 0) {
          this.reset();
          this.last = performance.now();
          this.frame = requestAnimationFrame(this.loop);
        }
      };
      img.src = url;
      this.images[name] = img;
    }
    (this.$refs.closeButton as HTMLButtonElement | undefined)?.focus({
      preventScroll: true,
    });
  }

  beforeDestroy(): void {
    cancelAnimationFrame(this.frame);
    window.removeEventListener("resize", this.fit);
    window.removeEventListener("keydown", this.onKey);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.audio?.close().catch(() => undefined);
  }

  fit(): void {
    const s = Math.min(
      (window.innerWidth - 24) / W,
      (window.innerHeight - 24) / H
    );
    // Whole or half steps keep the pixels even
    this.scale = s >= 1 ? Math.max(1, Math.floor(s * 2) / 2) : s;
  }

  close(): void {
    this.$emit("close");
  }

  onKey(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
    } else if (
      event.key === " " ||
      event.key === "ArrowUp" ||
      event.key === "w" ||
      event.key === "Enter"
    ) {
      if (event.target instanceof HTMLButtonElement && event.key === "Enter") {
        return;
      }
      event.preventDefault();
      this.press();
    }
  }

  onVisibility(): void {
    // Coming back to the tab should not replay the time spent away
    this.last = performance.now();
  }

  play(name: SoundName): void {
    const buffer = this.sounds[name];
    if (!this.audio || !buffer) {
      return;
    }
    if (this.audio.state === "suspended") {
      this.audio.resume().catch(() => undefined);
    }
    const source = this.audio.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audio.destination);
    source.start();
  }

  reset(): void {
    this.state = "ready";
    this.stateTime = 0;
    this.night = Math.random() < 0.35;
    this.birdY = 220;
    this.vy = 0;
    this.rot = 0;
    this.pipes = [];
    this.score = 0;
    this.newBest = false;
  }

  press(): void {
    if (this.state === "ready") {
      this.state = "playing";
      this.stateTime = 0;
      this.pipes = [this.newPipe(W + 60), this.newPipe(W + 60 + SPACING)];
      this.flap();
    } else if (this.state === "playing") {
      this.flap();
    } else if (this.state === "over" && this.stateTime > 0.7) {
      this.play("swoosh");
      this.reset();
    }
  }

  flap(): void {
    if (this.birdY > -BIRD_H) {
      this.vy = FLAP;
      this.rot = -25;
      this.noseUpFor = 0.28;
      this.play("wing");
    }
  }

  newPipe(x: number): Pipe {
    const min = 70;
    const max = BASE_Y - GAP - 70;
    return {
      x,
      gapY: Math.round(min + Math.random() * (max - min)),
      scored: false,
    };
  }

  loop(now: number): void {
    this.frame = requestAnimationFrame(this.loop);
    this.acc += Math.min(0.25, (now - this.last) / 1000);
    this.last = now;
    while (this.acc >= STEP) {
      this.update(STEP);
      this.acc -= STEP;
    }
    this.draw();
  }

  update(dt: number): void {
    this.time += dt;
    this.stateTime += dt;
    this.flash = Math.max(0, this.flash - dt * 4);
    const moving = this.state === "ready" || this.state === "playing";
    if (moving) {
      this.groundX = (this.groundX - SPEED * dt) % 48;
    }
    if (this.state === "ready") {
      this.birdY = 220 + Math.sin(this.time * 7) * 4;
      return;
    }
    if (this.state === "over") {
      return;
    }
    // Bird physics
    this.vy = Math.min(MAX_FALL, this.vy + GRAVITY * dt);
    this.birdY += this.vy * dt;
    if (this.noseUpFor > 0) {
      this.noseUpFor -= dt;
    } else {
      this.rot = Math.min(90, this.rot + 320 * dt);
    }
    if (this.birdY < -BIRD_H) {
      this.birdY = -BIRD_H;
    }
    if (this.state === "playing") {
      for (const pipe of this.pipes) {
        pipe.x -= SPEED * dt;
        if (!pipe.scored && pipe.x + PIPE_W / 2 < BIRD_X + BIRD_W / 2) {
          pipe.scored = true;
          this.score++;
          this.play("point");
        }
      }
      if (this.pipes[0] && this.pipes[0].x < -PIPE_W) {
        this.pipes.shift();
        const lastX = this.pipes[this.pipes.length - 1]?.x ?? W;
        this.pipes.push(this.newPipe(lastX + SPACING));
      }
      if (this.hitPipe()) {
        this.die(true);
      }
    }
    if (this.birdY + BIRD_H >= BASE_Y) {
      this.birdY = BASE_Y - BIRD_H;
      if (this.state === "playing") {
        this.die(false);
      } else if (this.state === "dying") {
        this.gameOver();
      }
    }
  }

  hitPipe(): boolean {
    const cx = BIRD_X + 13;
    const cy = this.birdY + 12;
    const r = 10;
    for (const pipe of this.pipes) {
      const rects = [
        [pipe.x, -PIPE_H, PIPE_W, pipe.gapY + PIPE_H],
        [pipe.x, pipe.gapY + GAP, PIPE_W, BASE_Y],
      ];
      for (const [x, y, w, h] of rects) {
        const nx = Math.max(x, Math.min(cx, x + w));
        const ny = Math.max(y, Math.min(cy, y + h));
        if ((cx - nx) ** 2 + (cy - ny) ** 2 < r * r) {
          return true;
        }
      }
    }
    return false;
  }

  die(inAir: boolean): void {
    this.flash = 1;
    this.play("hit");
    if (inAir) {
      this.state = "dying";
      this.stateTime = 0;
      this.vy = Math.max(this.vy, 0);
      window.setTimeout(() => this.play("die"), 300);
    } else {
      this.gameOver();
    }
  }

  gameOver(): void {
    this.state = "over";
    this.stateTime = 0;
    this.rot = 90;
    if (this.score > this.best) {
      this.best = this.score;
      this.newBest = this.score > 0;
      try {
        localStorage.setItem(BEST_KEY, String(this.best));
      } catch (e) {
        // Storage can be blocked; the best score then lasts for this visit
      }
    }
    window.setTimeout(() => this.play("swoosh"), 450);
  }

  img(name: ImageName): HTMLImageElement {
    return this.images[name];
  }

  drawNumber(
    n: number,
    x: number,
    y: number,
    small: boolean,
    align: "center" | "right"
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const strip = this.img(small ? "digitsSmall" : "digitsBig");
    const dw = small ? 12 : 24;
    const dh = small ? 14 : 36;
    const digits = String(n).split("").map(Number);
    const total = digits.length * (dw + (small ? 1 : 0));
    let cx = align === "center" ? Math.round(x - total / 2) : x - total;
    for (const d of digits) {
      ctx.drawImage(strip, d * dw, 0, dw, dh, cx, y, dw, dh);
      cx += dw + (small ? 1 : 0);
    }
  }

  draw(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.drawImage(this.img(this.night ? "night" : "day"), 0, 0, W, H);
    // Pipes
    const pipe = this.img("pipe");
    for (const p of this.pipes) {
      const x = Math.round(p.x);
      ctx.save();
      ctx.translate(x, p.gapY);
      ctx.scale(1, -1);
      ctx.drawImage(pipe, 0, 0);
      ctx.restore();
      ctx.drawImage(pipe, x, p.gapY + GAP);
    }
    // Ground
    ctx.drawImage(this.img("base"), Math.round(this.groundX), BASE_Y);
    // Duck
    const flying = this.state === "ready" || this.state === "playing";
    const seq = [0, 1, 2, 1];
    const f = flying ? seq[Math.floor(this.time * 12) % 4] : 1;
    ctx.save();
    ctx.translate(BIRD_X + BIRD_W / 2, Math.round(this.birdY) + BIRD_H / 2);
    ctx.rotate((this.state === "ready" ? 0 : this.rot) * (Math.PI / 180));
    ctx.drawImage(
      this.img("duck"),
      f * BIRD_W,
      0,
      BIRD_W,
      BIRD_H,
      -BIRD_W / 2,
      -BIRD_H / 2,
      BIRD_W,
      BIRD_H
    );
    ctx.restore();
    // Interface
    if (this.state === "ready") {
      const title = this.img("title");
      ctx.drawImage(title, Math.round((W - title.width) / 2), 70);
      ctx.drawImage(this.img("splash"), 50, 120);
    } else if (this.state === "playing" || this.state === "dying") {
      this.drawNumber(this.score, W / 2, 34, false, "center");
    } else if (this.state === "over") {
      const t = Math.min(1, this.stateTime / 0.45);
      const ease = 1 - Math.pow(1 - t, 3);
      const bx = 26;
      const by = Math.round(80 + (1 - ease) * 300);
      ctx.drawImage(this.img("board"), bx, by);
      const shown = Math.min(this.score, Math.floor(this.stateTime * 25));
      this.drawNumber(shown, bx + 211, by + 105, true, "right");
      this.drawNumber(this.best, bx + 211, by + 147, true, "right");
      const medal =
        this.score >= 40
          ? "platinum"
          : this.score >= 30
          ? "gold"
          : this.score >= 20
          ? "silver"
          : this.score >= 10
          ? "bronze"
          : null;
      if (medal && t >= 1) {
        ctx.drawImage(this.img(medal), bx + 32, by + 114);
      }
      if (this.newBest && t >= 1 && Math.floor(this.stateTime * 3) % 2 === 0) {
        ctx.fillStyle = "#fc7858";
        ctx.fillRect(bx + 150, by + 128, 30, 12);
        ctx.fillStyle = "#fff";
        ctx.font = "10px 04b19, sans-serif";
        ctx.fillText("NEW", bx + 154, by + 138);
      }
      if (t >= 1) {
        ctx.drawImage(this.img("replay"), bx + 61, by + 205);
      }
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.8})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}
</script>

<style>
.flappy-game {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(10 20 30 / 72%);
  touch-action: none;
}

.flappy-canvas {
  image-rendering: pixelated;
  border: 3px solid #543847;
  border-radius: 6px;
  box-shadow: 0 0 0 3px #ded895, 0 20px 60px rgb(0 0 0 / 60%);
  cursor: pointer;
}

.flappy-close {
  position: fixed;
  top: max(12px, env(safe-area-inset-top));
  right: 12px;
  width: 44px;
  height: 44px;
  border: 3px solid #543847;
  border-radius: 8px;
  background: linear-gradient(#fafafa 50%, #ededed 50%);
  box-shadow: 0 3px 0 #d6be9b;
  color: #543847;
  font-family: "04b19", "Press Start 2P", monospace;
  font-size: 28px;
  line-height: 32px;
}
</style>
