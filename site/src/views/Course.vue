<template>
  <div>
    <!-- We don't care if the prerequisite info isn't loaded yet (that can fill in later) -->
    <div v-if="departmentsInitialized && catalogInitialized">
      <div v-if="course">
        <h1>{{ course.title }}</h1>
        <div class="card-column">
          <CourseCard v-bind:course="course" v-bind:startExpanded="true" />
        </div>
      </div>
      <div v-else>
        <h1>No course found for "{{ coursecode }}" during this semester</h1>
      </div>
    </div>

    <b-spinner v-else label="Loading" class="loading-spinner"></b-spinner>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { mapGetters } from "vuex";
import { BSpinner } from "bootstrap-vue";

import CourseCard from "../components/CourseCard.vue";
import { Course } from "../typings";

@Component({
  components: {
    CourseCard,
    "b-spinner": BSpinner,
  },
  computed: {
    ...mapGetters(["departmentsInitialized", "catalogInitialized"]),
  },
})
export default class Department extends Vue {
  @Prop() coursecode!: string;

  get course(): Course | undefined {
    for (const dept of this.$store.state.departments) {
      if (this.coursecode.toUpperCase().startsWith(dept.code)) {
        // console.log(dept)
        for (const course of dept.courses) {
          if (course.id === this.coursecode.toUpperCase()) {
            return course;
          }
        }
      }
    }
    return undefined;
  }
}
</script>
