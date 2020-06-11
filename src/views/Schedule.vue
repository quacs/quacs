<template>
  <div>
    <div class="warning-message" v-if="selectedCourses.length == 0">
      <h3>It looks like you have not selected any courses yet :(</h3>
      <router-link class="navbar-brand" to="/"
        >Click to select a course</router-link
      >
    </div>

    <div class="warning-message" v-else-if="totalNumSchedules == 0">
      <h3>
        Uh oh! All possible schedules have conflicts! Try choosing more
        sections.
      </h3>
    </div>

    <template v-else>
      <div class="schedule-select">
        <b-icon-chevron-left
          class="schedule-select-button"
          v-on:click="decrementSchedule()"
        ></b-icon-chevron-left>
        <span class="schedule-num">
          {{ currentScheduleNumber + 1 }} / {{ totalNumSchedules }}
        </span>
        <b-icon-chevron-right
          class="schedule-select-button"
          v-on:click="incrementSchedule()"
        ></b-icon-chevron-right>
      </div>

      <Calendar :key="loadedWithCRNs" />

      <br />
    </template>

    <div class="card-columns">
      <CourseCard
        v-for="course in selectedCourses"
        v-bind:key="course.subj + course.crse + course.title"
        v-bind:course="course"
        v-on:open-prerequisite-modal="setPrerequisiteModalCrn"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Calendar from "@/components/Calendar.vue";
import { Course } from "@/typings";
import CourseCard from "@/components/CourseCard.vue";
import PrerequisiteModal from "@/components/PrerequisiteModal.vue";

function mod(n, m) {
  return ((n % m) + m) % m;
}

@Component({
  components: {
    Calendar,
    CourseCard,
    PrerequisiteModal,
  },
})
export default class Schedule extends Vue {
  keepSelected: Course[] = [];
  prerequisiteModalCrn = "";
  currentScheduleNumber = 0;
  loadedWithCRNs = true;

  get selectedCourses(): Course[] {
    if (this.keepSelected.length > 0) {
      return this.keepSelected;
    }

    for (const dept of this.$store.state.departments) {
      for (const course of dept.courses) {
        for (const section of course.sections) {
          if (this.$store.getters["sections/isSelected"](section.crn)) {
            this.keepSelected.push(course);
            break;
          }
        }
      }
    }

    return this.keepSelected;
  }

  mounted() {
    if (this.$route.query.crns === undefined && this.totalNumSchedules > 0) {
      this.$router.replace(
        "/schedule?crns=" + this.currentScheduleCRNs.join(",")
      );
      this.loadedWithCRNs = false; // set to false to force Vue to re-render calendar
    }
  }

  setPrerequisiteModalCrn(crn: string) {
    this.prerequisiteModalCrn = crn;
  }

  get totalNumSchedules() {
    return this.$store.getters["sections/schedules"].length;
  }

  get currentScheduleCRNs() {
    return this.$store.getters["sections/schedules"][this.currentScheduleNumber]
      .crns;
  }

  incrementSchedule() {
    this.currentScheduleNumber = mod(
      this.currentScheduleNumber + 1,
      this.totalNumSchedules
    );
    this.$router.push("/schedule?crns=" + this.currentScheduleCRNs.join(","));
  }

  decrementSchedule() {
    this.currentScheduleNumber = mod(
      this.currentScheduleNumber - 1,
      this.totalNumSchedules
    );
    this.$router.push("/schedule?crns=" + this.currentScheduleCRNs.join(","));
  }
}
</script>

<style scoped>
.card-columns {
  column-count: 1;
}

.warning-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5px;
  margin-bottom: 2rem;
  text-color: var(--global-text);
}

.schedule-select {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  text-color: var(--global-text);
}

.schedule-select-button {
  marging: 5rem;
  font-size: 2rem;
  cursor: pointer;
}

.schedule-num {
  padding-right: 15px;
  padding-left: 15px;
  font-size: 1.2rem;
}
</style>
