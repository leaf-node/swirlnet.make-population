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

var makeGenePool;

// creates a gene pool  reproduces based on fitness
makeGenePool = function (settings) {

    "use strict";

    var that, defaults,
        init, initSettings, initGenePool,
        inputCount, outputCount,
        fitnessList, currentGenerationNumber,
        innovationHistory,
        makeFirstGeneration, makeNewGenome, addIONode,
        setConnection, insertNewNode,
        pickInnovationNumber, perturbWeight, randomizeWeight,
        makeRandomWeight, setInputCount, setOutputCount,
        setFitness, getGenomes, getCurrentGenerationNumber,
        nextInnovationNumber, compareInnovations,
        compatibilityDistance, filterForGeneType,
        averageWeightDifference,
        countDisjointAndExcess,
        genomeMaxInnovationNumber,
        intersectingInnovations,
        nonMatchingInnovations,
        countGenes,
        setGene, getGene, getInnovationList, deleteGene,
        crossoverGenomes,
        pickUnconnectedNodes,
        makeSkeletonGenome,
        randomlyMutate,
        randomlyInsertNode,
        addRandomConnection,
        isConnected,
        chooseOffspringCounts,
        getSurvivors,
        speciate,
        getNewSpeciesRepresentatives,
        isInSameSpecies,
        pickNextNewSpeciesNumber,
        getGenomesInSpecies,
        getSpeciesMemberCount,
        getFitness,
        nextNewSpeciesNumber,
        representatives,
        currentCompatibilityThreshold,
        updateCompatibilityThreshold,
        getMaxSpeciesID,
        getSpeciesList,
        reproduce,
        nextNewGenomeID,
        bumpCurrentGenerationNumber,
        copyObj,
        genePool;


    // default settings
    defaults = {};
    defaults.populationSize                     = 100;

    defaults.survivalThreshold                  = 0.2;

    defaults.disjointCoefficient                = 1.0;
    defaults.excessCoefficient                  = 1.0;
    defaults.weightDifferenceCoefficient        = 0.4;

    defaults.compatibilityThreshold             = 3.0;
    defaults.compatibilityModifier              = 0.0;

    defaults.weightMutationRate                 = 0.8;
    defaults.weightPerturbanceRate              = 0.9;
    defaults.mutationPower                      = 2.5;

    defaults.addNodeMutationRate                = 0.03;
    defaults.addLinkMutationRate                = 0.05;

    defaults.fitterGenomeInheritanceRate        = 0.5;

    defaults.linearInputsFunction               = true;
    defaults.allowRecursionToInputs             = false;

    defaults.inheritRandomNonMatchingRate       = 0.25;


    // prepares new net object
    init = function () {

        initSettings();
    };

    // initializes settings
    initSettings = function () {

        settings = settings || {};

        Object.keys(settings).forEach(function (parameter) {
            console.assert(defaults[parameter] !== undefined, "bad settings parameter: " + parameter);
        });

        Object.keys(defaults).forEach(function (parameter) {
            settings[parameter] = settings[parameter] || defaults[parameter];
        });
    };

    // initializes gene pool and semi-global variables
    initGenePool = function () {

        fitnessList = [];
        representatives = [];
        innovationHistory = [];

        nextNewGenomeID = 0;
        nextInnovationNumber = 0;
        nextNewSpeciesNumber = 0;
        currentGenerationNumber = 0;

        currentCompatibilityThreshold = settings.compatibilityThreshold;


        makeFirstGeneration();
        speciate(genePool, representatives);
    };

    // performs crossover and mutation of fittest members of species
    reproduce = function () {

        var j, offspring, offspringCounts, fittest, newGenome, fitness;

        console.assert(genePool !== undefined, "bad genePool: " + genePool + ". First use .getGenomes()");

        for (j = 0; j < settings.populationSize; j += 1) {
            fitness = getFitness(j);
            console.assert(typeof fitness === 'number' && !isNaN(fitness), "bad fitness for genomeID " + j + ": " + fitness);
        }

        fittest = getSurvivors(genePool);
        bumpCurrentGenerationNumber();
        offspringCounts = chooseOffspringCounts(genePool);
        offspring = [];

        offspringCounts.forEach(function (offspringCount, species) {

            var i, index, parents, parent1, parent2, offset, speciesChampion;

            parents = getGenomesInSpecies(fittest, species);

            offset = 0;
            for (i = 0; i < offspringCount; i += 1) {

                // copy unmodified champion of species with population >= 5
                if (i === 0 && getSpeciesMemberCount(genePool, species) >= 5) {

                    speciesChampion = copyObj(parents[0]);
                    speciesChampion.generation = getCurrentGenerationNumber();
                    speciesChampion.genomeID = nextNewGenomeID;
                    nextNewGenomeID += 1;

                    offspring.push(speciesChampion);
                    offset = -1;

                } else {

                    index = (i + offset) % parents.length;
                    parent1 = parents.slice(index, index + 1)[0];
                    parent2 = parents[Math.floor(Math.random() * parents.length)];

                    newGenome = crossoverGenomes(parent1, parent2, getFitness(parent1), getFitness(parent2));
                    randomlyMutate(newGenome);
                    newGenome.speciesHint = parent1.speciesID;

                    offspring.push(newGenome);
                }
            }
        });

        speciate(offspring, representatives);
        representatives = getNewSpeciesRepresentatives(offspring);

        genePool = offspring;

        fitnessList = [];
        nextNewGenomeID = 0;
        innovationHistory = [];
        updateCompatibilityThreshold();
    };

    // makes first gene pool generation
    makeFirstGeneration = function () {

        var i;

        genePool = [];

        for (i = 0; i < settings.populationSize; i += 1) {

            genePool.push(makeNewGenome());
        }

        nextNewGenomeID = 0;
    };

    // make genome without any genes
    makeSkeletonGenome = function () {

        var genome;

        genome = {
            "format": "swirlGenomeJSON",
            "version": "0.0",
            "generation": 0,
            "speciesID": -1,
            "genomeID": nextNewGenomeID,
            "genes": []
        };

        nextNewGenomeID += 1;

        return genome;
    };

    // create basic genome without any connections
    makeNewGenome = function () {

        var i, genome, inputFunction, nodeID,
            biasInnovations, inputInnovations, outputInnovations;

        genome = makeSkeletonGenome();

        inputFunction = settings.linearInputsFunction ? "linear" : "sigmoid";

        nodeID = 0;
        addIONode(genome, "bias", nodeID, inputFunction);

        for (i = 0; i < inputCount; i += 1) {

            nodeID = i + 1;
            addIONode(genome, "input", nodeID, inputFunction);
        }

        for (i = 0; i < outputCount; i += 1) {

            nodeID = i + inputCount + 1;
            addIONode(genome, "output", nodeID, "sigmoid");
        }

        biasInnovations = filterForGeneType(genome, "node", "bias");
        inputInnovations = filterForGeneType(genome, "node", "input");
        outputInnovations = filterForGeneType(genome, "node", "output");

        outputInnovations.forEach(function (outputInnov) {

            biasInnovations.forEach(function (biasInnov) {

                setConnection(genome, biasInnov, outputInnov, makeRandomWeight());
            });
            inputInnovations.forEach(function (inputInnov) {

                setConnection(genome, inputInnov, outputInnov, makeRandomWeight());
            });
        });
        return genome;
    };

    // adds a bias, input or output node gene to a genome
    addIONode = function (genome, nodeType, nodeID, activationFunction) {

        var innovation;

        innovation = pickInnovationNumber(["node", nodeType, activationFunction, nodeID]);
        setGene(genome, [innovation, "node", nodeType, activationFunction]);
    };

    // filters for gene type, such as "node"/"output" or "connection"
    // returns list of genes
    filterForGeneType = function (genome, type, subtype) {

        var filteredgenes, innovationList;

        filteredgenes = [];

        innovationList = getInnovationList(genome);

        innovationList.forEach(function (innovation) {

            var gene = getGene(genome, innovation);

            if (gene[1] === type && (subtype === undefined || subtype === gene[2])) {
                filteredgenes.push(innovation);
            }
        });
        return filteredgenes;
    };

    // adds connection between two nodes in bare genome
    setConnection = function (genome, upstream, downstream, weight) {

        var innovation;

        console.assert(typeof upstream === 'number' && !isNaN(upstream), "upstream: " + upstream);
        console.assert(typeof downstream === 'number' && !isNaN(downstream), "downstream: " + downstream);
        console.assert(typeof weight === 'number' && !isNaN(weight), "weight: " + weight);

        innovation = pickInnovationNumber(["connection", upstream, downstream]);

        setGene(genome, [innovation, "connection", true, upstream, downstream, weight]);
    };

    // replaces connection with a node and two connections
    insertNewNode = function (genome, upstream, downstream) {

        var i, gene, weight, innovation, nodeInnovation, connections;

        console.assert(typeof upstream === 'number' && !isNaN(upstream), "upstream: " + upstream);
        console.assert(typeof downstream === 'number' && !isNaN(downstream), "downstream: " + downstream);

        connections = filterForGeneType(genome, "connection");

        // in case no connection was between upstream and downstream
        weight = 0;

        for (i = 0; i < connections.length; i += 1) {

            innovation = connections[i];

            gene = getGene(genome, innovation);

            if (gene[3] === upstream && gene[4] === downstream) {

                // disable prior connection gene
                gene[2] = false;
                weight = gene[5];

                break;
            }
        }

        nodeInnovation = pickInnovationNumber(["node", "hidden", "sigmoid", upstream, downstream]);
        setGene(genome, [nodeInnovation, "node", "hidden", "sigmoid"]);

        setConnection(genome, upstream, nodeInnovation, 1);
        setConnection(genome, nodeInnovation, downstream, weight);
    };

    // sets the innovation number of a new gene.
    // if the pattern is created previously in this generation,
    // the same innovation number is used.
    pickInnovationNumber = function (innovation) {

        var i, innovationNumber, oldInnovation, oldInnovationNumber;

        for (i = 0; i < innovationHistory.length; i += 1) {
            oldInnovationNumber = innovationHistory[i][0];
            oldInnovation = innovationHistory[i][1];

            if (compareInnovations(innovation, oldInnovation)) {
                return oldInnovationNumber;
            }
        }

        innovationNumber = nextInnovationNumber;
        nextInnovationNumber += 1;

        innovationHistory.push([innovationNumber, innovation]);

        return innovationNumber;
    };

    // returns true if partial representations of innovations are equal
    // (weight and disablement status must not be included in this representation)
    compareInnovations = function (innovation1, innovation2) {

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

    // returns the species closeness of two genomes
    compatibilityDistance = function (genome1, genome2) {

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
            = settings.disjointCoefficient * excessCount / maxGeneCount
            + settings.excessCoefficient * disjointCount / maxGeneCount
            + settings.weightDifferenceCoefficient * avgWeightDifference;

        return compatDistance;
    };

    // counts the number of genes in a genome
    countGenes = function (genome) {

        return getInnovationList(genome).length;
    };

    // returns the average of the abs() of weight difference between matching gene connections
    averageWeightDifference = function (genome1, genome2) {

        var weightDiffList, avgWeightDifference, intersection;

        intersection = intersectingInnovations(genome1, genome2);

        weightDiffList = [];

        intersection.forEach(function (innovation) {

            var gene1, gene2, weightDiff;

            gene1 = getGene(genome1, innovation);
            gene2 = getGene(genome2, innovation);

            if (gene1[1] === "connection") {
                weightDiff = Math.abs(gene1[5] - gene2[5]);
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

        nonMatchingInnovMatrix = nonMatchingInnovations(genome1, genome2);

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

        return getInnovationList(genome).slice(-1)[0];
    };

    // returns a list of both genomes (minus metadata),
    // with genes with non-matching innovation numbers filtered out.
    intersectingInnovations = function (genome1, genome2) {

        var intersection, innovations1;

        intersection = [];
        innovations1 = getInnovationList(genome1);

        innovations1.forEach(function (innovation) {

            if (getGene(genome2, innovation) !== undefined) {
                intersection.push(innovation);
            }
        });
        return intersection;
    };

    // returns list of both lists (minus metadata),
    // with genes with matching innovtion numbers removed
    nonMatchingInnovations = function (genome1, genome2) {

        var nonMatching, innovationList1, innovationList2;

        nonMatching = [[], []];

        innovationList1 = getInnovationList(genome1);
        innovationList2 = getInnovationList(genome2);

        innovationList1.forEach(function (innovationNumber) {
            if (getGene(genome2, innovationNumber) === undefined) {
                nonMatching[0].push(innovationNumber);
            }
        });

        innovationList2.forEach(function (innovationNumber) {
            if (getGene(genome1, innovationNumber) === undefined) {
                nonMatching[1].push(innovationNumber);
            }
        });

        return nonMatching;
    };

    // randomly mutates a genome
    randomlyMutate = function (genome) {

        var connections;

        if (Math.random() < settings.weightMutationRate) {

            connections = filterForGeneType(genome, "connection");

            connections.forEach(function (connection) {

                if (Math.random() < settings.weightPerturbanceRate) {

                    perturbWeight(getGene(genome, connection));

                } else {

                    randomizeWeight(getGene(genome, connection));
                }
            });
        }

        if (Math.random() < settings.addNodeMutationRate) {

            randomlyInsertNode(genome);
        }

        if (Math.random() < settings.addLinkMutationRate) {

            addRandomConnection(genome);
        }
    };

    // inserts a new nodes in a random location
    randomlyInsertNode = function (genome) {

        var connections, gene, upstream, downstream, randomSelection;

        connections = filterForGeneType(genome, "connection");

        randomSelection = Math.floor(Math.random() * connections.length);
        gene = getGene(genome, connections[randomSelection]);

        upstream = gene[3];
        downstream = gene[4];

        insertNewNode(genome, upstream, downstream);

    };

    // adds a connection between two random unconnected nodes
    // and gives them a random weight. connection may be recursive
    addRandomConnection = function (genome) {

        var nodesToConnect, upstream, downstream;

        nodesToConnect = pickUnconnectedNodes(genome);

        upstream = nodesToConnect[0];
        downstream = nodesToConnect[1];

        setConnection(genome, upstream, downstream, makeRandomWeight());

    };

    // returns a random pair of unconnected nodes
    // (the pair may already be connected in the other direction.)
    pickUnconnectedNodes = function (genome) {

        var bias, input, hidden, output,
            upstream, downstream, unconnected, randomSelection;

        bias = filterForGeneType(genome, "node", "bias");
        input = filterForGeneType(genome, "node", "input");
        hidden = filterForGeneType(genome, "node", "hidden");
        output = filterForGeneType(genome, "node", "output");

        upstream    = [].concat(bias).concat(input).concat(hidden).concat(output);
        downstream  = [].concat(hidden).concat(output);

        if (settings.allowRecursionToInputs) {
            downstream = downstream.concat(input);
        }

        unconnected = [];

        upstream.forEach(function (upInnov) {
            downstream.forEach(function (downInnov) {

                if (!isConnected(genome, upInnov, downInnov)) {
                    unconnected.push([upInnov, downInnov]);
                }
            });
        });

        randomSelection = Math.floor(Math.random() * unconnected.length);

        return unconnected[randomSelection];
    };

    // returns true if the upstream node has a downstream connection to the other node
    isConnected = function (genome, upstream, downstream) {

        var i, connection, connections;

        connections = filterForGeneType(genome, "connection");

        for (i = 0; i < connections.length; i += 1) {

            connection = connections[i];

            if (upstream === connection[3] && downstream === connection[4]) {

                return true;
            }
        }

        return false;
    };

    // creates new genome based on genes from parent genomes
    crossoverGenomes = function (genome1, genome2, fitness1, fitness2) {

        var fitterGenome, otherGenome, intersecting, nonMatchingMatrix,
            randomSelection, newGenome, newGene;

        newGenome = makeSkeletonGenome();
        newGenome.generation = getCurrentGenerationNumber();

        fitterGenome = (fitness1 > fitness2) ? genome1 : genome2;
        otherGenome  = (fitness1 > fitness2) ? genome2 : genome1;

        if (fitness1 === fitness2) {

            fitterGenome = (Math.random() < 0.5) ? genome2 : genome1;
            otherGenome  = (Math.random() < 0.5) ? genome1 : genome2;
        }

        intersecting = intersectingInnovations(fitterGenome, otherGenome);
        nonMatchingMatrix = nonMatchingInnovations(fitterGenome, otherGenome);

        intersecting.forEach(function (innovation) {

            randomSelection = (Math.random() < settings.fitterGenomeInheritanceRate) ? true : false;
            newGene = copyObj(getGene((randomSelection ? fitterGenome : otherGenome), innovation));

            setGene(newGenome, newGene);

            newGene[2] = getGene(fitterGenome, innovation)[2];
        });

        nonMatchingMatrix[0].forEach(function (innovation) {
            setGene(newGenome, copyObj(getGene(fitterGenome, innovation)));
        });

        return newGenome;
    };

    // finds the number of offspring each species will produce
    chooseOffspringCounts = function (genePool) {

        var i, speciesScores, adjustedFitness, offspringCounts,
            previousRemainder, offspringCountSoFar,
            adjustedFitnessSum, speciesOffspringCount, offspringPercentage,
            diff, targetOffspringCount;

        speciesScores = [];

        console.assert(genePool !== undefined && genePool.length !== 0, "bad genePool: " + genePool);

        genePool.forEach(function (genome) {

            adjustedFitness
                = getFitness(genome.genomeID)
                / getSpeciesMemberCount(genePool, genome.speciesID);

            speciesScores[genome.speciesID] = speciesScores[genome.speciesID] || 0;
            speciesScores[genome.speciesID] += adjustedFitness;
        });

        adjustedFitnessSum = speciesScores.reduce(function (a, b) {
            return (a + b);
        });

        offspringPercentage = speciesScores.map(function (x) {
            return x / adjustedFitnessSum;
        });

        offspringCounts = [];
        offspringCountSoFar = 0;
        previousRemainder = 0;

        targetOffspringCount = settings.populationSize;

        for (i = 0; i < offspringPercentage.length; i += 1) {

            if (offspringPercentage[i] !== undefined) {

                speciesOffspringCount = offspringPercentage[i] * targetOffspringCount + previousRemainder;

                offspringCounts[i] = Math.floor(speciesOffspringCount);
                offspringCountSoFar += offspringCounts[i];

                previousRemainder = speciesOffspringCount % 1;

                if (i === offspringPercentage.length - 1
                        || offspringCountSoFar > targetOffspringCount) {

                    diff = targetOffspringCount - offspringCountSoFar;

                    offspringCountSoFar += diff;
                    offspringCounts[i]  += diff;
                }
            }

        }

        return offspringCounts;
    };

    // gets the list of this generation's survivors who will reproduce
    getSurvivors = function (genePool) {

        var survivors, fittestMembers, speciesList;

        survivors = [];

        speciesList = getSpeciesList(genePool);

        speciesList.forEach(function (currentSpeciesCount, species) {

            var speciesMembers, survivorCount;

            survivorCount = Math.floor(currentSpeciesCount * settings.survivalThreshold);
            survivorCount = (survivorCount === 0 && currentSpeciesCount > 0) ? 1 : survivorCount;

            speciesMembers = getGenomesInSpecies(genePool, species);

            speciesMembers.sort(function (genome1, genome2) {
                return getFitness(genome2.genomeID) - getFitness(genome1.genomeID);
            });

            fittestMembers = speciesMembers.slice(0, survivorCount);

            survivors = survivors.concat(fittestMembers);
        });

        return survivors;
    };

    // group genomes into species based on their compatibility distance
    speciate = function (genePool, representatives) {

        genePool.forEach(function (genome) {

            var species, speciesHint, representative;

            speciesHint = genome.speciesHint;
            delete genome.speciesHint;

            if (speciesHint !== undefined) {
                representative = representatives[speciesHint];

                if (isInSameSpecies(genome, representative)) {
                    genome.speciesID = speciesHint;
                    return;
                }
            }

            for (species = 0; species < representatives.length; species += 1) {

                representative = representatives[species];
                if (representative !== undefined) {

                    if (isInSameSpecies(genome, representative)) {
                        genome.speciesID = species;
                        return;
                    }
                }
            }

            genome.speciesID = pickNextNewSpeciesNumber();
            representatives[genome.speciesID] = genome;
        });
    };

    // sets new random representatives for each species
    getNewSpeciesRepresentatives = function (genePool) {

        var newRepresentatives, maxSpeciesID, species,
            similarGenomes, randomSelection;

        newRepresentatives = [];
        maxSpeciesID = getMaxSpeciesID(genePool);

        for (species = 0; species <= maxSpeciesID; species += 1) {

            similarGenomes = getGenomesInSpecies(genePool, species);

            if (similarGenomes.length !== 0) {
                randomSelection = Math.floor(Math.random() * similarGenomes.length);

                newRepresentatives[species] = similarGenomes[randomSelection];
            }
        }
        return newRepresentatives;
    };

    // returns true if two genomes should be in the same species
    isInSameSpecies = function (genome1, genome2) {

        console.assert(genome1 !== undefined, "bad genome: " + genome1);
        console.assert(genome2 !== undefined, "bad genome: " + genome2);

        if (compatibilityDistance(genome1, genome2) < currentCompatibilityThreshold) {
            return true;
        }
        return false;
    };

    // picks new species numbers for genomes that are starting new species
    pickNextNewSpeciesNumber = function () {

        var speciesNumber;

        speciesNumber = nextNewSpeciesNumber;
        nextNewSpeciesNumber += 1;

        return speciesNumber;
    };

    // returns a list of all genomes in a species
    getGenomesInSpecies = function (genePool, species) {

        var genomes;

        genomes = [];

        genePool.forEach(function (genome) {

            if (genome.speciesID === species) {

                genomes.push(genome);
            }
        });

        return genomes;
    };

    // returns a list of counts of genomes per species
    getSpeciesList = function (genePool) {

        var speciesList;

        speciesList = [];

        genePool.forEach(function (genome) {

            var species;

            species = genome.speciesID;

            speciesList[species] = speciesList[species] || 0;
            speciesList[species] += 1;
        });

        return speciesList;
    };

    // returns the number of genomes in a particular species
    getSpeciesMemberCount = function (genePool, species) {

        var memberCount;

        memberCount = getGenomesInSpecies(genePool, species).length;

        return memberCount;
    };

    // returns the maximum species number
    getMaxSpeciesID = function (genePool) {

        var maxSpeciesID;

        maxSpeciesID = -1;

        genePool.forEach(function (genome) {

            if (genome.speciesID > maxSpeciesID) {

                maxSpeciesID = genome.speciesID;
            }
        });

        return maxSpeciesID;

    };

    // upticks the compatibility threshold, if set to do so
    updateCompatibilityThreshold = function () {

        currentCompatibilityThreshold += settings.compatibilityModifier;
    };

    // returns list of innovations used in genome
    getInnovationList = function (genome) {

        var innovationList = [];

        genome.genes.forEach(function (gene) {
            innovationList.push(gene[0]);
        });

        return innovationList.sort();
    };

    // returns gene from genome, according to innovation number
    getGene = function (genome, innovationNumber) {

        var i, gene;

        for (i = 0; i < genome.genes.length; i += 1) {

            gene = genome.genes[i];

            if (gene[0] === innovationNumber) {

                return gene;
            }
        }

        return undefined;
    };

    // sets the specified gene according to innovation number
    // first deletes any gene with the same innovation number
    setGene = function (genome, gene) {

        var innovationNumber, activationFunction,
            type, subtype, enabled, upstream, downstream, weight;

        innovationNumber = gene[0];
        type = gene[1];

        console.assert(typeof innovationNumber === 'number' && !isNaN(innovationNumber), "innovationNumber: " + innovationNumber);
        console.assert(type === "connection" || type === "node", "unknown genetype: " + type);

        if (type === "connection") {

            enabled = gene[2];
            upstream = gene[3];
            downstream = gene[4];
            weight = gene[5];

            console.assert(typeof enabled === 'boolean', "enabled: " + enabled);
            console.assert(typeof upstream === 'number' && !isNaN(upstream), "upstream: " + upstream);
            console.assert(typeof downstream === 'number' && !isNaN(downstream), "downstream: " + downstream);
            console.assert(typeof weight === 'number' && !isNaN(weight), "weight: " + weight);

        } else {

            subtype = gene[2];
            activationFunction = gene[3];

            console.assert(typeof subtype === "string", "subtype: " + subtype);
            console.assert(typeof activationFunction === 'string', "activationFunction: " + activationFunction);
        }

        deleteGene(genome, innovationNumber);

        genome.genes.push(gene);
    };

    // deletes gene w/ innovation number from genome
    deleteGene = function (genome, innovationNumber) {

        var i, gene;

        for (i = 0; i < genome.genes.length; i += 1) {

            gene = genome.genes[i];

            if (gene[0] === innovationNumber) {

                genome.genes.splice(i, 1);
                return;
            }
        }
    };

    // adds to connection weight
    perturbWeight = function (connection) {

        connection[5] += makeRandomWeight();
    };

    // randomizes connection weight
    randomizeWeight = function (connection) {

        connection[5] = makeRandomWeight();
    };

    // makes a random weight for new connections
    makeRandomWeight = function () {

        var min, max;

        max = settings.mutationPower;
        min = -max;

        return (max - min) * Math.random() + min;
    };

    // copies object (doesn't include functions, isn't recusion safe, etc.)
    copyObj = function (object) {

        return JSON.parse(JSON.stringify(object));
    };

    // sets the number of inputs
    setInputCount = function (x) {

        console.assert(typeof x === 'number' && !isNaN(x), "bad input count: " + x);

        inputCount = x;
    };

    // sets number of outputs
    setOutputCount = function (x) {

        console.assert(typeof x === 'number' && !isNaN(x), "bad output count: " + x);

        outputCount = x;
    };

    // sets the fitness of a particular genome
    setFitness = function (genomeID, fitness) {

        console.assert(typeof fitness === 'number' && !isNaN(fitness), "bad fitness: " + fitness);

        fitnessList[genomeID] = fitness;
    };

    // gets the fitness of a particular genome
    getFitness = function (genomeID) {

        return fitnessList[genomeID];
    };

    // returns the genomes of current generation
    getGenomes = function () {

        var jsonGenomes;

        if (inputCount === undefined || outputCount === undefined) {
            throw new Error('swirljs makeGenePool error: you must setInputCount() and setOutputCount() before generating genomes.');
        }
        if (genePool === undefined) {
            initGenePool();
        }

        jsonGenomes = [];
        genePool.forEach(function (genome) {
            jsonGenomes.push(JSON.stringify(genome));
        });

        return jsonGenomes;
    };

    // increases the current generation number
    bumpCurrentGenerationNumber = function () {

        currentGenerationNumber += 1;
    };

    // return the number of current generation (starts at 0).
    getCurrentGenerationNumber = function () {

        return currentGenerationNumber;
    };

    init();

    // public functions
    that = {};
    that.reproduce = reproduce;
    that.setFitness = setFitness;
    that.getGenomes = getGenomes;
    that.setInputCount = setInputCount;
    that.setOutputCount = setOutputCount;
    that.getCurrentGenerationNumber = getCurrentGenerationNumber;

    return that;
};

module.exports.makeGenePool = makeGenePool;


