<template>
  <b-card>
    <template v-slot:header v-on:click="expanded = !expanded">
      <DropdownCaret v-bind:expanded="expanded" />

      <span class="font-weight-bold"
        >{{ course.subj }}-{{ course.crse }}: {{ course.title }}</span
      >
      <!--TODO format credit nicely using min and max only showing what is needed -->
      {{ course.sections[0].cred_min }} credit<template
        v-if="course.sections[0].cred_min != 1"
        >s</template
      >
      <br />
      {{ getDescription(course.subj, course.crse) }}
    </template>

    <!-- only rendered on mobile -->
    <!--MobileSections
      v-for="section in this.course.sections"
      v-bind:key="section.crn"
      v-bind:section="section"
      v-bind:course="course"
    /-->

    <!-- only rendered on desktop -->
    <DesktopSections v-bind:course="course" />
  </b-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Course } from "@/typings";

import MobileSections from "./sections/MobileSections.vue";
import DesktopSections from "./sections/DesktopSections.vue";
import DropdownCaret from "./utils/DropdownCaret.vue";

@Component({
  components: {
    MobileSections,
    DesktopSections,
    DropdownCaret
  }
})
export default class CourseCard extends Vue {
  @Prop() readonly course!: Course;
  @Prop({ default: false }) expanded!: boolean;

  getDescription(subject: string, code: string): string {
    const catname = subject + "-" + code;
    if (catname in this.$store.state.catalog) {
      return this.$store.state.catalog[catname].description;
    }

    return "";
  }
}
</script>
