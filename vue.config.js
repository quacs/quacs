module.exports = {
  publicPath: "/",

  pwa: {
    themeColor: "#DCC308",
    msTileColor: "#DCC308",
    manifestOptions: {
      background_color: "#DCC308", // eslint-disable-line @typescript-eslint/camelcase
    },
    name: "QuACS",
    workboxOptions: {
      skipWaiting: true,
    },
  },
};
