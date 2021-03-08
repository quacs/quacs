<template>
  <div
    class="card course-card"
    :class="{
      hidden:
        missingPrerequisiteSections &&
        missingPrerequisiteSections.length === course.sections.length &&
        hidePrerequisitesState &&
        prerequisiteCheckingState &&
        areThereSelectedSections === 0,
    }"
  >
    <div
      class="card-header course-card-header"
      v-on:click="toggleExpanded()"
      v-on:keyup.enter="toggleExpanded()"
      tabindex="0"
    >
      <div style="display: flex">
        <span style="float: left; flex-grow: 2">
          <font-awesome-icon
            :icon="['fas', 'caret-right']"
            class="open_close_icon"
            :class="{ opened_icon: expanded }"
          ></font-awesome-icon>

          <span class="font-weight-bold">
            <span class="course-code">{{ course.subj }}-{{ course.crse }}</span>
            {{ course.title }}</span
          >
          • {{ credMin }} credit<template v-if="credMin !== '1'">s</template>
          {{ attributes }}
        </span>
        <!--
        This code should be left here in case we ever need to add a more info button to a course
        <font-awesome-icon
          :icon="['fas', 'info-circle']"
          class="open_close_icon info-icon"
          title="More info"
        ></font-awesome-icon> -->
      </div>
      <div>
        <CourseBadges
          :course="course"
          v-on:missing-prerequisite-sections="
            missingPrerequisiteSections = $event
          "
        ></CourseBadges>
      </div>
      {{ getDescription(course.subj, course.crse) }}
    </div>

    <div :id="'section-grow-' + course.id" class="section-grow">
      <div :id="'measuringWrapper-' + course.id">
        <div
          class="card-body"
          :class="{ expanded: expanded }"
          :key="course.id + lastNewSchedule"
        >
          <Sections
            :course="course"
            :missingPrerequisiteSections="missingPrerequisiteSections"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { mapGetters, mapState } from "vuex";
import { Course } from "@/typings";
import CourseInfo from "@/components/sections/CourseInfo.vue";

import Sections from "./sections/Sections.vue";
import CourseBadges from "./CourseBadges.vue";

@Component({
  components: {
    CourseInfo,
    Sections,
    CourseBadges,
  },
  computed: {
    ...mapGetters("prerequisites", ["prerequisiteCheckingState"]),
    ...mapGetters("settings", ["hidePrerequisitesState"]),
    ...mapState("schedule", ["courseSets", "currentTerm", "currentCourseSet"]),
    areThereSelectedSections: function () {
      let selectedCount = 0;
      // @ts-expect-error: no u typescript, this does exist
      for (const section of this.course.sections) {
        if (
          // @ts-expect-error: This is mapped in the custom computed section
          this.courseSets[this.currentTerm][this.currentCourseSet][section.crn]
        ) {
          selectedCount++;
        }
      }
      //2==all sections selected, 1==some sections selected, 0==no sections selected
      return (
        // @ts-expect-error: no u typescript, this does exist
        (selectedCount === this.course.sections.length) + (selectedCount > 0)
      );
    },
  },
})
export default class CourseCard extends Vue {
  @Prop() readonly course!: Course;
  @Prop() readonly startExpanded!: boolean;
  expanded = this.startExpanded ? this.startExpanded : false;
  missingPrerequisiteSections: number[] = [];

  get credMin(): string {
    return (
      this.course.sections[0].credMin +
      (this.course.sections[0].credMin !== this.course.sections[0].credMax
        ? "-" + this.course.sections[0].credMax
        : "")
    );
  }

  get attributes(): string {
    // Don't display if a course is remote since we have the tags for it
    let attrs = this.course.sections[0].attribute
      .replace(
        /(and )?(In-Person Course|Online Course|Hybrid:Online\/In-Person Course)/gi,
        ""
      )
      .trim();
    return attrs === "" ? "" : "• " + attrs;
  }

  getDescription(subject: string, code: string): string {
    const catname = subject + "-" + code;
    if (catname in this.$store.state.catalog) {
      return this.$store.state.catalog[catname].description;
    }

    return "";
  }

  get rotation(): number {
    if (this.expanded) {
      return 90;
    } else {
      return 0;
    }
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded;
    const growDiv = document.getElementById("section-grow-" + this.course.id);
    if (growDiv) {
      if (!this.expanded) {
        growDiv.style.height = "0";
      } else {
        const measuringWrapper = document.getElementById(
          "measuringWrapper-" + this.course.id
        );
        if (measuringWrapper) {
          growDiv.style.height = measuringWrapper.clientHeight + "px";
        }
      }
    }
  }

  get lastNewSchedule(): number {
    return this.$store.state.schedule.lastNewSchedule;
  }
}
</script>

<style scoped>
.open_close_icon {
  transition: 0.5s;
}

.section-grow {
  transition: height 0.5s;
  height: 0;
  overflow: hidden;
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

.hidden {
  display: none;
}
</style>
