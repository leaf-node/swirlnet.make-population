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

var reproduce, setFitness, getFitness,
    crossoverGenomes, chooseOffspringCounts,
    getSurvivors, init, resetFitnessList,
    bumpCurrentGenerationNumber,
    getCurrentGenerationNumber,
    settings, speciation, util, mutation, innovations,
    fitnessList, currentGenerationNumber, assert;


speciation = require('./speciation.js');
mutation = require('./mutation.js');
innovations = require('./innovations.js');
assert = require('assert');

settings = require('./settings.js');
util = require('swirlnet.util');

// performs crossover and mutation of fittest members of species
reproduce = function (population) {

    "use strict";

    var j, offspring, offspringCounts, fittest, newGenome, fitness,
        nextNewGenomeID;

    assert(population !== undefined, "bad population: " + population);

    for (j = 0; j < settings.getSetting("populationSize"); j += 1) {
        fitness = getFitness(j);
        assert(typeof fitness === 'number' && !isNaN(fitness), "swirlnet: error: bad fitness for genomeID " + j + ": " + fitness + ". set the fitness of every genome before reproduction.");
    }

    nextNewGenomeID = 0;
    bumpCurrentGenerationNumber();
    offspring = [];

    fittest = getSurvivors(population);
    offspringCounts = chooseOffspringCounts(population);

    offspringCounts.forEach(function (offspringCount, species) {

        var i, index, parents, parent1, parent2, offset, speciesChampion, randNum;

        parents = speciation.filterGenomesBySpecies(fittest, species);

        offset = 0;
        for (i = 0; i < offspringCount; i += 1) {

            // copy unmodified champion of species with sufficiently large population
            // (mentioned in original NEAT paper)
            if (i === 0 && speciation.getSpeciesMemberCount(population, species) > settings.getSetting("championCloneThreshold")) {

                speciesChampion = parents[0].spawn(nextNewGenomeID, getCurrentGenerationNumber());
                offspring.push(speciesChampion);

                offset = -1;

            } else {

                index = (i + offset) % parents.length;
                parent1 = parents.slice(index, index + 1)[0];
                parent2 = parents[Math.floor(Math.random() * parents.length)];

                randNum = Math.random();

                if (randNum < settings.getSetting("asexualReproductionOnlyRate")) {

                    newGenome = parent1.spawn(nextNewGenomeID, getCurrentGenerationNumber());
                    mutation.randomlyMutate(newGenome, true);

                } else {

                    if (randNum >= 1 - settings.getSetting("interspeciesMatingRate")) {

                        parent2 = fittest[Math.floor(Math.random() * fittest.length)];
                    }

                    newGenome = crossoverGenomes(nextNewGenomeID, parent1, parent2, getFitness(parent1), getFitness(parent2));
                    mutation.randomlyMutate(newGenome);
                }

                offspring.push(newGenome);
            }
            nextNewGenomeID += 1;
        }
    });

    speciation.speciate(offspring);
    speciation.getNewSpeciesRepresentatives(offspring);

    resetFitnessList();
    innovations.resetInnovationHistory();
    speciation.updateCompatibilityThreshold();

    return offspring;
};

// creates new genome based on genes from parent genomes
crossoverGenomes = function (genomeID, genome1, genome2, fitness1, fitness2) {

    "use strict";

    var fitterGenome, otherGenome, intersecting,
        randomSelection, newGenome, newGene,
        geneIsEnabledInFitterGenome, geneIsEnabledInOtherGenome,
        randomNumber;

    fitterGenome = (fitness1 > fitness2) ? genome1 : genome2;
    otherGenome  = (fitness1 > fitness2) ? genome2 : genome1;

    if (fitness1 === fitness2) {

        randomSelection = (Math.random() < 0.5);

        fitterGenome = randomSelection ? genome2 : genome1;
        otherGenome  = randomSelection ? genome1 : genome2;
    }

    newGenome = fitterGenome.spawn(genomeID, getCurrentGenerationNumber());

    intersecting = innovations.intersectingInnovations(fitterGenome, otherGenome);

    intersecting.forEach(function (innovation) {

        randomSelection = (Math.random() < settings.getSetting("fitterGenomeInheritanceRate")) ? true : false;
        newGene = (randomSelection ? fitterGenome : otherGenome).getGeneCopy(innovation);

        // random disablement or enablement of connection gene if disabled in one parent
        // random re-enablement of connection gene if disabled in both parents
        if (newGene.getType() === "connection") {

            geneIsEnabledInFitterGenome = fitterGenome.getGeneCopy(innovation).isEnabled();
            geneIsEnabledInOtherGenome = otherGenome.getGeneCopy(innovation).isEnabled();

            randomNumber = Math.random();

            if (geneIsEnabledInFitterGenome && !geneIsEnabledInOtherGenome) {
                if (randomNumber < settings.getSetting("fitterGenomeEnablementOverrideRate")) {
                    newGene.enable();
                } else if (randomNumber >= 1 - settings.getSetting("weakerGenomeDisablementOverrideRate")) {
                    newGene.disable();
                }
            } else if (!geneIsEnabledInFitterGenome && geneIsEnabledInOtherGenome) {
                if (randomNumber < settings.getSetting("fitterGenomeDisablementOverrideRate")) {
                    newGene.disable();
                } else if (randomNumber >= 1 - settings.getSetting("weakerGenomeEnablementOverrideRate")) {
                    newGene.enable();
                }
            } else if (!geneIsEnabledInFitterGenome && !geneIsEnabledInOtherGenome) {
                if (randomNumber < settings.getSetting("neitherGenomeEnablementOverrideRate")) {
                    newGene.enable();
                }
            }
        }

        newGenome.overwriteGene(newGene);
    });

    return newGenome;
};

