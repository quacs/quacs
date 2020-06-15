<template>
  <div>
    <font-awesome-icon
      :icon="['fas', 'info-circle']"
      class="open_close_icon info-icon"
      title="More info"
      v-on:click.stop.prevent
      v-on:keyup.enter.stop.prevent
      tabindex="0"
      @click="$bvModal.show('section-info' + section.crn)"
      @keyup.enter="$bvModal.show('section-info' + section.crn)"
    ></font-awesome-icon>
    <b-modal :id="'section-info' + section.crn" title="Section Info">
      <div class="font-weight-bold">Prerequisites:</div>
      <span v-html="formatPrerequisites(section.crn) || 'None'"></span>
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
import { Section } from "@/typings";
import { formatPrerequisites } from "@/utilities";

@Component({
  computed: {
    formatPrerequisites,
  },
})
export default class SectionInfo extends Vue {
  @Prop() readonly section!: Section;
}
</script>

<style scoped>
.info-icon {
  transition: all 0.2s ease-in-out;
  float: left;
  margin-right: 0.5rem;
  font-size: 3rem !important;
  width: auto !important;
}
.info-icon:hover,
.info-icon:focus,
.info-icon:active {
  transform: scale(1.5);
}

@media (min-width: 992px) {
  .info-icon {
    font-size: 1.7rem !important;
  }
}
</style>
