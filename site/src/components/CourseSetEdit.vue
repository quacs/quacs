<template>
  <div>
    <b-nav-item-dropdown left title="Switch between saved course sets">
      <template v-slot:button-content>
        <em class="nav-text" style="font-style: normal">{{
          currentCourseSet
        }}</em>
      </template>
      <b-dropdown-item
        v-for="courseSet in Object.keys(getCourseSets)"
        :key="courseSet"
        @click="switchCurrentCourseSet(courseSet)"
        >{{ courseSet }}</b-dropdown-item
      >
      <div class="dropdown-divider"></div>
      <b-dropdown-item v-b-modal.courseSet-modal data-cy="manage-course-sets">
        <font-awesome-icon
          title="Manage Course Sets"
          :icon="['fas', 'pen']"
        ></font-awesome-icon
        ><!-- this color is kind of ugly for an icon.  perhaps a dark gray instead? -->
        Manage Course Sets
      </b-dropdown-item>
      <b-dropdown-item v-b-modal.courseSet-modal data-cy="course-set-transfer">
        <font-awesome-icon :icon="['fas', 'file-export']"></font-awesome-icon>
        Import / Export
      </b-dropdown-item>
    </b-nav-item-dropdown>

    <b-modal id="courseSet-modal" title="Course Set Settings">
      <p>
        Course sets allow you to save and switch among multiple selections of
        courses/sections.
      </p>
      <div>
        <div>
          <h5 class="mb-0">Course Sets:</h5>
        </div>
        <div class="p-2">
          <div
            class=""
            v-for="courseSet in Object.keys(getCourseSets)"
            :key="courseSet"
          >
            <b-input-group
              v-if="renamingCourseSet === courseSet"
              size="sm"
              class="mb-1"
            >
              <b-form-input
                v-model="renameCourseSetName"
                :state="renameCourseSetValid"
                placeholder="New Course Set Name"
                aria-label="New Course Set Name"
                data-cy="rename-course-set-input"
                autofocus
                trim
                @keyup.enter="renameCourseSet"
                @keyup.esc="cancelRenameCourseSet"
              ></b-form-input>
              <b-input-group-append>
                <b-button
                  variant="success"
                  :disabled="!renameCourseSetValid"
                  data-cy="rename-course-set-save"
                  @click="renameCourseSet"
                  >Save</b-button
                >
                <b-button
                  data-cy="rename-course-set-cancel"
                  style="
                    border-top-right-radius: 0.2rem;
                    border-bottom-right-radius: 0.2rem;
                  "
                  @click="cancelRenameCourseSet"
                  >Cancel</b-button
                >
              </b-input-group-append>
              <b-form-invalid-feedback data-cy="rename-course-set-feedback">
                <template v-if="renameCourseSetName.length === 0">
                  You must give your course set a name
                </template>
                <template v-else> Must be a unique name </template>
              </b-form-invalid-feedback>
            </b-input-group>
            <template v-else>
              <font-awesome-icon
                v-if="Object.keys(getCourseSets).length > 1"
                :icon="['fas', 'trash']"
                class="open_close_icon, trash-btn"
                @click="removeCourseSet(courseSet)"
              ></font-awesome-icon>
              <font-awesome-icon
                :icon="['fas', 'pen']"
                class="rename-btn"
                :title="'Rename ' + courseSet"
                :data-cy="'rename-course-set-' + courseSet"
                @click="startRenameCourseSet(courseSet)"
              ></font-awesome-icon>
              {{ courseSet }}
            </template>
          </div>
        </div>
        <div>
          <b-input-group>
            <b-form-input
              v-model="newCourseSetName"
              :state="newCourseSetExists"
              placeholder="Course Set Name"
              aria-lable="Course Set Name"
              trim
              @keyup.enter="createNewCourseSet"
            ></b-form-input>
            <b-input-group-append>
              <b-button
                @click="createNewCourseSet"
                style="
                  border-top-right-radius: 0.25rem;
                  border-bottom-right-radius: 0.25rem;
                "
                :disabled="!newCourseSetExists"
                :class="{
                  'btn-success': newCourseSetExists,
                }"
                :title="newCourseSetExists ? '' : 'Disabled'"
                >Add Course Set</b-button
              ></b-input-group-append
            >
            <b-form-valid-feedback id="valid-feedback">
              <span style="visibility: hidden">Valid</span>
            </b-form-valid-feedback>
            <b-form-invalid-feedback>
              <template v-if="newCourseSetName.length === 0">
                You must give your course set a name
              </template>
              <template v-else> Must be a unique name </template>
            </b-form-invalid-feedback>
          </b-input-group>
        </div>
        <div class="mt-2">
          <h5>Import / Export:</h5>
          <p class="mb-2">
            Save course sets to a file, then import that file to use them on
            another device or browser.
          </p>
          <div class="transfer-buttons">
            <b-button
              size="sm"
              data-cy="export-course-set"
              @click="exportCourseSets(false)"
              >Export Current Set</b-button
            >
            <b-button
              v-if="Object.keys(getCourseSets).length > 1"
              size="sm"
              data-cy="export-all-course-sets"
              @click="exportCourseSets(true)"
              >Export All Sets</b-button
            >
            <b-button
              size="sm"
              data-cy="import-course-sets"
              @click="$refs.importFile.click()"
              >Import from File</b-button
            >
          </div>
          <input
            ref="importFile"
            type="file"
            accept=".json,application/json"
            class="d-none"
            data-cy="import-course-sets-file"
            @change="importCourseSets"
          />
          <b-alert
            :show="transferMessage !== ''"
            :variant="transferError ? 'danger' : 'success'"
            class="mt-2 mb-0"
            data-cy="course-set-transfer-message"
            >{{ transferMessage }}</b-alert
          >
        </div>
      </div>
      <template v-slot:modal-footer="{ ok }">
        <b-button variant="primary" @click="ok()"> Close </b-button>
      </template>
    </b-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import {
  BAlert,
  BButton,
  BCol,
  BDropdownItem,
  BFormInput,
  BFormInvalidFeedback,
  BFormValidFeedback,
  BInputGroup,
  BInputGroupAppend,
  BNavItemDropdown,
  BRow,
  VBModal,
} from "bootstrap-vue";
import { mapGetters, mapState } from "vuex";
import { saveAs } from "file-saver";

