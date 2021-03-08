<template>
  <span>
    <span
      v-for="badge in badges"
      :key="badge.key"
      class="custom-badge rounded"
      :style="{ background: badge.color }"
    >
      <span
        v-if="badge.clickAction"
        v-on:click.stop.prevent
        v-on:keyup.enter.stop.prevent
        :tabindex="0"
        @click="badge.clickAction"
        @keyup.enter="badge.clickAction"
      >
        <span v-for="(icon, index) in badge.icons" :key="icon">
          <font-awesome-icon :icon="['fas', icon]"></font-awesome-icon>
          <template v-if="index < badge.icons.length - 1"> / </template>
        </span>
        {{ badge.value }}
      </span>
      <span v-else>
        <span v-for="(icon, index) in badge.icons" :key="icon">
          <font-awesome-icon :icon="['fas', icon]"></font-awesome-icon>
          <template v-if="index < badge.icons.length - 1"> / </template>
        </span>
        {{ badge.value }}
      </span>
    </span>
  </span>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Course } from "@/typings";
import { mapGetters } from "vuex";
import { hasMetAllPrerequisites, trackEvent } from "@/utilities";
import { ModalPlugin } from "bootstrap-vue";

Vue.use(ModalPlugin);

interface badge {
  key: string;
  icons: string[];
  color: string;
  value: string;
  clickAction?: () => void;
}

@Component({
  computed: {
    ...mapGetters("prerequisites", [
      "prerequisiteCheckingState",
      "getPriorCourses",
    ]),
    hasMetAllPrerequisites,
  },
})
export default class CourseBadges extends Vue {
  @Prop() readonly course!: Course;

  showCourseModal(crn: number): void {
    trackEvent("Course modal", "info-modal");
    this.$bvModal.show("course-info" + crn);
  }

  get badges(): (badge | null)[] {
    return [
      this.alreadyTaken,
      this.fullSections,
      this.areThereMissingPrerequisites,
      this.locationType,
    ]
      .flat()
      .filter(function (val) {
        return val !== null && val !== undefined;
      });
  }

  get alreadyTaken(): badge | null {
    // @ts-expect-error: This is mapped in the custom computed section
    if (this.getPriorCourses()[this.course.id]) {
      return {
        key: "already-taken",
        icons: ["clipboard-check"],
        color: "var(--badge-warn)",
        value: "Already taken",
      };
    }

    return null;
  }

  get areThereMissingPrerequisites(): badge | null {
    let missingPrerequisiteSections: number[] = [];
    // @ts-expect-error: This is mapped in the custom computed section
    if (!this.prerequisiteCheckingState) {
      this.$emit("missing-prerequisite-sections", missingPrerequisiteSections);
      return null;
    }

    for (const section of this.course.sections) {
      // @ts-expect-error: This is mapped in the custom computed section
      if (!this.hasMetAllPrerequisites(section.crn)) {
        missingPrerequisiteSections.push(section.crn);
      }
    }

    this.$emit("missing-prerequisite-sections", missingPrerequisiteSections);

    if (missingPrerequisiteSections.length === 0) {
      return null;
    }

    return {
      key: "prerequisites",
      icons: ["exclamation-triangle"],
      color:
        missingPrerequisiteSections.length !== this.course.sections.length
          ? "var(--badge-warn)"
          : "var(--badge-error)",
      value: `Missing prerequisites${
        missingPrerequisiteSections.length !== this.course.sections.length
          ? " for some sections"
          : ""
      }`,
      clickAction: () => {
        this.showCourseModal(this.course.sections[0].crn);
      },
    };
  }

  // Gets if this course is online
  // Will emit the list of sections and the locationType for that section
  get locationType(): badge[] {
    let sectionLocationTypes: { crn: number; type: string }[] = [];
    for (const section of this.course.sections) {
      if (this.course.sections[0].attribute.includes("Hybrid")) {
        sectionLocationTypes.push({ crn: section.crn, type: "hybrid" });
      } else if (this.course.sections[0].attribute.includes("Online")) {
        sectionLocationTypes.push({ crn: section.crn, type: "online" });
      } else if (this.course.sections[0].attribute.includes("In-Person")) {
        sectionLocationTypes.push({ crn: section.crn, type: "in-person" });
      }
    }

    this.$emit("location-types", sectionLocationTypes);

    const sectionTypes = [
      ...new Set(sectionLocationTypes.map((section) => section.type)),
    ].sort();
    const badges = [];
    for (const theType of sectionTypes) {
      if (theType === "hybrid") {
        badges.push({
          key: "locationType-hybrid",
          icons: ["user", "laptop-house"],
          color: "var(--badge-warn)",
          value: "Hybrid Course",
        });
      } else if (theType === "online") {
        badges.push({
          key: "locationType-online",
          icons: ["laptop-house"],
          color: "var(--badge-warn)",
          value: "Online Course",
        });
      } else if (theType === "in-person") {
        badges.push({
          key: "locationType-in-person",
          icons: ["user"],
          color: "var(--badge-warn)",
          value: "In-Person Course",
        });
      } else {
        //eslint-disable-next-line
        console.error("Invalid section type", theType);
      }
    }

    return badges;
  }

  // Goes through each section to see if they are full
  // Will emit the list of sections which are full
  get fullSections(): badge | null {
    let fullSections = [];
    for (const section of this.course.sections) {
      if (section.rem <= 0) {
        fullSections.push(section.crn);
      }
    }

    this.$emit("full-sections", fullSections);

    if (fullSections.length == 0) {
      return null;
    }

    const courseFull = fullSections.length === this.course.sections.length;
    return {
      key: "fullSections",
      icons: [courseFull ? "user-slash" : "exclamation-triangle"],
      color: courseFull ? "var(--badge-error)" : "var(--badge-warn)",
      value: courseFull ? "Full Course" : "Full Sections",
    };
  }
}
</script>
