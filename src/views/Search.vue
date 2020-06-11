<template>
  <div class="card-column">
    <h1 v-if="courses.length === 0">
      No results found for "{{ Object.keys(this.$route.query)[0] }}"
    </h1>
    <CourseCard
      v-for="course in courses"
      v-bind:key="course.subj + course.crse + course.title"
      v-bind:course="course"
    />
  </div>
</template>

<script lang="ts">
import { fuseSearch } from "@/searchUtilities";
import { Course } from "@/typings";
import CourseCard from "../components/CourseCard.vue";

// There isn't a functional decorator library for asyncComputed, so we need to go old school
export default {
  components: {
    CourseCard,
  },
  asyncComputed: {
    courses: {
      get(): Promise<Course[]> {
        // @ts-expect-error: We're not in a real class so Typescript is confused
        const query = Object.keys(this.$route.query)[0];
        return fuseSearch(query);
      },
    },
  },
};
</script>
