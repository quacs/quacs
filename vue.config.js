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
  configureWebpack: (config) => {
    config.module.rules = [
      {
        test: /\.worker\.js$/i,
        use: [
          {
            loader: "comlink-loader",
            options: {
              singleton: true,
            },
          },
        ],
      },
      ...config.module.rules,
    ];
  },
};
