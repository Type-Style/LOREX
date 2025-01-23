const fs = require('fs');
const path = require('path');

const packagePath = path.resolve(__dirname, '../node_modules/react-leaflet-markercluster/package.json');
const packageJson = require(packagePath);

packageJson.main = './dist/esm/index.js';
packageJson.exports['.'] = './dist/esm/index.js';

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log('Fixed react-leaflet-markercluster package.json');
