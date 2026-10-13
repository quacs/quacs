<template>
  <div class="row unofficial-warning-row" style="padding-top: 1rem">
    <div class="col-lg-1"></div>
    <div class="col-lg">
      <div class="unofficial-schedule-warning">
        QuACS is currently based off of incomplete data for this semester.<br />
        It is still largely a copy/paste of last year's schedule, and is heavily
        subject to change.<br />
        <span style="font-weight: bold"
          >Do not consider it accurate or official in any way.</span
        >
      </div>
    </div>
    <div class="col-lg-1"></div>
  </div>
</template>

<style scoped>
/* This row sits outside the page's .container-fluid, so a row's usual -15px side margins would push
it past the window and let every theme scroll sideways. Without them it lines up with the page. */
.unofficial-warning-row {
  margin-right: 0;
  margin-left: 0;
}
</style>
