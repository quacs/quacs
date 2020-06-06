<template>
  <b-table-simple
    table-class="desktop-only"
    v-bind:bordered="true"
    style="margin-bottom:0px"
  >
    <b-thead>
      <b-tr>
        <b-th style="width:100%">Info</b-th>
        <b-th v-for="day in days" v-bind:key="day" class="week-day">
          {{ day }}
        </b-th>
      </b-tr>
    </b-thead>

    <b-tbody>
      <b-tr
        v-for="section in course.sections"
        v-bind:key="section.crn"
        v-on:click="toggleSelection(section)"
        v-bind:class="{
          selected: isSelected(section.crn),
          conflict: isInConflict(section.crn)
        }"
      >
        <b-td class="info-cell">
          <span class="font-weight-bold">{{ section.sec }}</span
          >-{{ section.crn }}
          {{ section.instructor }}
          {{ section.timeslots[0].date_start }}-{{
            section.timeslots[0].date_end
          }}
          {{ section.timeslots[0].instructor }}
        </b-td>

        <b-td v-for="day in days" v-bind:key="day" class="time-cell">
          <span
            v-for="session in getSessions(section, day)"
            v-bind:key="session.time_start"
          >
            <nobr>{{ formatTimeslot(session) }}</nobr>
            <br />
          </span>
        </b-td>
      </b-tr>
    </b-tbody>
  </b-table-simple>
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
.week-day {
  width: fit-content;
}

.conflict {
  text-decoration: line-through;
  background: #ff7b7b;
}

.selected {
  background: #9198f9;
}

.info-cell {
  font-size: 11pt;
}

.time-cell {
  font-size: 10pt;
  padding: 3px !important;
}
</style>
