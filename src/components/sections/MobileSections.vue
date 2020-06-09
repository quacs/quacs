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
import GeneralSections from "./GeneralSections.vue";

export default GeneralSections;
</script>

<style scoped>
@import "./style.css";
</style>
