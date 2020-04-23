const fs = require('fs')
var MongoClient = require('mongodb').MongoClient;
var config = require('../config')
const _ = require('lodash')

MongoClient.connect(config.dbUrl, function(err, db) {

  var startYear = 1997;
  var endYear = 2007;
  for (var year = startYear; year <= endYear; year++) {
    const content = fs.readFileSync('./archive/' + year + '.json')

    const events = JSON.parse(content)

    const categories = _.flatten(events)
    const results = _.flatten(categories)
    console.log("Start import for year: " + year + " Number of resuts " + results.length)

    // create local copy of variable, else year will always be 2008
    const staticYear = year;
    db.collection('results').insertMany(results, function(err, res){
      console.log("Imported results for year '" + staticYear + "'. Number of results: " + res.ops.length)
    })
  }
})
