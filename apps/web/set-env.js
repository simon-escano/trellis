const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/environments/environment.prod.ts');
let apiUrl = process.env.TRELLIS_API_URL || '';
if (apiUrl && !apiUrl.endsWith('/graphql')) {
  // Ensure the URL points to the GraphQL endpoint, not just the root domain
  apiUrl = apiUrl.replace(/\/$/, '') + '/graphql';
}

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log('[Build Setup] Updated ' + targetPath + ' with apiUrl: ' + apiUrl);
