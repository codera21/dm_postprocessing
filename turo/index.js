const TuroDailyModel = require("../utils/turo_car_daily");
const { csvToArr } = require("../utils/csvUtils");
const mongoose = require("mongoose");
const { mongoURI } = require("../config");
const fs = require("fs");
const finalFile = fs.createWriteStream("final_turo_2.csv", {
  flags: "a"
});

finalFile.write(
  "city,make,model,name,owner,state,type,url,year,zip,average_turnover,total_turnover,total_trips_days,observed_trips\n"
);

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log("mongoose connected");

    const startDate = new Date(2021, 06, 10).toISOString();

    csvToArr(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSeEdjq4F-4wWmLYYudD7O7GtYhBba3AOb25dUSfcUZxxUOiozl4uNymqXntOeBb0EFrSZAHzuuaSg/pub?gid=506136279&single=true&output=csv"
    )
      .catch(() => console.log("whoops"))
      .then(inputData => {
        for (let j = 0; j < inputData.length; j++) {
          // if (j > 100) {
          //   break;
          // }
          const tCar = inputData[j];
          let queryParams = {
            url: tCar.url,
            daily_crawl_start_datetime: {
              $gte: "2021-07-16T00:00:00.000Z",
              $lte: "2021-08-01T00:00:00.000Z"
            }
          };

          TuroDailyModel.find(queryParams)
            .maxTime(30 * 1000)
            .sort({ daily_crawl_start_datetime: "asc" })
            .exec((err, doc) => {
              let observedTrips, minTrip, maxTrip;
              let prevTripCount;
              let dailyRate = 0;
              let weeklyDisc = 0;
              let monthlyDisc = 0;
              let changedDate = [];
              const totalChangedDate = [];

              for (let i = 0; i < doc.length; i++) {
                const car = doc[i]._doc;
                const trip = parseInt(car.trips);
                const avaliable = car.available;

                if (i === 0) {
                  minTrip = maxTrip = trip;
                  prevTripCount = trip;
                  dailyRate = car.daily_rate;
                  weeklyDisc = car.weekly_disc;
                  monthlyDisc = car.monthly_disc;
                } else {
                  if (trip < minTrip) {
                    minTrip = trip;
                  }
                  if (trip > maxTrip) {
                    maxTrip = trip;
                  }
                }

                if (
                  avaliable == false &&
                  car.unavailable_reason === "VEHICLE_UNAVAILABLE"
                ) {
                  changedDate.push(car.input_start_datetime);
                }

                if (prevTripCount < trip) {
                  changedDate.push(car.input_start_datetime);
                  prevTripCount = trip;
                  totalChangedDate.push({
                    s: changedDate[0],
                    e: changedDate[changedDate.length - 1]
                  });
                  changedDate = [];
                }
              }

              observedTrips = maxTrip - minTrip;
              observedTrips = isNaN(observedTrips) ? 0 : observedTrips;

              let totalTripDays = 0;
              let totalTurnover = 0;

              for (let k = 0; k < totalChangedDate.length; k++) {
                let tripDays =
                  new Date(totalChangedDate[k]["e"].slice(0, 10)) -
                  new Date(totalChangedDate[k]["s"].slice(0, 10));
                tripDays = tripDays / (1000 * 60 * 60 * 24);
                tripDays = parseInt(tripDays);

                totalTripDays += tripDays;
                let turnover = 0;
                if (tripDays < 7) {
                  turnover = dailyRate * tripDays;
                } else if (tripDays > 7 && tripDays < 30) {
                  turnover =
                    dailyRate * tripDays -
                    dailyRate * tripDays * (parseInt(weeklyDisc) / 100);
                } else {
                  turnover =
                    dailyRate * tripDays -
                    dailyRate * tripDays * (parseInt(monthlyDisc) / 100);
                }

                totalTurnover += Math.ceil(turnover);
              }
              const averageTurnover = Math.ceil(totalTurnover / 7).toFixed(2);

              let finalData = {
                city: tCar.city,
                make: tCar.make,
                model: tCar.model,
                name: tCar.name,
                owner: tCar.owner,
                state: tCar.state,
                type: tCar.type,
                url: tCar.url,
                year: tCar.year,
                zip: tCar.zip,
                average_turnover: averageTurnover,
                total_turnover: totalTurnover,
                total_trips_days: totalTripDays,
                observed_trips: observedTrips
              };

              let keys = Object.keys(finalData);
              let finalCsv = keys
                .map(k => finalData[k].toString().replace(",", "\\,"))
                .join(",");
              finalCsv = finalCsv + "\n";
              finalFile.write(finalCsv);
              console.log("added");
            });
        }
      });
  })
  .catch(err => console.log("Error Connecting to mongo: " + err));
