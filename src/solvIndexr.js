var MongoClient = require('mongodb').MongoClient;
var request = require("request")
var _ = require('lodash')
var async = require("async")
var ranking = require('./services/ranking')
var config = require('../config')

function importEvent(event, db) {
  var col = db.collection('results');
  event.date = Date.parse(event.date);
  request(event._link, function(err, resp, body) {
      var categories = JSON.parse(body).categories
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
          console.log("Error in " + event.name)
          return
      }
      col.insertMany(runners, function(err, res){
             console.log("Imported Event '" + event.name + "'. Number of runners: " + res.length)
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

            request('http://ol.zimaa.ch/api/events', function(err, resp, body) {
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
                    //db.collection("importedEvents").insertOne({id: 3619, date: new Date()})

                    for(var i in events.events) {
                        (function() {

                            var event = events.events[i]
                            if(!_.find(res, {id: event.id})) {
                                db.collection("importedEvents").insertOne({id: event.id, date: new Date()}, function(err, res) {
                                    console.log("Start import " + event.name)
                                    importEvent(event, db)
                                })
                            }
                            else {
                                console.log("Skip "+ event.name)
                            }
                        })()
                    }
                    console.log("Finish importing events.")

                })
                return importEvent(events.events[0], db)
                //db.close();
            });
        });
    }
}