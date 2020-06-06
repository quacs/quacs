<template>
  <div>
    <h3>
      Join the QuACS development discord server!
      <a href="https://discord.gg/3xNxfBy">https://discord.gg/3xNxfBy</a>
    </h3>
    <br /><br />
    <div v-for="department in departments" v-bind:key="department.code">
      <router-link class="nav-link" :to="'/department/' + department.code"
        >{{ department.code }}: {{ department.name }}</router-link
      >
    </div>
  </div>
</template>

<script lang="ts">
import { mapState } from "vuex";

export default {
  computed: mapState(["departments"])
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
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
</style>
