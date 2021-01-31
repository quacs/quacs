<template>
  <div>
    <b-modal :id="'section-info' + section.crn" :title="modalTitle">
      <div class="font-weight-bold">Prerequisites:</div>
      <span v-html="formatPrerequisites(section.crn) || 'None'"></span>
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
      <br />
      <br />
      <div class="font-weight-bold">Seats:</div>
      <div>
        There are
        {{ formatCourseSize(section) }}
        . Check SIS for more up to date information.
      </div>
      <template v-slot:modal-footer="{ ok }">
        <b-button variant="primary" @click="ok()"> Close </b-button>
      </template>
      <br />
      <PrereqGraph :course="course"></PrereqGraph>
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
      return this.$store.state.prerequisitesData[this.section.crn];
    },
  },
})
export default class SectionInfo extends Vue {
  @Prop() readonly section!: CourseSection;

  get modalTitle(): string {
    return `Section Info: ${this.section.sec} - ${this.section.title}`;
  }

  get course(): string {
    return `${this.section.subj} ${this.section.crse}`;
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