// finds the number of offspring each species will produce
chooseOffspringCounts = function (population) {

    "use strict";

    var speciesID, speciesScores, adjustedFitness, offspringCounts,
        previousRemainder, offspringCountSoFar,
        adjustedFitnessSum, speciesOffspringCount, offspringPercentage,
        diff, targetOffspringCount;

    speciesScores = [];

    assert(population !== undefined && population.length !== 0, "bad population: " + population);

    population.forEach(function (genome) {

        adjustedFitness
            = getFitness(genome.getGenomeID())
            / speciation.getSpeciesMemberCount(population, genome.getSpeciesID());

        speciesScores[genome.getSpeciesID()] = speciesScores[genome.getSpeciesID()] || 0;
        speciesScores[genome.getSpeciesID()] += adjustedFitness;
    });

    adjustedFitnessSum = speciesScores.reduce(function (a, b) {
        return (a + b);
    });

    if (adjustedFitnessSum !== 0) {
        offspringPercentage = speciesScores.map(function (x) {
            return x / adjustedFitnessSum;
        });
    } else {
        offspringPercentage = speciation.getSpeciesList(population).map(function (memberCount) {
            return memberCount / settings.getSetting("populationSize");
        });
    }

    offspringCounts = [];
    offspringCountSoFar = 0;
    previousRemainder = 0;

    targetOffspringCount = settings.getSetting("populationSize");

    for (speciesID = 0; speciesID < offspringPercentage.length; speciesID += 1) {

        if (offspringPercentage[speciesID] !== undefined) {

            speciesOffspringCount = offspringPercentage[speciesID] * targetOffspringCount + previousRemainder;

            offspringCounts[speciesID] = Math.floor(speciesOffspringCount);
            offspringCountSoFar += offspringCounts[speciesID];

            previousRemainder = speciesOffspringCount % 1;

            if (speciesID === offspringPercentage.length - 1
                    || offspringCountSoFar > targetOffspringCount) {

                diff = targetOffspringCount - offspringCountSoFar;

                offspringCountSoFar         += diff;
                offspringCounts[speciesID]  += diff;
            }
        }

    }

    return offspringCounts;
};

// gets the list of this generation's survivors who will reproduce
getSurvivors = function (population) {

    "use strict";

    var survivors, fittestMembers, speciesList;

    survivors = [];

    speciesList = speciation.getSpeciesList(population);

    speciesList.forEach(function (currentSpeciesCount, species) {

        var speciesMembers, survivorCount;

        survivorCount = Math.floor(currentSpeciesCount * settings.getSetting("survivalThreshold"));
        survivorCount = (survivorCount === 0 && currentSpeciesCount > 0) ? 1 : survivorCount;

        speciesMembers = speciation.filterGenomesBySpecies(population, species);

        speciesMembers.sort(function (genome1, genome2) {
            return getFitness(genome2.getGenomeID()) - getFitness(genome1.getGenomeID());
        });

        fittestMembers = speciesMembers.slice(0, survivorCount);

        survivors = survivors.concat(fittestMembers);
    });

    return survivors;
};

// sets the fitness of a particular genome
setFitness = function (genomeID, fitness) {

    "use strict";

    assert(typeof fitness === 'number' && !isNaN(fitness), "swirlnet: error: bad fitness: " + fitness);
    assert(fitness >= 0, "swirlnet: error: fitness must not be negative: " + fitness);

    fitnessList[genomeID] = fitness;
};

// gets the fitness of a particular genome
getFitness = function (genomeID) {

    "use strict";

    return fitnessList[genomeID];
};

// for resetting the fitness array at the start of a new generation
resetFitnessList = function () {

    "use strict";

    fitnessList = [];
};

// initializes some variables local to this file
init = function () {

    "use strict";

    currentGenerationNumber = 0;
    fitnessList = [];
};

// increases the current generation number
bumpCurrentGenerationNumber = function () {

    "use strict";

    currentGenerationNumber += 1;
};

// return the number of current generation (starts at 0).
getCurrentGenerationNumber = function () {

    "use strict";

    return currentGenerationNumber;
};

module.exports.reproduce = reproduce;
module.exports.setFitness = setFitness;
module.exports.getFitness = getFitness;

module.exports.init = init;

