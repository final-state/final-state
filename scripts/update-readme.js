const { readFile, writeFile } = require('fs');

readFile('./package.json', (err, buf) => {
  if (err) {
    throw err;
  }
  const { version } = JSON.parse(buf.toString());

  readFile('./README.md', (err1, buf1) => {
    if (err1) {
      throw err1;
    }
    const text = buf1.toString().replace(/final-state@\d+\.\d+\.\d+/g, version);

    writeFile('./README.md', text, err2 => {
      if (err2) {
        throw err2;
      }
    });
  });
});
