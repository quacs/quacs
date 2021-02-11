<template>
  <div class="accordion" role="tablist">
    <b-container fluid>
      <b-row>
        <b-col cols="0">
          <b-button
            v-on:click="semBarsExpanded = !semBarsExpanded"
            variant="info"
          >
            <font-awesome-icon
              :icon="['fas', 'caret-right']"
              class="open_close_icon"
              :class="{ opened_icon: semBarsExpanded }"
            ></font-awesome-icon>
          </b-button>
        </b-col>

        <b-col>
          <div class="sem-bar-wrapper">
            <div class="sem-bar-segments" ref="semBarSegments">
              <b-collapse
                :visible="semBarsExpanded"
                accordion="my-accordion"
                role="tabpanel"
              >
                <div
                  v-on:click="propagateClick('localSemesterBars', $event)"
                  ref="localSemesterBars"
                >
                  <div v-for="section in sections" :key="section.crn">
                    <b-progress :max="1" class="mb-3">
                      <b-progress-bar
                        v-for="segment in getSegments(section)"
                        :key="segment.key"
                        :value="segment.fillPercentage"
                        :variant="segment.variant"
                        :label="section.title"
                      ></b-progress-bar>
                    </b-progress>
                  </div>
                </div>
              </b-collapse>

              <b-collapse
                :visible="!semBarsExpanded"
                accordion="my-accordion"
                role="tabpanel"
              >
                <div
                  v-on:click="propagateClick('globalSemesterBars', $event)"
                  ref="globalSemesterBars"
                >
                  <b-progress :max="1" class="mb-3">
                    <b-progress-bar
                      v-for="segment in subsemSegments"
                      :class="
                        segment.startPercentage !== 0 ? 'subsem-bar-inner' : ''
                      "
                      :key="segment.key"
                      :value="segment.fillPercentage"
                      :variant="segment.variant"
                    ></b-progress-bar>
                  </b-progress>
                </div>
              </b-collapse>
            </div>

            <div class="sem-bar-selector">
              <b-progress
                :max="1"
                class="mb-3"
              >
                <b-progress-bar
                  v-for="segment in subsemSegments"
                  :class="
                    segment.startPercentage !== 0 ? 'subsem-bar-inner' : ''
                  "
                  :key="segment.key"
                  :value="segment.fillPercentage"
                  :variant="segment.variant"
                ></b-progress-bar>
              </b-progress>
            </div>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script lang="ts">
import { Component, Prop, ModelSync, Vue, Watch } from "vue-property-decorator";
import {
  BButton,
  BCol,
  BCollapse,
  BContainer,
  BProgress,
  BProgressBar,
  BRow,
} from "bootstrap-vue";
import { CourseSection } from "@/typings";
import { timeslotStartEndUnix } from "@/utilities";

interface PercentageSegment {
  key: number;
  startPercentage: number;
  fillPercentage: number;
  variant: string;
}

@Component({
  components: {
    "b-button": BButton,
    "b-col": BCol,
    "b-collapse": BCollapse,
    "b-container": BContainer,
    "b-progress": BProgress,
    "b-progress-bar": BProgressBar,
    "b-row": BRow,
  },
})
export default class SemesterBars extends Vue {
  @Prop() readonly sections!: CourseSection[];

  // Using @ModelSync lets us propagate this value to the parent component (e.g. the calendar)
  // which can use it to determine which sections to render.
  @ModelSync("selectedDate", "change", { type: Number })
  clickedDate!: number;

  // Stored as Unix times for Easy Math™
  semesterStart = 0;
  semesterEnd = 0;

  semBarsExpanded = false;

  mounted(): void {
    this.calculateSemesterBoundaries();
  }

  @Watch("sections")
  calculateSemesterBoundaries(): void {
    // Identify start and end dates for the semester
    this.semesterStart = Number.POSITIVE_INFINITY;
    this.semesterEnd = Number.NEGATIVE_INFINITY;

    for (const section of this.sections) {
      for (const timeslot of section.timeslots) {
        const [timeslotStart, timeslotEnd] = timeslotStartEndUnix(timeslot);

        if (timeslotStart === null || timeslotEnd === null) {
          continue;
        }

        this.semesterStart = Math.min(this.semesterStart, timeslotStart);
        this.semesterEnd = Math.max(this.semesterEnd, timeslotEnd);
      }
    }
  }

