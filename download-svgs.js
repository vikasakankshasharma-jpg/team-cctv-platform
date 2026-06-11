const https = require('https');
const fs = require('fs');

const download = (url, dest, referer) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': referer,
        'Connection': 'keep-alive'
      }
    }, function(response) {
      if (response.statusCode === 301 || response.statusCode === 302) {
         return download(response.headers.location, dest, referer).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', function() {
        file.close(resolve);
      });
    }).on('error', function(err) {
      fs.unlink(dest, () => reject(err));
    });
  });
};

Promise.all([
  download('https://cdn.worldvectorlogo.com/logos/dahua-technology.svg', 'public/partners/dahua.svg', 'https://worldvectorlogo.com/logo/dahua-technology'),
  download('https://cdn.worldvectorlogo.com/logos/hikvision.svg', 'public/partners/hikvision.svg', 'https://worldvectorlogo.com/logo/hikvision')
]).then(() => console.log('Downloaded SVGs successfully')).catch(console.error);
