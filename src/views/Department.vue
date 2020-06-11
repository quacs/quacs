<template>
  <div>
    <h1>{{ code }}: {{ name }}</h1>
    <div class="card-column">
      <CourseCard
        v-for="course in courses"
        v-bind:key="course.subj + course.crse + course.title"
        v-bind:course="course"
        v-on:open-prerequisite-modal="setPrerequisiteModalCrn"
      />
      <PrerequisiteModal :crn="prerequisiteModalCrn"></PrerequisiteModal>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import CourseCard from "../components/CourseCard.vue";
import PrerequisiteModal from "@/components/PrerequisiteModal.vue";

@Component({
  components: {
    CourseCard,
    PrerequisiteModal,
  },
})
export default class Department extends Vue {
  @Prop() code!: string;

  prerequisiteModalCrn = "";

  setPrerequisiteModalCrn(crn: string) {
    this.prerequisiteModalCrn = crn;
  }

  get department() {
    for (const dept of this.$store.state.departments) {
      if (dept.code === this.code) {
        return dept;
      }
    }

    return {};
  }

  get courses() {
    return this.department.courses;
  }

  get name() {
    return this.department.name;
  }
}
</script>
