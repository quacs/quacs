<template>
  <div class="card course-card">
    <!-- header -->
    <div
      class="card-header course-card-header"
      v-on:click="toggleExpanded()"
      v-on:keyup.enter="toggleExpanded()"
      tabindex="0"
    >
      <div style="display: flex;">
        <span style="float: left; flex-grow: 2;">
          <font-awesome-icon
            :icon="['fas', 'caret-right']"
            class="open_close_icon"
            :class="{ opened_icon: expanded }"
          ></font-awesome-icon>

          <span class="font-weight-bold">
            <span class="course-code">{{ course.subj }}-{{ course.crse }}</span>
            {{ course.title }}</span
          >
          ꞏ {{ credMin }} credit<template v-if="credMin !== '1'">s</template>
        </span>
        <!--
        This code should be left here in case we ever need to add a more info button to a course
        <font-awesome-icon
          :icon="['fas', 'info-circle']"
          class="open_close_icon info-icon"
          title="More info"
        ></font-awesome-icon> -->
      </div>
      <!-- <br> -->
      {{ getDescription(course.subj, course.crse) }}
    </div>

    <div
      class="card-body"
      :class="{ expanded: expanded }"
      v-if="expanded"
      :key="course.id + lastNewSchedule"
    >
      <Sections v-bind:course="course" />
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

  get lastNewSchedule() {
    return this.$store.state.schedule.lastNewSchedule;
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

.info-icon {
  transition: all 0.2s ease-in-out;
  float: right;
  font-size: 3rem;
}
.info-icon:hover {
  transform: scale(1.5);
}

@media (min-width: 992px) {
  .info-icon {
    font-size: 2rem;
  }
}
</style>
