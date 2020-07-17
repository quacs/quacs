module.exports = {
  publicPath: "/",

  pwa: {
    themeColor: "#DCC308",
    msTileColor: "#DCC308",
    manifestOptions: {
      background_color: "#DCC308",
    },
    name: "QuACS",
    workboxOptions: {
      skipWaiting: true,
    },
  },
  configureWebpack: (config) => {
    config.module.rules = [
      {
        test: /\.worker\.ts$/i,
        use: [
          {
            loader: "workerize-loader",
          },
        ],
      },
      ...config.module.rules,
    ];
    config.output = {
      globalObject: "self",
      ...config.output,
    };
  },
};
