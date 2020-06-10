<template>
  <div>
    <template v-if="selectedCourses.length == 0">
      <h3>It looks like you have not selected any courses yet :(</h3>
      <router-link class="navbar-brand" to="/"
        >Click to select a course</router-link
      >
    </template>

    <Calendar v-bind:selectedCourses="selectedCourses" />

    <br />

    <div class="card-columns">
      <CourseCard
        v-for="course in selectedCourses"
        v-bind:key="course.subj + course.crse + course.title"
        v-bind:course="course"
        v-on:open-prerequisite-modal="setPrerequisiteModalCrn"
      />
    </div>

    <PrerequisiteModal :crn="prerequisiteModalCrn"></PrerequisiteModal>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Calendar from "@/components/Calendar.vue";
import { Course } from "@/typings";
import CourseCard from "@/components/CourseCard.vue";
import PrerequisiteModal from "@/components/PrerequisiteModal.vue";

@Component({
  components: {
    Calendar,
    CourseCard,
    PrerequisiteModal,
  },
})
export default class Schedule extends Vue {
  keepSelected: Course[] = [];
  prerequisiteModalCrn = "";

  get selectedCourses(): Course[] {
    if (this.keepSelected.length > 0) {
      return this.keepSelected;
    }

    for (const dept of this.$store.state.departments) {
      for (const course of dept.courses) {
        for (const section of course.sections) {
          if (this.$store.getters["sections/isSelected"](section.crn)) {
            this.keepSelected.push(course);
            break;
          }
        }
      }
    }

    return this.keepSelected;
  }

  setPrerequisiteModalCrn(crn: string) {
    this.prerequisiteModalCrn = crn;
  }
}
</script>

<style scoped>
.card-columns {
  column-count: 1;
}
</style>
