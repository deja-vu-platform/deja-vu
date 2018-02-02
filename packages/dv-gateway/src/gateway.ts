import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as minimist from 'minimist';
import { readFileSync } from 'fs';
import * as path from 'path';

const argv = minimist(process.argv);
const configFilePath = argv.configFilePath;

const config = JSON.parse(readFileSync(configFilePath, 'utf8'));

const app = express();

const distFolder = path.join(process.cwd(), 'dist');
app.use(express.static(distFolder));
app.get('*', ({}, res) => {
  res.sendFile(path.join(distFolder, 'index.html'));
});

app.use('/api', bodyParser.json(), (req, {}, next) => {
  // reject invalid action or forward
  console.log(`here ${req}`);
  next();
});

const port = config.gatewayPort;
app.listen(port, () => {
  console.log(`Running gateway on port ${port}`);
  console.log(`Using config ${JSON.stringify(config, undefined, 2)}`);
  console.log(`Serving ${distFolder}`);
});
