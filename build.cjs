const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
let html = read('index.html');
html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>\n' + read('style.css') + '\n</style>');
for (const name of ['engine.js', 'three.min.js', 'lobby3d.js', 'game.js']) {
  const source = read(name).replace(/<\/script/gi, '<\\/script');
  html = html.replace(`<script src="${name}"></script>`, () => `<script>\n${source}\n</script>`);
}
// Keep the bundled library's full license inside the standalone download.
html = html.replace('<!doctype html>', () => '<!doctype html>\n<!--\nBundled Three.js license:\n' + read('THREE-LICENSE.txt') + '\n-->');
if (/<script\b[^>]*\bsrc=|<link\b[^>]*\brel="stylesheet"/i.test(html)) throw new Error('Unbundled dependency');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'FreeFall.html'), html);
console.log('Built dist/FreeFall.html — download, open, play.');
