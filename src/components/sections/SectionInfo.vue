<template>
  <div>
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
    <b-modal :id="'section-info' + section.crn" title="Section Info">
      <div class="font-weight-bold">Prerequisites:</div>
      <span v-html="formatPrerequisites(section.crn) || 'None'"></span>
      <template v-if="prerequisiteData.cross_list_courses">
        <div class="font-weight-bold">Cross listed with:</div>
        <span
          v-for="course in prerequisiteData.cross_list_courses"
          :key="course"
          class="course"
          :class="{
            takenCourse:
              course.split(' ').join('-') in
              $store.getters['prerequisites/getPriorCourses'](),
          }"
          >{{ course }}
        </span>
        <!-- :class="{green:course.split(" ").join("-") in $store.getters["prerequisites/getPriorCourses"]()}" -->
      </template>
      <br />
      <br />
      <div class="font-weight-bold">Seats:</div>
      <div>
        There are {{ formatCourseSize(section.crn, courseSizes) }} available.
        Check SIS for more up to data information.
      </div>
      <template v-slot:modal-footer="{ ok }">
        <b-button variant="primary" @click="ok()">
          Close
        </b-button>
      </template>
    </b-modal>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Section } from "@/typings";
import { formatCourseSize, formatPrerequisites } from "@/utilities";

@Component({
  computed: {
    formatPrerequisites,
    formatCourseSize,
    prerequisiteData: function () {
      // @ts-expect-error: ts does not understand that sections exists on 'this'
      return this.$store.state.prerequisitesData[this.section.crn];
    },
  },
})
export default class SectionInfo extends Vue {
  @Prop() readonly section!: Section;
}
</script>

<style scoped>
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

.course {
  color: var(--not-taken-course);
}

.course.takenCourse {
  color: var(--taken-course);
}
</style>
