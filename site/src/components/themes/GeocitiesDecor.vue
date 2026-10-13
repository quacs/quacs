<template>
  <section
    v-if="place === 'top'"
    class="geo-masthead"
    :aria-label="page.name + ' welcome banner'"
  >
    <img
      v-if="page.topline"
      class="geo-topline"
      :src="page.topline.src"
      :alt="page.topline.alt"
      :width="page.topline.w"
      :height="page.topline.h"
    />
    <div class="geo-title-row">
      <img
        class="geo-flank"
        :src="page.flank.src"
        alt=""
        :width="page.flank.w"
        :height="page.flank.h"
      />
      <div class="geo-title-box">
        <div class="geo-title">{{ page.title }}</div>
        <div class="geo-subtitle">
          {{ page.subtitle }}
          <span class="geo-updated"
            >Now updated for {{ semester }}!
            <img :src="images.new" alt="New" width="40" height="20"
          /></span>
        </div>
      </div>
      <img
        class="geo-flank geo-flank-right"
        :src="page.flank.src"
        alt=""
        :width="page.flank.w"
        :height="page.flank.h"
      />
    </div>
    <div class="geo-marquee">
      <div class="geo-marquee-track" :style="{ animationDuration: duration }">
        <span v-for="copy in 2" :key="copy" :aria-hidden="copy === 2">
          <span v-for="(verse, i) in page.marquee" :key="i" class="geo-verse"
            ><q>{{ verse.text }}</q> <cite>&mdash; {{ verse.cite }}</cite></span
          >
        </span>
      </div>
    </div>
    <img
      class="geo-divider"
      :src="page.divider.src"
      alt=""
      :width="page.divider.w"
      :height="page.divider.h"
    />
  </section>

  <section
    v-else-if="place === 'bottom'"
    class="geo-guestbook"
    :aria-label="page.name + ' page footer'"
  >
    <img
      class="geo-divider"
      :src="page.divider.src"
      alt=""
      :width="page.divider.w"
      :height="page.divider.h"
    />
    <div v-if="page.facts" class="geo-facts" role="note">
      <img
        class="geo-facts-bulb"
        :src="page.facts.bulb.src"
        alt=""
        :width="page.facts.bulb.w"
        :height="page.facts.bulb.h"
      />
      <div class="geo-facts-body">
        <div class="geo-facts-title">Did You Know?</div>
        <p class="geo-facts-text" aria-live="polite">
          {{ page.facts.items[factIndex] }}
        </p>
        <button type="button" class="geo-facts-next" @click="nextFact">
          Tell me another!
        </button>
      </div>
    </div>
    <div class="geo-gallery" aria-hidden="true">
      <img
        v-for="gif in page.gallery"
        :key="gif.src"
        :src="gif.src"
        alt=""
        :width="gif.w"
        :height="gif.h"
        :class="gif.frame ? 'geo-framed' : ''"
      />
    </div>
    <div class="geo-webring" role="navigation" aria-label="Webring">
      <img
        v-if="page.ringPost"
        class="geo-webring-post"
        :src="page.ringPost.src"
        alt=""
        :width="page.ringPost.w"
        :height="page.ringPost.h"
      />
      <button type="button" @click="ring(-1)">&laquo; Prev</button>
      <span class="geo-webring-name"
        >This site is a member of the<br /><b>{{ page.ringName }}</b>
        <button type="button" class="geo-webring-random" @click="ringRandom">
          Random Site
        </button></span
      >
      <button type="button" @click="ring(1)">Next &raquo;</button>
      <img
        v-if="page.ringPost"
        class="geo-webring-post"
        :src="page.ringPost.src"
        alt=""
        :width="page.ringPost.w"
        :height="page.ringPost.h"
      />
    </div>
    <p class="geo-counter" title="Counted in this browser">
      You are visitor number
      <span class="geo-odometer" :aria-label="String(visits)"
        ><span v-for="(digit, i) in digits" :key="i">{{ digit }}</span></span
      >!
    </p>
    <div class="geo-badges">
      <a
        href="https://discord.gg/yXaHkwU"
        target="_blank"
        rel="noopener"
        class="geo-badge"
        ><img :src="images.guestbook" alt="" width="120" height="100" /><span
          >Sign my Guestbook!</span
        ></a
      >
      <a
        href="https://github.com/quacs/quacs/issues"
        target="_blank"
        rel="noopener"
        class="geo-badge"
        ><img
          :src="page.mail.src"
          alt=""
          :width="page.mail.w"
          :height="page.mail.h"
        /><span>E-mail the Webmaster!</span></a
      >
      <span class="geo-badge"
        ><img
          :src="images.constructionSign"
          alt=""
          width="90"
          height="85"
        /><span>Always under construction</span></span
      >
    </div>
    <p class="geo-fineprint">
      <span v-if="page.address" class="geo-address"
        >This page is hosted by <b>GeoCities</b> &middot; {{ page.address }}<br
      /></span>
      <img :src="images.netscape" alt="Netscape Now!" width="90" height="30" />
      <img
        :src="images.internetExplorer"
        alt="Microsoft Internet Explorer"
        width="88"
        height="31"
      />
      <br />
      Best viewed with Netscape Navigator 4.0 or Internet Explorer 4.0 at
      800&times;600
    </p>
  </section>

  <div v-else-if="place === 'overlay'" class="geo-overlay" aria-hidden="true">
    <div ref="trail" class="geo-trail"></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Department } from "@/typings";
