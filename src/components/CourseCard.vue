<template>
  <div class="card course-card">
    <!-- header -->
    <div
      class="card-header course-card-header"
      v-on:click="toggleExpanded()"
      v-on:keyup.enter="toggleExpanded()"
      tabindex="0"
    >
      <font-awesome-icon
        :icon="['fas', 'caret-right']"
        class="open_close_icon"
        :class="{ opened_icon: expanded }"
      ></font-awesome-icon>

      <span class="font-weight-bold">
        <span class="course-code">{{ course.subj }}-{{ course.crse }}</span>
        {{ course.title }}</span
      >
      {{ credMin }} credit<template v-if="credMin !== '1'">s</template>
      <br />

      {{ getDescription(course.subj, course.crse) }}
    </div>

    <div class="card-body" :class="{ expanded: expanded }" v-if="expanded">
      <Sections
        v-bind:course="course"
        v-on:open-prerequisite-modal="emitCrn"
        v-on:toggledSection="reEmit('toggledSection')"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Course } from "@/typings";

import Sections from "./sections/Sections.vue";

@Component({
  components: {
    Sections,
  },
})
export default class CourseCard extends Vue {
  @Prop() readonly course!: Course;
  @Prop() readonly startExpanded!: boolean;
  expanded = this.startExpanded ? this.startExpanded : false;

  get credMin() {
    return (
      this.course.sections[0].credMin +
      (this.course.sections[0].credMin !== this.course.sections[0].credMax
        ? "-" + this.course.sections[0].credMax
        : "")
    );
  }

  getDescription(subject: string, code: string): string {
    const catname = subject + "-" + code;
    if (catname in this.$store.state.catalog) {
      return this.$store.state.catalog[catname].description;
    }

    return "";
  }

  get rotation() {
    if (this.expanded) {
      return 90;
    } else {
      return 0;
    }
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  emitCrn(crn: string) {
    this.$emit("open-prerequisite-modal", crn);
  }

  reEmit(str: string) {
    this.$emit(str);
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

.card-header:hover {
  background: var(--card-header-hover);
}

.course-code {
  font-family: monospace;
  font-size: 1.5rem;
  margin-left: 0.3rem;
}
</style>
