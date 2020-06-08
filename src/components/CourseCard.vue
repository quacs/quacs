<template>
  <div class="card course-card">
    <!-- header -->
    <div
      class="card-header course-card-header"
      v-on:click="toggleExpanded()"
      v-on:keyup.enter="toggleExpanded()"
      tabindex="0"
    >
      <i
        class="fas fa-caret-right open_close_icon"
        :class="{ opened_icon: expanded }"
      ></i>

      <span class="font-weight-bold">
        {{ course.subj }}-{{ course.crse }}: {{ course.title }}</span
      >
      <!--TODO format credit nicely using min and max only showing what is needed -->
      {{ credMin }} credit<template v-if="credMin != 1">s</template>
      <br />

      {{ getDescription(course.subj, course.crse) }}
    </div>

    <div class="card-body course-card-body" :class="{ expanded: expanded }">
      <!-- only rendered on mobile -->
      <MobileSections v-bind:course="course" />

      <!-- only rendered on desktop -->
      <DesktopSections v-bind:course="course" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Course } from "@/typings";

import DesktopSections from "./sections/DesktopSections.vue";
import MobileSections from "./sections/MobileSections.vue";

@Component({
  components: {
    MobileSections,
    DesktopSections
  }
})
export default class CourseCard extends Vue {
  @Prop() readonly course!: Course;
  @Prop() readonly startExpanded!: boolean;
  expanded = this.startExpanded ? this.startExpanded : false;

  get credMin() {
    return this.course.sections[0].credMin;
  }

  getDescription(subject: string, code: string): string {
    const catname = subject + "-" + code;
    if (catname in this.$store.state.catalog)
      return this.$store.state.catalog[catname].description;

    return "";
  }

  get rotation() {
    if (this.expanded) return 90;
    else return 0;
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
  }
}
</script>

<style scoped>
.open_close_icon {
  transition: 0.2s;
}

.opened_icon {
  transform: rotate(90deg);
}

.course-card-body {
  max-height: 0px;
  overflow: hidden;
  transition: max-height 0.5s ease-in;
}

.card-body {
  padding: 0px;
}

.expanded {
  max-height: 9999px;
}

.course-card {
  margin-bottom: 0.75rem;
}

.course-card-header {
  cursor: pointer;
}
</style>
