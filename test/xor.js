#! /usr/bin/env nodejs

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


"use strict";

var swirljs, solveXOR, runNet,
    genomeSettings, netSettings,
    fitnessTarget, maxGenerations,
    results, targetFitness, maxGenerations;


targetFitness = 0.9;
maxGenerations = 100;


// when using this library:
// swirljs = require('swirljs');
swirljs = require('../lib/index.js');

// settings are optional
netSettings = {"sigmoidSteepness": 4.9};

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
    "addLinkMutationRate":          0.05
};

solveXOR = function (fitnessTarget, maxGenerations) {

    var i, j, population, genomes, genome,
        net, swirlNetJSON,
        fitness, bestFitness,
        out0, out1, out2, out3,
        error0, error1, error2, error3;

    population = swirljs.makePopulation(2, 1, genomeSettings);

    for (i = 0; i < maxGenerations; i += 1) {

        genomes = population.getGenomes();

        bestFitness = 0;

        for (j = 0; j < genomes.length; j += 1) {

            genome = genomes[j];

            swirlNetJSON = swirljs.growNet(genome);
            net = swirljs.startNet(swirlNetJSON, netSettings);

            out0 = runNet(net, 0, 0);
            out1 = runNet(net, 0, 1);
            out2 = runNet(net, 1, 0);
            out3 = runNet(net, 1, 1);

            error0 = Math.abs(out0);
            error1 = Math.abs(1 - out1);
            error2 = Math.abs(1 - out2);
            error3 = Math.abs(out3);

            fitness = (1 - error0) * (1 - error1) * (1 - error2) * (1 - error3);
            population.setFitness(net.getGenomeID(), fitness);

            if (fitness > fitnessTarget) {

                console.log();
                console.log("winner found after " + (i + 1) + " generations with fitness: " + fitness);
                console.log();
                console.log("winning network:");
                console.log();
                console.log(swirlNetJSON);
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

runNet = function (net, input0, input1) {

    var i;

    net.flush();
    net.setInputs([input0, input1]);

    for (i = 0; i < 5; i += 1) {
        net.step();
    }

    return net.getOutputs()[0];
};

solveXOR(targetFitness, maxGenerations);

