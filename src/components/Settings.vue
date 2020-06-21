<template>
  <div>
    <b-modal id="settings-modal" title="Settings">
      <label for="timePreference">
        Time Preference:
      </label>
      <b-form-select
        id="timePreference"
        v-model="timePreference"
        :options="timeOptions"
      ></b-form-select>
      <br />
      <br />
      <label for="colorTheme">
        Color Theme:
      </label>
      <b-form-select
        id="colorTheme"
        v-model="colorTheme"
        :options="themeOptions"
      ></b-form-select>
      <br />
      <br />
      <b-form-checkbox
        switch
        disabled
        v-if="!this.$store.state.prerequisites.enableChecking"
        v-b-tooltip.hover.left
        title="Enable prerequisite checking to access this option"
        >Hide courses/sections you are missing the prerequisites
        for?</b-form-checkbox
      >
      <b-form-checkbox v-else switch v-model="hidePrerequisites"
        >Hide courses/sections you are missing the prerequisites
        for?</b-form-checkbox
      >
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
import { BButton, BFormCheckbox, BFormSelect, VBTooltip } from "bootstrap-vue";

@Component({
  components: {
    "b-button": BButton,
    "b-form-select": BFormSelect,
    "b-form-checkbox": BFormCheckbox,
  },
  directives: {
    "b-tooltip": VBTooltip,
  },
  watch: {
    timePreference: function (val) {
      this.$store.commit("settings/setTimePreference", val);
    },
    colorTheme: function (val) {
      this.$store.commit("settings/setColorTheme", val);
    },
  },
  computed: {
    hidePrerequisites: {
      get() {
        return this.$store.state.settings.hidePrerequisites;
      },
      set() {
        this.$store.commit(
          "settings/toggleHiddenPrerequisites",
          !this.$store.state.settings.hidePrerequisites
        );
      },
    },
  },
})
export default class Settings extends Vue {
  timePreference = this.$store.state.settings.timePreference;
  timeOptions: { value: string; text: string }[] = [
    { value: "S", text: "12 Hour" },
    { value: "M", text: "24 Hour" },
  ];

  colorTheme = this.$store.state.settings.colorTheme;
  //Add color theme option here
  themeOptions: { value: string; text: string }[] = [
    { value: "system", text: "Follow Device Theme" },
    { value: "light", text: "Light" },
    { value: "dark", text: "Dark" },
    { value: "dark black", text: "Black" },
    { value: "light colorful", text: "Splash of Color" },
    { value: "yacs", text: "YACS" },
  ];
}
</script>
