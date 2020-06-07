<template>
  <ul class="list-group mobile-only">
    <li
      v-for="section in sections"
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
      {{ section.timeslots[0].dateStart }}-{{ section.timeslots[0].dateEnd }}
      {{ formatCourseSize(section.crn) }}
      <br />
      {{ section.timeslots[0].instructor }}
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
                session.timeStart +
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
import { formatTimeslot, getSessions, formatCourseSize } from "@/utilities";

@Component({
  computed: {
    formatTimeslot,
    getSessions,
    formatCourseSize,
    ...mapGetters("sections", ["isSelected", "isInConflict"])
  }
})
export default class MobileSections extends Vue {
  @Prop() readonly course!: Course;
  days = ["M", "T", "W", "R", "F"];

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
}
</script>

<style scoped>
@import "./style.css";
</style>
