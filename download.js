const https = require('https');
const fs = require('fs');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    }, function(response) {
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
  download('https://upload.wikimedia.org/wikipedia/commons/7/77/Dahua_Technology_logo.svg', 'public/partners/dahua.svg'),
  download('https://upload.wikimedia.org/wikipedia/commons/a/ae/Hikvision_logo.svg', 'public/partners/hikvision.svg')
]).then(() => console.log('Downloaded'));
