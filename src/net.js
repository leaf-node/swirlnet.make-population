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
        that, inputs, state, nodeCount;

    // prepares new net object
    init = function () {

        phenotype = JSON.parse(unparsed_phenotype);
        flush();
        inputs = [];

        console.assert(phenotype.roles !== undefined
                && phenotype.roles.bias !== undefined && phenotype.roles.input !== undefined
                && phenotype.roles.output !== undefined && phenotype.roles.hidden !== undefined,
                    "swirlnet: internal error: 'roles' must contain bias, input, output and hidden members.");

        console.assert(phenotype.roles.output.length > 0,
                    "swirlnet: internal error: invalid number of output nodes: " + phenotype.roles.bias.length + " (should be greater than 0)");
        console.assert(phenotype.roles.bias.length === 1,
                    "swirlnet: internal error: invalid number of bias nodes: " + phenotype.roles.bias.length + " (should be 1)");
    };

    // sets state of every node to zero
    flush = function () {
        var node;

        state = [];
        for (node = 0; node < getNodeCount(); node += 1) {
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
        var i, node, func, target, weight, incoming;

        if (stepCount === undefined) {
            stepCount = 1;
        }

        console.assert(util.isInt(stepCount) && stepCount > 0,
                "swirlnet: error: invalid number of steps to take: " + stepCount);

        // applies bias
        node = phenotype.roles.bias[0];
        state[node] = phenotype.settings.biasValue;

        // applies inputs
        for (i = 0; i < inputs.length; i += 1) {
            node = phenotype.roles.input[i];
            state[node] = inputs[i];
        }

        // sets incoming activity array to zero for all nodes
        incoming = [];
        for (node = 0; node < getNodeCount(); node += 1) {
            incoming.push(0);
        }

        // calculates incoming activity for all nodes
        for (node = 0; node < getNodeCount(); node += 1) {

            for (target in phenotype.connections[node]) {
                if (phenotype.connections[node].hasOwnProperty(target)) {

                    weight = phenotype.connections[node][target];
                    incoming[target] += weight * state[node];
                }
            }
        }

        // calculates new state with activation functions and incoming activity
        for (func in phenotype.functions) {
            if (phenotype.functions.hasOwnProperty(func)) {

                for (i in phenotype.functions[func]) {
                    if (phenotype.functions[func].hasOwnProperty(i)) {

                        node = phenotype.functions[func][i];
                        state[node] = functions[func](incoming[node]);
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
        var i, node, outputs;

        outputs = [];
        for (i = 0; i < phenotype.roles.output.length; i += 1) {

            node = phenotype.roles.output[i];
            outputs.push(state[node]);
        }
        return outputs;
    };

    // dumps state of every node
    getNodeStates = function () {
        return util.copy(state);
    };

    // gets number of nodes in network
    getNodeCount = function () {

        var role;

        if (nodeCount === undefined) {
            nodeCount = 0;
            for (role in phenotype.roles) {
                if (phenotype.roles.hasOwnProperty(role)) {

                    nodeCount += phenotype.roles[role].length;
                }
            }
        }

        return nodeCount;
    };

    getGenomeID = function () {
        return phenotype.genomeID;
    };

    // node activation functions -- accurate versions
    accurateFunctions = {};
    accurateFunctions.sigmoid = function (x) {
        return 1 / (1 + Math.exp(-phenotype.settings.sigmoidSteepness * x));
    };

    // node activation functions
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
