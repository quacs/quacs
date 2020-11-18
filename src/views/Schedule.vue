<template>
  <div>
    <!-- We don't care if the prerequisite info isn't loaded yet (that can fill in later) -->
    <div v-if="departmentsInitialized && catalogInitialized">
      <b-overlay
        :show="selectedCourses.length === 0 || currentScheduleCRNs.length === 0"
        rounded="sm"
        opacity="0.7"
      >
        <div style="padding-bottom: 2rem" :key="lastNewSchedule">
          <div class="schedule-select">
            <!-- <div v-if="numSchedules !== 0"> -->
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

          <Calendar :crns="currentScheduleCRNs" />
          <div class="d-flex justify-content-between">
            <div class="crn-list">
              CRNs:
              <template v-for="(crn, idx) in currentScheduleCRNs">
                <template v-if="idx !== 0">, </template>
                <span
                  class="crn"
                  :key="crn"
                  v-on:click="copyToClipboard(crn)"
                  >{{ crn }}</span
                ></template
              >
              <div id="crn-copy-indicator">Copied!</div>
            </div>
            <b-button @click="exportIcs()">
              <font-awesome-icon
                title="Settings"
                :icon="['fas', 'calendar']"
              ></font-awesome-icon>
              Export .ics
            </b-button>
          </div>
        </div>
        <template v-slot:overlay>
          <div class="text-center">
            <div v-if="lastNewSchedule === 0">
              <b-spinner label="Loading" class="loading-spinner"></b-spinner>
            </div>
            <div
              class="warning-message"
              v-else-if="selectedCourses.length === 0"
            >
              <h3>It looks like you have not selected any courses yet :(</h3>
              <router-link class="navbar-brand" to="/"
                >Click to select a course</router-link
              >
            </div>
            <div
              class="warning-message"
              v-else-if="filteredKeepSelected.length === 0"
            >
              <h3>
                Uh oh! You have deselected all sections! Please select at least
                one section.
              </h3>
            </div>
            <div class="warning-message" v-else-if="numSchedules === 0">
              <h3>
                Uh oh! All possible schedules have conflicts! Try choosing more
                sections.
              </h3>
            </div>
          </div>
        </template>
      </b-overlay>

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
import {
  BButton,
  BIconChevronLeft,
  BIconChevronRight,
  BOverlay,
  BSpinner,
} from "bootstrap-vue";
import Calendar from "@/components/Calendar.vue";
import { Course } from "@/typings";
import CourseCard from "@/components/CourseCard.vue";
import { EventAttributes, createEvents } from "ics";
import { saveAs } from "file-saver";
import { shortSemToLongSem } from "@/utilities";

// eslint-disable-next-line
declare const umami: any; // Not initialized here since it's declared elsewhere

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

@Component({
  computed: {
    ...mapGetters(["departmentsInitialized", "catalogInitialized"]),
    ...mapGetters("schedule", ["numSchedules"]),
    ...mapState("schedule", [
      "lastNewSchedule",
      "currentCourseSet",
      "lastNewSchedule",
    ]),
    shortSemToLongSem,
  },
  components: {
    Calendar,
    CourseCard,
    "b-icon-chevron-left": BIconChevronLeft,
    "b-icon-chevron-right": BIconChevronRight,
    "b-spinner": BSpinner,
    "b-overlay": BOverlay,
    "b-button": BButton,
  },
})
export default class Schedule extends Vue {
  keepSelected: Course[] = [];
  keepSelectedCourseSet = "";
  currentScheduleNumber = 0;
  currentScheduleCRNs: number[] = [];
  // loadedWithCRNs = true;

  @Watch("lastNewSchedule")
  onPropertyChanged(): void {
    this.currentScheduleNumber = 0;
    this.getSchedule(this.currentScheduleNumber);
  }

  get selectedCourses(): Course[] {
    // @ts-expect-error: This is mapped in the @Component decorator
    if (this.currentCourseSet !== this.keepSelectedCourseSet) {
      this.keepSelected = [];
      // @ts-expect-error: This is mapped in the @Component decorator
      this.keepSelectedCourseSet = this.currentCourseSet;
    }
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

  get filteredKeepSelected(): Course[] {
    return this.keepSelected.filter((course) =>
      course.sections.some((sec) =>
        this.$store.getters["schedule/isSelected"](sec.crn)
      )
    );
  }

  mounted(): void {
    // if (this.$route.query.crns === undefined && this.totalNumSchedules > 0) {
    //   this.$router.replace(
    //     "/schedule?crns=" + this.currentScheduleCRNs.join(",")
    //   );
    //   this.loadedWithCRNs = false; // set to false to force Vue to re-render calendar
    // }
    this.getSchedule(this.currentScheduleNumber);
  }

  get lastNewSchedule(): number[] {
    return this.$store.state.schedule.lastNewSchedule;
  }

  get visibleCurrentScheduleNumber(): number {
    // @ts-expect-error: This is mapped in the @Component decorator
    if (this.numSchedules === 0) {
      this.currentScheduleNumber = 0;
      return 0;
    }
    return this.currentScheduleNumber + 1;
  }

  async getSchedule(idx: number): Promise<void> {
    // @ts-expect-error: This is mapped in the @Component decorator
    if (this.numSchedules === 0) {
      this.currentScheduleCRNs = [];
      return;
    }
    this.currentScheduleCRNs = await this.$store.getters[
      "schedule/getSchedule"
    ](idx);
  }

  incrementSchedule(): void {
    this.currentScheduleNumber = mod(
      this.currentScheduleNumber + 1,
      // @ts-expect-error: This is mapped in the @Component decorator
      this.numSchedules
    );
    this.getSchedule(this.currentScheduleNumber);
  }

  decrementSchedule(): void {
    this.currentScheduleNumber = mod(
      this.currentScheduleNumber - 1,
      // @ts-expect-error: This is mapped in the @Component decorator
      this.numSchedules
    );
    this.getSchedule(this.currentScheduleNumber);
  }

  copyToClipboard(val: string): void {
    umami.trackEvent("Copy crn", "schedule");

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

  exportIcs(): void {
    umami.trackEvent("Export ics", "schedule");

    const recurrenceDays: { [day: string]: string } = {
      U: "SU",
      M: "MO",
      T: "TU",
      W: "WE",
      R: "TH",
      F: "FR",
      S: "SA",
    };

    const dayNumToLetter: string[] = ["U", "M", "T", "W", "R", "F", "S"];

    // @ts-expect-error: shortSemToLongSem is defined in the computed section
    const year = this.shortSemToLongSem(process.env.VUE_APP_CURR_SEM).slice(-4);
    const events: EventAttributes[] = [];

    for (const dept of this.$store.state.departments) {
      for (const course of dept.courses) {
        for (const section of course.sections) {
          if (this.currentScheduleCRNs.includes(section.crn)) {
            //Generate recurrenceRule for the days in the timeslot
            for (const timeslot of section.timeslots) {
              //If the timeslot is not set, just skip it
              if (
                timeslot.days.length === 0 ||
                timeslot.timeStart < 0 ||
                timeslot.timeEnd < 0
              ) {
                continue;
              }

              let recurrenceRule = "FREQ=WEEKLY;BYDAY=";
              for (let i = 0; i < timeslot.days.length; i++) {
                if (i) {
                  recurrenceRule += ",";
                }
                recurrenceRule += recurrenceDays[timeslot.days[i]];
              }
              recurrenceRule += ";INTERVAL=1;UNTIL=";
              recurrenceRule += year;
              recurrenceRule += timeslot.dateEnd.replace("/", "");

              // Make a js date that starts on the first day of the semester
              // need to add hours/min/sec to make sure it gets the correct day
              const month = timeslot.dateStart.split("/")[0];
              const day = timeslot.dateStart.split("/")[1];
              let start = new Date(`${year}-${month}-${day} 1:0:0`);

              //Find the first day after the semester starts that has this section
              //For example if the semster starts on a monday, but the section is on wednesday
              // then move the date up to the next wednesday
              while (!timeslot.days.includes(dayNumToLetter[start.getDay()])) {
                start.setDate(start.getDate() + 1);
              }

              events.push({
                title: section.title,
                start: [
                  Number(year),
                  start.getMonth() + 1,
                  start.getDate(),
                  Math.floor(timeslot.timeStart / 100),
                  timeslot.timeStart % 100,
                ],
                end: [
                  Number(year),
                  Number(timeslot.dateStart.split("/")[0]),
                  Number(timeslot.dateStart.split("/")[1]),
                  Math.floor(timeslot.timeEnd / 100),
                  timeslot.timeEnd % 100,
                ],
                location:
                  timeslot.location !== "TBA" ? timeslot.location : undefined,
                recurrenceRule,
              });
            }
          }
        }
      }
    }

    //creates ics calendar
    const { error, value } = createEvents(events);

    if (!value) {
      // eslint-disable-next-line
      console.log(error);
      // eslint-disable-next-line
      alert(
        "There was an error generating your ics file. Please report this bug to the developers using the Discord or GitHub links in the website footer."
      );
    } else {
      const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
      saveAs(blob, "schedule.ics");
    }
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
