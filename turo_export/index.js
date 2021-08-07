const TuroDailyModel = require("../utils/turo_car_daily");
const mongoose = require("mongoose");
const { mongoURI } = require("../config");
const fs = require("fs");
const { csvToArr } = require("../utils/csvUtils");
const finalFile = fs.createWriteStream("turo_export_final.csv", {
  flags: "a"
});

const nameVal = {
  "This car has a minimum trip length requirement.": "MIN LENGTH REQ",
  "This car must be requested at least 3 hours in advance at this location":
    "3HR ADVANCE",
  "The owner is available for pickup and return from... ":
    "OWNER SCHEDULE ISSUE",
  "This vehicle is currently disabled": "DISABLED",
  "This car must be requested at least 12 hours in advance at this location":
    "12HR ADVANCE",
  "This car must be requested at least 1 day in advance at this location":
    "1D ADVANCE",
  "The host isn’t available for pickup or return from…": "HOST N/A",
  "This car must be requested at least 2 hours in advance at this location":
    "2HR ADVANCE",
  "This car must be requested at least 6 hours in advance at this location":
    "6HR ADVANCE",
  "The host isn’t available for pickup or return on…": "OWNER SCHEDULE ISSUE",
  "This car must be requested at least 2 days in advance at this location":
    "2D ADVANCE",
  "The host isn’t available for pickup…": "OWNER SCHEDULE ISSUE",
  "The host isn’t available for return…": "OWNER SCHEDULE ISSUE"
};

const unavaliableName = Object.keys(nameVal);

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(async () => {
    let queryParams = {
      daily_crawl_start_datetime: {
        $gte: "2021-07-15T00:00:00.000Z",
        $lte: "2021-07-31T00:00:00.000Z"
      }
    };

    TuroDailyModel.find(queryParams)
      .maxTime(350 * 1000)
      .sort({ url: "asc" })
      .exec((err, doc) => {
        console.log(err);
        console.log(doc.length);
        for (let i = 0; i < doc.length; i++) {
          const car = doc[i]._doc;
          const inputStartDatetime = new Date(
            car.input_start_datetime.replace("T", " ")
          ).toLocaleString("en-US", { timeZone: "Asia/Kathmandu" });
          const inputEndDatetime = new Date(
            car.input_end_datetime.replace("T", " ")
          ).toLocaleString("en-US", { timeZone: "Asia/Kathmandu" });

          let unavailReason = nameVal[car.unavailable_description] || "";

          if (unavailReason == "") {
            unavailReason = car.unavailable_reason;
          }

          if (unavailReason === undefined || unavailReason == null) {
            unavailReason = "";
          }

          let finalData = {
            url: car.url,
            // car_site_name: car.car_site_name,
            location: car.location,
            make: car.make,
            model: car.model,
            //name: car.name,
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
            available: car.available || "",
            unavailable_description: car.unavailable_description || "",
            unavailable_reason: unavailReason || ""
          };
          // console.log(finalData);
          let keys = Object.keys(finalData);
          if (i === 0) {
            finalFile.write(keys.join(",") + "\n");
          }
          let finalCsv = keys
            .map(k => `"${finalData[k].toString()}"`)
            .join(",");
          finalCsv = finalCsv + "\n";
          finalFile.write(finalCsv);
          console.count("added");
        }
      });
  })
  .catch(err => console.log("Error Connecting to mongo: " + err));

// node --expose-gc --max_old_space_size=8192 turo_export
