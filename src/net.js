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


var makeNet, util;

util = require('./util.js');

// create an artifical network based on internal phenotype format
makeNet = function (unparsed_phenotype) {

    "use strict";

    var setInputs, step, getOutputs,
        getNodeStates, getNodeCount,
        getGenomeID, phenotype,
        init, flush,
        functions, accurateFunctions,
        that, inputs, state;

    // prepares new net object
    init = function () {

        phenotype = JSON.parse(unparsed_phenotype);
        flush();
        inputs = [];

        console.assert(phenotype.roles.output.length > 0,
                    "swirlnet: internal error: invalid number of output nodes: " + phenotype.roles.bias.length + " (should be greater than 0)");
        console.assert(phenotype.roles.bias.length === 1,
                    "swirlnet: internal error: invalid number of bias nodes: " + phenotype.roles.bias.length + " (should be 1)");
    };

    // sets state of every cell to zero
    flush = function () {
        var cell;

        state = [];
        for (cell = 0; cell < getNodeCount(); cell += 1) {
            state.push(0);
        }
    };

    // sets inputs
    setInputs = function (list) {
        console.assert(list.length === phenotype.roles.input.length,
                "swirlnet: error: invalid number of inputs: " + list.length + " (should be " + phenotype.roles.input.length + ")");
        inputs = list;
    };

    // steps network forward by propagating signals to downstream nodes
    step = function (stepCount) {
        var i, cell, func, target, weight, incoming;

        if (stepCount === undefined) {
            stepCount = 1;
        }

        console.assert(util.isInt(stepCount) && stepCount > 0,
                "swirlnet: error: invalid number of steps to take: " + stepCount);

        // applies bias
        if (phenotype.roles.bias !== undefined) {
            cell = phenotype.roles.bias[0];
            state[cell] = phenotype.settings.biasValue;
        }

        // applies inputs
        for (i = 0; i < inputs.length; i += 1) {
            cell = phenotype.roles.input[i];
            state[cell] = inputs[i];
        }

        // sets incoming activity array to zero for all cells
        incoming = [];
        for (cell = 0; cell < getNodeCount(); cell += 1) {
            incoming.push(0);
        }

        // calculates incoming activity for all cells
        for (cell = 0; cell < getNodeCount(); cell += 1) {

            for (target in phenotype.connections[cell]) {
                if (phenotype.connections[cell].hasOwnProperty(target)) {

                    weight = phenotype.connections[cell][target];
                    incoming[target] += weight * state[cell];
                }
            }
        }

        // calculates new state with activation functions and incoming activity
        for (func in phenotype.functions) {
            if (phenotype.functions.hasOwnProperty(func)) {

                for (i in phenotype.functions[func]) {
                    if (phenotype.functions[func].hasOwnProperty(i)) {

                        cell = phenotype.functions[func][i];
                        state[cell] = functions[func](incoming[cell]);
                    }
                }
            }
        }

        // recurse if multiple steps were specified
        if (stepCount > 1) {
            step(stepCount - 1);
        }
    };

    // fetches output values
    getOutputs = function () {
        var i, cell, outputs;

        outputs = [];
        for (i = 0; i < phenotype.roles.output.length; i += 1) {

            cell = phenotype.roles.output[i];
            outputs.push(state[cell]);
        }
        return outputs;
    };

    // dumps state of every cell
    getNodeStates = function () {
        return util.copy(state);
    };

    // gets number of nodes in network
    getNodeCount = function () {
        return phenotype.cellCount;
    };

    getGenomeID = function () {
        return phenotype.genomeID;
    };

    // cell activation functions -- accurate versions
    accurateFunctions = {};
    accurateFunctions.sigmoid = function (x) {
        return 1 / (1 + Math.exp(-phenotype.settings.sigmoidSteepness * x));
    };

    // cell activation functions
    functions = accurateFunctions;

    // executes init of object
    init();

    // contains a listing of public functions
    that = {};
    that.step = step;
    that.flush = flush;
    that.setInputs = setInputs;
    that.getOutputs = getOutputs;
    that.getGenomeID = getGenomeID;
    that.getNodeCount = getNodeCount;
    that.getNodeStates = getNodeStates;

    // returns hash table of public functions as new object ready for use
    return that;
};

// exports the makeNet function for require()
exports.makeNet = makeNet;

