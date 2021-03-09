<template>
  <b-modal
    title="Course offerings are not official!"
    :visible="currentSem === '202109'"
    centered
    size="xl"
    :hide-footer="!acceptedThatScheduleIsUnofficial"
    ok-only
    ok-title="Close"
    no-close-on-backdrop
    no-close-on-esc
    hide-header-close
  >
    <span>
      QuACS is currently based off of a pre-release schedule for the fall
      semester. Course offerings and associated faculty are subject to change,
      and prerequisite checking is not available.
    </span>
    <br />
    <br />
    <b-form-checkbox v-model="acceptedThatScheduleIsUnofficial"
      >I understand that the current scheduling info is unreliable and shouldn't
      in any way be considered representative of the upcoming semester's
      schedule.</b-form-checkbox
    >
    <br />
    <span
      >(Please click the checkbox to accept the warning and continue to the
      website)</span
    >
  </b-modal>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { BFormCheckbox, VBModal } from "bootstrap-vue";

@Component({
  components: {
    "b-form-checkbox": BFormCheckbox,
  },
  directives: {
    "b-modal": VBModal,
  },
})
export default class UnofficialScheduleModal extends Vue {
  acceptedThatScheduleIsUnofficial = false;

  get currentSem(): string {
    return process.env.VUE_APP_CURR_SEM;
  }
}
</script>
