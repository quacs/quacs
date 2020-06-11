<template>
  <div class="home">
    <div>
      <b-jumbotron
        header="Prerequisites"
        header-level="4"
        lead="Add courses you have already taken to QuACS to perform prerequisite checking"
      >
        <p>
          Once you have added courses you've already taken to the website,
          sections will warn you if you don't meet the requirements.
          <br />
          (You may still be able to be signed into theses courses. Contact the
          professor and ask!)
        </p>
      </b-jumbotron>
    </div>
    <div>
      <b-card no-body>
        <b-tabs card v-model="tabNumber">
          <b-tab title="Manual" active>
            <b-row class="my-1">
              <b-col>
                <b-form-input
                  id="input-live"
                  v-model="newCourse"
                  :state="verifyNewCourse"
                  aria-describedby="input-live-help input-live-feedback"
                  placeholder="Course Code"
                  trim
                  :formatter="formatCourse"
                  @keyup.enter="addCourse"
                ></b-form-input>
                <b-form-invalid-feedback id="input-live-feedback">
                  Format "ABCD-1234"
                </b-form-invalid-feedback>
              </b-col>
              <b-col>
                <b-button @click="addCourse" :disabled="!verifyNewCourse"
                  >Add Course</b-button
                >
              </b-col>
            </b-row>

            <div v-for="course in priorCourses" :key="course">
              <font-awesome-icon
                :icon="['fas', 'trash']"
                class="open_close_icon, trash-btn"
                @click="removeCourse(course)"
              ></font-awesome-icon>
              {{ course }}
            </div>
          </b-tab>
          <b-tab title="Import Courses">
            <h3>Instructions</h3>
            <p>
              In order to import your courses you will need to upload your
              transcript. Don't worry, QuACS is 100% client-side, which means
              that all the data in your transcript stays on your computer and
              there is literally no way for anyone - including the QuACS
              developers - to view the data.
            </p>
            <p>
              1) Go to
              <a href="https://sis.rpi.edu" target="_blank"
                >https://sis.rpi.edu</a
              >
            </p>
            <p>2) Log in and navigate to the Student Menu tab</p>
            <p>3) Click View Transcript</p>
            <p>
              4) Press the Submit button (leave the options as "All Levels" and
              "Unofficial Web Transcript")
            </p>
            <p>
              5) Press CTRL+S on your keyboard (or right click and press "Save
              As") and save the page as a .html file.
            </p>
            <p>
              6) Upload the .html file here on QuACS and click "Import
              Transcript"
            </p>
            <p></p>
            <form onsubmit="return false;" method="post">
              <input type="file" id="transcriptFile" required />
              <input
                class="submit"
                type="submit"
                value="Input Transcript"
                v-on:click="importTranscript()"
              />
            </form>
          </b-tab>
        </b-tabs>
      </b-card>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
// @ts-expect-error: ¯\_(ツ)_/¯ I dont feel like making this work with typescript. TODO make this work with typescript
import { scrapeTranscript } from "@/components/scrapeTranscript.js";
import { mapGetters } from "vuex";

@Component({
  computed: {
    verifyNewCourse(): boolean {
      // @ts-expect-error: no u typescript, this does exist
      return this.newCourse.match("^[a-zA-Z]{4}[-_\\s]\\d{4}$") !== null;
    },
    priorCourses(): string[] {
      // @ts-expect-error: no u typescript, this does exist
      return Object.keys(this.getPriorCourses()).sort();
    },
    ...mapGetters("prerequisites", ["getPriorCourses"]),
  },
})
export default class Prerequisites extends Vue {
  newCourse = "";
  tabNumber = 0;

  formatCourse(value: string) {
    return value
      .toUpperCase()
      .replace("_", "-")
      .replace(" ", "-")
      .substring(0, 9);
  }

  addCourse() {
    // @ts-expect-error: no u typescript, this does exist
    if (this.verifyNewCourse) {
      this.$store.commit("prerequisites/addPriorCourse", this.newCourse);
    }
  }

  removeCourse(course: string) {
    this.$store.commit("prerequisites/removePriorCourse", course);
  }

  importTranscript() {
    const importedTranscript = scrapeTranscript("transcriptFile");
    const store = this.$store;
    // @ts-expect-error
    importedTranscript.then(function (transcript) {
      for (const term of transcript.terms) {
        for (const course of term.courses) {
          store.commit(
            "prerequisites/addPriorCourse",
            course.subject.toUpperCase() + "-" + course.course
          );
        }
      }
    });
    this.tabNumber = 0;
  }
}
</script>

<style>
.trash-btn {
  color: var(--trash-btn);
  cursor: pointer;
}

.trash-btn:hover {
  color: var(--trash-btn-hover);
}
</style>
