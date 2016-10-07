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

var makePopulation, generation, innovations,
    reproduction, settings, speciation, util;

speciation = require('./speciation.js');
generation = require('./generation.js');
innovations = require('./innovations.js');
reproduction = require('./reproduction.js');

settings = require('./settings.js');
util = require('../util.js');

// creates a population that reproduces based on fitness
makePopulation = function (inputCount, outputCount, userSettings) {

    "use strict";

    var that, population,
        init, setFitness, reproduce, getGenomes,
        getCurrentGenerationNumber;


    // initializes population and semi-global variables
    init = function () {

        console.assert(util.isInt(inputCount) && inputCount >= 0,
                "swirlnet: error: invalid input count: " + inputCount);
        console.assert(util.isInt(outputCount) && outputCount >= 1,
                "swirlnet: error: invalid output count: " + outputCount);

        settings.initSettings(userSettings);

        reproduction.init();
        speciation.init();
        innovations.init();

        population = generation.makeFirstGeneration(inputCount, outputCount);
        speciation.speciate(population);
    };

    // returns the genomes of current generation
    getGenomes = function () {

        var jsonGenomes;

        jsonGenomes = [];
        population.forEach(function (genome) {
            jsonGenomes.push(genome.stringify());
        });

        return jsonGenomes;
    };

    // for setting the fitness of a tested genome
    setFitness = function (genomeID, fitness) {

        console.assert(util.isInt(genomeID) && genomeID >= 0 && genomeID < settings.getSetting("populationSize"),
                "swirlnet: error: invalid genomeID: " + genomeID);
        console.assert(typeof fitness === "number" && !isNaN(fitness),
                "swirlnet: error: invalid fitness: " + fitness);

        reproduction.setFitness(genomeID, fitness);
    };

    // creates a new generation based on prior fitness scores
    reproduce = function () {

        population = reproduction.reproduce(population);

        console.assert(population.length === settings.getSetting("populationSize"), "swirlnet: internal error: invalid population size: " + population.length);
    };

    // returns the current generation number
    getCurrentGenerationNumber = function () {

        return reproduction.getCurrentGenerationNumber();
    };

    init();

    // public functions
    that = {};
    that.reproduce = reproduce;
    that.setFitness = setFitness;
    that.getGenomes = getGenomes;
    that.getCurrentGenerationNumber = getCurrentGenerationNumber;

    return that;
};

module.exports.makePopulation = makePopulation;


