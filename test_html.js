const fs = require('fs');
const cheerio = require('cheerio');
const content = fs.readFileSync('C:/Users/hp/Documents/temp_extracted/temp/HD Camera _ Mega Compu World.html', 'utf8');
const $ = cheerio.load(content);
console.log('HTML of first product:');
console.log($('.product-layout').first().html());
