const { readFile, writeFile } = require('fs');
const { argv } = require('process');

const version = argv[2];

readFile('./README.md', (err1, buf1) => {
  if (err1) {
    throw err1;
  }
  const text = buf1
    .toString()
    .replace(/final-state@\d+\.\d+\.\d+/g, `final-state@${version}`);

  writeFile('./README.md', text, err2 => {
    if (err2) {
      throw err2;
    }
  });
});
