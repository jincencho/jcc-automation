const fs = require('fs');
const data = JSON.parse(fs.readFileSync('assets/extracted_data.json', 'utf8'));
console.log(data.induction[5]);
