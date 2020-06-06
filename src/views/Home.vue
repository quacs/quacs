<template>
  <div class="home">
    <Homepage />
  </div>
</template>

<script>
// @ is an alias to /src
import Homepage from "@/components/Homepage.vue";

export default {
  name: "Home",
  components: {
    Homepage
  }
};
</script>
