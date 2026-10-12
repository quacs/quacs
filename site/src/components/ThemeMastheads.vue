<template>
  <div>
    <section class="nyan-masthead" aria-labelledby="nyan-title">
      <div class="nyan-flight" aria-hidden="true">
        <img src="@/assets/images/nyan-cat.svg" alt="" />
      </div>
      <div class="nyan-intro">
        <span class="nyan-kicker">QUACS // SEMESTER SELECT</span>
        <h1 id="nyan-title">Your semester. At warp speed.</h1>
        <p>Pick your courses. Chase the rainbow. Land on a schedule.</p>
      </div>
      <router-link class="nyan-launch" to="/schedule"
        >Launch schedule <span aria-hidden="true">→</span></router-link
      >
    </section>
    <section class="artisanal-masthead" aria-labelledby="artisanal-title">
      <div class="artisanal-manifesto">
        <span class="artisanal-kicker"
          >THE SMALL-BATCH COURSE CO-OP · TROY, NY</span
        >
        <h1 id="artisanal-title">
          <span>No prompts.</span> <span>Just vibes.</span>
        </h1>
        <p>
          Locally sourced courses. Hand-selected sections. A semester with an
          actual human in the loop. You.
        </p>
        <router-link class="artisanal-plan" to="/schedule"
          >Curate your semester <span aria-hidden="true">↗</span></router-link
        >
      </div>
      <div
        class="artisanal-certification"
        aria-label="Satirical certification: 100% organic keystrokes"
      >
        <span>SELF-CERTIFIED</span><strong>100%</strong
        ><span>ORGANIC KEYSTROKES</span>
        <small
          >No neural networks were consulted<br />in the choosing of these
          classes.*</small
        >
      </div>
      <div class="artisanal-fine-print">
        * Your browser is still a computer. We're working through that.
      </div>
    </section>
    <section class="web-masthead" aria-labelledby="web-title">
      <div class="web-window-bar">
        <span>QuACS Navigator</span><span aria-hidden="true">▁ ▣ ×</span>
      </div>
      <div class="web-toolbar">
        <span>Bookmarks:</span
        ><router-link to="/schedule">My schedule</router-link
        ><router-link to="/prerequisites">Prerequisites</router-link>
      </div>
      <div class="web-welcome">
        <div>
          <span class="web-kicker"
            >WELCOME TO THIS CORNER OF THE WORLD WIDE WEB</span
          >
          <h1 id="web-title">Your semester starts here.</h1>
          <p>
            A lovingly hyperlinked directory of courses. No CD-ROM required.
          </p>
        </div>
        <div class="web-badge" aria-hidden="true">
          <strong>WWW</strong><span>COURSE<br />EXPLORER</span>
        </div>
      </div>
      <div class="web-status">
        <span>✓ Ready to browse</span><span>Best viewed with curiosity.</span>
      </div>
    </section>
    <section class="manuscript-masthead" aria-labelledby="manuscript-title">
      <img
        class="manuscript-initial"
        src="@/assets/images/manuscript-initial.svg"
        alt=""
        aria-hidden="true"
      />
      <div class="manuscript-intro">
        <span class="manuscript-kicker">QUACS · THE BOOK OF COURSES</span>
        <h1 id="manuscript-title">A semester, well composed.</h1>
        <p>Gather your courses and arrange the hours of your next chapter.</p>
        <router-link class="manuscript-link" to="/schedule"
          >Open your timetable <span aria-hidden="true">→</span></router-link
        >
      </div>
      <span class="manuscript-folio" aria-hidden="true">Folio I</span>
    </section>
    <section class="retro-masthead" aria-labelledby="retro-title">
      <div class="retro-intro">
        <span class="retro-kicker">PLAYER 1 / SEMESTER SELECT</span>
        <h1 id="retro-title">Build your loadout.</h1>
        <p>Choose your courses. Find your combo. Make this semester yours.</p>
      </div>
      <router-link class="retro-start" to="/schedule"
        ><span aria-hidden="true">▶</span> START PLANNING</router-link
      >
    </section>
    <section class="luma-masthead" aria-labelledby="luma-title">
      <figure class="luma-portrait">
        <img
          src="@/assets/images/luma-closeup.jpg"
          alt="Close-up of Luma’s face and whiskers"
        />
        <figcaption>Luma, head of QuACS.</figcaption>
      </figure>
      <div class="luma-intro">
        <span class="luma-kicker">WELCOME TO LUMA'S STUDY NOOK</span>
        <h1 id="luma-title">Make room for a good semester.</h1>
        <p>
          A cozy corner for planning your courses. Supervised by Luma. Probably
          from your keyboard.
        </p>
        <router-link class="luma-plan" to="/schedule"
          >Settle into your schedule
          <span aria-hidden="true">↗</span></router-link
        >
      </div>
      <figure class="luma-office-photo">
        <img
          src="@/assets/images/luma-resting.jpg"
          alt="Luma curled up on a brown blanket"
          loading="lazy"
        />
        <figcaption>Office hours: nap time.</figcaption>
      </figure>
      <div class="luma-swatch" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class ThemeMastheads extends Vue {}
</script>

<style scoped>
.nyan-masthead,
.artisanal-masthead,
.web-masthead,
.manuscript-masthead,
.retro-masthead,
.luma-masthead {
  display: none;
}
</style>
