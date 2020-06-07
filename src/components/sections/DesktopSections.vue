<template>
  <table class="desktop-only table table-bordered" style="margin-bottom: 0px">
    <thead>
      <tr>
        <th style="width:100%">Section Info</th>
        <th v-for="day in days" v-bind:key="day" class="week-day">
          {{ day }}
        </th>
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="section in sections"
        v-bind:key="section.crn"
        v-on:click="toggleSelection(section)"
        class="course-row"
        v-bind:class="{
          selected: isSelected(section.crn),
          conflict: isInConflict(section.crn)
        }"
      >
        <td class="info-cell">
          <span class="font-weight-bold" title="Section number">{{
            section.sec
          }}</span
          >-<span title="CRN: the unique id given to each section in sis">{{
            section.crn
          }}</span>
          {{ section.timeslots[0].instructor }}
          ({{ section.timeslots[0].dateStart }}-{{
            section.timeslots[0].dateEnd
          }})
          <span
            :title="
              'There are ' +
                formatCourseSize(section.crn) +
                ' spots currently available'
            "
            >{{ formatCourseSize(section.crn) }}</span
          >
        </td>

        <td v-for="day in days" v-bind:key="day" class="time-cell">
          <!-- TODO: fix different instructors for same timeslot -->
          <span
            v-for="session in spaceOutSessions(
              section.crn,
              getSessions(section, day)
            )"
            v-bind:key="
              'desktop' +
                day +
                session.timeStart +
                section.crn +
                session.instructor +
                session.location
            "
          >
            {{ formatTimeslot(session) }}
            <br />
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { mapGetters } from "vuex";
import { Course, CourseSection, Timeslot } from "@/typings";
import { formatTimeslot, getSessions, formatCourseSize } from "./utilities";

@Component({
  computed: {
    formatTimeslot,
    formatCourseSize,
    getSessions,
    ...mapGetters("sections", ["isSelected", "isInConflict"])
  }
})
export default class Section extends Vue {
  @Prop() readonly course!: Course;
  days = ["M", "T", "W", "R", "F"];
  sessionOrders: { [crn: string]: { [time: number]: number } } = {};

  get sections() {
    const sections = [];
    for (const crn in this.course.sections) {
      sections.push(this.course.sections[crn]);
    }
    return sections;
  }

  toggleSelection(section: CourseSection, selected: boolean | null = null) {
    let newState = true;

    if (selected !== null) {
      newState = selected;
    } else if (section.crn in this.$store.state.sections.selectedSections) {
      newState = !this.$store.getters["sections/isSelected"](section.crn);
    }

    this.$store.commit("sections/setSelected", {
      crn: section.crn,
      selected: newState
    });
    this.$store.commit("sections/updateConflicts", {
      crn: section.crn,
      conflicts: section.conflicts
    });
  }

  // Calculates the order of the timeslots for each section
  // For example if a section with the crn 1234 has times that start at 1000, 1100, 800
  //This will return a json of {1234:{800:0, 1000:1, 1100:2}}
  sessionIndex(): { [crn: string]: { [time: number]: number } } {
    //This is used to cache the data
    //TODO figure out how to use vue to do the caching for me. There must be a better way
    if (Object.keys(this.sessionOrders).length !== 0) {
      return this.sessionOrders;
    }
    for (const crn in this.course.sections) {
      //collect all the times and put them as keys in the times object (to remove duplicates)
      const times: { [key: string]: boolean } = {};
      for (const timeslot of this.course.sections[crn].timeslots) {
        times[timeslot.timeStart] = true;
      }

      //sort and go through each time giving them an index value
      const sortedTimes = Object.keys(times);
      sortedTimes.sort();
      console.log(sortedTimes);
      this.sessionOrders[crn] = {};
      for (let i = 0; i < sortedTimes.length; i++) {
        this.sessionOrders[crn][parseInt(sortedTimes[i])] = i;
      }
    }
    return this.sessionOrders;
  }

  //Takes in a crn and a list of timeslots
  //Returns a list of timeslots but with spacers inserted so that
  //Times on different days line up
  spaceOutSessions(crn: string, timeslots: Timeslot[]): Timeslot[] {
    const spacedTimeslots: Timeslot[] = [];
    if (crn == "25567") {
      console.log(this.sessionIndex()[crn]);
    }
    //Go through all the timeslots inserting spacers when needed to line up times
    for (let i = 0, count = 1; i < timeslots.length; i++, count++) {
      if (
        spacedTimeslots.length ==
        this.sessionIndex()[crn][timeslots[i].timeStart]
      ) {
        spacedTimeslots.push(timeslots[i]);
      } else {
        //This acts as a spacer
        spacedTimeslots.push({
          days: [],
          timeStart: -1 * count,
          timeEnd: -1 * count,
          instructor: "",
          dateStart: "",
          dateEnd: "",
          location: ""
        });
        i--;
      }
    }
    return spacedTimeslots;
  }
}
</script>

<style scoped>
@import "./style.css";
</style>
