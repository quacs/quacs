<template>
  <div>
    <b-modal :id="'section-info' + section.crn" :title="modalTitle">
      <div class="font-weight-bold">Prerequisites:</div>
      <span v-html="formatPrerequisites(section.crn) || 'None'"></span>
      <template
        v-for="mode in [
          { internal: 'corequisites', display: 'Corequisites' },
          { internal: 'cross_list_courses', display: 'Cross-listed with' },
        ]"
      >
        <div :key="mode">
          <template v-if="prerequisiteData[mode.internal]">
            <div class="font-weight-bold">{{ mode.display }}:</div>
            <ul>
              <li
                v-for="course in prerequisiteData[mode.internal]"
                :key="course"
                class="course"
                :class="{
                  takenCourse:
                    course.replace(' ', '-') in
                    $store.getters['prerequisites/getPriorCourses'](),
                }"
              >
                {{ course }}
                {{ courseName(course) }}
              </li>
            </ul>
          </template>
        </div>
      </template>
      <template v-if="prerequisiteData.restrictions">
        <template
          v-for="type in [
            { internal: 'level', display: 'levels' },
            { internal: 'campus', display: 'campuses' },
            { internal: 'classification', display: 'classes' },
            { internal: 'degree', display: 'degrees' },
            { internal: 'college', display: 'schools' },
            { internal: 'major', display: 'majors' },
            {
              internal: 'field_of_study',
              display: 'fields of study (major or minor)',
            },
          ]"
        >
          <div :key="type">
            <template v-if="prerequisiteData.restrictions[type.internal]">
              <template
                v-if="prerequisiteData.restrictions[type.internal].must_be"
              >
                <div class="font-weight-bold">
                  Restricted to the following {{ type.display }}:
                </div>
                <ul>
                  <li
                    v-for="restriction in prerequisiteData.restrictions[
                      type.internal
                    ].must_be"
                    :key="restriction"
                    class="type.internal"
                  >
                    {{ restriction }}
                  </li>
                </ul>
              </template>
              <template
                v-if="prerequisiteData.restrictions[type.internal].may_not_be"
              >
                <div class="font-weight-bold">
                  Not allowed for the following {{ type.display }}:
                </div>
                <ul>
                  <li
                    v-for="restriction in prerequisiteData.restrictions[
                      type.internal
                    ].may_not_be"
                    :key="restriction"
                    class="restriction"
                  >
                    {{ restriction }}
                  </li>
                </ul>
              </template>
            </template>
          </div>
        </template>
      </template>
      <div class="font-weight-bold">Dates Offered:</div>
      <div>
        {{ section.timeslots[0].dateStart }} -
        {{ section.timeslots[0].dateEnd }}
      </div>
      <br />
      <div class="font-weight-bold">Seats:</div>
      <div>
        There are
        {{ formatCourseSize(section) }}. Check SIS for more up to date
        information.
      </div>
      <template v-slot:modal-footer="{ ok }">
        <b-button variant="primary" @click="ok()"> Close </b-button>
      </template>
      <template v-if="prerequisiteData.prerequisites">
        <br />
        <div class="font-weight-bold">Visualize Prerequisites:</div>
        <PrereqGraph :course="courseCode"></PrereqGraph>
      </template>
      <template v-if="section.rem <= 0 || section.xl_rem <= 0">
        <b>This section is currently full.</b>
        In order to register, you must submit a signed
        <a
          href="https://www.rpi.edu/dept/srfs/AuthorizationFrm.pdf"
          target="_blank"
          >override form</a
        >
        to the registrar.
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
      return this.$store.state.prerequisitesData[this.section.crn];
    },
  },
})
export default class SectionInfo extends Vue {
  @Prop() readonly section!: CourseSection;

  get modalTitle(): string {
    return `Section Info: ${this.section.sec} - ${this.section.title} (CRN ${this.section.crn})`;
  }

  get courseCode(): string {
    return `${this.section.subj} ${this.section.crse}`;
  }

  get courseName(): (course: string) => string {
    return (course: string): string => {
      return course
        ? this.$store.state.prereqGraph[course.replace("-", " ")]?.title ?? ""
        : "";
    };
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
