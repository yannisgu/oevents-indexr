var MongoClient = require('mongodb').MongoClient;
var request = require("request")
var _ = require('lodash')
var async = require("async")
var ranking = require('./services/ranking')
var config = require('../config')

function importEvent(event, db, cb) {
    var col = db.collection('results');
    event.date = Date.parse(event.date);
    request(event._link, function(err, resp, body) {
        if(err) {
          cb(err)
          return;
        }

        var categories;
        try {
          categories = JSON.parse(body).categories
        }
        catch(error) {
          cb(error)
          return;
        }
        var runners = []
        for(var i in categories) {
            var category = categories[i]
            var results = ranking.parseRanking(category   )

            for(var j in results.runners) {
                var runner = results.runners[j]
                runners.push({
                    "eventId": event.id,
                    "event": event,
                    "category": category.name,
                    "rank": runner.rank,
                    "name": runner.fullName,
                    "yearOfBirth": runner.yearOfBirth,
                    "club": runner.club
                })
            }
        }


        if(runners.length <= 0) {
            console.log("No runners in " + event.name)
            return
        }
        col.insertMany(runners, function(err, res){
                console.log("Imported Event '" + event.name + "'. Number of runners: " + res.ops.length)
                cb(err)
        })
    })
}

module.exports = {
    index: function(cb) {
        
        MongoClient.connect(config.dbUrl, function(err, db) {
            if(err) {
                cb(err, null)
                return;
            }

            request('http://localhost:3001/api/events?year=2016', function(err, resp, body) {
                if(err) {
                    cb(err, null)
                    return
                }
                if(resp.statusCode  != 200) {
                    cb("Status not 200: " + resp.statusCode , null)
                    return
                }

                var events = JSON.parse(body)
                db.collection("importedEvents").find().toArray(function(err, res) {

                    for(var i in events.events) {
                        (function() {

                            var event = events.events[i]
                            if(!_.find(res, {id: event.id})) {
                            //if(true) {
                                db.collection("importedEvents").insertOne({id: event.id, date: new Date(), success: 0}, function(err, res) {
                                    console.log("Start import " + event.name)
                                    importEvent(event, db, function(error) {
                                      if(error) {
                                        console.log("Failed to import " + event.name)
                                        console.error(error)
                                      }
                                      else {
                                        db.collection("importedEvents").update({_id: res.ops[0]._id}, {$set: {success: 1}})
                                      }
                                    })
                                })
                            }
                            else {
                                console.log("Skip "+ event.name)
                            }
                        })()
                    }
                    console.log("Finish importing events.")
                    cb()
                })
            });
        });
    }
}