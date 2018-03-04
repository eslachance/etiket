/* eslint-disable func-names */
const Enmap = require('enmap');
const Provider = require('enmap-mongo');
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);

const config = require('./config.js');

const langs = new Enmap({ provider: new Provider({ name: 'langs', url: config.mongodb.url }) });


(async function () {
  await langs.defer;
  const langfiles = await readdir("./lang/");
  langfiles.forEach(file => {
    const lang = file.split(".")[0];
    const langdata = require(`./lang/${file}`).strings;
    langs.set(lang, langdata);
  });
}());
