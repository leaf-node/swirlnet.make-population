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


var makeArchive, util;

util = require('../util.js');


// factory function that creates an archive object used for performing "novelty search"
makeArchive = function (options) {

    "use strict";

    var that, behaviorArchive, recentBehaviors, dimensionality, sparsities,
        init, noteBehavior, getSparsities, archiveAndClear, getArchive, getArchiveLength,
        calculateSparsities, measureSparsity, defaultBehaviorDistanceFunction, measureBehaviorDistance;

    console.assert(typeof options === "object",
            "swirlnet: error: novelty search options argument must be an object.");
    console.assert(util.isInt(options.kNearestNeighbors) && options.kNearestNeighbors > 0,
            "swirlnet: error: kNearestNeighbors option must be an integer greater than zero.");
    console.assert(util.isInt(options.archiveThreshold) && options.archiveThreshold > 0,
            "swirlnet: error: archiveThreshold must be an integer greater than zero.");
    console.assert(typeof options.behaviorDistanceFunction === "function" || options.behaviorDistanceFunction === undefined,
            "swirlnet: error: behaviorDistanceFunction must be a function or unspecified (undefined).");

    behaviorArchive = [];
    recentBehaviors = [];
    sparsities = [];

    // sets the distance function
    init = function () {

        if (options.behaviorDistanceFunction === undefined) {
            measureBehaviorDistance = defaultBehaviorDistanceFunction;
        } else {
            measureBehaviorDistance = options.behaviorDistanceFunction;
        }
    };

    // adds a behavior and genome pair to the list of behaviors of genomes in the current generation
    noteBehavior = function (behavior, genome) {

        if (dimensionality === undefined) {
            dimensionality = behavior.length;
        }

        console.assert(Array.isArray(behavior),
                "swirlnet: error: behavior must be an array.");
        console.assert(typeof genome === "string",
                "swirlnet: error: genome must be a string.");
        console.assert(behavior.length === dimensionality,
                "swirlnet: error: behavior dimensionality must match prior behavior dimensionalities: " + dimensionality);

        recentBehaviors.push([behavior, genome]);
    };

    // returns a list of the sparsities of each genome from the current generation
    getSparsities = function () {

        calculateSparsities();

        return util.copy(sparsities);
    };

    // returns a copy of the archive of novel genomes and their behavior vectors
    getArchive = function () {

        return util.copy(behaviorArchive);
    };

    // returns the length of the archive
    getArchiveLength = function () {

        return behaviorArchive.length;
    };

    // archives novels genomes from the current generation and clears out the rest
    // use this prior to adding behaviors of genomes in the next generation
    archiveAndClear = function () {

        var i;

        calculateSparsities();

        for (i = 0; i < recentBehaviors.length; i += 1) {
            if (sparsities[i] >= options.archiveThreshold) {
                behaviorArchive.push(recentBehaviors[i]);
            }
        }

        recentBehaviors = [];
        sparsities = [];
    };

    // calculates the sparsities of behaviors of genomes in this generation
    calculateSparsities = function () {

        var i;

        console.assert(recentBehaviors.length > 0,
                "swirlnet: error: recent behavior count must be greater than zero.");
        console.assert(sparsities.length === 0 || sparsities.length === recentBehaviors.length,
                "swirlnet: error: sparsities may only be calculated once all behaviors have been added.");

        if (sparsities.length !== recentBehaviors.length) {

            sparsities = [];

            for (i = 0; i < recentBehaviors.length; i += 1) {
                sparsities.push(measureSparsity(i));
            }
        }
    };

    // measures the sparsity of a behaviour relative to archive of behaviours and behaviours of current generation
    measureSparsity = function (recentBehaviorIndex) {

        var behavior, distances, i, effectiveKNearestNeighbors, sparsity;

        console.assert(util.isInt(recentBehaviorIndex) && recentBehaviorIndex >= 0 && recentBehaviorIndex < recentBehaviors.length,
                "swirlnet: internal error: recent behavior index must be an integer greater than or equal to zero and less than the number of recent behaviors.");

        behavior = recentBehaviors[recentBehaviorIndex][0];
        distances = [];

        behaviorArchive.forEach(function (archivedBehavior) {
            distances.push(measureBehaviorDistance(archivedBehavior[0], behavior));
        });

        for (i = 0; i < recentBehaviors.length; i += 1) {
            if (i !== recentBehaviorIndex) {
                distances.push(measureBehaviorDistance(recentBehaviors[i][0], behavior));
            }
        }

        effectiveKNearestNeighbors = (distances.length < options.kNearestNeighbors) ? distances.length : options.kNearestNeighbors;

        distances.sort(function (a, b) { return a - b; });
        distances = distances.slice(0, effectiveKNearestNeighbors);

        sparsity = distances.reduce(function (a, b) { return a + b; }) / effectiveKNearestNeighbors;

        return sparsity;
    };

    // default function to measure the distance of two behaviors
    // calculated as spatial distance between two behaviours when treated as multidimensional points
    defaultBehaviorDistanceFunction = function (behavior0, behavior1) {

        var distanceSquared, i;

        console.assert(Array.isArray(behavior0) && Array.isArray(behavior1),
                "swirlnet: internal error: behaviors must be arrays.");
        console.assert(behavior0.length === behavior1.length,
                "swirlnet: internal error: behaviors have differing dimensionality.");

        distanceSquared = 0;

        for (i = 0; i < behavior0.length; i += 1) {
            distanceSquared += Math.pow(behavior0[i] - behavior1[i], 2);
        }

        return Math.sqrt(distanceSquared);
    };

    init();

    that = {};
    that.noteBehavior = noteBehavior;
    that.getSparsities = getSparsities;
    that.archiveAndClear = archiveAndClear;
    that.getArchive = getArchive;
    that.getArchiveLength = getArchiveLength;

    return that;
};

module.exports.makeArchive = makeArchive;

