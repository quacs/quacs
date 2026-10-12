<template>
  <!-- CSS exposes this only in MTA, including when Random picks it. Hidden
       in every other theme, so it takes no space and leaves no accessibility nodes. -->
  <section class="transit-masthead" aria-labelledby="transit-title">
    <div class="transit-sign">
      <span>QUACS / COURSE TRANSIT</span>
      <span>Rensselaer Polytechnic Institute ↗</span>
    </div>
    <div class="transit-intro">
      <div class="transit-copy">
        <div class="transit-kicker">THE SEMESTER SYSTEM MAP</div>
        <h1 id="transit-title">Next stop:<br />Your semester.</h1>
        <p>
          Every course is a connection. Find your stops, choose your sections,
          and put your semester on the right track.
        </p>
        <router-link class="transit-schedule-link" to="/schedule">
          <span class="transit-bullet">S</span> Your schedule
          <span aria-hidden="true">↗</span>
        </router-link>
      </div>
      <svg
        class="transit-map"
        viewBox="0 0 720 240"
        aria-hidden="true"
        focusable="false"
      >
        <!-- A wide, original schematic with round stations and 45-degree connections. -->
        <path d="M430 0H520L280 240H190Z" fill="#dce8e9" />
        <g
          fill="none"
          stroke-width="9"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M28 42H255L390 177H690" stroke="#d82233" />
          <path d="M28 74H235L369 208H690" stroke="#eb6800" />
          <path d="M100 14V108L186 194H690" stroke="#009952" />
          <path d="M690 26H555L360 221H28" stroke="#0062cf" />
          <path d="M690 58H570L398 230" stroke="#f6bc26" />
          <path d="M28 184H235L390 29H510" stroke="#9a38a1" />
        </g>
        <g fill="#f5f2e9" stroke="#181818" stroke-width="2.5">
          <circle cx="100" cy="42" r="6" />
          <circle cx="170" cy="74" r="6" />
          <circle cx="345" cy="132" r="6" />
          <circle cx="500" cy="81" r="6" />
          <circle cx="275" cy="144" r="6" />
          <circle cx="580" cy="177" r="6" />
          <circle cx="580" cy="194" r="6" />
          <circle cx="316" cy="103" r="9" />
          <circle cx="404" cy="177" r="9" />
        </g>
        <g fill="#181818" font-size="13" font-weight="700">
          <text x="28" y="25">Start here</text>
          <text x="111" y="103">Discovery</text>
          <text x="319" y="86">Course Junction</text>
          <text x="542" y="159">Your sections</text>
          <text x="420" y="199">Schedule Sq</text>
          <text x="582" y="235">Next semester</text>
        </g>
        <g font-size="17" font-weight="700" text-anchor="middle">
          <circle cx="28" cy="42" r="15" fill="#d82233" />
          <text x="28" y="48" fill="white">1</text>
          <circle cx="28" cy="184" r="15" fill="#9a38a1" />
          <text x="28" y="190" fill="white">7</text>
          <circle cx="690" cy="26" r="15" fill="#0062cf" />
          <text x="690" y="32" fill="white">A</text>
          <circle cx="690" cy="58" r="15" fill="#f6bc26" />
          <text x="690" y="64" fill="#181818">Q</text>
        </g>
      </svg>
    </div>
    <ol class="transit-itinerary" aria-label="How to plan your semester">
      <li><span class="transit-bullet">1</span> Find your courses</li>
      <li><span class="transit-bullet">2</span> Choose your sections</li>
      <li><span class="transit-bullet">3</span> Build your schedule</li>
    </ol>
    <div class="transit-directory">
      <h2>Explore the lines</h2>
      <span>Pick a department below <span aria-hidden="true">↓</span></span>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class TransitMasthead extends Vue {}
</script>

<style scoped>
.transit-masthead {
  display: none;
}
</style>
