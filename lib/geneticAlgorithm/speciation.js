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

var currentCompatibilityThreshold, speciesRepresentatives,
    nextNewSpeciesNumber,
    speciate, compatibilityDistance, getNewSpeciesRepresentatives,
    isInSameSpecies, pickNextNewSpeciesNumber, init,
    getGenomesInSpecies, genomeMaxInnovationNumber,
    getSpeciesList,
    getSpeciesMemberCount,
    getMaxSpeciesID,
    countGenes,
    averageWeightDifference,
    updateCompatibilityThreshold,
    getCompatibilityThreshold,
    countDisjointAndExcess,
    innovations,
    settings;

innovations = require('./innovations.js');

settings = require('./settings.js');

// group genomes into species based on their compatibility distance
speciate = function (population) {

    "use strict";

    population.forEach(function (genome) {

        var species, speciesHint, representative;

        speciesHint = genome.getSpeciesHint();

        if (speciesHint !== undefined) {
            representative = speciesRepresentatives[speciesHint];

            if (isInSameSpecies(genome, representative)) {
                genome.setSpeciesID(speciesHint);
                return;
            }
        }

        for (species = 0; species < speciesRepresentatives.length; species += 1) {

            representative = speciesRepresentatives[species];
            if (representative !== undefined) {

                if (isInSameSpecies(genome, representative)) {
                    genome.setSpeciesID(species);
                    return;
                }
            }
        }

        genome.setSpeciesID(pickNextNewSpeciesNumber());
        speciesRepresentatives[genome.getSpeciesID()] = genome;
    });
};

// returns the species closeness of two genomes
compatibilityDistance = function (genome1, genome2) {

    "use strict";

    var excessCount, disjointCount,
        maxGeneCount, avgWeightDifference,
        compatDistance, disjointAndExcessCount;

    console.assert(genome1 !== undefined, "genome1: " + genome1);
    console.assert(genome2 !== undefined, "genome2: " + genome2);

    disjointAndExcessCount = countDisjointAndExcess(genome1, genome2);

    disjointCount   = disjointAndExcessCount[0];
    excessCount     = disjointAndExcessCount[1];

    avgWeightDifference = averageWeightDifference(genome1, genome2);

    maxGeneCount = Math.max(countGenes(genome1), countGenes(genome2));

    compatDistance
        = settings.getSetting("disjointCoefficient") * excessCount / maxGeneCount
        + settings.getSetting("excessCoefficient") * disjointCount / maxGeneCount
        + settings.getSetting("weightDifferenceCoefficient") * avgWeightDifference;

    return compatDistance;
};

// counts the number of genes in a genome
countGenes = function (genome) {

    "use strict";

    return genome.getGeneInnovationNumbers().length;
};

// returns the average of the abs() of weight difference between matching gene connections
averageWeightDifference = function (genome1, genome2) {

    "use strict";

    var weightDiffList, avgWeightDifference, intersection;

    intersection = innovations.intersectingInnovations(genome1, genome2);

    weightDiffList = [];

    intersection.forEach(function (innovation) {

        var gene1, gene2, weightDiff;

        gene1 = genome1.getGene(innovation);
        gene2 = genome2.getGene(innovation);

        if (gene1.getType() === "connection") {
            weightDiff = Math.abs(gene1.getWeight() - gene2.getWeight());
            weightDiffList.push(weightDiff);
        }
    });

    avgWeightDifference
        = weightDiffList.reduce(function (sum, value) { return sum + value; }, 0)
        / weightDiffList.length;

    return avgWeightDifference;
};

// retuns list with number of disjoint and excess genes
countDisjointAndExcess = function (genome1, genome2) {

    "use strict";

    var excessCount, disjointCount,
        lesserMaxInnovationNumber, nonMatchingInnovMatrix;

    console.assert(genome1 !== undefined, "genome1: " + genome1);
    console.assert(genome2 !== undefined, "genome2: " + genome2);

    excessCount = 0;
    disjointCount = 0;

    lesserMaxInnovationNumber = Math.min(
        genomeMaxInnovationNumber(genome1),
        genomeMaxInnovationNumber(genome2)
    );

    nonMatchingInnovMatrix = innovations.nonMatchingInnovations(genome1, genome2);

    nonMatchingInnovMatrix.forEach(function (nonMatchingInnovs) {
        nonMatchingInnovs.forEach(function (innovation) {

            if (innovation > lesserMaxInnovationNumber) {
                excessCount += 1;
            } else {
                disjointCount += 1;
            }
        });
    });

    return [disjointCount, excessCount];
};

