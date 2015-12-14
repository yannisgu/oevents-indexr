var schedule = require("node-schedule");
var solvIndexr = require("./src/solvIndexr")

var j = schedule.scheduleJob('42 * * * * *', function() {
    solvIndexr.index(function(err, message) {
        console.log(err)
    });
});

solvIndexr.index(function(err, message) {
    console.log(err)
});