import { buildCourseSetsFile, parseCourseSetsFile } from "@/courseSetTransfer";
import { shortSemToLongSem } from "@/utilities";
import { trackAgentAction } from "@/webmcp";

@Component({
  components: {
    "b-alert": BAlert,
    "b-nav-item-dropdown": BNavItemDropdown,
    "b-dropdown-item": BDropdownItem,
    "b-button": BButton,
    "b-form-input": BFormInput,
    "b-form-invalid-feedback": BFormInvalidFeedback,
    "b-form-valid-feedback": BFormValidFeedback,
    "b-col": BCol,
    "b-row": BRow,
    "b-input-group": BInputGroup,
    "b-input-group-append": BInputGroupAppend,
  },
  directives: {
    "b-modal": VBModal,
  },
  computed: {
    ...mapGetters("schedule", ["getCourseSets"]),
    ...mapState("schedule", ["currentCourseSet", "courseSets"]),
    newCourseSetExists(): boolean {
      // @ts-expect-error: this is in code below
      if (this.newCourseSetName.length === 0) {
        return false;
      }
      // @ts-expect-error: no u typescript, this does exist
      return this.getCourseSets[this.newCourseSetName] === undefined;
    },
    renameCourseSetValid(): boolean | null {
      // @ts-expect-error: this is in code below
      const name = this.renameCourseSetName.trim();
      // @ts-expect-error: this is in code below
      if (name === this.renamingCourseSet) {
        // Unchanged, so neither valid nor invalid
        return null;
      }
      if (name.length === 0) {
        return false;
      }
      // @ts-expect-error: no u typescript, this does exist
      return this.getCourseSets[name] === undefined;
    },
  },
})
export default class CourseSetEdit extends Vue {
  newCourseSetName = "";
  transferMessage = "";
  transferError = false;
  renamingCourseSet: string | null = null;
  renameCourseSetName = "";

