<template>
  <div>
    <b-modal :id="'course-info' + course.sections[0].crn" title="Course Info">
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
                course.split(' ').join('-') in
                $store.getters['prerequisites/getPriorCourses'](),
            }"
            >{{ course }}
          </span>
        </template>
      </template>
      <template v-else>
        Some sections have different prerequisite data. Click on individual
        sections for more info on their exact prerequisites.
      </template>
      <template v-slot:modal-footer="{ ok }">
        <b-button variant="primary" @click="ok()">
          Close
        </b-button>
      </template>
    </b-modal>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { CourseSection } from "@/typings";
import { formatCourseSize, formatPrerequisites } from "@/utilities";

@Component({
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
