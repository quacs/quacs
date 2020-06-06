<template>
  <b-list-group class="mobile-only">
    <b-list-group-item
      v-for="section in course.sections"
      v-bind:key="section.crn"
      v-on:click="toggleSelection(section)"
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
          <span
            v-for="session in getSessions(section, day)"
            v-bind:key="session.time_start"
          >
            <span class="font-weight-bold">{{ day }}:</span>
            {{ formatTimeslot(session) }}
          </span>
        </template>
      </span>
    </b-list-group-item>
  </b-list-group>
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
.week-day-time {
  font-size: 10pt;
  padding: 1px !important;
}

.conflict {
  text-decoration: line-through;
  background: #ff7b7b;
}

.selected {
  background: #9198f9;
}
</style>
