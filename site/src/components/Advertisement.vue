<template>
  <div class="advertisement">
    <a
      :href="currentAdvertisement.url"
      v-on:click="
        track('Advertisement clicked', currentAdvertisement.advertiser)
      "
      rel="noopener"
      target="_blank"
    >
      <div
        class="advertisement-img"
        :style="'background:' + currentAdvertisement.backgroundColor"
      >
        <img
          :src="baseUrl + currentAdvertisement.desktop_path"
          :alt="currentAdvertisement.altText"
          class="d-none d-lg-inline-block d-xl-inline-block"
        />
        <img
          v-if="hasTablet"
          :src="baseUrl + currentAdvertisement.tablet_path"
          :alt="currentAdvertisement.altText"
          class="d-none d-sm-inline-block d-md-inline-block d-lg-none"
        />
        <img
          :src="baseUrl + currentAdvertisement.mobile_path"
          :alt="currentAdvertisement.altText"
          :class="
            'd-inline-block d-lg-none d-xl-none ' +
            (hasTablet ? 'd-sm-none d-md-none' : '')
          "
        />
      </div>
    </a>

    <a
      href="https://patreon.com/quacs"
      v-on:click="track('Visit Patreon', 'Advertiser pull')"
      rel="noopener"
      target="_blank"
      ><span>Want your ad here? Support us on Patreon!</span></a
    >
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { shortSemToURL, shuffleArray, trackEvent } from "@/utilities";

interface Advert {
  advertiser: string;
  url: string;
  altText: string;
  backgroundColor: string;
  desktop_path: string;
  tablet_path?: string;
  mobile_path: string;
}

@Component
export default class Advertisement extends Vue {
  advertisements: Advert[] = [];

  academic_server_ad: Advert = {
    advertiser: "RPI Academic Discord Server",

    url: "https://discord.gg/rpi",
    altText: "Click here to join the RPI Academic Discord Server!",
    backgroundColor: "#dcc308",
    desktop_path: "/academic_discord/desktop.png",
    tablet_path: "/academic_discord/tablet.png",
    mobile_path: "/academic_discord/mobile.png",
  };

  currentAdvertisementIdx = 0;

  baseUrl = `${shortSemToURL()(process.env.VUE_APP_CURR_SEM)}/ads`;

  created(): void {
    shuffleArray(this.advertisements);

    // Always make the default ad last
    this.advertisements.push(this.academic_server_ad);
  }

  mounted(): void {
    this.scheduleAdvertIncrement();
  }

  scheduleAdvertIncrement(): void {
    // This will be called every time the advertisement changes
    this.track(
      "View Advertisement",
      this.advertisements[this.currentAdvertisementIdx].advertiser
    );

    setTimeout(() => {
      Vue.set(
        this,
        "currentAdvertisementIdx",
        (this.currentAdvertisementIdx + 1) % this.advertisements.length
      );

      this.scheduleAdvertIncrement();
    }, 10000);
  }

  get currentAdvertisement(): Advert {
    return this.advertisements[this.currentAdvertisementIdx];
  }

  get hasTablet(): boolean {
    return this.currentAdvertisement.tablet_path !== undefined;
  }

  track(event_value: string, event_type: string): void {
    trackEvent(event_value, event_type);
  }
}
</script>

<style scoped>
.advertisement {
  margin-bottom: 1rem;
}

.advertisement > a > span {
  color: var(--raw-link);
}

.advertisement-img {
  text-align: center;
}
</style>
