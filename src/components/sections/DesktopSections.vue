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
        v-for="section in course.sections"
        v-bind:key="section.crn"
        v-on:click="toggleSelection(section)"
        v-on:keyup.enter="toggleSelection(section)"
        tabindex="0"
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
                formatCourseSize(section.crn, courseSizes) +
                ' spots currently available'
            "
            >{{ formatCourseSize(section.crn) }}</span
          >
        </td>

        <td v-for="day in days" v-bind:key="day" class="time-cell">
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
            {{ formatTimeslot(timeslot) }}
            <br />
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import GeneralSections from "./GeneralSections.vue";

export default GeneralSections;
</script>

<style scoped>
@import "./style.css";
</style>
