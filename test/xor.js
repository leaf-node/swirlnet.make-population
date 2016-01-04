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

var swirljs, genomeSettings, netSettings,
    main, runXOR,
    fitnessTarget, maxGenerations, okError;

swirljs = require('../lib/swirl.js');

netSettings = {"sigmoidSteepness": 4.9};

genomeSettings = {

    "populationSize": 150,
    "compatibilityThreshold": 4.0,
    "mutationPower": 2.5,
    "disjointCoefficient": 1.0,
    "excessCoefficient": 1.0,
    "weightDifferenceCoefficient": 0.4,

    "survivalThreshold": 0.2,

    "weightMutationRate": 0.8,
    "weightPerturbanceRate": 0.9,
    "addNodeMutationRate": 0.03,
    "addLinkMutationRate": 0.05,
    "geneEnablementRate": 0.25,

    "inheritRandomNonMatchingRate": 0.25,
};

fitnessTarget = 0.9;

maxGenerations = 200;

main = function () {

    var i, j, bestNet, bestGenome, bestFitness, genomes, genome, genePool,
        net, swirlNetJSON, fitness,
        out0, out1, out2, out3, results,
        diff0, diff1, diff2, diff3;

    genePool = swirljs.makeGenePool(genomeSettings);

    genePool.setInputCount(2);
    genePool.setOutputCount(1);

    for (i = 0; i < maxGenerations; i += 1) {

        console.log("generation: " + i);

        genomes = genePool.getGenomes();

        bestFitness = 0;

        for (j = 0; j < genomes.length; j += 1) {

            genome = genomes[j];

            swirlNetJSON = swirljs.growNet(genome);
            net = swirljs.startNet(swirlNetJSON, netSettings);

            out0 = runXOR(net, 0, 0);
            out1 = runXOR(net, 0, 1);
            out2 = runXOR(net, 1, 0);
            out3 = runXOR(net, 1, 1);

            diff0 = Math.abs(out0);
            diff1 = Math.abs(1 - out1);
            diff2 = Math.abs(1 - out2);
            diff3 = Math.abs(out3);

            fitness = (1 - diff0) * (1 - diff1) * (1 - diff2) * (1 - diff3);

            genePool.setFitness(net.getGenomeID(), fitness);

            if (fitness > fitnessTarget) {

                results = [out0, out1, out2, out3];
                bestFitness = fitness;
                bestNet = swirlNetJSON;
                bestGenome = genome;

                console.log("winner found after " + i + " generations, with fitness " + bestFitness + ":");
                console.log();
                console.log(bestNet);
                console.log(bestGenome);
                console.log();
                console.log(results);

                return;
            }

            if (fitness > bestFitness) {

                bestFitness = fitness;
                results = JSON.stringify([out0, out1, out2, out3]);

                bestFitness = fitness;
                bestNet = swirlNetJSON;
                bestGenome = genome;
            }
        }

        genePool.reproduce();

        console.log("best fitness so far: " + bestFitness);
        console.log(results);
        console.log();
    }

    console.log("no winner found in " + i + " generations.");
    console.log();
    console.log(bestNet);
    console.log(bestGenome);
    console.log(bestFitness);
    console.log();
    console.log(results);

};

runXOR = function (net, input0, input1) {

    var i;

    net.flush();
    net.setInputs([input0, input1]);

    for (i = 0; i < 5; i += 1) {
        net.step();
    }

    return net.getOutputs()[0];
};

main();

