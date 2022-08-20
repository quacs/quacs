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
          (You may still be able to be signed into these courses. Contact the
          professor and ask!)

          <br />
          <br />

          <span class="font-weight-bold">
            This prerequisite information comes from SIS. If SIS only checks
            prerequisites for some sections of a course, the other sections will
            not show a warning. This also means that our prerequisite
            information may disagree with the course catalog, but it will be
            accurate for course registration.</span
          >
        </p>
        <b-form-checkbox switch size="lg" v-model="prerequisiteChecking"
          >Enable prerequisite checking</b-form-checkbox
        >
      </b-jumbotron>
    </div>
    <div>
      <b-card no-body>
        <b-tabs card v-model="tabNumber">
          <b-tab title="Manual Upload" active>
            <b-row class="my-1">
              <b-col>
                <b-form-input
                  v-model="newCourse"
                  :state="verifyNewCourse"
                  placeholder="Course Code"
                  aria-lable="Course Code"
                  trim
                  :disabled="!prerequisiteChecking"
                  :title="
                    prerequisiteChecking
                      ? 'Enter a course here'
                      : 'Enable prerequisites to add a course'
                  "
                  :formatter="formatCourse"
                  @keyup.enter="addCourse"
                ></b-form-input>
                <b-form-invalid-feedback>
                  Format "ABCD-1234"
                </b-form-invalid-feedback>
                <!-- I dont actually show any form valid feedback, but having this here keeps
                     The page nicely spaced out and not bouncing-->
                <b-form-valid-feedback id="valid-feedback">
                  Format "ABCD-1234"
                </b-form-valid-feedback>
              </b-col>
              <b-col>
                <b-button
                  @click="addCourse"
                  :disabled="!verifyNewCourse || !prerequisiteChecking"
                  :title="
                    prerequisiteChecking
                      ? 'Enter a course here'
                      : 'Enable prerequisites to add a course'
                  "
                  >Add Course</b-button
                >
              </b-col>
            </b-row>
            <br />
            <h3>Courses you have already taken:</h3>

            <div
              v-for="course in priorCourses"
              :key="course"
              style="margin-left: 2rem; margin-bottom: 0.5rem"
            >
              <font-awesome-icon
                :icon="['fas', 'trash']"
                class="open_close_icon, trash-btn"
                @click="removeCourse(course)"
              ></font-awesome-icon>
              {{ course }}
            </div>
            <!-- {{ $store.state }} -->
          </b-tab>
          <b-tab title="Import Courses">
            <h3>Instructions</h3>
            <p>
              In order to import your courses you will need to upload your
              transcript. Don't worry, QuACS is 100% client-side which means
              that all the data in your transcript stays on your computer and
              there is no way for anyone - including the QuACS developers - to
              view the data.
            </p>
            <h3 class="mobile-only">
              NOTE: Transcript importing does not work on mobile because there
              is no way to get your transcript as an html file. We recommend you
              use a computer for checking prerequisites, or type out your
              courses by hand if you wish to stay on mobile.
              <br /><br />
            </h3>
            <p>
              1) Go to
              <a href="https://sis.rpi.edu" target="_blank"
                >https://sis.rpi.edu</a
              >
            </p>
            <p>2) Log in and navigate to the Student Menu tab</p>
            <p>3) Click "View Transcript"</p>
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
              <b-form-file
                id="transcriptFileUpload"
                v-model="file"
                type="file"
                name="file upload"
                accept=".html,.htm"
                :state="Boolean(file)"
                placeholder="Click to upload your transcript or drop it here..."
                drop-placeholder="Drop transcript here..."
                required
                :title="
                  prerequisiteChecking
                    ? ''
                    : 'Enable prerequisites to upload your transcript'
                "
                :disabled="!prerequisiteChecking"
                @change="importTranscript()"
                v-b-tooltip.disabled="prerequisiteChecking"
                v-b-tooltip.hover
              ></b-form-file>
            </form>
          </b-tab>
        </b-tabs>
      </b-card>
    </div>
    <b-modal id="transcriptImportModal" title="Import Error">
      <p>
        There was an issue importing from your transcript. These issues are hard
        to debug because we don't have access to many test transcript files.
      </p>
      <p>For now you will have to add your courses by hand... sorry :(</p>

      <p>
        If you would like to help us fix this issue, join our discord so we can
        talk:
      </p>
      <a
        href="https://discord.gg/EyGZTAP"
        title="Join our development Discord server"
        aria-label="Join our development Discord server"
        target="_blank"
        >https://discord.gg/EyGZTAP
      </a>
      <template v-slot:modal-footer="{ ok }">
        <b-button variant="primary" @click="ok()"> Close </b-button>
      </template>
    </b-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { scrapeTranscript, StudentData } from "@/components/scrapeTranscript";
import { mapGetters, mapState } from "vuex";
import {
  BButton,
  BCard,
  BCol,
  BFormCheckbox,
  BFormFile,
  BFormInput,
  BFormInvalidFeedback,
  BFormValidFeedback,
  BJumbotron,
  BRow,
  BTab,
  BTabs,
  VBTooltip,
} from "bootstrap-vue";

@Component({
  components: {
    "b-button": BButton,
    "b-card": BCard,
    "b-col": BCol,
    "b-form-checkbox": BFormCheckbox,
    "b-form-file": BFormFile,
    "b-form-input": BFormInput,
    "b-form-invalid-feedback": BFormInvalidFeedback,
    "b-form-valid-feedback": BFormValidFeedback,
    "b-jumbotron": BJumbotron,
    "b-row": BRow,
    "b-tab": BTab,
    "b-tabs": BTabs,
  },
  directives: {
    "b-tooltip": VBTooltip,
  },
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
    ...mapState(["courseIdToCourse"]),
    prerequisiteChecking: {
      get() {
        return this.$store.state.prerequisites.enableChecking;
      },
      set() {
        const new_val = !this.$store.state.prerequisites.enableChecking;
        this.$store.commit("prerequisites/togglePrerequisiteChecking", new_val);
      },
    },
  },
})
export default class Prerequisites extends Vue {
  newCourse = "";
  tabNumber = 0;
  file = null;

  formatCourse(value: string): string {
    return value
      .toUpperCase()
      .replace("_", "-")
      .replace(" ", "-")
      .substring(0, 9);
  }

  addCourse(): void {
    // @ts-expect-error: no u typescript, this does exist
    if (this.verifyNewCourse) {
      this.$store.commit("prerequisites/addPriorCourse", this.newCourse);
    }
  }

  removeCourse(course: string): void {
    this.$store.commit("prerequisites/removePriorCourse", course);
  }

  importTranscript(): void {
    const store = this.$store;
    const bvModal = this.$bvModal;
    const importedTranscript = scrapeTranscript("transcriptFileUpload");
    importedTranscript
      .catch(function (err: string) {
        //eslint-disable-next-line
        console.log(err);
        bvModal.show("transcriptImportModal");
      })
      .then(function (transcript: StudentData | void) {
        if (!transcript) {
          //eslint-disable-next-line
          console.log("transcript is void");
          bvModal.show("transcriptImportModal");
          return;
        }

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
#valid-feedback {
  visibility: hidden;
}

.jumbotron {
  background: var(--prerequisite-jumbotron);
}
</style>
