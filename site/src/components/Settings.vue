<template>
  <div>
    <b-modal id="settings-modal" title="Settings">
      <label for="timePreference"> Time Preference: </label>
      <b-form-select
        id="timePreference"
        v-model="timePreference"
        :options="timeOptions"
      ></b-form-select>
      <br />
      <br />
      <label for="colorTheme"> Color Theme: </label>
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
        title="Enable prerequisite checking on the prerequisites page to access this option"
        >Hide courses/sections you are missing the prerequisites
        for?</b-form-checkbox
      >
      <b-form-checkbox v-else switch v-model="hidePrerequisites"
        >Hide courses/sections you are missing the prerequisites
        for?</b-form-checkbox
      >
      <b-form-checkbox
        switch
        v-model="hideAgentButton"
        data-cy="hide-agent-button-toggle"
        >Hide the AI Agents button in the navbar?</b-form-checkbox
      >
      <template v-slot:modal-footer="{ ok }">
        <b-button variant="primary" @click="ok()"> Close </b-button>
      </template>
    </b-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { BButton, BFormCheckbox, BFormSelect, VBTooltip } from "bootstrap-vue";
import { trackAgentAction } from "@/webmcp";
import { ARTISANAL_THEME, THEME_OPTIONS } from "@/utilities";

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
      // A preference the dialog only followed (see below) is already in the store
      if (val === (this as Settings).followedTimePreference) {
        (this as Settings).followedTimePreference = null;
        return;
      }
      this.$store.commit("settings/setTimePreference", val);
    },
    // The time preference can also change outside this dialog (the Liquid Glass theme's Control
    // Centre, or another tab), so the dropdown follows the store without committing it again
    "$store.state.settings.timePreference": function (val) {
      const settings = this as Settings;
      if (settings.timePreference !== val) {
        settings.followedTimePreference = val;
        settings.timePreference = val;
      }
    },
    colorTheme: function (val) {
      // A theme the dropdown only followed (see below) is already in the store
      if (val === (this as Settings).followedColorTheme) {
        (this as Settings).followedColorTheme = null;
        return;
      }
      this.$store.commit("settings/setColorTheme", val);
      trackAgentAction("theme_selected", { theme: val });
    },
    // The theme can also change in another tab, so the dropdown follows the store. It doesn't
    // commit those changes again, or two tabs could echo a change between them forever.
    "$store.state.settings.colorTheme": function (val) {
      const settings = this as Settings;
      if (settings.colorTheme !== val) {
        settings.followedColorTheme = val;
        settings.colorTheme = val;
      }
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
    hideAgentButton: {
      get() {
        return this.$store.state.settings.hideAgentButton;
      },
      set(hidden: boolean) {
        this.$store.commit("settings/setHideAgentButton", hidden);
        if (hidden) {
          this.$store.commit("settings/setColorTheme", ARTISANAL_THEME);
          (this as Settings).colorTheme = ARTISANAL_THEME;
        }
        trackAgentAction("agent_button_toggled", { hidden });
      },
    },
  },
})
export default class Settings extends Vue {
  timePreference = this.$store.state.settings.timePreference;
  followedTimePreference: string | null = null;
  timeOptions: { value: string; text: string }[] = [
    { value: "S", text: "12 Hour" },
    { value: "M", text: "24 Hour" },
  ];

  colorTheme = this.$store.state.settings.colorTheme;
  followedColorTheme: string | null = null;
  themeOptions: { value: string; text: string }[] = THEME_OPTIONS.map(
    ({ value, text }) => ({ value, text })
  );
}
</script>
