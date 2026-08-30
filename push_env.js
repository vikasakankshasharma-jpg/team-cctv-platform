const { execSync } = require('child_process');
const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env.production'));
const keys = Object.keys(env);
const ignore = ['VERCEL', 'VERCEL_ENV', 'VERCEL_GIT_COMMIT_AUTHOR_LOGIN', 'VERCEL_GIT_COMMIT_AUTHOR_NAME', 'VERCEL_GIT_COMMIT_MESSAGE', 'VERCEL_GIT_COMMIT_REF', 'VERCEL_GIT_COMMIT_SHA', 'VERCEL_GIT_PREVIOUS_SHA', 'VERCEL_GIT_PROVIDER', 'VERCEL_GIT_PULL_REQUEST_ID', 'VERCEL_GIT_REPO_ID', 'VERCEL_GIT_REPO_OWNER', 'VERCEL_GIT_REPO_SLUG', 'VERCEL_OIDC_TOKEN', 'VERCEL_TARGET_ENV', 'VERCEL_URL', 'TURBO_CACHE', 'TURBO_DOWNLOAD_LOCAL_ENABLED', 'TURBO_REMOTE_ONLY', 'TURBO_RUN_SUMMARY', 'NX_DAEMON'];
for (const key of keys) {
    if (ignore.includes(key)) continue;
    console.log('Syncing ' + key);
    try { execSync('npx vercel env rm ' + key + ' production -y', { stdio: 'ignore' }); } catch(e) {}
    // Safe write to a temporary file
    fs.writeFileSync('temp_val.txt', env[key]);
    try {
        execSync('npx vercel env add ' + key + ' production < temp_val.txt', { stdio: 'ignore' });
    } catch(e) {
        console.error('Failed on ' + key);
    }
}
fs.unlinkSync('temp_val.txt');
console.log('Done syncing env.');
