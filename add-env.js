const { execSync } = require('child_process');
try {
  execSync('npx vercel env add NEXT_PUBLIC_MAPPLS_API_KEY production', {
    input: '607539836d89fdc1f0cd8fddb1294763',
    stdio: ['pipe', 'inherit', 'inherit']
  });
  execSync('npx vercel env add NEXT_PUBLIC_MAPPLS_API_KEY preview', {
    input: '607539836d89fdc1f0cd8fddb1294763',
    stdio: ['pipe', 'inherit', 'inherit']
  });
  execSync('npx vercel env add NEXT_PUBLIC_MAPPLS_API_KEY development', {
    input: '607539836d89fdc1f0cd8fddb1294763',
    stdio: ['pipe', 'inherit', 'inherit']
  });
} catch (e) {
  console.log('Failed:', e);
}
