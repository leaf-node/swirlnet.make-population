// Copyright 2016 Andrew Engelbrecht
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var clone, copy, isInt;

clone = require('clone');

copy = function (object) {

    "use strict";

    return clone(object, false);
};

isInt = function (number) {

    "use strict";

    return (typeof number === "number" && !isNaN(number) && number % 1 === 0);
};

module.exports.copy = copy;
module.exports.isInt = isInt;

