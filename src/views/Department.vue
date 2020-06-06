<template>
  <div class="row">
    <div class="col-lg-1"></div>
    <div class="col-lg">
      <h1>{{ department.code }}: {{ department.name }}</h1>
      <div class="card-columns">
        <div
          v-for="course in department.courses"
          v-bind:key="course.subj + course.crse + course.title"
        >
          <CourseCard v-bind:course="course" />
        </div>
      </div>
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

<style scoped>
.card-columns {
  column-count: 1;
}
</style>
