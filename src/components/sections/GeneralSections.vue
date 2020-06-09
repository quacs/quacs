<!-- This file stores the logic which drives DesktopSections and MobileSections -->
<!-- The HTML templates for each of those components are found in their respective files -->

<script lang="ts">
import { Course, CourseSection, Timeslot } from "@/typings";
import { Component, Prop, Vue } from "vue-property-decorator";
import { mapGetters, mapState } from "vuex";
import { formatCourseSize, formatTimeslot, getSessions } from "@/utilities";

@Component({
  computed: {
    formatTimeslot,
    formatCourseSize,
    getSessions,
    ...mapGetters("sections", ["isSelected", "isInConflict"]),
    ...mapState(["courseSizes"])
  }
})
export default class GeneralSections extends Vue {
  @Prop() readonly course!: Course;
  days = ["M", "T", "W", "R", "F"];

  toggleSelection(section: CourseSection) {
    let selected = true;

    if (section.crn in this.$store.state.sections.selectedSections)
      selected = !this.$store.getters["sections/isSelected"](section.crn);

    const selectedSection = {
      course: this.course,
      section,
      selected
    };

    this.$store.commit("sections/setSelected", selectedSection);
    this.$store.commit("sections/updateConflicts", {
      crn: section.crn,
      conflicts: section.conflicts
    });
  }

  // Calculates the order of the timeslots for each section
  // For example if a section with the crn 1234 has times that start at 1000, 1100, 800
  //This will return a json of {1234:{800:0, 1000:1, 1100:2}}
  get sessionIndex(): { [crn: string]: { [time: number]: number } } {
    const sessionOrders: { [crn: string]: { [time: number]: number } } = {};

    for (const section of this.course.sections) {
      // Since some course sections have multiple timeslots at the same time on the same
      // day (thanks SIS!), we first have to count up how many times this timeslot has
      // occurred each day.
      const dayTimes: { [day: string]: { [time: number]: number } } = {};

      for (const timeslot of section.timeslots)
        for (const day of timeslot.days) {
          if (!(day in dayTimes)) dayTimes[day] = {};

          if (timeslot.timeStart in dayTimes[day])
            dayTimes[day][timeslot.timeStart]++;
          else dayTimes[day][timeslot.timeStart] = 1;
        }

      // Store the max number of occurrences of each time so we can correctly space things out
      const times: { [key: number]: number } = {};
      for (const day in dayTimes)
        for (const time in dayTimes[day]) {
          const occurrences = dayTimes[day][time];

          if (!(time in times) || occurrences > times[time])
            times[time] = occurrences;
        }

      const sortedTimes = Object.keys(times);
      sortedTimes.sort((a, b) => (parseInt(a) > parseInt(b) ? 1 : -1));
      sessionOrders[section.crn] = {};

      let currRow = 0;
      for (const time of sortedTimes) {
        sessionOrders[section.crn][parseInt(time)] = currRow;
        currRow += times[parseInt(time)];
      }
    }

    return sessionOrders;
  }

  //Takes in a crn and a list of timeslots
  //Returns a list of timeslots but with spacers inserted so that
  //Times on different days line up
  spaceOutTimeslots(crn: string, timeslots: Timeslot[]): Timeslot[] {
    const spacedTimeslots: Timeslot[] = [];

    //Go through all the timeslots inserting spacers when needed to line up times
    let numSpacers = 0;
    for (const timeslot of timeslots) {
      while (
        spacedTimeslots.length < this.sessionIndex[crn][timeslot.timeStart]
      ) {
        numSpacers++;
        //This acts as a spacer
        spacedTimeslots.push({
          days: [],
          timeStart: -1 * numSpacers,
          timeEnd: -1 * numSpacers,
          instructor: "",
          dateStart: "",
          dateEnd: "",
          location: ""
        });
      }

      spacedTimeslots.push(timeslot);
    }
    return spacedTimeslots;
  }
}
</script>
