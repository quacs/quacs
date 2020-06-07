<template>
  <table class="desktop-only table table-bordered" style="margin-bottom: 0px">
    <thead>
      <tr>
        <th style="width:100%">Info</th>
        <th v-for="day in days" v-bind:key="day" class="week-day">
          {{ day }}
        </th>
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="section in course.sections"
        v-bind:key="section.crn"
        v-on:click="toggleSelection(section)"
        class="course-row"
        v-bind:class="{
          selected: isSelected(section.crn),
          conflict: isInConflict(section.crn)
        }"
      >
        <td class="info-cell">
          <span class="font-weight-bold">{{ section.sec }}</span
          >-{{ section.crn }}
          {{ section.instructor }}
          {{ section.timeslots[0].date_start }}-{{
            section.timeslots[0].date_end
          }}
          {{ section.timeslots[0].instructor }}
        </td>

        <td v-for="day in days" v-bind:key="day" class="time-cell">
          <!-- TODO: fix different instructors for same timeslot -->
          <span
            v-for="session in getSessions(section, day)"
            v-bind:key="
              'desktop' +
                day +
                session.time_start +
                section.crn +
                session.instructor +
                session.location
            "
          >
            <nobr>{{ formatTimeslot(session) }}</nobr>
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
import { Course, CourseSection } from "@/typings";
import { formatTimeslot, getSessions } from "./utilities";

@Component({
  computed: {
    formatTimeslot,
    getSessions,
    ...mapGetters("sections", ["isSelected", "isInConflict"])
  }
})
export default class Section extends Vue {
  @Prop() readonly course!: Course;
  days = ["M", "T", "W", "R", "F"];

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
}
</script>

<style scoped>
@import "./style.css";
</style>