import {
  shortSemToLongSem,
  themeState,
  GEOCITIES_PAGES,
  GeocitiesPage,
} from "@/utilities";

interface Gif {
  src: string;
  alt: string;
  w: number;
  h: number;
  // Shown inside a little picture frame (for GIFs drawn on black)
  frame?: boolean;
}

interface Page {
  name: string;
  topline?: Gif;
  flank: Gif;
  title: string;
  subtitle: string;
  marquee: { text: string; cite: string }[];
  divider: Gif;
  gallery: Gif[];
  mail: Gif;
  // Cursor trail sprites, as image URLs
  trail: string[];
  // "Did You Know?" facts, shown one at a time beside a light bulb
  facts?: { bulb: Gif; items: string[] };
  ringName: string;
  // Stands on either side of the webring
  ringPost?: Gif;
  // The GeoCities address shown in the fine print
  address?: string;
}

const svg = (body: string, size = 16): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-8 -8 16 16">${body}</svg>`
  )}`;

const gif = (
  path: string,
  alt: string,
  w: number,
  h: number,
  frame = false
): Gif => ({
  // The .gif suffix keeps webpack's require context to the GIFs in that folder
  src: require(`@/assets/images/geocities/${path}.gif`),
  alt,
  w,
  h,
  frame,
});

const goldStar = svg(
  `<path d="M0 -7.5 L2.2 -2.4 7.6 -2.3 3.4 1.1 4.9 6.6 0 3.5 -4.9 6.6 -3.4 1.1 -7.6 -2.3 -2.2 -2.4 Z" fill="#ffd34d" stroke="#b8860b" stroke-width=".8" stroke-linejoin="round"/>`
);
const apple = svg(
  `<path d="M0 -3.5 C-3.5 -6 -7.2 -3.2 -6.4 1 C-5.8 4.6 -3.2 7.4 -0.8 6.6 C-0.3 6.4 0.3 6.4 0.8 6.6 C3.2 7.4 5.8 4.6 6.4 1 C7.2 -3.2 3.5 -6 0 -3.5 Z" fill="#e0242a" stroke="#8b0f12" stroke-width=".7"/><path d="M0 -3.6 C0.2 -5.4 0.8 -6.6 1.8 -7.4" stroke="#5a3311" stroke-width="1" fill="none"/><path d="M1 -5.6 C2.8 -7.4 5 -7 5.6 -6.2 C4.2 -5 2.6 -4.8 1 -5.6 Z" fill="#3fa535"/>`
);
const pencil = svg(
  `<g transform="rotate(-35)"><rect x="-1.8" y="-6.4" width="3.6" height="9.4" fill="#f6c22d" stroke="#8a6200" stroke-width=".6"/><rect x="-1.8" y="-7.8" width="3.6" height="1.8" fill="#f59ea6" stroke="#8a6200" stroke-width=".5"/><path d="M-1.8 3 L0 7.4 L1.8 3 Z" fill="#f2d5a6" stroke="#8a6200" stroke-width=".5"/><path d="M-0.6 6 L0 7.4 L0.6 6 Z" fill="#333"/></g>`
);

// Content for the GeoCities homepages, so far just the QuACS Academy. The GIFs are real ones from
// GeoCities pages, as archived by the Internet Archive's GifCities (see the SOURCES.txt files in
// assets/images/geocities).
const PAGES: { [theme in GeocitiesPage]: Page } = {
  // A schoolhouse of the Information Superhighway: the kind of homepage a teacher built in GeoCities'
  // Athens neighborhood (its education quarter) around 1999, styled like the CD-ROM encyclopedias and
  // textbooks of the time (the "Utopian Scholastic" look)
  geocities: {
    name: "QuACS Academy",
    topline: gif(
      "academy/chalkboard-welcome",
      "Welcome to my website",
      173,
      120
    ),
    flank: gif("academy/globe", "", 113, 105),
    title: "The QuACS Academy",
    subtitle: "Your gateway to knowledge on the Information Superhighway!",
    marquee: [
      { text: "Knowledge and Thoroughness.", cite: "Rensselaer's motto" },
      {
        text: "For the purpose of instructing persons, who may choose to apply themselves, in the application of science to the common purposes of life.",
        cite: "Stephen Van Rensselaer, founding Rensselaer in 1824",
      },
      { text: "Knowledge is power.", cite: "Francis Bacon" },
      { text: "Philosophy begins in wonder.", cite: "Plato, Theaetetus" },
      {
        text: "The roots of education are bitter, but the fruit is sweet.",
        cite: "Aristotle, as told by Diogenes Laërtius",
      },
      {
        text: "If I have seen further it is by standing on the shoulders of Giants.",
        cite: "Isaac Newton, 1675",
      },
      {
        text: "I have no special talents. I am only passionately curious.",
        cite: "Albert Einstein",
      },
      {
        text: "The best way to predict the future is to invent it.",
        cite: "Alan Kay",
      },
    ],
    divider: gif("academy/divider-owl", "", 560, 27),
    facts: {
      bulb: gif("academy/lightbulb", "", 50, 75),
      items: [
        "Rensselaer opened in Troy, New York, in 1824, which makes it the oldest technological university in the English-speaking world that has been open ever since.",
        "Rensselaer's first senior professor, Amos Eaton, had students learn by doing: they gave the lectures and ran the experiments themselves.",
        "In 1835 Rensselaer granted the first civil engineering degrees in the United States, to four students.",
        "George W. G. Ferris Jr., Class of 1881, built the first Ferris wheel for the 1893 World's Columbian Exposition in Chicago.",
        "Washington Roebling, Class of 1857, led the building of the Brooklyn Bridge.",
        "Ray Tomlinson, Class of 1963, sent the first email between computers on a network in 1971, and picked the @ sign for its addresses.",
        "Ted Hoff, Class of 1958, co-invented the microprocessor: the Intel 4004.",
        "Steven Sasson, Class of 1972, built the first digital camera at Kodak in 1975.",
        "Curtis Priem, Class of 1982, co-founded NVIDIA. EMPAC, the arts center on campus, is named for him.",
      ],
    },
    gallery: [
      gif("academy/owl-graduate", "", 100, 100),
      gif("academy/book-quill", "", 148, 80),
      gif("academy/teacher", "", 125, 100, true),
      gif("academy/atom", "", 111, 108),
      gif("academy/cap-diploma", "", 200, 102, true),
      gif("academy/donkey-emc2", "", 130, 100),
    ],
    mail: gif("academy/email-quill", "", 115, 101),
    trail: [goldStar, goldStar, apple, pencil],
    ringName: "RPI Departments WebRing",
    ringPost: gif("academy/column-flame", "", 41, 93),
    address: "Athens/Acropolis/1824",
  },
};

const VISITS_KEY = "geocities-visitor-number";
const TRAIL_SIZE = 14;

// The GeoCities homepages: a masthead with spinning GIFs and a marquee of quotes under the navbar, a
// guestbook-and-webring footer with a "Did You Know?" box, and a cursor trail.
@Component
export default class GeocitiesDecor extends Vue {
  @Prop({ required: true }) readonly place!: string;

  images = {
    new: require("@/assets/images/geocities/new.gif"),
    guestbook: require("@/assets/images/geocities/guestbook.gif"),
    constructionSign: require("@/assets/images/geocities/construction-sign.gif"),
    netscape: require("@/assets/images/geocities/netscape-now.gif"),
    internetExplorer: require("@/assets/images/geocities/internet-explorer.gif"),
  };

  visits = 0;
  factIndex = 0;
  trail: HTMLElement[] = [];
  trailNext = 0;
  lastTrail = { x: -100, y: -100, t: 0 };

  get theme(): GeocitiesPage {
    const applied = themeState.applied as GeocitiesPage;
    return GEOCITIES_PAGES.includes(applied) ? applied : "geocities";
  }

  get page(): Page {
    return PAGES[this.theme];
  }

  get semester(): string {
    return shortSemToLongSem()(process.env.VUE_APP_CURR_SEM);
  }

  // The marquee moves at the same speed whatever the length of the quotes
  get duration(): string {
    const chars = this.page.marquee.reduce(
      (n, v) => n + v.text.length + v.cite.length + 8,
      0
    );
    return `${Math.round(chars / 7)}s`;
  }

  get digits(): string[] {
    return String(this.visits).padStart(6, "0").split("");
  }

  mounted(): void {
    const facts = this.page.facts?.items.length ?? 0;
    this.factIndex = Math.floor(Math.random() * facts);
    if (this.place === "bottom") {
      try {
        this.visits = (Number(localStorage.getItem(VISITS_KEY)) || 0) + 1;
        localStorage.setItem(VISITS_KEY, String(this.visits));
      } catch (e) {
        this.visits = 1;
      }
    }
    if (
      this.place === "overlay" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const holder = this.$refs.trail as HTMLElement;
      for (let i = 0; i < TRAIL_SIZE; i++) {
        const dot = document.createElement("span");
        dot.className = "geo-sparkle";
        holder.appendChild(dot);
        this.trail.push(dot);
      }
      window.addEventListener("pointermove", this.onPointerMove, {
        passive: true,
      });
    }
  }

  beforeDestroy(): void {
    window.removeEventListener("pointermove", this.onPointerMove);
  }

  onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== "mouse") {
      return;
    }
    const now = performance.now();
    const moved = Math.hypot(
      event.clientX - this.lastTrail.x,
      event.clientY - this.lastTrail.y
    );
    if (now - this.lastTrail.t < 40 || moved < 14) {
      return;
    }
    this.lastTrail = { x: event.clientX, y: event.clientY, t: now };
    const dot = this.trail[this.trailNext];
    this.trailNext = (this.trailNext + 1) % this.trail.length;
    const sprites = this.page.trail;
    dot.style.backgroundImage = `url("${
      sprites[Math.floor(Math.random() * sprites.length)]
    }")`;
    dot.style.left = `${event.clientX + 8}px`;
    dot.style.top = `${event.clientY + 10}px`;
    dot.style.setProperty(
      "--geo-drift",
      `${Math.round(Math.random() * 30 - 15)}px`
    );
    // Restart the fall animation
    dot.classList.remove("geo-sparkle-on");
    void dot.offsetWidth;
    dot.classList.add("geo-sparkle-on");
  }

  nextFact(): void {
    const facts = this.page.facts?.items.length ?? 1;
    this.factIndex = (this.factIndex + 1) % facts;
  }

  // Prev and Next walk the webring through RPI's departments: a department page's neighbors, or the
  // first and last from any other page
  ring(step: number): void {
    const codes = this.departmentCodes;
    if (!codes.length) {
      return;
    }
    const code = this.$route.path.startsWith("/department/")
      ? this.$route.params.code
      : undefined;
    const i = code === undefined ? -1 : codes.indexOf(code);
    const next =
      i === -1
        ? codes[step > 0 ? 0 : codes.length - 1]
        : codes[(i + step + codes.length) % codes.length];
    this.$router.push(`/department/${next}`);
  }

  ringRandom(): void {
    const others = this.departmentCodes.filter(
      (code) => code !== this.$route.params.code
    );
    if (others.length) {
      const pick = others[Math.floor(Math.random() * others.length)];
      this.$router.push(`/department/${pick}`);
    }
  }

  get departmentCodes(): string[] {
    return (this.$store.state.departments as Department[]).map((d) => d.code);
  }
}
</script>
