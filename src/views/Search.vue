<template>
  <div>
    <template v-if="courses.length == 0">
      <h3>It looks like your search came up empty :(</h3>
      <router-link class="navbar-brand" to="/"
        >Click to select a course</router-link
      >
    </template>

    <Calendar />

    <div class="card-columns">
      <CourseCard
        v-for="course in courses"
        v-bind:key="course.subj + course.crse + course.title"
        v-bind:course="course"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Course } from "@/typings";

import CourseCard from "@/components/CourseCard.vue";

@Component({
  components: {
    CourseCard
  }
})
export default class Search extends Vue {
  get courses(): Course[] {
    const selected = [];

    for (const dept of this.$store.state.departments) {
      for (const course of dept.courses) {
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
