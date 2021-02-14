<template>
  <b-collapse
    class="accordion"
    role="tablist"
    :visible="Array.isArray(subsemSegments) && subsemSegments.length > 1"
  >
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
          <div
            v-on:click="propagateClick('localSemesterBars', $event)"
            ref="localSemesterBars"
            class="sem-bar-wrapper"
          >
            <b-progress :max="1" class="sem-bar-selector mb-3">
              <b-progress-bar
                v-for="segment in subsemSegments"
                :class="segment.startPercentage !== 0 ? 'subsem-bar-inner' : ''"
                :key="segment.key"
                :value="segment.fillPercentage"
                variant="transparent"
              ></b-progress-bar>
            </b-progress>

            <b-progress :max="1" class="sem-bar-selector transparent mb-3">
              <b-progress-bar
                :value="percentageBeforeCurrentSubsem"
                class="transparent"
              ></b-progress-bar>
              <b-progress-bar
                :value="percentageOfCurrentSubsem"
                variant="dark"
                class="translucent"
              ></b-progress-bar>
              <b-progress-bar
                :value="
                  1 - percentageOfCurrentSubsem - percentageBeforeCurrentSubsem
                "
                class="transparent"
              ></b-progress-bar>
            </b-progress>

            <b-collapse
              :visible="semBarsExpanded"
              accordion="my-accordion"
              role="tabpanel"
            >
              <div class="sem-bar-wrapper">
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

                <b-progress
                  :max="1"
                  class="sem-bar-selector full-height transparent mb-3"
                >
                  <b-progress-bar
                    v-for="segment in subsemSegments"
                    :class="
                      segment.startPercentage !== 0 ? 'subsem-bar-inner' : ''
                    "
                    :key="segment.key"
                    :value="segment.fillPercentage"
                    variant="transparent"
                  ></b-progress-bar>
                </b-progress>

                <b-progress
                  :max="1"
                  class="sem-bar-selector full-height transparent mb-3"
                >
                  <b-progress-bar
                    :value="percentageBeforeCurrentSubsem"
                    class="transparent"
                  ></b-progress-bar>
                  <b-progress-bar
                    :value="percentageOfCurrentSubsem"
                    variant="dark"
                    class="translucent"
                  ></b-progress-bar>
                  <b-progress-bar
                    :value="
                      1 -
                      percentageBeforeCurrentSubsem -
                      percentageOfCurrentSubsem
                    "
                    class="transparent"
                  ></b-progress-bar>
                </b-progress>
              </div>
            </b-collapse>
          </div>
          <div style="position: relative; width: 100%">
            <span
              v-for="date, index in subsemDates"
              :key="date[0]"
              class="subsem-date"
              :style="{
                left: date[0] * 100 + '%',
                transform: `translate(${index===0?0:index==subsemDates.length-1?-100:-50}%, 0)`,
              }"
              >{{ date[1] }}</span
            >
          </div>
        </b-col>
      </b-row>

      <div style="text-align: center">
        <b-button class="mt-3" @click="switchToSubsem(currentSubsem - 1)"
          >Prev subsemester</b-button
        >
        <!--span>Currently viewing: 01/01 - 02/02</span-->
        <b-button class="mt-3" @click="switchToSubsem(currentSubsem + 1)"
          >Next subsemester</b-button
        >
      </div>
    </b-container>
  </b-collapse>
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

  semBarsExpanded = true;

  percentageBeforeCurrentSubsem = 0;
  percentageOfCurrentSubsem = 1;
  currentSubsem = 0;

  mounted(): void {
    this.calculateSemesterBoundaries();
  }

  // Identifies when the semester begins/ends so we can have accurate percentages in
  // the subsemester segment bars.
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

    // Reinitialize subsemester selector
    this.switchToSubsem(0);
  }

  // Gets a list of all subsemesters (represented as percentage segments).  This is used
  // for the overall semester bar.
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

  get subsemDates(): [number, string][] {
    const monthsShortStr = [
      "Jan.",
      "Feb.",
      "Mar.",
      "Apr.",
      "May",
      "June",
      "July",
      "Aug.",
      "Sep.",
      "Oct.",
      "Nov.",
      "Dec.",
    ];

    const ret = [];

    for (const segment of this.subsemSegments) {
      const startTimestamp =
        segment.startPercentage * (this.semesterEnd - this.semesterStart) +
        this.semesterStart;

      const startDate = new Date(startTimestamp);
      const shortStr = `${
        monthsShortStr[startDate.getMonth()]
      } ${startDate.getDate()}`;

      ret.push([segment.startPercentage, shortStr]);
    }

    const endDate = new Date(this.semesterEnd);
    const shortStr = `${
      monthsShortStr[endDate.getMonth()]
    } ${endDate.getDate()}`;

    ret.push([1, shortStr]);

    // Typescript isn't good enough to see that we're returning the right type :(
    return ret as [number, string][];
  }

  // Returns the segments for an individual course bar.
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

    // Identify which subsem we're in and switch to it
    for (const subsemIdxStr in this.subsemSegments) {
      const subsemIdx = parseInt(subsemIdxStr);

      const segment = this.subsemSegments[subsemIdx];
      if (
        segment.startPercentage + segment.fillPercentage >=
        clickedPercentage
      ) {
        this.switchToSubsem(subsemIdx);
        break;
      }
    }
  }

  // Updates stored percentage values for overall subsemester array based on new subsemester values
  switchToSubsem(subsemIdx: number): void {
    if (this.subsemSegments.length === 0) {
      // If we haven't initialized subsemSegments, just leave
      return;
    }

    // Since Javascript modulus doesn't account for negative numbers, we can just
    // add the subsemSegments length to make it positive.  Since this will only ever be
    // negative with a value of -1, this hack is fine.
    this.currentSubsem =
      (subsemIdx + this.subsemSegments.length) % this.subsemSegments.length;

    this.percentageBeforeCurrentSubsem = this.subsemSegments[
      this.currentSubsem
    ].startPercentage;

    this.percentageOfCurrentSubsem = this.subsemSegments[
      this.currentSubsem
    ].fillPercentage;

    const subsemCenter =
      this.percentageBeforeCurrentSubsem + this.percentageOfCurrentSubsem / 2;

    this.clickedDate =
      subsemCenter * (this.semesterEnd - this.semesterStart) +
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

.full-height {
  height: 100%;
}

.transparent {
  background-color: #0000;
}

.translucent {
  opacity: 40%;
}

.subsem-date {
  position: absolute;
  white-space: nowrap;
}
</style>
