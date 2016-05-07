#! /usr/bin/env node

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


var swirlnet, solveXOR, runNet,
    genomeSettings, netSettings,
    fitnessTarget, maxGenerations,
    results, targetFitness, maxGenerations,
    getXORFitness;


targetFitness = 0.9;
maxGenerations = 200;


// when using this library:
// swirlnet = require('swirlnet');
swirlnet = require('../lib/index.js');

// settings are optional
genomeSettings = {

    "populationSize":               150,
    "survivalThreshold":            0.2,

    "disjointCoefficient":          1.0,
    "excessCoefficient":            1.0,
    "weightDifferenceCoefficient":  0.4,
    "compatibilityThreshold":       3.0,

    "mutationPower":                2.5,
    "weightMutationRate":           0.8,
    "weightPerturbanceRate":        0.9,
    "addNodeMutationRate":          0.03,
    "addLinkMutationRate":          0.05,

    "allowRecursion":               false
};

solveXOR = function (fitnessTarget, maxGenerations) {

    "use strict";

    var i, j, population, genomes, genome,
        net, phenotype,
        fitness, bestFitness;

    // arg 0: input count
    // arg 1: output count
    population = swirlnet.makePopulation(2, 1, genomeSettings);

    for (i = 0; i < maxGenerations; i += 1) {

        genomes = population.getGenomes();

        bestFitness = 0;

        for (j = 0; j < genomes.length; j += 1) {

            genome = genomes[j];

            phenotype = swirlnet.growNet(genome);
            net = swirlnet.startNet(phenotype);

            fitness = getXORFitness(net, 5, 10);

            population.setFitness(net.getGenomeID(), fitness);

            if (fitness > fitnessTarget) {

                console.log();
                console.log("winner found in " + (i + 1) + " generations with fitness: " + fitness);
                console.log();
                console.log("winning network:");
                console.log();
                console.log(phenotype);
                console.log();

                return;
            }

            bestFitness = (fitness > bestFitness) ? fitness : bestFitness;
        }

        population.reproduce();

        console.log("generation: " + (i + 1) + "  best fitness so far: " + bestFitness);
    }

    console.log();
    console.log("no winner found in " + i + " generations. best fitness: " + bestFitness);
    console.log();
};

getXORFitness = function (net, minIterations, maxIterations) {

    "use strict";

    var results0, results1, results2, results3,
        fitness0, fitness1, fitness2, fitness3,
        fitness, multiply, absOneMinus;

    fitness = 1;

    multiply = function (a, b) { return a * b; };
    absOneMinus = function (x) { return Math.abs(1 - x); };

    results0 = runNet(net, minIterations, maxIterations, 0, 0);
    results1 = runNet(net, minIterations, maxIterations, 1, 1);
    results2 = runNet(net, minIterations, maxIterations, 0, 1);
    results3 = runNet(net, minIterations, maxIterations, 1, 0);

    // fitness of 1 for values of 0
    fitness0 = results0.map(absOneMinus).reduce(multiply);
    fitness1 = results1.map(absOneMinus).reduce(multiply);
    // fitness of 1 for values of 1
    fitness2 = results2.map(Math.abs).reduce(multiply);
    fitness3 = results3.map(Math.abs).reduce(multiply);

    fitness *= fitness0 * fitness1 * fitness2 * fitness3;

    return fitness;
};

runNet = function (net, minIterations, maxIterations, input0, input1) {

    "use strict";

    var i, results;

    results = [];

    net.flush();
    net.setInputs([input0, input1]);

    for (i = 0; i < maxIterations; i += 1) {

        net.step();

        if (i >= minIterations - 1) {
            results.push(net.getOutputs()[0]);
        }

    }

    return results;
};

solveXOR(targetFitness, maxGenerations);

