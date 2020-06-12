<template>
  <div>
    <div class="warning-message" v-if="selectedCourses.length == 0">
      <h3>It looks like you have not selected any courses yet :(</h3>
      <router-link class="navbar-brand" to="/"
        >Click to select a course</router-link
      >
    </div>

    <!-- <div class="warning-message" v-else-if="totalNumSchedules == 0">
      <h3>
        Uh oh! All possible schedules have conflicts! Try choosing more
        sections.
      </h3>
    </div> -->

    <div style="padding-bottom: 2rem;" v-else>
      <div class="schedule-select">
        <b-icon-chevron-left
          class="schedule-select-button"
          v-on:click="decrementSchedule()"
        ></b-icon-chevron-left>
        <span class="schedule-num">
          {{ visibleCurrentScheduleNumber }} / {{ totalNumSchedules }}
        </span>
        <b-icon-chevron-right
          class="schedule-select-button"
          v-on:click="incrementSchedule()"
        ></b-icon-chevron-right>
      </div>

      <Calendar :crns="currentScheduleCRNs" />

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

function mod(n: number, m: number) {
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
  // loadedWithCRNs = true;

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
    // if (this.$route.query.crns === undefined && this.totalNumSchedules > 0) {
    //   this.$router.replace(
    //     "/schedule?crns=" + this.currentScheduleCRNs.join(",")
    //   );
    //   this.loadedWithCRNs = false; // set to false to force Vue to re-render calendar
    // }
  }

  setPrerequisiteModalCrn(crn: string) {
    this.prerequisiteModalCrn = crn;
  }

  get totalNumSchedules() {
    return this.$store.getters["sections/schedules"].length;
  }

  get visibleCurrentScheduleNumber() {
    if (this.$store.getters["sections/schedules"].length === 0) {
      this.currentScheduleNumber = 0;
      return 0;
    }
    return this.currentScheduleNumber + 1;
  }

  get currentScheduleCRNs() {
    if (this.$store.getters["sections/schedules"].length === 0) {
      this.$router.replace("/schedule").catch(() => {
        return;
      });
      return [];
    }

    const crns = this.$store.getters["sections/schedules"][
      this.currentScheduleNumber
    ];

    this.$router.replace("/schedule?crns=" + crns.join(",")).catch(() => {
      return;
    });
    return crns;
  }

  incrementSchedule() {
    this.currentScheduleNumber = mod(
      this.currentScheduleNumber + 1,
      this.totalNumSchedules
    );
  }

  decrementSchedule() {
    this.currentScheduleNumber = mod(
      this.currentScheduleNumber - 1,
      this.totalNumSchedules
    );
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
