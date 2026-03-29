module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Required for Reanimated
      "react-native-reanimated/plugin",
      // Module path aliases — maps @/* to src/*
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: { "@": "./src" },
        },
      ],
    ],
  };
};
