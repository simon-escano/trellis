const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/environments/environment.prod.ts');
const apiUrl = process.env.TRELLIS_API_URL || '';

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log('[Build Setup] Updated ' + targetPath + ' with apiUrl: ' + apiUrl);
