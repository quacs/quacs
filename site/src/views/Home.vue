<template>
  <div class="home">
    <a href="https://patreon.com/quacs" rel="noopener" target="_blank">
      <div class="advertisement">
        <img
          srcset="
            @/assets/images/funding_motivator_mobile.png 700w,
            @/assets/images/funding_motivator.png
          "
          alt="Your advertisement could be here!"
        />
      </div>
    </a>
    <b-card-group columns class="department-cards">
      <b-card
        v-for="school in schools"
        v-bind:key="school.name"
        :header="school.name"
      >
        <div v-for="department in school.depts" v-bind:key="department.code">
          <router-link
            class="nav-link department-link"
            :to="'/department/' + department.code"
            ><span class="department-code">{{ department.code }}</span>
            {{ department.name }}</router-link
          >
        </div>
      </b-card>
    </b-card-group>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { mapState } from "vuex";
import { BCard, BCardGroup } from "bootstrap-vue";

@Component({
  components: {
    "b-card": BCard,
    "b-card-group": BCardGroup,
  },
  computed: mapState(["schools"]),
})
export default class Home extends Vue {}
</script>

<style scoped>
.advertisement {
  background: var(--global-text-hover);
  text-align: center;
  margin-bottom: 1rem;
}

h3 {
  margin: 40px 0 0;
  text-align: left;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  text-align: left;
}

.card-header {
  font-weight: bold;
  font-size: 1.4rem;
  padding: 0.5rem 0.75rem;
}

.department-link {
  padding: 0.25rem 1rem;
  font-size: 1.2rem;
  color: var(--text-default);
}

.department-link:hover {
  background: var(--department-link-hover);
}

.department-cards {
  column-count: 1;
}
@media (min-width: 1100px) {
  .department-cards {
    column-count: 2;
  }
}
@media (min-width: 1400px) {
  .department-cards {
    column-count: 3;
  }
}

.department-code {
  font-family: monospace;
  font-weight: bold;
  font-size: 1.7rem;
}
</style>
