<template>
  <div id="app">
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <router-link class="navbar-brand" to="/"
        ><img src="@/assets/quacs_40.png" alt="QuACS" style="height:40px"
      /></router-link>
      <router-link class="navbar-brand" to="/schedule">Schedule</router-link>
      <form class="form-inline my-2 my-lg-0">
        <input
          class="form-control mr-sm-2"
          type="search"
          placeholder="COMING SOON Search"
          aria-label="COMING SOON: Search"
          disabled
        />
        <button class="btn btn-outline-success my-2 my-sm-0" type="submit">
          Search
        </button>
      </form>
    </nav>

    <router-view />
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
