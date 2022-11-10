<template>
  <div>
    <b-modal :id="'section-info' + section.crn" :title="modalTitle">
      <div class="font-weight-bold">Prerequisites:</div>
      <ul v-html="formatPrerequisites(section.crn) || 'None'"></ul>
      <template v-if="prerequisiteData.corequisites">
        <div class="font-weight-bold">Corequisites:</div>
        <ul>
          <li
            v-for="course in prerequisiteData.corequisites"
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
      <template v-if="prerequisiteData.cross_list_courses">
        <div class="font-weight-bold">Cross listed with:</div>
        <ul>
          <li
            v-for="course in prerequisiteData.cross_list_courses"
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
      <template v-if="prerequisiteData.restrictions">
        <template v-if="prerequisiteData.restrictions.level">
          <template v-if="prerequisiteData.restrictions.level.must_be">
            <div class="font-weight-bold">
              Restricted to the following levels:
            </div>
            <ul>
              <li
                v-for="level in prerequisiteData.restrictions.level.must_be"
                :key="level"
                class="level"
              >
              {{ level }}
              </li>
            </ul>
          </template>
          <template v-if="prerequisiteData.restrictions.level.may_not_be">
            <div class="font-weight-bold">
              Not allowed for the following levels:
            </div>
            <ul>
              <li
                v-for="level in prerequisiteData.restrictions.level.may_not_be"
                :key="level"
                class="level"
              >
              {{ level }}
              </li>
            </ul>
          </template>
        </template>
        <template v-if="prerequisiteData.restrictions.campus">
          <template v-if="prerequisiteData.restrictions.campus.must_be">
            <div class="font-weight-bold">
              Restricted to the following campuses:
            </div>
            <ul>
              <li
                v-for="campus in prerequisiteData.restrictions.campus.must_be"
                :key="campus"
                class="campus"
              >
              {{ campus }}
              </li>
            </ul>
          </template>
          <template v-if="prerequisiteData.restrictions.campus.may_not_be">
            <div class="font-weight-bold">
              Not allowed for the following campuses:
            </div>
            <ul>
              <li
                v-for="campus in prerequisiteData.restrictions.campus.may_not_be"
                :key="campus"
                class="campus"
              >
              {{ campus }}
              </li>
            </ul>
          </template>
        </template>
        <template v-if="prerequisiteData.restrictions.classification">
          <template v-if="prerequisiteData.restrictions.classification.must_be">
            <div class="font-weight-bold">
              Restricted to the following classes:
            </div>
            <ul>
              <li
                v-for="classification in prerequisiteData.restrictions.classification.must_be"
                :key="classification"
                class="classification"
              >
              {{ classification }}
              </li>
            </ul>
          </template>
          <template v-if="prerequisiteData.restrictions.classification.may_not_be">
            <div class="font-weight-bold">
              Not allowed for the following classes:
            </div>
            <ul>
              <li
                v-for="classification in prerequisiteData.restrictions.classification.may_not_be"
                :key="classification"
                class="classification"
              >
              {{ classification }}
              </li>
            </ul>
          </template>
        </template>
        <template v-if="prerequisiteData.restrictions.degree">
          <template v-if="prerequisiteData.restrictions.degree.must_be">
            <div class="font-weight-bold">
              Restricted to the following degrees:
            </div>
            <ul>
              <li
                v-for="degree in prerequisiteData.restrictions.degree.must_be"
                :key="degree"
                class="degree"
              >
              {{ degree }}
              </li>
            </ul>
          </template>
          <template v-if="prerequisiteData.restrictions.degree.may_not_be">
            <div class="font-weight-bold">
              Not allowed for the following degrees:
            </div>
            <ul>
              <li
                v-for="degree in prerequisiteData.restrictions.degree.may_not_be"
                :key="degree"
                class="degree"
              >
              {{ degree }}
              </li>
            </ul>
          </template>
        </template>
        <template v-if="prerequisiteData.restrictions.college">
          <template v-if="prerequisiteData.restrictions.college.must_be">
            <div class="font-weight-bold">
              Restricted to the following schools:
            </div>
            <ul>
              <li
                v-for="college in prerequisiteData.restrictions.college.must_be"
                :key="college"
                class="college"
              >
              {{ college }}
              </li>
            </ul>
          </template>
          <template v-if="prerequisiteData.restrictions.college.may_not_be">
            <div class="font-weight-bold">
              Not allowed for the following schools:
            </div>
            <ul>
              <li
                v-for="college in prerequisiteData.restrictions.college.may_not_be"
                :key="college"
                class="college"
              >
              {{ college }}
              </li>
            </ul>
          </template>
        </template>
        <template v-if="prerequisiteData.restrictions.major">
          <template v-if="prerequisiteData.restrictions.major.must_be">
            <div class="font-weight-bold">
              Restricted to the following majors:
            </div>
            <ul>
              <li
                v-for="major in prerequisiteData.restrictions.major.must_be"
                :key="major"
                class="major"
              >
              {{ major }}
              </li>
            </ul>
          </template>
          <template v-if="prerequisiteData.restrictions.major.may_not_be">
            <div class="font-weight-bold">
              Not allowed for the following majors:
            </div>
            <ul>
              <li
                v-for="major in prerequisiteData.restrictions.major.may_not_be"
                :key="major"
                class="major"
              >
              {{ major }}
              </li>
            </ul>
          </template>
        </template>
        <template v-if="prerequisiteData.restrictions.field_of_study">
          <template v-if="prerequisiteData.restrictions.field_of_study.must_be">
            <div class="font-weight-bold">
              Restricted to the following fields of study (major or minor):
            </div>
            <ul>
              <li
                v-for="field_of_study in prerequisiteData.restrictions.field_of_study.must_be"
                :key="field_of_study"
                class="field_of_study"
              >
              {{ field_of_study }}
              </li>
            </ul>
          </template>
          <template v-if="prerequisiteData.restrictions.field_of_study.may_not_be">
            <div class="font-weight-bold">
              Not allowed for the following fields of study (major or minor):
            </div>
            <ul>
              <li
                v-for="field_of_study in prerequisiteData.restrictions.field_of_study.may_not_be"
                :key="field_of_study"
                class="field_of_study"
              >
              {{ field_of_study }}
              </li>
            </ul>
          </template>
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
