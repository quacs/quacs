// THIS FUNCTION IS DUPLICATED IN src/utilities.ts BECAUSE
// I DON'T KNOW HOW TO IMPORT IT.  ANY CHANGES MUST ALSO
// BE MADE THERE.
function shortSemToURL(shortSem) {
  const year = shortSem.substring(0, 4);

  const semNum = shortSem.substring(4);
  let sem = "";
  if (semNum === "01") {
    sem = "spring";
  } else if (semNum === "09") {
    sem = "fall";
  } else if (semNum === "05") {
    sem = "summer";
  } else if (semNum === "12") {
    sem = "winter-enrichment";
  } else {
    sem = semNum;
  }

  return `/${sem}${year}`;
}

module.exports = {
  publicPath:
    process.env.VUE_APP_CURR_SEM !== undefined
      ? shortSemToURL(process.env.VUE_APP_CURR_SEM)
      : "/",

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
