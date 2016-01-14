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

var genes, util, makeGenome, swirlGenomeJSONVersion;

genes = require('./genes.js');
util = require('../util.js');

swirlGenomeJSONVersion = "0.0";

// makes a new genome
makeGenome = function (genomeID, generationID, speciesHint) {

    "use strict";

    var that, speciesID, genesList,
        init, getGenomeID, getGenerationID, getSpeciesID, getSpeciesHint,
        getGeneInnovationNumbers, hasGene,
        getGene, getGeneSlot, getGeneCopy, setSpeciesID, addGene, overwriteGene,
        stringify, copy, copyHelper, spawn;

    console.assert(util.isInt(genomeID),
            "swirljs: internal error: invalid genomeID: " + genomeID);
    console.assert(util.isInt(generationID),
            "swirljs: internal error: invalid generationID: " + genomeID);
    console.assert(speciesHint === undefined || util.isInt(speciesHint),
            "swirljs: internal error: invalid speciesHint: " + speciesHint);

    init = function () {
        genesList = [];
        speciesID = undefined;
    };

    getGenomeID = function () {
        return genomeID;
    };

    getGenerationID = function () {
        return generationID;
    };

    getSpeciesID = function () {
        return speciesID;
    };

    setSpeciesID = function (newSpeciesID) {
        speciesID = newSpeciesID;
    };

    getSpeciesHint = function () {
        return speciesHint;
    };

    getGeneInnovationNumbers = function (type, subtype) {
        var gene, geneInnovationNumbers = [];

        console.assert(type === undefined || type === "node" || type === "connection",
                "swirljs: internal error: invalid gene type: " + type);

        console.assert(subtype === undefined || (type === "node"
                    && (subtype === "bias" || subtype === "input" || subtype === "hidden" || subtype === "output")),
                "swirljs: internal error: invalid gene subtype: " + subtype + " for type: " + type);

        Object.keys(genesList).sort(function (a, b) { return a - b; }).forEach(function (key) {
            var innovationNumber = parseInt(key, 10);
            if (type !== undefined || subtype !== undefined) {
                gene = getGene(innovationNumber);

                if (type !== undefined && type !== gene.getType()) { return; }
                if (subtype !== undefined && subtype !== gene.getSubtype()) { return; }
            }
            geneInnovationNumbers.push(innovationNumber);
        });
        return geneInnovationNumbers;
    };

    hasGene = function (innovationNumber) {
        var gene = getGeneSlot(innovationNumber);
        if (gene === undefined) {
            return false;
        }
        return true;
    };

    getGeneCopy = function (innovationNumber) {
        return getGene(innovationNumber).copy();
    };

    getGene = function (innovationNumber) {
        var gene = getGeneSlot(innovationNumber);
        console.assert(gene !== undefined,
                "swirljs: internal error: no gene with innovation number " + innovationNumber + " exists in its proper slot within this genome.");
        return gene;
    };

    getGeneSlot = function (innovationNumber) {
        var gene = genesList[innovationNumber];
        if (gene !== undefined) {
            console.assert(gene.getInnovationNumber() === innovationNumber,
                    "swirljs: internal error: mismatched gene innovation numbers: " + innovationNumber + " and " + gene.getInnovationNumber());
        }
        return gene;
    };

    addGene = function (gene) {
        var innovationNumber, originalGene;
        innovationNumber = gene.getInnovationNumber();
        originalGene = getGeneSlot(innovationNumber);
        if (originalGene !== undefined) {
            console.assert(false,
                    "swirljs: internal error: gene with innovation number " + innovationNumber + " (" + originalGene.getInnovationNumber() + ") already exists in this genome.");
        }
        overwriteGene(gene);
    };

    overwriteGene = function (gene) {
        var innovationNumber;
        innovationNumber = gene.getInnovationNumber();
        genesList[innovationNumber] = gene;
    };

    copy = function () {
        var newGenome;
        newGenome = copyHelper(getGenomeID(), getGenerationID(), getSpeciesHint());
        newGenome.setSpeciesID(getSpeciesID);
        return newGenome;
    };

    spawn = function (genomeID, generationID) {
        return copyHelper(genomeID, generationID, getSpeciesID());
    };

    copyHelper = function (genomeID, generationID, speciesHint) {
        var newGenome, innovationNumbers;
        newGenome = makeGenome(genomeID, generationID, speciesHint);
        innovationNumbers = getGeneInnovationNumbers();
        innovationNumbers.forEach(function (innovationNumber) {
            newGenome.addGene(getGeneCopy(innovationNumber));
        });
        return newGenome;
    };

    stringify = function () {

        var genomeObj = {};
        genomeObj.format = "swirlGenomeJSON";
        genomeObj.version = swirlGenomeJSONVersion;
        genomeObj.generation = getGenerationID();
        genomeObj.speciesID = getSpeciesID();
        genomeObj.genomeID = getGenomeID();
        genomeObj.genes = [];

        Object.keys(genesList).sort(function (a, b) { return a - b; }).forEach(function (key) {
            var gene, innovationNumber;
            innovationNumber = parseInt(key, 10);
            gene = getGene(innovationNumber);
            console.assert(gene.getInnovationNumber() === innovationNumber,
                    "swirljs: internal error: mismatched gene innovation numbers: " + innovationNumber + " and " + gene.getInnovationNumber());
            genomeObj.genes.push(JSON.parse(gene.stringify()));
        });

        return JSON.stringify(genomeObj);
    };

    init();

    that = {};

    that.getGenomeID = getGenomeID;
    that.getGenerationID = getGenerationID;
    that.getSpeciesID = getSpeciesID;
    that.getSpeciesHint = getSpeciesHint;

    that.setSpeciesID = setSpeciesID;

    that.getGeneInnovationNumbers = getGeneInnovationNumbers;
    that.hasGene = hasGene;
    that.getGene = getGene;
    that.getGeneCopy = getGeneCopy;

    that.addGene = addGene;
    that.overwriteGene = overwriteGene;

    that.copy = copy;
    that.spawn = spawn;
    that.stringify = stringify;

    return that;
};

module.exports.makeGenome = makeGenome;

