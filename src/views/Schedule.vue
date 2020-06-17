<template>
  <div>
    <!-- We don't care if the prerequisite info isn't loaded yet (that can fill in later) -->
    <div v-if="departmentsInitialized && catalogInitialized">
      <div class="warning-message" v-if="selectedCourses.length === 0">
        <h3>It looks like you have not selected any courses yet :(</h3>
        <router-link class="navbar-brand" to="/"
          >Click to select a course</router-link
        >
      </div>

      <!-- <div class="warning-message" v-else-if="totalNumSchedules === 0">
      <h3>
        Uh oh! All possible schedules have conflicts! Try choosing more
        sections.
      </h3>
    </div> -->

      <div style="padding-bottom: 2rem;" v-else :key="lastNewSchedule">
        <div class="schedule-select">
          <div v-if="numSchedules !== 0">
            <b-icon-chevron-left
              class="schedule-select-button"
              v-on:click="decrementSchedule()"
            ></b-icon-chevron-left>
            <span class="schedule-num">
              {{ visibleCurrentScheduleNumber }} / {{ numSchedules }}
            </span>
            <b-icon-chevron-right
              class="schedule-select-button"
              v-on:click="incrementSchedule()"
            ></b-icon-chevron-right>
          </div>
          <div v-else>
            No valid schedules,
            <span v-if="selectedCourses.length > 0">there are conflicts</span>
            <span v-else>please select at least one course</span>
          </div>
        </div>

        <Calendar v-if="numSchedules !== 0" :crns="currentScheduleCRNs" />

        <div class="crn-list">
          CRNs:
          <template v-for="(crn, idx) in currentScheduleCRNs">
            <template v-if="idx !== 0">, </template>
            <span class="crn" :key="crn" v-on:click="copyToClipboard(crn)">{{
              crn
            }}</span></template
          >
          <div id="crn-copy-indicator">Copied!</div>
        </div>
      </div>

      <div class="card-columns">
        <CourseCard
          v-for="course in selectedCourses"
          v-bind:key="course.subj + course.crse + course.title"
          v-bind:course="course"
        />
      </div>
    </div>

    <b-spinner v-else label="Loading" class="loading-spinner"></b-spinner>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { mapGetters, mapState } from "vuex";
import Calendar from "@/components/Calendar.vue";
import { Course } from "@/typings";
import CourseCard from "@/components/CourseCard.vue";

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

@Component({
  computed: {
    ...mapGetters(["departmentsInitialized", "catalogInitialized"]),
    ...mapGetters("schedule", ["numSchedules"]),
    ...mapState("schedule", ["lastNewSchedule"]),
  },
  components: {
    Calendar,
    CourseCard,
  },
})
export default class Schedule extends Vue {
  keepSelected: Course[] = [];
  currentScheduleNumber = 0;
  currentScheduleCRNs = [];
  // loadedWithCRNs = true;

  @Watch("lastNewSchedule")
  onPropertyChanged() {
    this.currentScheduleNumber = 0;
    this.getSchedule(this.currentScheduleNumber);
  }

  get selectedCourses(): Course[] {
    if (this.keepSelected.length > 0) {
      return this.keepSelected;
    }

    for (const dept of this.$store.state.departments) {
      for (const course of dept.courses) {
        for (const section of course.sections) {
          if (this.$store.getters["schedule/isSelected"](section.crn)) {
            this.keepSelected.push(course);
            break;
          }
        }
      }
    }

    return this.keepSelected;
  }

  mounted() {
    // if (this.$route.query.crns === undefined && this.totalNumSchedules > 0) {
    //   this.$router.replace(
    //     "/schedule?crns=" + this.currentScheduleCRNs.join(",")
    //   );
    //   this.loadedWithCRNs = false; // set to false to force Vue to re-render calendar
    // }
    this.getSchedule(this.currentScheduleNumber);
  }

  get lastNewSchedule() {
    return this.$store.state.schedule.lastNewSchedule;
  }

  get visibleCurrentScheduleNumber() {
    // @ts-expect-error: This is mapped in the @Component decorator
    if (this.numSchedules === 0) {
      this.currentScheduleNumber = 0;
      return 0;
    }
    return this.currentScheduleNumber + 1;
  }

  async getSchedule(idx: number) {
    // @ts-expect-error: This is mapped in the @Component decorator
    if (this.numSchedules === 0) {
      return [];
    }

    this.currentScheduleCRNs = await this.$store.getters[
      "schedule/getSchedule"
    ](idx);
  }

  incrementSchedule() {
    this.currentScheduleNumber = mod(
      this.currentScheduleNumber + 1,
      // @ts-expect-error: This is mapped in the @Component decorator
      this.numSchedules
    );
    this.getSchedule(this.currentScheduleNumber);
  }

  decrementSchedule() {
    this.currentScheduleNumber = mod(
      this.currentScheduleNumber - 1,
      // @ts-expect-error: This is mapped in the @Component decorator
      this.numSchedules
    );
    this.getSchedule(this.currentScheduleNumber);
  }

  copyToClipboard(val: string) {
    const tempInput = document.createElement("input");
    // @ts-expect-error: This works so ts is just being dumb
    tempInput.style = "position: absolute; left: -1000px; top: -1000px";
    tempInput.value = val;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);

    const copyIndicator = document.getElementById("crn-copy-indicator");
    // @ts-expect-error: I know it might be null but the element exists so stop complaining
    copyIndicator.className = "show";
    setTimeout(function () {
      // @ts-expect-error: I know it might be null but the element exists so stop complaining
      copyIndicator.className = copyIndicator.className.replace("show", "");
    }, 2000);
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

.crn-list {
  color: var(--global-text);
}

.crn:hover {
  color: var(--global-text-hover);
  cursor: pointer;
}

#crn-copy-indicator {
  visibility: hidden;
  min-width: 250px;
  margin-left: -125px;
  background-color: var(--toast-background);
  color: var(--toast-text);
  text-align: center;
  border-radius: 2px;
  padding: 16px;
  position: fixed;
  z-index: 1;
  left: 50%;
  bottom: 30px;
}

#crn-copy-indicator.show {
  visibility: visible;
  -webkit-animation: fadein 0.5s, fadeout 0.5s 1.5s;
  animation: fadein 0.5s, fadeout 0.5s 1.5s;
}

@-webkit-keyframes fadein {
  from {
    bottom: 0;
    opacity: 0;
  }
  to {
    bottom: 30px;
    opacity: 1;
  }
}

@keyframes fadein {
  from {
    bottom: 0;
    opacity: 0;
  }
  to {
    bottom: 30px;
    opacity: 1;
  }
}

@-webkit-keyframes fadeout {
  from {
    bottom: 30px;
    opacity: 1;
  }
  to {
    bottom: 0;
    opacity: 0;
  }
}

@keyframes fadeout {
  from {
    bottom: 30px;
    opacity: 1;
  }
  to {
    bottom: 0;
    opacity: 0;
  }
}
</style>
