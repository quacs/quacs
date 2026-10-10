<template>
  <div class="home">
    <div>
      <b-jumbotron
        header="Prerequisites"
        header-level="4"
        lead="Add courses you have already taken to QuACS to perform prerequisite checking"
      >
        <p>
          Once you have added courses you've already taken to the website,
          sections will warn you if you don't meet the requirements.
          <br />
          (You may still be able to be signed into these courses. Contact the
          professor and ask!)

          <br />
          <br />

          <span class="font-weight-bold">
            This prerequisite information comes from SIS. If SIS only checks
            prerequisites for some sections of a course, the other sections will
            not show a warning. This also means that our prerequisite
            information may disagree with the course catalog, but it will be
            accurate for course registration.</span
          >
        </p>
        <b-form-checkbox switch size="lg" v-model="prerequisiteChecking"
          >Enable prerequisite checking</b-form-checkbox
        >
      </b-jumbotron>
    </div>
    <div>
      <b-card>
        <b-row class="my-1">
          <b-col>
            <b-form-input
              v-model="newCourse"
              :state="verifyNewCourse"
              placeholder="Course Code"
              aria-lable="Course Code"
              trim
              :disabled="!prerequisiteChecking"
              :title="
                prerequisiteChecking
                  ? 'Enter a course here'
                  : 'Enable prerequisites to add a course'
              "
              :formatter="formatCourse"
              @keyup.enter="addCourse"
            ></b-form-input>
            <b-form-invalid-feedback>
              Format "ABCD-1234"
            </b-form-invalid-feedback>
            <!-- I dont actually show any form valid feedback, but having this here keeps
                 The page nicely spaced out and not bouncing-->
            <b-form-valid-feedback id="valid-feedback">
              Format "ABCD-1234"
            </b-form-valid-feedback>
          </b-col>
          <b-col>
            <b-button
              @click="addCourse"
              :disabled="!verifyNewCourse || !prerequisiteChecking"
              :title="
                prerequisiteChecking
                  ? 'Enter a course here'
                  : 'Enable prerequisites to add a course'
              "
              >Add Course</b-button
            >
          </b-col>
        </b-row>
        <br />
        <h3>Courses you have already taken:</h3>

        <div
          v-for="course in priorCourses"
          :key="course"
          style="margin-left: 2rem; margin-bottom: 0.5rem"
        >
          <font-awesome-icon
            :icon="['fas', 'trash']"
            class="open_close_icon, trash-btn"
            @click="removeCourse(course)"
          ></font-awesome-icon>
          {{ course }}
        </div>
        <!-- {{ $store.state }} -->
      </b-card>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { mapGetters, mapState } from "vuex";
import {
  BButton,
  BCard,
  BCol,
  BFormCheckbox,
  BFormInput,
  BFormInvalidFeedback,
  BFormValidFeedback,
  BJumbotron,
  BRow,
} from "bootstrap-vue";

@Component({
  components: {
    "b-button": BButton,
    "b-card": BCard,
    "b-col": BCol,
    "b-form-checkbox": BFormCheckbox,
    "b-form-input": BFormInput,
    "b-form-invalid-feedback": BFormInvalidFeedback,
    "b-form-valid-feedback": BFormValidFeedback,
    "b-jumbotron": BJumbotron,
    "b-row": BRow,
  },
  computed: {
    verifyNewCourse(): boolean {
      // @ts-expect-error: no u typescript, this does exist
      return this.newCourse.match("^[a-zA-Z]{4}[-_\\s]\\d{4}$") !== null;
    },
    priorCourses(): string[] {
      // @ts-expect-error: no u typescript, this does exist
      return Object.keys(this.getPriorCourses()).sort();
    },
    ...mapGetters("prerequisites", ["getPriorCourses"]),
    ...mapState(["courseIdToCourse"]),
    prerequisiteChecking: {
      get() {
        return this.$store.state.prerequisites.enableChecking;
      },
      set() {
        const new_val = !this.$store.state.prerequisites.enableChecking;
        this.$store.commit("prerequisites/togglePrerequisiteChecking", new_val);
      },
    },
  },
})
export default class Prerequisites extends Vue {
  newCourse = "";

  formatCourse(value: string): string {
    return value
      .toUpperCase()
      .replace("_", "-")
      .replace(" ", "-")
      .substring(0, 9);
  }

  addCourse(): void {
    // @ts-expect-error: no u typescript, this does exist
    if (this.verifyNewCourse) {
      this.$store.commit("prerequisites/addPriorCourse", this.newCourse);
    }
  }

  removeCourse(course: string): void {
    this.$store.commit("prerequisites/removePriorCourse", course);
  }
}
</script>

<style>
#valid-feedback {
  visibility: hidden;
}

.jumbotron {
  background: var(--prerequisite-jumbotron);
}
</style>
