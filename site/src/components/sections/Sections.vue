<template>
  <table class="table table-bordered" style="margin-bottom: 0px">
    <thead>
      <tr
        v-on:click="toggleAll()"
        class="select-section"
        tabindex="0"
        v-on:keyup.enter="toggleAll()"
      >
        <th style="width: 100%">Toggle all sections</th>
        <th
          v-for="day in getDays()"
          v-bind:key="day"
          class="week-day desktop-only"
        >
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
            @click="showSectionModal(section.crn)"
            @keyup.enter="showSectionModal(section.crn)"
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
            @click="showSectionModal(section.crn)"
            @keyup.enter="showSectionModal(section.crn)"
          >
            <font-awesome-icon
              :icon="['fas', 'exclamation-triangle']"
            ></font-awesome-icon>
            Missing Prerequisites</span
          >
          <span
            class="padding-left prerequisiteError"
            :class="{
              hidden: !(section.rem <= 0),
            }"
            v-on:click.stop.prevent
            v-on:keyup.enter.stop.prevent
            @click="showSectionModal(section.crn)"
            @keyup.enter="showSectionModal(section.crn)"
          >
            <font-awesome-icon
              :icon="['fas', 'user-slash']"
            ></font-awesome-icon>
            Full Section</span
          >
          <!-- Show the XL-full message if:
            1. The section is not already full (avoids duplicate full section/full course)
              - AND -
            2. The course is an XL course and is out of XL seats. -->
          <span
            class="padding-left prerequisiteError"
            :class="{
              hidden:
                section.xl_rem === undefined ||
                section.xl_rem > 0 ||
                section.rem <= 0,
            }"
            v-on:click.stop.prevent
            v-on:keyup.enter.stop.prevent
            @click="showSectionModal(section.crn)"
            @keyup.enter="showSectionModal(section.crn)"
          >
            <font-awesome-icon
              :icon="['fas', 'user-slash']"
            ></font-awesome-icon>
            Full Section (No cross-list seats remaining)</span
          >
          <span title="Professor(s)">
            | {{ section.timeslots[0].instructor }} |
          </span>
          <span title="dates">
            {{ section.timeslots[0].dateStart }} -
            {{ section.timeslots[0].dateEnd }} |
          </span>
          <span
            class="padding-left"
            v-b-tooltip.hover
            :title="
              'There are ' +
              formatCourseSize(section) +
              '. Check SIS for more up to date information.'
            "
            >{{ formatCourseSize(section) }}</span
          >
          <!-- Mobile times -->
          <div class="mobile-only">
            <template v-for="day in getDays()">
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
        <td
          v-for="day in getDays()"
          v-bind:key="day"
          class="time-cell desktop-only"
          :class="'time-cell-' + day"
        >
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
import { VBTooltip } from "bootstrap-vue";

@Component({
  components: {
    SectionInfo,
  },
  directives: {
    "b-tooltip": VBTooltip,
  },
  computed: {
    formatTimeslot,
    formatCourseSize,
    getSessions,
    hasMetAllPrerequisites,
    ...mapGetters("settings", ["isMilitaryTime", "hidePrerequisitesState"]),
    ...mapGetters("schedule", ["isSelected"]),
    ...mapState("schedule", ["courseSets", "currentTerm", "currentCourseSet"]),
    ...mapGetters("prerequisites", ["prerequisiteCheckingState"]),
  },
})
export default class Section extends Vue {
  @Prop() readonly course!: Course;
  days = [] as string[];
  conflicts: { [crn: number]: boolean } = {};

  mounted(): void {
    for (const section of this.course.sections) {
      this.$store
        .dispatch("schedule/isInConflict", section.crn)
        .then((isInConflict: number) => {
          Vue.set(this.conflicts, section.crn, isInConflict);
        });
    }
  }

  getDays(): string[] {
    // Don't compute the days array again
    if (this.days.length > 0) {
      return this.days;
    }

    // By default, we list all 5 weekdays
    this.days = ["M", "T", "W", "R", "F"];

    // Check to see if the class has a weekend entry
    const weekendTime = (timeslot: Timeslot) =>
      timeslot.days.includes("S") || timeslot.days.includes("U");
    const hasWeekend = this.course.sections.some((section) =>
      section.timeslots.some(weekendTime)
    );

    // Only display weekend days if necessary
    if (hasWeekend) {
      this.days.push("S");
      this.days.push("U");
    }

    return this.days;
  }

  toggleSelection(
    section: CourseSection,
    newState: boolean | null = null,
    rePopulateConflicts = true
  ): void {
    let selected = true;

    if (
      // @ts-expect-error: This is mapped in the custom computed section
      section.crn in this.courseSets[this.currentTerm][this.currentCourseSet]
    ) {
      // @ts-expect-error: This is mapped in the custom computed section
      selected = !this.isSelected(section.crn);
    }

    if (newState !== null) {
      selected = newState;
    }

    this.$store.dispatch("schedule/setSelected", {
      crn: section.crn,
      selected,
    });

    if (rePopulateConflicts) {
      this.$store.dispatch("schedule/generateSchedulesAndConflicts");
    }
  }

  toggleAll(): void {
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

    this.$store.dispatch("schedule/generateSchedulesAndConflicts");
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
          type: "",
        });
      }

      spacedTimeslots.push(timeslot);
    }
    return spacedTimeslots;
  }

  showSectionModal(crn: string): void {
    this.$bvModal.show("section-info" + crn);
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
  background: var(--prerequisite-warn-icon);
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
