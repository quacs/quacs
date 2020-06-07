<template>
  <div class="card-columns">
    <template v-if="courses.length == 0">
      <h3>It looks like you have not selected any courses yet :(</h3>
      <router-link class="navbar-brand" to="/"
        >Click to select a course</router-link
      >
    </template>
    <CourseCard
      v-for="course in courses"
      v-bind:key="course.subj + course.crse + course.title"
      v-bind:course="course"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Course } from "@/typings";

import CourseCard from "../components/CourseCard.vue";

@Component({
  components: {
    CourseCard
  }
})
export default class Schedule extends Vue {
  get courses(): Course[] {
    const selected = [];

    for (const deptName in this.$store.state.departments) {
      const dept = this.$store.state.departments[deptName];
      for (const courseName in dept.courses) {
        const course = dept.courses[courseName];

        for (const crn in course.sections) {
          if (this.$store.getters["sections/isSelected"](crn)) {
            selected.push(course);
            break;
          }
        }
      }
    }

    return selected;
  }
}
</script>

<style scoped>
.card-columns {
  column-count: 1;
}
</style>
