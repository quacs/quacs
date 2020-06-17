<template>
  <table class="table table-bordered" style="margin-bottom: 0px;">
    <thead>
      <tr
        v-on:click="toggleAll()"
        class="select-section"
        tabindex="0"
        v-on:keyup.enter="toggleAll()"
      >
        <th style="width: 100%;">Toggle all sections</th>
        <th v-for="day in days" v-bind:key="day" class="week-day desktop-only">
          {{ day }}
        </th>
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="section in course.sections"
        v-bind:key="section.crn"
        class="course-row select-section"
        v-bind:class="{
          selected: isSelected(section.crn),
          conflict: conflicts[section.crn],
          hidden:
            !hasMetAllPrerequisites(section.crn) &&
            hidePrerequisitesState &&
            prerequisiteCheckingState &&
            !isSelected(section.crn),
        }"
        v-on:click="toggleSelection(section)"
        tabindex="0"
        v-on:keyup.enter="toggleSelection(section)"
      >
        <td class="info-cell">
          <SectionInfo class="more-info" :section="section"></SectionInfo>
          <font-awesome-icon
            :icon="['fas', 'info-circle']"
            class="open_close_icon info-icon"
            title="More info"
            v-on:click.stop.prevent
            v-on:keyup.enter.stop.prevent
            tabindex="0"
            @click="$bvModal.show('section-info' + section.crn)"
            @keyup.enter="$bvModal.show('section-info' + section.crn)"
          ></font-awesome-icon>
          <span class="font-weight-bold" title="Section number">{{
            section.sec
          }}</span
          >-<span title="CRN: the unique id given to each section in sis">{{
            section.crn
          }}</span>
          <span
            v-if="prerequisiteCheckingState"
            class="padding-left prerequisiteError"
            :class="{
              hidden: hasMetAllPrerequisites(section.crn),
            }"
            title="Click for more info"
            tabindex="0"
            v-on:click.stop.prevent
            v-on:keyup.enter.stop.prevent
            @click="$bvModal.show('section-info' + section.crn)"
            @keyup.enter="$bvModal.show('section-info' + section.crn)"
          >
            <font-awesome-icon
              :icon="['fas', 'exclamation-triangle']"
            ></font-awesome-icon>
            Missing Prerequisites</span
          >
          <span
            class="padding-left prerequisiteError"
            :class="{
              hidden: !(
                $store.state.courseSizes[section.crn] &&
                $store.state.courseSizes[section.crn].avail === 0
              ),
            }"
            v-on:click.stop.prevent
            v-on:keyup.enter.stop.prevent
            @click="$bvModal.show('section-info' + section.crn)"
            @keyup.enter="$bvModal.show('section-info' + section.crn)"
          >
            <font-awesome-icon
              :icon="['fas', 'user-slash']"
            ></font-awesome-icon>
            Full Section</span
          >
          <span title="Professor(s)">
            {{ section.timeslots[0].instructor }}
          </span>
          <template v-if="section.timeslots[0].dateStart"
            >({{ section.timeslots[0].dateStart }}-{{
              section.timeslots[0].dateEnd
            }})
          </template>
          <span
            class="padding-left"
            :title="
              'There are ' +
              formatCourseSize(section.crn, courseSizes) +
              ' available. Check SIS for more up to date information.'
            "
            >{{ formatCourseSize(section.crn) }}</span
          >
          <!-- Mobile times -->
          <div class="mobile-only">
            <template v-for="day in days">
              <!-- TODO: fix different instructors for same timeslot -->
              <span
                v-for="session in getSessions(section, day)"
                v-bind:key="
                  'mobile' +
                  day +
                  session.timeStart +
                  section.crn +
                  session.instrutor +
                  session.location
                "
              >
                <span class="font-weight-bold">{{ day }}:</span>
                {{ formatTimeslot(session, isMilitaryTime()) }}
              </span>
            </template>
          </div>
          <!-- End mobile times -->
        </td>
        <!-- Desktop times -->
        <td v-for="day in days" v-bind:key="day" class="time-cell desktop-only">
          <!-- TODO: fix different instructors for same timeslot -->
          <span
            v-for="timeslot in spaceOutTimeslots(
              section.crn,
              getSessions(section, day)
            )"
            v-bind:key="
              'desktop' +
              day +
              timeslot.timeStart +
              section.crn +
              timeslot.instructor +
              timeslot.location
            "
          >
            {{ formatTimeslot(timeslot, isMilitaryTime()) }}
            <br />
          </span>
        </td>
        <!-- End Desktop times -->
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import { Course, CourseSection, Timeslot } from "@/typings";
import { Component, Prop, Vue } from "vue-property-decorator";
import { mapGetters, mapState } from "vuex";
import SectionInfo from "@/components/sections/SectionInfo.vue";
import {
  formatCourseSize,
  formatTimeslot,
  getSessions,
  hasMetAllPrerequisites,
} from "@/utilities";

@Component({
  components: {
    SectionInfo,
  },
  computed: {
    formatTimeslot,
    formatCourseSize,
    getSessions,
    hasMetAllPrerequisites,
    ...mapGetters("settings", ["isMilitaryTime", "hidePrerequisitesState"]),
    ...mapGetters("schedule", ["isSelected"]),
    ...mapGetters("prerequisites", ["prerequisiteCheckingState"]),
    ...mapState(["courseSizes"]),
  },
})
export default class Section extends Vue {
  @Prop() readonly course!: Course;
  days = ["M", "T", "W", "R", "F"];
  conflicts: { [crn: number]: boolean } = {};

