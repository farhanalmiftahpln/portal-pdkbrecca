import * as https from "https";

const sheetId = "1YXFGPcpoK-mcpcQNyg1BeupyVeIql9z3L8byvtLCFws";
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=OVERVIEW`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', err => console.log(err));