// returns the maximum innovation number used in a genome
genomeMaxInnovationNumber = function (genome) {

    "use strict";

    return genome.getGeneInnovationNumbers().slice(-1)[0];
};

// sets new random representatives for each species
getNewSpeciesRepresentatives = function (population) {

    "use strict";

    var newRepresentatives, maxSpeciesID, species,
        similarGenomes, randomSelection;

    newRepresentatives = [];
    maxSpeciesID = getMaxSpeciesID(population);

    for (species = 0; species <= maxSpeciesID; species += 1) {

        similarGenomes = getGenomesInSpecies(population, species);

        if (similarGenomes.length !== 0) {
            randomSelection = Math.floor(Math.random() * similarGenomes.length);

            newRepresentatives[species] = similarGenomes[randomSelection];
        }
    }
    speciesRepresentatives = newRepresentatives;
};

// returns true if two genomes should be in the same species
isInSameSpecies = function (genome1, genome2) {

    "use strict";

    console.assert(genome1 !== undefined, "bad genome: " + genome1);
    console.assert(genome2 !== undefined, "bad genome: " + genome2);

    if (compatibilityDistance(genome1, genome2) < getCompatibilityThreshold()) {
        return true;
    }
    return false;
};

// picks new species numbers for genomes that are starting new species
pickNextNewSpeciesNumber = function () {

    "use strict";

    var speciesNumber;

    speciesNumber = nextNewSpeciesNumber;
    nextNewSpeciesNumber += 1;

    return speciesNumber;
};

// returns a list of all genomes in a species
getGenomesInSpecies = function (population, species) {

    "use strict";

    var genomes;

    genomes = [];

    population.forEach(function (genome) {

        if (genome.getSpeciesID() === species) {

            genomes.push(genome);
        }
    });

    return genomes;
};

// returns a list of counts of genomes per species
getSpeciesList = function (population) {

    "use strict";

    var speciesList;

    speciesList = [];

    population.forEach(function (genome) {

        var species;

        species = genome.getSpeciesID();

        speciesList[species] = speciesList[species] || 0;
        speciesList[species] += 1;
    });

    return speciesList;
};

// returns the number of genomes in a particular species
getSpeciesMemberCount = function (population, species) {

    "use strict";

    var memberCount;

    memberCount = getGenomesInSpecies(population, species).length;

    return memberCount;
};

// returns the maximum species number
getMaxSpeciesID = function (population) {

    "use strict";

    var maxSpeciesID;

    maxSpeciesID = -1;

    population.forEach(function (genome) {

        if (genome.getSpeciesID() > maxSpeciesID) {

            maxSpeciesID = genome.getSpeciesID();
        }
    });

    return maxSpeciesID;

};

// upticks the compatibility threshold, if set to do so
updateCompatibilityThreshold = function () {

    "use strict";

    currentCompatibilityThreshold += settings.getSetting("compatibilityModifier");
};

// returns the current compatibility threshold
getCompatibilityThreshold = function () {

    "use strict";

    return currentCompatibilityThreshold;
};

// initializes semi-global variables used in this file
init = function () {

    "use strict";

    nextNewSpeciesNumber = 0;
    currentCompatibilityThreshold = settings.getSetting("compatibilityThreshold");
    speciesRepresentatives = [];
};


module.exports.init = init;
module.exports.speciate = speciate;
module.exports.getSpeciesList = getSpeciesList;
module.exports.getSpeciesMemberCount = getSpeciesMemberCount;
module.exports.getGenomesInSpecies = getGenomesInSpecies;
module.exports.getNewSpeciesRepresentatives = getNewSpeciesRepresentatives;
module.exports.updateCompatibilityThreshold = updateCompatibilityThreshold;

