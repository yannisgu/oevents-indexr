var schedule = require("node-schedule");
var solvIndexr = require("./src/solvIndexr")
const peopleIndexr = require('./src/peopleIndexr');

var j = schedule.scheduleJob('42 * * * * *', function() {
    solvIndexr.index(function(err, message) {
        console.log(err)

        console.log("SOLV update done, now people update...")
        peopleIndexr.index((error) => {
            console.log(error)
        })
    });
});

solvIndexr.index(function(err, message) {
    console.log(err)

    console.log("SOLV update done, now people update...")
    peopleIndexr.index((error) => {
        console.log(error)
    })
});


