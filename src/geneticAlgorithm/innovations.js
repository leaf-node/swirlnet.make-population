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

var nextInnovationNumber, innovationHistory,
    pickInnovationNumber, init,
    compareInnovations,
    intersectingInnovations,
    nonMatchingInnovations,
    getNextInnovationNumber,
    getInnovationHistory,
    resetInnovationHistory, util;

util = require('../util.js');

// picks the innovation number for a new gene.
// if the pattern is created previously in this generation, or if the pattern
// expresses a previously used input, output or bias node, the same innovation
// number is used.
pickInnovationNumber = function (innovation) {

    "use strict";

    var i, innovationNumber, oldInnovation, oldInnovationNumber,
        innovationHistory, historyToUse;

    console.assert(innovation[0] === "connection" || innovation[0] === "node",
            "swirlnet: internal error: invalid innovation type: " + innovation[0]);

    if (innovation[0] === "connection") {

        console.assert(util.isInt(innovation[1]),
                "swirlnet: internal error: invalid upstream connection: " + innovation[1]);
        console.assert(util.isInt(innovation[2]),
                "swirlnet: internal error: invalid downstream connection: " + innovation[2]);
    } else {

        console.assert(innovation[1] === "bias" || innovation[1] === "input" || innovation[1] === "output" || innovation[1] === "hidden",
                "swirlnet: internal error: invalid node subtype: " + innovation[1]);
        console.assert(innovation[2] === null || innovation[2] === "sigmoid",
                "swirlnet: internal error: invalid node activation function: " + innovation[2]);
        console.assert(innovation[3] === undefined || util.isInt(innovation[3]),
                "swirlnet: internal error: invalid node position: " + innovation[3]);
        console.assert(innovation[4] === undefined || util.isInt(innovation[4]),
                "swirlnet: internal error: invalid node upstream node: " + innovation[4]);
        console.assert(innovation[5] === undefined || util.isInt(innovation[5]),
                "swirlnet: internal error: invalid node downstream node: " + innovation[5]);
    }

    innovationHistory = getInnovationHistory();

    if (innovation[0] === "node"
            && (innovation[1] === "bias"
                || innovation[1] === "input"
                || innovation[1] === "output")) {

        historyToUse = innovationHistory[0];
    } else {
        historyToUse = innovationHistory[1];
    }

    for (i = 0; i < historyToUse.length; i += 1) {
        oldInnovationNumber = historyToUse[i][0];
        oldInnovation = historyToUse[i][1];

        if (compareInnovations(innovation, oldInnovation)) {
            return oldInnovationNumber;
        }
    }

    innovationNumber = getNextInnovationNumber();

    historyToUse.push([innovationNumber, innovation]);

    return innovationNumber;
};

// returns true if partial representations of innovations are equal
// (weight and disablement status must not be included in this representation)
compareInnovations = function (innovation1, innovation2) {

    "use strict";

    var i;

    if (innovation1.length !== innovation2.length) {
        return false;
    }
    for (i = 0; i < innovation1.length; i += 1) {

        if (innovation1[i] !== innovation2[i]) {
            return false;
        }
    }
    return true;
};

// returns a list of both genomes (minus metadata),
// with genes with non-matching innovation numbers filtered out.
intersectingInnovations = function (genome1, genome2) {

    "use strict";

    var intersection, innovations1;

    intersection = [];
    innovations1 = genome1.getGeneInnovationNumbers();

    innovations1.forEach(function (innovation) {

        if (genome2.hasGene(innovation)) {
            intersection.push(innovation);
        }
    });
    return intersection;
};

// returns list of both lists (minus metadata),
// with genes with matching innovtion numbers removed
nonMatchingInnovations = function (genome1, genome2) {

    "use strict";

    var nonMatching, innovationList1, innovationList2;

    nonMatching = [[], []];

    innovationList1 = genome1.getGeneInnovationNumbers();
    innovationList2 = genome2.getGeneInnovationNumbers();

    innovationList1.forEach(function (innovationNumber) {
        if (!genome2.hasGene(innovationNumber)) {
            nonMatching[0].push(innovationNumber);
        }
    });

    innovationList2.forEach(function (innovationNumber) {
        if (!genome1.hasGene(innovationNumber)) {
            nonMatching[1].push(innovationNumber);
        }
    });

    return nonMatching;
};

// returns next unused innovation number
getNextInnovationNumber = function () {

    "use strict";

    var newInnovationNumber;

    console.assert(nextInnovationNumber !== undefined, "swirlnet: internal error: innovations.init() needs to be run!");

    newInnovationNumber = nextInnovationNumber;
    nextInnovationNumber += 1;

    return newInnovationNumber;
};

// gets the innovation history for this generation
getInnovationHistory = function () {

    "use strict";

    console.assert(innovationHistory !== undefined, "swirlnet: internal error: resetInnovationHistory() needs to be run!");

    return innovationHistory;
};

// initializes innovation numbers
init = function () {

    "use strict";

    console.assert(nextInnovationNumber === undefined, "swirlnet: internal error: innovations.init() should only be run once!");

    nextInnovationNumber = 0;

    resetInnovationHistory();
};

// for resetting the remembered history after mutating each generation
resetInnovationHistory = function () {

    "use strict";

    innovationHistory = innovationHistory || [];
    innovationHistory[0] = innovationHistory[0] || [];

    // only reset the connection gene and hidden node gene history
    innovationHistory[1] = [];
};

module.exports.init = init;

module.exports.pickInnovationNumber = pickInnovationNumber;
module.exports.resetInnovationHistory = resetInnovationHistory;

module.exports.intersectingInnovations = intersectingInnovations;
module.exports.nonMatchingInnovations = nonMatchingInnovations;

