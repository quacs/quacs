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
    timePreference: function(val) {
      this.$store.commit("settings/setTimePreference", val);
    }
  }
})
export default class Settings extends Vue {
  timePreference = this.$store.state.settings.timePreference;
  timeOptions: { value: string; text: string }[] = [
    { value: "S", text: "12 Hour" },
    { value: "M", text: "24 Hour" }
  ];
}
</script>
