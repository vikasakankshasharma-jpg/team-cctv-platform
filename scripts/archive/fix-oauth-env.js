const { execSync } = require('child_process');

const fixEnv = (key, value) => {
  try {
    console.log(`Fixing ${key}...`);
    execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
    execSync(`npx vercel env rm ${key} preview -y`, { stdio: 'ignore' });
    execSync(`npx vercel env rm ${key} development -y`, { stdio: 'ignore' });
  } catch(e) {}
  
  try {
    execSync(`npx vercel env add ${key} production`, { input: value, stdio: ['pipe', 'ignore', 'ignore'] });
    execSync(`npx vercel env add ${key} preview`, { input: value, stdio: ['pipe', 'ignore', 'ignore'] });
    execSync(`npx vercel env add ${key} development`, { input: value, stdio: ['pipe', 'ignore', 'ignore'] });
    console.log(`Successfully fixed ${key}`);
  } catch(e) {
    console.log(`Failed to add ${key}`);
  }
};

fixEnv('MAPPLS_CLIENT_ID', '96dHZVzsAusPjUqeIzTY-c8ndIJyNDuFLlZQKCU78X8e2_oXOso44j_d5AKObpcbImh3LJU2ZEXubTgzSZWK8g==');
fixEnv('MAPPLS_CLIENT_SECRET', 'lrFxI-iSEg--Cw49f2P1TD8ugaaWXPIWCZLd_nnSSk_A3cixq56OvkmY4zGNLgyp0OcygLvflxDljAkjv2NynVNBplaRQfdW');
