var MongoClient = require('mongodb').MongoClient;
var request = require("request")
var _ = require('lodash')
var async = require("async")
var ranking = require('./services/ranking')
var config = require('../config')


        
MongoClient.connect(config.dbUrl, function(err, db) {
    if(err) {
        console.log(err, null)
        return;
    }

    request('http://localhost:3001/api/events?year=2009', function(err, resp, body) {
        if(err) {
            console.log(err, null)
            return
        }
        if(resp.statusCode  != 200) {
            console.log("Status not 200: " + resp.statusCode , null)
            return
        }

        var events = JSON.parse(body)
        for(var i in events.events) {
            var event = events.events[i]
            db.collection("importedEvents").deleteOne({id: event.id});
            db.collection("results").deleteMany({eventId: event.id});
        }
    });
});