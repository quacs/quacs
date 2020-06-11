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

@Component({
  watch: {
    timePreference: function (val) {
      this.$store.commit("settings/setTimePreference", val);
    },
    colorTheme: function (val) {
      this.$store.commit("settings/setColorTheme", val);
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
    { value: "true-dark", text: "True Dark" }
  ];
}
</script>
