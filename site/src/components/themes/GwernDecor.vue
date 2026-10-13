<template>
  <div
    v-if="place === 'overlay'"
    class="gwern-toolbar"
    role="group"
    aria-label="Light or dark mode"
  >
    <button
      v-for="option in modes"
      :key="option.value"
      type="button"
      class="gwern-mode"
      :class="{ selected: mode === option.value }"
      :title="option.title"
      :aria-pressed="String(mode === option.value)"
      @click="setMode(option.value)"
    >
      <font-awesome-icon :icon="option.icon" />
      <span class="gwern-mode-label">{{ option.label }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faAdjust, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { applyGwernMode, GWERN_MODE_KEY } from "@/utilities";

type Mode = "auto" | "light" | "dark";

// gwern.net's mode switcher: auto follows the device, light and dark pin the look.
@Component
export default class GwernDecor extends Vue {
  @Prop({ required: true }) readonly place!: string;

  modes: { value: Mode; label: string; title: string; icon: IconDefinition }[] =
    [
      {
        value: "auto",
        label: "Auto",
        title: "Auto: follow the device's light or dark setting",
        icon: faAdjust,
      },
      { value: "light", label: "Light", title: "Light mode", icon: faSun },
      { value: "dark", label: "Dark", title: "Dark mode", icon: faMoon },
    ];

  mode: Mode = "auto";

  created(): void {
    try {
      const saved = localStorage.getItem(GWERN_MODE_KEY);
      if (saved === "light" || saved === "dark") {
        this.mode = saved;
      }
    } catch (e) {
      // Storage can be blocked; stay on auto
    }
  }

  setMode(mode: Mode): void {
    this.mode = mode;
    try {
      if (mode === "auto") {
        localStorage.removeItem(GWERN_MODE_KEY);
      } else {
        localStorage.setItem(GWERN_MODE_KEY, mode);
      }
    } catch (e) {
      // Without storage the choice lasts until the page reloads
      document.documentElement.setAttribute("data-gwern-mode", mode);
      return;
    }
    applyGwernMode("gwern");
  }
}
</script>

<style>
.gwern-toolbar {
  position: fixed;
  top: 50%;
  right: 0;
  z-index: 1020;
  display: flex;
  flex-direction: column;
  transform: translateY(-50%);
  border: 1px solid var(--gw-box-border);
  border-right: 0;
  background: var(--gw-bg);
  opacity: 55%;
  transition: opacity 0.3s ease;
}

.gwern-toolbar:hover,
.gwern-toolbar:focus-within {
  opacity: 100%;
}

.gwern-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  width: 2.9rem;
  padding: 0.45rem 0 0.35rem;
  border: 0;
  border-bottom: 1px dotted var(--gw-box-border);
  background: transparent;
  color: var(--gw-popup-button);
  font-family: var(--gw-sans);
  font-size: 1.05rem;
  line-height: 1;
}

.gwern-mode:last-child {
  border-bottom: 0;
}

.gwern-mode:hover,
.gwern-mode:focus-visible {
  color: var(--gw-text);
}

.gwern-mode.selected {
  color: var(--gw-text);
  background: var(--gw-box-bg);
}

.gwern-mode-label {
  font-size: 0.62rem;
  letter-spacing: 0.02em;
}

@media (max-width: 991.98px) {
  .gwern-toolbar {
    top: auto;
    bottom: 0.5rem;
    flex-direction: row;
    transform: none;
    border-right: 1px solid var(--gw-box-border);
    right: 0.5rem;
  }

  .gwern-mode {
    border-right: 1px dotted var(--gw-box-border);
    border-bottom: 0;
  }

  .gwern-mode:last-child {
    border-right: 0;
  }
}
</style>
