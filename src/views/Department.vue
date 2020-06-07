<template>
  <div>
    <h1>{{ department.code }}: {{ department.name }}</h1>
    <div class="card-column">
      <CourseCard
        v-for="course in department.courses"
        v-bind:key="course.subj + course.crse + course.title"
        v-bind:course="course"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import CourseCard from "../components/CourseCard.vue";

@Component({
  components: {
    CourseCard
  }
})
export default class Department extends Vue {
  @Prop() code!: string;

  get department() {
    for (const dept of this.$store.state.departments) {
      if (dept.code == this.code) {
        return dept;
      }
    }

    return {};
  }
}
</script>