  get subsemSegments(): PercentageSegment[] {
    const allSegments = this.sections
      .map((section) => this.getSegments(section))
      .flat();

    const startPoints = Array.from(allSegments)
      .sort((seg1, seg2) => seg2.startPercentage - seg1.startPercentage)
      .map((seg) => seg.startPercentage);

    const endPoints = Array.from(allSegments)
      .sort(
        (seg1, seg2) =>
          seg2.startPercentage +
          seg2.fillPercentage -
          (seg1.startPercentage + seg1.fillPercentage)
      )
      .map((seg) => seg.startPercentage + seg.fillPercentage);

    const togglePoints = Array.from(
      new Set(startPoints.concat(endPoints))
    ).sort();

    let startPoint = togglePoints[0];
    const segments = [];
    for (const endPoint of togglePoints.slice(1)) {
      segments.push({
        key: startPoint,
        startPercentage: startPoint,
        fillPercentage: endPoint - startPoint,
        variant: "success",
      });
      startPoint = endPoint;
    }

    return segments;
  }

  get getSegments() {
    return (section: CourseSection): PercentageSegment[] => {
      // We first need to identify all times a class starts or ends
      const togglePoints = new Set([this.semesterStart, this.semesterEnd]);
      for (const timeslot of section.timeslots) {
        const [timeslotStart, timeslotEnd] = timeslotStartEndUnix(timeslot);

        if (timeslotStart === null || timeslotEnd === null) {
          continue;
        }

        togglePoints.add(timeslotStart);
        togglePoints.add(timeslotEnd);
      }

      // Sort the toggle points, then remove the first one (since we know it'll be the
      // start of the semester).
      const sortedTogglePoints: number[] = Array.from(togglePoints)
        .sort()
        .slice(1);
      const segments = [];

      /*
        Example section:
        +---------------------------------------------------------------------+
        |                                |////////////////////////////|       |
        +---------------------------------------------------------------------+
        |      |///////////////////////////////////|                          |
        +---------------------------------------------------------------------+
        In the above, the overall table represents a section's semester offering with each
        row representing a single timeslot for a given section.  If an area is shaded, that
        means the timeslot is active during those days in the semester.
        We want to collapse the above to the below, since we just care about if a course
        is offered during that time:
        +---------------------------------------------------------------------+
        |      |//////////////////////////////////////////////////////|       |
        +---------------------------------------------------------------------+
        TODO: Do we actually want to do this?  If the two timeslots have different date offerings,
        shouldn't they be displayed as separate bars?

        Pseudocode:
          current segment start = semester start
          for each toggle point:
            if toggle point is inside another timeslot or it's both a start and end of a timeslot:
              continue

            if toggle point is at start of timeslot:
              current segment end = toggle point
              save current segment as inactive
              current segment start = current segment end

            if toggle point is at end of timeslot:
              current segment end = toggle point
              save current segment as active
              current segment start = current segment end
          save the final segment as inactive, if it exists
      */

      let currSegStart = this.semesterStart;
      let startPercentage = 0;
      for (const togglePoint of sortedTogglePoints) {
        let isStartOfTimeslot = false;
        let isEndOfTimeslot = false;
        let isInsideTimeslot = false;

        // We have to do a nested loop here to determine which categories this toggle point
        // fall into
        // Is there a more efficient way?
        for (const timeslot of section.timeslots) {
          const [timeslotStart, timeslotEnd] = timeslotStartEndUnix(timeslot);

          if (timeslotStart === null || timeslotEnd === null) {
            continue;
          }

          if (togglePoint === timeslotStart) {
            isStartOfTimeslot = true;
          }

          if (togglePoint === timeslotEnd) {
            isEndOfTimeslot = true;
          }

          if (timeslotStart < togglePoint && togglePoint < timeslotEnd) {
            isInsideTimeslot = true;
          }
        }

        if (isInsideTimeslot || isStartOfTimeslot === isEndOfTimeslot) {
          continue;
        }

        // If we get here, there definitely is a segment which ends here

        const fillPercentage =
          (togglePoint - currSegStart) /
          (this.semesterEnd - this.semesterStart);
        const key = currSegStart;

        if (isStartOfTimeslot) {
          // The segment which ends here is inactive
          segments.push({
            variant: "danger",
            key,
            fillPercentage,
            startPercentage,
          });
        } else if (isEndOfTimeslot) {
          // The segment which ends here is active
          segments.push({
            variant: "success",
            key,
            fillPercentage,
            startPercentage,
          });
        }

        startPercentage += fillPercentage;
        currSegStart = togglePoint;
      }

      return segments;
    };
  }

  propagateClick(refName: string, event: { layerX: number }): void {
    const x = event.layerX;
    // @ts-expect-error: Typescript doesn't know that `semesterBars` has a `clientWidth` attribute
    const selfWidth = this.$refs[refName].clientWidth;

    const clickedPercentage = x / selfWidth;

    this.clickedDate =
      clickedPercentage * (this.semesterEnd - this.semesterStart) +
      this.semesterStart;
  }
}
</script>

<style>
.subsem-bar-inner {
  border-style: none;
  border-color: black;
  border-left-style: solid;
}

.open_close_icon {
  transition: 0.5s;
}

.opened_icon {
  transform: rotate(90deg);
}

.sem-bar-wrapper {
  position: relative;
}

.sem-bar-selector {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
</style>
