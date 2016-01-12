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

var makeFirstGeneration, makeBasicGenome,
    randomizeAllWeights,
    genes, genomes, mutation, settings;

genes = require('./genes.js');
genomes = require('./genomes.js');
mutation = require('./mutation.js');

settings = require('./settings.js');

// makes first generation of genomes
makeFirstGeneration = function (inputCount, outputCount) {

    "use strict";

    var i, generation, baseGenome, genomeCopy;

    generation = [];

    baseGenome = makeBasicGenome(inputCount, outputCount);

    for (i = 0; i < settings.getSetting("populationSize"); i += 1) {

        genomeCopy = baseGenome.spawn(i, 0);
        randomizeAllWeights(genomeCopy);

        generation.push(genomeCopy);
    }

    return generation;
};

// create basic genome
makeBasicGenome = function (inputCount, outputCount) {

    "use strict";

    var i, genome, inputFunction,
        biasInnovations, inputInnovations, outputInnovations;

    genome = genomes.makeGenome(0, 0, undefined);

    inputFunction = settings.getSetting("linearInputsFunction") ? "linear" : "sigmoid";

    genome.addGene(genes.makeNodeGene("bias", inputFunction, undefined, undefined, undefined));

    for (i = 0; i < inputCount; i += 1) {

        genome.addGene(genes.makeNodeGene("input", inputFunction, i, undefined, undefined));
    }
    for (i = 0; i < outputCount; i += 1) {

        genome.addGene(genes.makeNodeGene("output", "sigmoid", i, undefined, undefined));
    }

    biasInnovations = genome.getGeneInnovationNumbers("node", "bias");
    inputInnovations = genome.getGeneInnovationNumbers("node", "input");
    outputInnovations = genome.getGeneInnovationNumbers("node", "output");

    outputInnovations.forEach(function (outputInnov) {

        biasInnovations.forEach(function (biasInnov) {

            genome.addGene(genes.makeConnectionGene(biasInnov, outputInnov, 0));
        });
        inputInnovations.forEach(function (inputInnov) {

            genome.addGene(genes.makeConnectionGene(inputInnov, outputInnov, 0));
        });
    });
    return genome;
};

// randomizes the weights of every connection in a genome
randomizeAllWeights = function (genome) {

    "use strict";

    var connections;

    connections = genome.getGeneInnovationNumbers("connection");

    connections.forEach(function (connection) {

        mutation.randomizeWeight(genome, connection);
    });
};

module.exports.makeFirstGeneration = makeFirstGeneration;

