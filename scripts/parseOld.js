var solvBase = "http://www.o-l.ch/cgi-bin/";
var resultsOld = solvBase + "abfrage?type=rang&event=Auswahl&year="
var ent = require('ent')
var async = require('async')
var request = require('request')
var fs = require('fs')
var crypto = require('crypto')
var startYear = 1997;
var endYear = 2007;
for (var year = startYear; year <= endYear; year++) {
    importYear(year);
}


function importYear(year) {
    var url = resultsOld + year;
    
    request({encoding: null, url: url}, function (error, response, buffer) {
        var body = "";
        for (var ii = 0; ii < buffer.length; ii++) {
            body += String.fromCharCode(buffer.readUInt8(ii));
        }
        body = ent.decode(body)
        if (!error && response.statusCode == 200) {
            var reg = /<input type=radio name=event value=".*?"> <a href="(.*?)">(.*)<\/a> (\d| )\d\. .{3,4} \d{4}(.*)/g

            var events = new Array();
            while (result = reg.exec(body)) {
                events.push({url: result[1], year: year, name: result[4].trim() || result[2]});
            }

            async.mapSeries(events, importResults, function (err, results) {
              console.log("Done. Write file...")
              fs.writeFile("./archive/" + year + ".json", JSON.stringify(results))
            });

        }
        else {
            out.error('Error while importing SOLV ' + error);
        }

    });


}

function importResults(options, fn) {
    var url = solvBase + options.url + "&kind=all";
    request({encoding: null, url: url}, function (error, response, buffer) {
        var body = "";
        for (var ii = 0; ii < buffer.length; ii++) {
            body += String.fromCharCode(buffer.readUInt8(ii));
        }
        body = ent.decode(body)
        
        var categories = new Array();

        var reg = /<b>(?:<p><.p>)?(.*?)<.b>\s<pre>\( ?(\d*?.\d*?) km,\s*?(\d*?) m,  ?(\d*?) Po.\)(.*\s*)*?<.pre>/g

        while (res = reg.exec(body)) {
            categories.push({sourceCode: res[0], name: res[1]});

        }

        if (categories.length == 0) {
            console.log("error reading result categories: " + options.url)
            fn(null, []);
        }
        else {
            var regex = /<td valign=top>\s<pre>(.*)/g
            var res = regex.exec(body);
            var eventLine = res[1].replace(/(<b>|<\/b>|<\/a>|<a href=".*">)/g, "");
            var regex;
            regex = /(?:<b>)?(?:<a href=".*?">)?((?:[^ <]+\s)*(?:\S*[^ ,<] ))(?:<.a>)?(.*?) +((?:\S+ )*(?:[^\s,]+))? +(?:((?:\S+\s?)+), )?((?:\d| )\d)\.(.*)(\d\d\d\d)(?:<.b>)*/g
            res = regex.exec(eventLine);
                
                if (!res) {
                    console.error("error reading result page:" + options.url)
                    fn(null, null)
                    return
                }

                    var obj = {};
                   
                    //obj.urlSource = url;
                   // obj.source = 'solvResults';
                    obj.name = options.name;
                  //  obj.map = res[3] ? res[3].trim() : null;
                   /// obj.eventCenter = res[4] ? res[4].trim() : null;
                    if (res[5] && res[6] && res[7]) {
                        obj.date = (new Date(res[7], getMonth(res[6]), res[5])).getTime()
                    }
                    obj.id = crypto.createHash('sha1').update(obj.name + obj.date).digest('hex')

                    importResultsOneEvent(obj);



            function importResultsOneEvent(event) {
                var regex = /(?:(?:(\d+)\.)|(?:  )) (.{22}\w*?) (\d\d)?  (.{18,}) (.{19,}) (?:(?:(?:(\d?\d):)?(\d?\d):(\d\d))|.*)/g
                async.mapSeries(categories, function (category, categoryFn) {
                            //console.log(event.name + category.name);

                           
                            var items = [];
                            while (res = regex.exec(category.sourceCode)) {
                                var resultItem = {
                                    category: category.name,
                                    name: res[2].trim(),
                                    club: res[5] ? res[5].trim() : null,
                                    rank: res[1],
                                    yearOfBirth: res[3],
                                    event: event,
                                    eventId: event.id
                                }
                                  
                                items.push(resultItem)
                            }

                            categoryFn(null, items);

                    },
                    function (err, results) {
                        console.log("Imported event " + event.name)
                        fn(null, results);
                    })
            }

        }
    });
}

var months = {
    "Jan.": 0,
    "Feb.": 1,
    "März": 2,
    "Apr.": 3,
    "Mai": 4,
    "Juni": 5,
    "Juli": 6,
    "Aug.": 7,
    "Sep.": 8,
    "Okt.": 9,
    "Nov.": 10,
    "Dez.": 11
};

function getMonth(monthString) {
    return months[monthString.trim()];
}

