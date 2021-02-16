<template>
  <div>
    <b-modal :id="'course-info' + course.sections[0].crn" :title="modalTitle">
      <template v-if="matchingData">
        <div class="font-weight-bold">Prerequisites:</div>
        <span
          v-html="formatPrerequisites(course.sections[0].crn) || 'None'"
        ></span>
        <template v-if="prerequisiteData.cross_list_courses">
          <div class="font-weight-bold">Cross listed with:</div>
          <span
            v-for="course in prerequisiteData.cross_list_courses"
            :key="course"
            class="course"
            :class="{
              takenCourse:
                course.replace(' ', '-') in
                $store.getters['prerequisites/getPriorCourses'](),
            }"
            >{{ course }}
          </span>
        </template>
        <template v-if="prerequisiteData.prerequisites">
          <br />
          <br />
          <div class="font-weight-bold">Visualize Prerequisites:</div>
          <PrereqGraph :course="courseCode"></PrereqGraph>
        </template>
      </template>
      <template v-else>
        Some sections have different prerequisite data. Click on individual
        sections for more info on their exact prerequisites.
      </template>
      <template v-slot:modal-footer="{ ok }">
        <b-button variant="primary" @click="ok()"> Close </b-button>
      </template>
    </b-modal>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { BButton } from "bootstrap-vue";
import { CourseSection } from "@/typings";
import { formatCourseSize, formatPrerequisites } from "@/utilities";

import PrereqGraph from "@/components/PrereqGraph.vue";

@Component({
  components: {
    "b-button": BButton,
    PrereqGraph,
  },
  computed: {
    formatPrerequisites,
    formatCourseSize,
    prerequisiteData: function () {
      // @ts-expect-error: ts does not understand that sections exists on 'this'
      return this.$store.state.prerequisitesData[this.course.sections[0].crn];
    },
    matchingData: function () {
      const sectionPrerequisiteData = JSON.stringify(
        // @ts-expect-error: ts does not understand that sections exists on 'this'
        this.prerequisiteData.prerequisites
      );
      // @ts-expect-error: ts does not understand that sections exists on 'this'
      for (const section of this.course.sections) {
        if (
          sectionPrerequisiteData !==
          JSON.stringify(
            this.$store.state.prerequisitesData[section.crn].prerequisites
          )
        ) {
          return false;
        }
      }
      return true;
    },
  },
})
export default class CourseInfo extends Vue {
  @Prop() readonly course!: CourseSection;

  get modalTitle(): string {
    return `Course Info: ${this.course.title}`;
  }

  get courseCode(): string {
    return this.course.id.split("-").join(" ");
  }
}
</script>

<style scoped>
.course {
  color: var(--not-taken-course);
}

.course.takenCourse {
  color: var(--taken-course);
}
</style>
