<template>
  <i
    class="fas fa-caret-right open_close_icon"
    :class="{ open_icon: expanded }"
  ></i>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class DropdownCaret extends Vue {
  @Prop() expanded!: boolean;
}
</script>
