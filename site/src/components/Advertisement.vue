<template>
  <div class="sponsor">
    <AdvertImage :advertisement="currentAdvertisement" />

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
import { shuffleArray, trackEvent } from "@/utilities";
import { Advert } from "@/typings";
import { advertisers } from "@/sponsors";
import AdvertImage from "@/components/AdvertImage.vue";

@Component({
  components: {
    AdvertImage,
  },
})
export default class Advertisement extends Vue {
  advertisements: Advert[] = [...advertisers];

  academic_server_ad: Advert = {
    advertiser: "RPI Academic Discord Server",

    url: "https://discord.gg/rpi",
    altText: "Click here to join the RPI Academic Discord Server!",
    backgroundColor: "#dac423",
    desktop_path: "/academic_discord/desktop.png",
    tablet_path: "/academic_discord/tablet.png",
    mobile_path: "/academic_discord/mobile.png",
  };

  currentAdvertisementIdx = 0;

  viewedAdvertisements: { [id: number]: boolean } = {};

  created(): void {
    shuffleArray(this.advertisements);

    // Always make the default ad last
    if (this.advertisements.length < 2) {
      this.advertisements.push(this.academic_server_ad);
    }
  }

  mounted(): void {
    this.scheduleAdvertIncrement();
  }

  scheduleAdvertIncrement(): void {
    /*
    // This will be called every time the advertisement changes
    if (this.viewedAdvertisements[this.currentAdvertisementIdx] !== true) {
      this.viewedAdvertisements[this.currentAdvertisementIdx] = true;

      this.track(
        "View Advertisement",
        this.advertisements[this.currentAdvertisementIdx].advertiser
      );
    }
    */

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

  track(event_value: string, event_type: string): void {
    trackEvent(event_value, event_type);
  }
}
</script>

<style scoped>
.sponsor {
  margin-bottom: 1rem;
}

.sponsor > a > span {
  color: var(--raw-link);
}

.sponsor-img {
  text-align: center;
}
</style>
