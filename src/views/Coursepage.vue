<template>
  <div>
    <div class="card-columns">
      <template v-if="course">
        <CourseCard :course="course" :startExpanded="true" />
      </template>
      <template v-else>
        <h3>Unable to find course {{ courseid }}</h3>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import CourseCard from "@/components/CourseCard.vue";

import { Course } from "@/typings";

@Component({
  components: {
    CourseCard
  }
})
export default class Coursepage extends Vue {
  @Prop() courseid!: string;

  get course(): Course | null {
    for (const dept of this.$store.state.departments)
      for (const course of dept.courses)
        if (course.subj + "-" + course.crse === this.courseid) return course;

    return null;
  }
}
</script>

<style scoped>
.card-columns {
  column-count: 1;
}
</style>
