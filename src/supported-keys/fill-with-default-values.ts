import json from './supported-keys.json'
import fs from 'fs'

function main() {
  for (const key in json.keys) {
    if (json.keys[key].deprecatedKeyName === undefined) {
      json.keys[key].deprecatedKeyName = null;
    }
    if (json.keys[key].validationRegex === undefined) {
      json.keys[key].validationRegex = null;
    }
    if (json.keys[key].deprecated === undefined) {
      json.keys[key].deprecated = false;
    }
  }

  const jsonOutput = JSON.stringify(json, undefined, 4);
  fs.writeFileSync('./supported-keys.json', jsonOutput);
}

main();