const https = require('https');
const fs = require('fs');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
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
  download('https://cdn.worldvectorlogo.com/logos/dahua-technology.svg', 'public/partners/dahua.svg'),
  download('https://cdn.worldvectorlogo.com/logos/hikvision.svg', 'public/partners/hikvision.svg')
]).then(() => console.log('Downloaded'));
