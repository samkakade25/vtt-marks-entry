
export default {
  basePath: 'https://samkakade25.github.io/vtt-marks-entry',
  supportedLocales: {
  "en-US": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
