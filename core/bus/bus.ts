const fs = require("fs");

// Read the config given as arg
// receive a config file with the compound info and use that to configure the
// bus
const fp = process.argv[2];
let config;

fs.readFile(fp, "utf8", (err, data) => {
  if (err) throw err;
  console.log(`Reading config from ${fp}`);
  config = JSON.parse(data);
  console.log(`Done reading config`);
});
