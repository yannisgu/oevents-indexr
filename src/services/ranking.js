/*
 * Copyright 2015 Simon Raess
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
require('array.prototype.find');

var parseTime = require('./time').parseTime;
var formatTime = require('./time').formatTime;

function invalidTime(time) {
  return time === '-' || time === 's';
}

function sum(a1, a2) {
  return a1 + a2;
}

module.exports.parseRanking = function(json) {
  var result = {
    name: json.name,
    distance: json.distance,
    ascent: json.ascent,
    controls: json.controls
  };

  // define the legs
  result.legs = json.runners[0].splits.map(function(split, idx, splits) {
    var from = idx === 0 ? 'St' : splits[idx - 1].code;
    return {
      code: from + '-' + split.code,
      runners: []
    };
  });

  result.runners = json.runners.map(function(runner) {
    return {
      id: runner.id,
      fullName: runner.fullName,
      time: runner.time,
      yearOfBirth: runner.yearOfBirth,
      city: runner.city,
      club: runner.club,
      category: runner.category
    };
  });

  // calculate the rank
  result.runners.forEach(function(runner, idx) {
    if (idx === 0) {
      runner.rank = 1;
    } else {
      var prev = result.runners[idx - 1];
      if (prev.time === runner.time) {
        runner.rank = prev.rank;
      } else if (parseTime(runner.time)) {
        runner.rank = idx + 1;
      }
    }
  });

  return result;
}
