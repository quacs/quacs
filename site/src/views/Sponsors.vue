<template>
  <b-jumbotron header-level="4">
    <template #header
      ><span>Supported with </span>
      <font-awesome-icon
        :icon="['fas', 'heart']"
        style="color: #ffb300"
      ></font-awesome-icon>
      <span> by our patrons:</span></template
    >
    <br />
    <h4>
      <a
        href="https://patreon.com/quacs"
        class="patreon-link"
        rel="noopener"
        title="Sponsor us on Patreon!"
        aria-label="Sponsor us on Patreon!"
        target="_blank"
        >Click here to visit our Patreon page and become a patron today!</a
      >
    </h4>
    <br />
    <h3>Rubber Duck Tier Patrons</h3>
    <ul>
      <li>Enis Aras</li>
    </ul>
    <br />
    <h3>QuACS User Tier Patrons</h3>
    <ul>
      <li>Chris Jerrett</li>
    </ul>
  </b-jumbotron>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { BJumbotron } from "bootstrap-vue";

@Component({
  components: {
    "b-jumbotron": BJumbotron,
  },
})
export default class Sponsors extends Vue {}
</script>

<style scoped>
.jumbotron {
  background: var(--prerequisite-jumbotron);
}

.patreon-link {
  color: var(--global-text);
  text-decoration: underline;
}

.patreon-link:hover {
  color: DimGrey;
}
</style>
