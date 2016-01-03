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


var startNet;

// create a network object constructor.
// this is similar to crockford's function/closure pattern
// usage: "net = startNet(swirlNetJSON, settings)"
startNet = function (swirlNetJSON, settings) {

    "use strict";

    var setInputs, step, getOutputs,
        getCellStates, getCellCount,
        getGenomeID,
        init, initSettings, initNet, flush,
        functions, accurateFunctions,
        that, defaults, inputs, state,
        networkObj;

    // default settings
    defaults = {};
    defaults.bias = 1;
    defaults.sigmoidSteepness = 4.9;

    // prepares new net object
    init = function () {

        initSettings();
        initNet();
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

    // initializes network object
    initNet = function () {

        networkObj = JSON.parse(swirlNetJSON);
        flush();
        inputs = [];
    };

    // sets state of every cell to zero
    flush = function () {
        var cell;

        state = [];
        for (cell = 0; cell < getCellCount(); cell += 1) {
            state.push(0);
        }
    };

    // sets inputs
    setInputs = function (list) {
        inputs = list;
    };

    // steps neural state forward one tick
    step = function () {
        var i, cell, func, target, weight, incoming;

        // sets incoming activity array to zero for all cells
        incoming = [];
        for (cell = 0; cell < getCellCount(); cell += 1) {
            incoming.push(0);
        }

        // applies bias
        if (networkObj.roles.bias !== undefined) {
            incoming[networkObj.roles.bias[0]] = settings.bias;
        }

        // applies inputs
        for (i = 0; i < inputs.length; i += 1) {
            cell = networkObj.roles.input[i];
            incoming[cell] = inputs[i];
        }

        // calculates incoming activity
        for (cell = 0; cell < getCellCount(); cell += 1) {

            for (target in networkObj.connections[cell]) {
                if (networkObj.connections[cell].hasOwnProperty(target)) {

                    weight = networkObj.connections[cell][target];
                    incoming[target] += weight * state[cell];
                }
            }
        }

        // calculates new state with activation functions and incoming activity
        for (func in networkObj.functions) {
            if (networkObj.functions.hasOwnProperty(func)) {

                for (i in networkObj.functions[func]) {
                    if (networkObj.functions[func].hasOwnProperty(i)) {

                        cell = networkObj.functions[func][i];
                        state[cell] = functions[func](incoming[cell]);
                    }
                }
            }
        }
    };

    // fetches output values
    getOutputs = function () {
        var i, cell, outputs;

        outputs = [];
        for (i = 0; i < networkObj.roles.output.length; i += 1) {

            cell = networkObj.roles.output[i];
            outputs.push(state[cell]);
        }
        return outputs;
    };

    // dumps state of every cell
    getCellStates = function () {
        return state;
    };

    // gets number of cells in network
    getCellCount = function () {
        return networkObj.cellCount;
    };

    getGenomeID = function () {
        return networkObj.genomeID;
    };

    // cell activation functions -- accurate versions
    accurateFunctions = {};
    accurateFunctions.sigmoid = function (x) {
        return 1 / (1 + Math.exp(-settings.sigmoidSteepness * x));
    };
    accurateFunctions.linear = function (x) {
        return x;
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
    that.getCellCount = getCellCount;
    that.getCellStates = getCellStates;

    // returns hash table of public functions as new object ready for use
    return that;
};

// exports the startNet function for require()
exports.startNet = startNet;

