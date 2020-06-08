<template>
  <div class="home">
    <h3>
      Join the QuACS development discord server!
      <a href="https://discord.gg/3xNxfBy">https://discord.gg/3xNxfBy</a>
    </h3>
    <br /><br />
    <b-card-group columns>
      <b-card
        v-for="(departmentCodes, school) in schools"
        v-bind:key="school"
        :header="school"
      >
        <div
          v-for="departmentCode in departmentCodes"
          v-bind:key="departmentCode"
        >
          <router-link class="nav-link" :to="'/department/' + departmentCode"
            >{{ departmentCode }}
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
        if (dept.code == code) {
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
</style>