  createNewCourseSet(): void {
    // @ts-expect-error: this is in the computed section above
    if (!this.newCourseSetExists) {
      return;
    }

    this.$store.dispatch("schedule/addCourseSet", {
      name: this.newCourseSetName,
    });
    this.$store.dispatch("schedule/generateSchedulesAndConflicts");
    this.newCourseSetName = "";
  }

  removeCourseSet(name: string): void {
    this.$store.dispatch("schedule/removeCourseSet", {
      name: name,
    });
  }

  exportCourseSets(all: boolean): void {
    const semester = process.env.VUE_APP_CURR_SEM;
    const courseSets = this.$store.getters["schedule/getCourseSets"];
    const currentCourseSet = this.$store.state.schedule.currentCourseSet;
    const names = all ? Object.keys(courseSets) : [currentCourseSet];
    const file = buildCourseSetsFile(semester, courseSets, names);

    const blob = new Blob([JSON.stringify(file, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const fileName = all
      ? "course_sets"
      : currentCourseSet.toLowerCase().replaceAll(" ", "_");
    saveAs(blob, `quacs_${semester}_${fileName}.json`);

    this.transferError = false;
    this.transferMessage = all
      ? `Exported ${names.length} course sets.`
      : `Exported "${currentCourseSet}".`;
    trackAgentAction("course_sets_exported", { count: names.length });
  }

  async importCourseSets(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Clear the input so picking the same file again still fires a change
    input.value = "";
    if (file === undefined) {
      return;
    }
    this.transferMessage = "";

    try {
      const data = parseCourseSetsFile(await file.text());
      const semester = process.env.VUE_APP_CURR_SEM;
      if (data.semester !== semester) {
        const fileSemester = data.semester
          ? shortSemToLongSem()(data.semester)
          : "an unknown semester";
        const currentSemester = shortSemToLongSem()(semester);
        if (
          !window.confirm(
            `This file is from ${fileSemester}, but you are viewing ${currentSemester}. Sections that are not offered this semester will be skipped. Import anyway?`
          )
        ) {
          return;
        }
      }
      if (this.$store.state.departments.length === 0) {
        throw new Error("Course data is still loading. Try again in a moment.");
      }

      const { names, skippedCrns } = await this.$store.dispatch(
        "schedule/importCourseSets",
        { courseSets: data.course_sets }
      );
      this.transferError = false;
      this.transferMessage =
        `Imported ${names.map((name: string) => `"${name}"`).join(", ")}.` +
        (skippedCrns > 0
          ? ` Skipped ${skippedCrns} ${
              skippedCrns === 1 ? "section that is" : "sections that are"
            } not offered this semester.`
          : "");
      trackAgentAction("course_sets_imported", {
        count: names.length,
        skipped_crns: skippedCrns,
      });
    } catch (e) {
      this.transferError = true;
      this.transferMessage = `Could not import course sets: ${
        (e as Error).message
      }`;
    }
  }

  startRenameCourseSet(name: string): void {
    this.renamingCourseSet = name;
    this.renameCourseSetName = name;
  }

  cancelRenameCourseSet(): void {
    this.renamingCourseSet = null;
    this.renameCourseSetName = "";
  }

  async renameCourseSet(): Promise<void> {
    // @ts-expect-error: this is in the computed section above
    if (!this.renameCourseSetValid || this.renamingCourseSet === null) {
      return;
    }

    const renamed = await this.$store.dispatch("schedule/renameCourseSet", {
      oldName: this.renamingCourseSet,
      newName: this.renameCourseSetName,
    });
    if (renamed) {
      trackAgentAction("course_set_renamed", {});
      this.cancelRenameCourseSet();
    }
  }

  switchCurrentCourseSet(name: string): void {
    this.$store.dispatch("schedule/switchCurrentCourseSet", {
      name: name,
    });
    this.$store.dispatch("schedule/generateSchedulesAndConflicts");
  }
}
</script>

<style scoped>
.transfer-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.rename-btn {
  cursor: pointer;
  color: var(--trash-btn);
  margin-left: 0.25rem;
  margin-right: 0.25rem;
}
</style>
