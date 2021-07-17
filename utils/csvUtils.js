const axios = require("axios");
const csvToJson = require("csvtojson");
const fs = require("fs");


async function csvToArr(url) {
  const res = await axios.get(url, { responseType: "blob" });
  return await csvToJson().fromString(res.data);
}


function addRow(rowData) {
  fs.createWriteStream()

}

module.exports = {
  csvToArr
};
