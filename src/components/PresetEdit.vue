<template>
  <div>
    <b-nav-item-dropdown left title="Switch between saved presets">
      <template v-slot:button-content>
        <em class="nav-text">{{ currentPreset }}</em>
      </template>
      <b-dropdown-item
        v-for="preset in Object.keys(getPresets)"
        :key="preset"
        @click="switchCurrentPreset(preset)"
        >{{ preset }}</b-dropdown-item
      >
      <b-dropdown-item v-b-modal.preset-modal>
        <font-awesome-icon
          title="Settings"
          :icon="['fas', 'plus']"
        ></font-awesome-icon>
        Add /
        <font-awesome-icon
          title="Settings"
          :icon="['fas', 'edit']"
        ></font-awesome-icon>
        Edit</b-dropdown-item
      >
    </b-nav-item-dropdown>

    <b-modal id="preset-modal" title="Preset Schedule Settings">
      <b-input-group>
        <b-form-input
          v-model="newPresetName"
          :state="verifyNewPreset"
          placeholder="Preset Name"
          aria-lable="Preset Name"
          trim
          @keyup.enter="newPreset"
        ></b-form-input>
        <b-input-group-append>
          <b-button
            @click="newPreset"
            style="
              border-top-right-radius: 0.25rem;
              border-bottom-right-radius: 0.25rem;
            "
            :disabled="!verifyNewPreset"
            :title="verifyNewPreset ? '' : 'Disabled'"
            >Add Preset</b-button
          ></b-input-group-append
        >
        <b-form-invalid-feedback>
          Must be a unique name
        </b-form-invalid-feedback>
        <!-- I dont actually show any form valid feedback, but having this here keeps
           The page nicely spaced out and not bouncing-->
        <b-form-valid-feedback id="valid-feedback">
          Must be a unique name
        </b-form-valid-feedback>
      </b-input-group>

      <h3 style="margin: 0px;">Current presets:</h3>
      <p style="font-size: 80%;" v-if="Object.keys(getPresets).length <= 1">
        There must always be 1 preset, add another to remove the current preset
      </p>
      <div v-for="preset in Object.keys(getPresets)" :key="preset">
        <font-awesome-icon
          v-if="Object.keys(getPresets).length > 1"
          :icon="['fas', 'trash']"
          class="open_close_icon, trash-btn"
          @click="removePreset(preset)"
        ></font-awesome-icon>
        {{ preset }}
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
    ...mapGetters("schedule", ["getPresets"]),
    ...mapState("schedule", ["currentPreset", "presets"]),
    verifyNewPreset(): boolean {
      // @ts-expect-error: this is in code below
      if (this.newPresetName.length === 0) {
        return false;
      }
      // @ts-expect-error: no u typescript, this does exist
      return this.getPresets[this.newPresetName] === undefined;
    },
  },
})
export default class PresetEdit extends Vue {
  newPresetName = "";

  newPreset() {
    // @ts-expect-error: this is in the computed section above
    if (!this.verifyNewPreset) {
      return;
    }
    this.$store.commit("schedule/addPreset", {
      name: this.newPresetName,
    });
    this.$store.dispatch("schedule/generateCurrentSchedulesAndConflicts");
    this.newPresetName = "";
  }

  removePreset(name: string) {
    this.$store.commit("schedule/removePreset", {
      name: name,
    });
  }

  switchCurrentPreset(name: string) {
    this.$store.commit("schedule/switchCurrentPreset", {
      name: name,
    });
    this.$store.dispatch("schedule/generateCurrentSchedulesAndConflicts");
  }
}
</script>
