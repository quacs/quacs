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
import { trackAgentAction } from "@/webmcp";

@Component({
  components: {
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
.rename-btn {
  cursor: pointer;
  color: var(--trash-btn);
  margin-left: 0.25rem;
  margin-right: 0.25rem;
}
</style>
