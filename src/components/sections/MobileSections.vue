<template>
  <ul class="list-group mobile-only">
    <li
      v-for="section in course.sections"
      v-bind:key="section.crn"
      v-on:click="toggleSelection(section)"
      class="list-group-item course-row"
      :class="{
        selected: isSelected(section.crn),
        conflict: isInConflict(section.crn)
      }"
    >
      <span class="font-weight-bold">{{ section.sec }}</span>
      {{ section.crn }}
      {{ section.instructor }}
      {{ section.timeslots[0].date_start }}-{{ section.timeslots[0].date_end }}
      <br />
      {{ section.timeslots[0].instrutor }}
      <br />

      <!-- List timeslots -->
      <span class="week-day-time">
        <template v-for="day in days">
          <!-- TODO: fix different instructors for same timeslot -->
          <span
            v-for="session in getSessions(section, day)"
            v-bind:key="
              'mobile' +
                day +
                session.time_start +
                section.crn +
                session.instrutor +
                session.location
            "
          >
            <span class="font-weight-bold">{{ day }}:</span>
            {{ formatTimeslot(session) }}
          </span>
        </template>
      </span>
    </li>
  </ul>
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
export default class MobileSections extends Vue {
  @Prop() readonly course!: Course;
  days = ["M", "T", "W", "R", "F"];

  toggleSelection(section: CourseSection, selected: boolean | null = null) {
    let newState = true;

    if (selected !== null) {
      newState = selected;
    } else if (section.crn in this.$store.state.courses.selectedSections) {
      newState = !this.$store.state.courses.selected(section.crn);
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
