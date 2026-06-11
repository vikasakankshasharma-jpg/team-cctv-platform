const https = require('https');
const fs = require('fs');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, {
      headers: {
        'User-Agent': 'SecureEasyBot/1.0 (contact@example.com) Node.js/20'
      }
    }, function(response) {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
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
  download('https://upload.wikimedia.org/wikipedia/commons/7/77/Dahua_Technology_logo.svg', 'public/partners/dahua.svg'),
  download('https://upload.wikimedia.org/wikipedia/commons/a/ae/Hikvision_logo.svg', 'public/partners/hikvision.svg')
]).then(() => console.log('Downloaded SVGs successfully')).catch(console.error);
