<template>
  <div>
    <!-- We don't care if the prerequisite info isn't loaded yet (that can fill in later) -->
    <div v-if="departmentsInitialized && catalogInitialized">
      <h1>{{ code }}: {{ name }}</h1>
      <div class="card-column">
        <CourseCard
          v-for="course in courses"
          v-bind:key="course.subj + course.crse + course.title"
          v-bind:course="course"
        />
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
  @Prop() code!: string;

  get department(): Department {
    // @ts-expect-error: value exists
    if (this.departmentsInitialized) {
      for (const dept of this.$store.state.departments) {
        if (dept.code === this.code) {
          return dept;
        }
      }
    }

    // @ts-expect-error: uses {} type
    return {};
  }

  get formattedDept(): Department {
    for (const schoolName in this.$store.state.schools) {
      const school = this.$store.state.schools[schoolName];

      for (const dept of school.depts) {
        if (dept.code === this.code) {
          return dept;
        }
      }
    }

    // @ts-expect-error: uses {} type
    return {};
  }

  get courses(): Course[] {
    return this.department.courses;
  }

  get name(): string {
    return this.formattedDept.name;
  }
}
</script>
