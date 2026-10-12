<template>
  <div class="background-trains" aria-hidden="true">
    <svg
      v-for="direction in ['uptown', 'downtown']"
      :key="direction"
      :class="['mta-background-train', `mta-background-train-${direction}`]"
      :viewBox="`0 0 30 ${carCount * 45}`"
      width="30"
      :height="carCount * 45"
      :data-car-count="carCount"
      focusable="false"
    >
      <g
        v-for="car in carCount"
        :key="car"
        :transform="`translate(0, ${(car - 1) * 45})`"
      >
        <path v-if="car > 1" d="M12-3h6v6h-6z" fill="#343a40" />
        <rect
          x="4"
          y="2"
          width="22"
          height="41"
          rx="3"
          fill="#c9ced1"
          stroke="#555d62"
        />
        <template v-if="car === 1">
          <path d="M5 6q0-3 3-3h14q3 0 3 3v12H5z" fill="#20262b" />
          <circle cx="10" cy="9" r="4" fill="#f6bc26" />
          <text
            x="10"
            y="11"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="6"
            font-weight="700"
            fill="#181818"
          >
            Q
          </text>
          <rect x="16" y="6" width="6" height="7" rx="1" fill="#8c9ca6" />
          <g fill="#fff2bf">
            <circle cx="8" cy="16" r="1.5" />
            <circle cx="22" cy="16" r="1.5" />
          </g>
        </template>
        <rect
          x="10"
          :y="car === 1 ? 24 : 12"
          width="10"
          :height="car === 1 ? 12 : 21"
          rx="1"
          fill="#a8b2b9"
        />
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Department } from "@/typings";

@Component
export default class BackgroundTrains extends Vue {
  get carCount(): number {
    const schedule = this.$store.state.schedule;
    const selections =
      schedule.courseSets[schedule.currentTerm]?.[schedule.currentCourseSet] ||
      {};
    const courses = new Set<string>();
    for (const department of this.$store.state.departments as Department[]) {
      for (const course of department.courses) {
        if (course.sections.some((section) => selections[section.crn] === true))
          courses.add(course.id);
      }
    }
    return 1 + courses.size;
  }
}
</script>

<style scoped>
.background-trains {
  display: none;
}
</style>
