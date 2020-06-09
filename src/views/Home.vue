<template>
  <div class="home">
    <b-card-group columns class="department-cards">
      <b-card
        v-for="(departmentCodes, school) in schools"
        v-bind:key="school"
        :header="school"
      >
        <div
          v-for="departmentCode in departmentCodes"
          v-bind:key="departmentCode"
        >
          <router-link
            class="nav-link department-link"
            :to="'/department/' + departmentCode"
            ><span style="font-weight:bold">{{ departmentCode }}</span>
            {{ getDepartment(departmentCode).name }}</router-link
          >
        </div>
      </b-card>
    </b-card-group>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { mapState } from "vuex";

@Component({
  computed: mapState(["departments", "schools"])
})
export default class Home extends Vue {
  get getDepartment() {
    return (code: string) => {
      for (const dept of this.$store.state.departments) {
        if (dept.code === code) {
          return dept;
        }
      }

      return {};
    };
  }
}
</script>

<style scoped>
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
  color: black;
}

.department-link:hover {
  background: lightgrey;
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
</style>
