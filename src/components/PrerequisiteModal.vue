<template>
  <div>
    <b-modal id="prerequisite-modal" title="Settings">
      test
      {{ crn }}
      <!-- {{$store.state.prerequisites[crn]}} -->

      {{ data }}

      <template v-slot:modal-footer="{ ok }">
        <b-button variant="primary" @click="ok()">
          Close
        </b-button>
      </template>
    </b-modal>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class PrerequisiteModal extends Vue {
  @Prop() readonly crn!: string;
  data = this.$store.state.prerequisites[this.crn];
}
</script>
