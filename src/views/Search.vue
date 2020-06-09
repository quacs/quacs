<template>
  <div>
    <div class="card-columns">
      <template v-for="course in fuseCourses">
        <CourseCard
          :course="course.item"
          :startExpanded="false"
          :key="course.item.id"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import CourseCard from "@/components/CourseCard.vue";

import { instantFuseSearch } from "@/searchUtilities";

@Component({
  components: {
    CourseCard
  }
})
export default class Search extends Vue {
  @Prop() searchString!: string;

  get fuseCourses() {
    if (this.searchString.match(/[A-Z]{4}[-\w]\d{4}/)) {
      const result = instantFuseSearch(this.searchString.slice(0, 9));
      if (result.length !== 0) {
        return result;
      }
    }
    return instantFuseSearch(this.searchString);
  }
}
</script>

<style scoped>
.card-columns {
  column-count: 1;
}
</style>
