const TuroDailyModel = require("../utils/turo_car_daily");

const mongoose = require("mongoose");
const { mongoURI } = require("../config");
const fs = require("fs");
const finalFile = fs.createWriteStream("turo_export_1.csv", {
  flags: "a"
});

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(async () => {
    console.log("mongoose connected");

    const startDate = new Date(2021, 06, 20).toISOString();
    const endDate = new Date(2021, 06, 20).toISOString();
    let queryParams = {
      daily_crawl_start_datetime: {
        $gte: startDate
      }
    };

    global.gc();

    TuroDailyModel.find(queryParams)
      .maxTime(150 * 1000)
      .sort({ url: "asc" })
      .exec((err, doc) => {
        global.gc();
        for (let i = 0; i < doc.length; i++) {
          const car = doc[i]._doc;
          const inputStartDatetime = new Date(
            car.input_start_datetime.replace("T", " ")
          ).toLocaleString("en-US", { timeZone: "Asia/Kathmandu" });
          const inputEndDatetime = new Date(
            car.input_end_datetime.replace("T", " ")
          ).toLocaleString("en-US", { timeZone: "Asia/Kathmandu" });

          let finalData = {
            url: car.url,
            car_site_name: car.car_site_name,
            location: car.location,
            make: car.make,
            model: car.model,
            name: car.name,
            owner: car.owner,
            trips: car.trips,
            daily_crawl_start_datetime: new Date(
              car.daily_crawl_start_datetime
            ).toLocaleString("en-US", { timeZone: "UTC" }),
            daily_rate: car.daily_rate,
            input_start_date: inputStartDatetime.split(",")[0].trim(),
            input_start_time: inputStartDatetime.split(",")[1].trim(),
            input_end_date: inputEndDatetime.split(",")[0].trim(),
            input_end_time: inputEndDatetime.split(",")[1].trim(),
            available: car.available,
            unavailable_description: car.unavailable_description || "",
            unavailable_reason: car.unavailable_reason || ""
          };

          let keys = Object.keys(finalData);
          if (i === 0) {
            finalFile.write(keys.join(",") + "\n");
          }
          let finalCsv = keys
            .map(k => `"${finalData[k].toString()}"`)
            .join(",");
          finalCsv = finalCsv + "\n";
          finalFile.write(finalCsv);
          console.log("added");
        }
      });
  })
  .catch(err => console.log("Error Connecting to mongo: " + err));


  // node --expose-gc --max_old_space_size=8192 turo_export