  mounted() {
    for (const section of this.course.sections) {
      this.$store.getters["schedule/getInConflict"](section.crn).then(
        (isInConflict: number) => {
          Vue.set(this.conflicts, section.crn, isInConflict);
        }
      );
    }
  }

  toggleSelection(
    section: CourseSection,
    newState: boolean | null = null,
    rePopulateConflicts = true
  ) {
    let selected = true;

    if (section.crn in this.$store.state.schedule.selectedSections) {
      // @ts-expect-error: This is mapped in the custom computed section
      selected = !this.isSelected(section.crn);
    }

    if (newState !== null) {
      selected = newState;
    }

    this.$store.commit("schedule/setSelected", {
      crn: section.crn,
      selected,
    });
    if (rePopulateConflicts) {
      this.$store.dispatch("schedule/generateCurrentSchedulesAndConflicts");
    }
  }

  toggleAll() {
    let turnedOnAnySection = false;
    for (const section of this.course.sections) {
      if (!this.$store.getters["schedule/isSelected"](section.crn)) {
        this.toggleSelection(section, true, false);
        turnedOnAnySection = true;
      }
    }
    if (!turnedOnAnySection) {
      for (const section of this.course.sections) {
        this.toggleSelection(section, false, false);
      }
    }

    this.$store.dispatch("schedule/generateCurrentSchedulesAndConflicts");
  }

  // Calculates the order of the timeslots for each section
  // For example if a section with the crn 1234 has times that start at 1000, 1100, 800
  //This will return a json of {1234:{800:0, 1000:1, 1100:2}}
  get sessionIndex(): { [crn: string]: { [time: number]: number } } {
    const sessionOrders: { [crn: string]: { [time: number]: number } } = {};

    for (const section of this.course.sections) {
      // Since some course sections have multiple timeslots at the same time on the same
      // day (thanks SIS!), we first have to count up how many times this timeslot has
      // occurred each day.
      const dayTimes: { [day: string]: { [time: number]: number } } = {};

      for (const timeslot of section.timeslots) {
        for (const day of timeslot.days) {
          if (!(day in dayTimes)) {
            dayTimes[day] = {};
          }

          if (timeslot.timeStart in dayTimes[day]) {
            dayTimes[day][timeslot.timeStart]++;
          } else {
            dayTimes[day][timeslot.timeStart] = 1;
          }
        }
      }

      // Store the max number of occurrences of each time so we can correctly space things out
      const times: { [key: number]: number } = {};
      for (const day in dayTimes) {
        for (const time in dayTimes[day]) {
          const occurrences = dayTimes[day][time];

          if (!(time in times) || occurrences > times[time]) {
            times[time] = occurrences;
          }
        }
      }

      const sortedTimes = Object.keys(times);
      sortedTimes.sort((a, b) => (parseInt(a) > parseInt(b) ? 1 : -1));
      sessionOrders[section.crn] = {};

      let currRow = 0;
      for (const time of sortedTimes) {
        sessionOrders[section.crn][parseInt(time)] = currRow;
        currRow += times[parseInt(time)];
      }
    }

    return sessionOrders;
  }

  //Takes in a crn and a list of timeslots
  //Returns a list of timeslots but with spacers inserted so that
  //Times on different days line up
  spaceOutTimeslots(crn: string, timeslots: Timeslot[]): Timeslot[] {
    const spacedTimeslots: Timeslot[] = [];

    //Go through all the timeslots inserting spacers when needed to line up times
    let numSpacers = 0;
    for (const timeslot of timeslots) {
      while (
        spacedTimeslots.length < this.sessionIndex[crn][timeslot.timeStart]
      ) {
        numSpacers++;
        //This acts as a spacer
        spacedTimeslots.push({
          days: [],
          timeStart: -1 * numSpacers,
          timeEnd: -1 * numSpacers,
          instructor: "",
          dateStart: "",
          dateEnd: "",
          location: "",
        });
      }

      spacedTimeslots.push(timeslot);
    }
    return spacedTimeslots;
  }
}
</script>

<style scoped>
.week-day {
  width: fit-content;
  text-align: center;
}

.time-cell {
  font-size: 10pt;
  padding: 3px !important;
  white-space: nowrap;
}

.info-cell {
  font-size: 13pt;
}

.location {
  font-style: italic;
}

.padding-left {
  padding-left: 0.2rem;
}

.select-section {
  cursor: pointer;
}

.select-section:hover {
  background: var(--course-row-hover);
}

.select-section > * > svg {
  width: 100%;
  text-align: center;
  vertical-align: top;
  font-size: 2rem;
}

.conflict {
  text-decoration: line-through;
  background: var(--conflict-row);
}

.conflict:hover {
  background: var(--conflict-row-hover);
}

.selected {
  background: var(--selected-row);
}

.selected:hover {
  background: var(--selected-row-hover);
}

.invisible {
  visibility: hidden;
}

.prerequisiteError {
  background: var(--prerequisite-error-icon);
  color: var(--prerequisite-text);
  margin: 0px 0.3rem;
  padding: 0.2rem 0.4rem;
}

.hidden {
  display: none;
}

.more-info {
  width: auto;
}

.info-icon {
  transition: all 0.2s ease-in-out;
  float: left;
  margin-right: 0.5rem;
  font-size: 3rem !important;
  width: auto !important;
}
.info-icon:hover,
.info-icon:focus {
  transform: scale(1.5);
}

@media (min-width: 992px) {
  .info-icon {
    font-size: 1.7rem !important;
  }
}
</style>
