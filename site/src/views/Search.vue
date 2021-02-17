<template>
  <!-- We don't care if the prerequisite info isn't loaded yet (that can fill in later) -->
  <div v-if="departmentsInitialized && catalogInitialized">
    <div class="card-column">
      <h1 v-if="Object.keys($route.query)[0].length < 3">
        Search query must be at least 3 characters long
      </h1>
      <h1 v-else-if="courses && courses.length === 0">
        No results found for "{{ Object.keys(this.$route.query)[0] }}"
      </h1>
      <CourseCard
        v-for="course in courses"
        v-bind:key="course.subj + course.crse + course.title"
        v-bind:course="course"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { mapGetters } from "vuex";
import { fuseSearch } from "@/searchUtilities";
import { Course } from "@/typings";
import CourseCard from "../components/CourseCard.vue";

// There isn't a functional decorator library for asyncComputed, so we need to go old school
export default {
  components: {
    CourseCard,
  },
  computed: {
    ...mapGetters(["departmentsInitialized", "catalogInitialized"]),
  },
  asyncComputed: {
    courses: {
      get(): Promise<Course[]> {
        // @ts-expect-error: We're not in a real class so Typescript is confused
        const query = this.$route.query.q;
        if (query.length < 3) {
          return new Promise((resolve) => resolve([]));
        }

        return fuseSearch(query);
      },
    },
  },
};
</script>
