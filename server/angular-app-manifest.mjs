
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: 'https://samkakade25.github.io/vtt-marks-entry',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/vtt-marks-entry"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 2496, hash: 'a03360ca5e24d8917aeae338cd98bd49c1791efcbf511d1d552da2cb6840f8e6', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1049, hash: '1ddc9197496e1d15a6287d3aa6e8002459773b510e63e90037b7c8bc4c5069d6', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 17069, hash: '5058598cce0df649769c4d8a94593ae753ec76d24995d8a521b835cb0dd59dae', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-OK6JSVPP.css': {size: 6582, hash: '4u5VRGhRItc', text: () => import('./assets-chunks/styles-OK6JSVPP_css.mjs').then(m => m.default)}
  },
};
