<template>
  <div>
    <b-nav-item-dropdown
      left
      title="Switch between saved course sets"
      v-on:show="trackShow()"
    >
      <template v-slot:button-content>
        <em class="nav-text" style="font-style: normal;">{{
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
      <b-dropdown-item v-b-modal.courseSet-modal>
        <font-awesome-icon
          title="Edit Course Sets"
          :icon="['fas', 'pen']"
        ></font-awesome-icon
        ><!-- this color is kind of ugly for an icon.  perhaps a dark gray instead? -->
        Edit
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
            <font-awesome-icon
              v-if="Object.keys(getCourseSets).length > 1"
              :icon="['fas', 'trash']"
              class="open_close_icon, trash-btn"
              @click="removeCourseSet(courseSet)"
            ></font-awesome-icon>
            {{ courseSet }}
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
              <span style="visibility: hidden;">Valid</span>
            </b-form-valid-feedback>
            <b-form-invalid-feedback>
              <template v-if="newCourseSetName.length === 0">
                You must give your course set a name
              </template>
              <template v-else>
                Must be a unique name
              </template>
            </b-form-invalid-feedback>
          </b-input-group>
        </div>
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
import { trackEvent } from "@/utilities";

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
  },
})
export default class CourseSetEdit extends Vue {
  newCourseSetName = "";

  trackShow(): void {
    trackEvent("Show course sets", "course-set");
  }

  createNewCourseSet(): void {
    // @ts-expect-error: this is in the computed section above
    if (!this.newCourseSetExists) {
      return;
    }

    trackEvent("Add course set", "course-set");

    this.$store.dispatch("schedule/addCourseSet", {
      name: this.newCourseSetName,
    });
    this.$store.dispatch("schedule/generateCurrentSchedulesAndConflicts");
    this.newCourseSetName = "";
  }

  removeCourseSet(name: string): void {
    trackEvent("Remove course set", "course-set");

    this.$store.dispatch("schedule/removeCourseSet", {
      name: name,
    });
  }

  switchCurrentCourseSet(name: string): void {
    trackEvent("Change active course set", "course-set");

    this.$store.commit("schedule/switchCurrentCourseSet", {
      name: name,
    });
    this.$store.dispatch("schedule/generateCurrentSchedulesAndConflicts");
  }
}
</script>
