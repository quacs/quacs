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

    <br v-if="advertisers.length > 0" />
    <h3 v-if="advertisers.length > 0">Advertisers</h3>
    <AdvertImage
      v-for="advertiser in advertisers"
      :advertisement="advertiser"
      :key="advertiser.advertiser"
    />

    <br v-if="roboMallardPatrons.length > 0" />
    <h3 v-if="roboMallardPatrons.length > 0">Robo-Mallard Tier Patrons</h3>
    <ul>
      <li v-for="patron in roboMallardPatrons" :key="patron">
        <a
          class="patreon-link"
          :href="patron.url"
          rel="noopener"
          target="_blank"
          >{{ patron.name }}</a
        >
      </li>
    </ul>

    <br v-if="rubberDuckPatrons.length > 0" />
    <h3 v-if="rubberDuckPatrons.length > 0">Rubber Duck Tier Patrons</h3>
    <ul>
      <li v-for="patron in rubberDuckPatrons" :key="patron">{{ patron }}</li>
    </ul>
  </b-jumbotron>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { BJumbotron } from "bootstrap-vue";
import { advertisers, roboMallardPatrons, rubberDuckPatrons } from "@/sponsors";
import AdvertImage from "@/components/AdvertImage.vue";

@Component({
  components: {
    AdvertImage,
    "b-jumbotron": BJumbotron,
  },
})
export default class Sponsors extends Vue {
  readonly advertisers = advertisers;
  readonly rubberDuckPatrons = rubberDuckPatrons;
  readonly roboMallardPatrons = roboMallardPatrons;
}
</script>

<style>
.jumbotron {
  background: var(--prerequisite-jumbotron);
}

.patreon-link {
  color: var(--raw-text);
  text-decoration: underline;
}

.sponsor-img {
  margin-bottom: 1em;
}

.patreon-link:hover {
  color: DimGrey;
}
</style>
