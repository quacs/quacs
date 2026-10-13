<template>
  <component :is="decor" v-if="decor" :place="place" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { AsyncComponent } from "vue";
import { themeState } from "@/utilities";

// Extra markup, images and scripts for themes that need more than CSS. Each theme's decorations
// load the first time the theme is applied, so other themes never download them.
// App.vue renders this component in three places: "top" (under the navbar), "bottom" (above the
// footer) and "overlay" (after everything, for fixed layers). The theme's component gets the
// place as a prop and renders whatever belongs there, or nothing.
const DECORATIONS: { [theme: string]: AsyncComponent } = {
  "frutiger-aero": () => import("@/components/themes/AeroDecor.vue"),
  gwern: () => import("@/components/themes/GwernDecor.vue"),
  diablo: () => import("@/components/themes/DiabloDecor.vue"),
  "liquid-glass": () => import("@/components/themes/LiquidGlassDecor.vue"),
  "flappy-bird": () => import("@/components/themes/FlappyDecor.vue"),
  steampunk: () => import("@/components/themes/SteampunkDecor.vue"),
  skeuomorphism: () => import("@/components/themes/SkeuomorphismDecor.vue"),
  geocities: () => import("@/components/themes/GeocitiesDecor.vue"),
};

@Component
export default class ThemeDecor extends Vue {
  @Prop({ required: true }) readonly place!: "top" | "bottom" | "overlay";

  get decor(): AsyncComponent | null {
    return DECORATIONS[themeState.applied] ?? null;
  }
}
</script>
