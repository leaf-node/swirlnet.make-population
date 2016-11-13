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

var makeSuperGene, makeNodeGene, makeConnectionGene,
    makeNodeGeneHelper, makeConnectionGeneHelper,
    innovations, util, assert;

innovations = require('./innovations.js');
util = require('swirlnet.util');

assert = require('assert');

// makes a node gene
// position refers to the eventual position of an input or output node in the input or output array.
// upstream and downstream refer to the nodes a hidden node will sit between, for the sake of picking an innovation number.
makeNodeGene = function (subtype, activationFunction, position, upstream, downstream) {

    "use strict";

    var innovationNumber;

    assert(((subtype === "bias" || subtype === "input" || subtype === "output")
                && upstream === undefined && downstream === undefined)
            || (subtype === "hidden" && util.isInt(upstream) && util.isInt(downstream)),
            "swirlnet: internal error: invalid node gene upstream node: " + upstream +
            " and downstream node: " + downstream + " for node subtype: " + subtype);

    innovationNumber = innovations.pickInnovationNumber(["node", subtype, activationFunction, position, upstream, downstream]);

    return makeNodeGeneHelper(innovationNumber, subtype, activationFunction, position);
};

// makes a connection gene
makeConnectionGene = function (upstream, downstream, weight) {

    "use strict";

    var innovationNumber = innovations.pickInnovationNumber(["connection", upstream, downstream]);

    return makeConnectionGeneHelper(innovationNumber, upstream, downstream, weight);
};

// the reason for separating out the "helper" function factories is so that
// gene copies contain the same innovation number as the one in the original
// gene, whereas the creation of new genes should not require a new innovation
// number as input. the non-helper factory function handles picking the correct
// number.

// used in making a node gene
makeNodeGeneHelper = function (innovationNumber, subtype, activationFunction, position) {

    "use strict";

    var superThat, that,
        getSubtype, getActivationFunction,
        getPosition,
        copy, stringify;

    assert(subtype === "bias" || subtype === "input" || subtype === "output" || subtype === "hidden",
            "swirlnet: internal error: invalid node gene subtype: " + subtype);
    assert(typeof activationFunction === "string" || activationFunction === null,
            "swirlnet: internal error: invalid node gene activation function: " + activationFunction);
    assert(((subtype === "bias" || subtype === "hidden") && position === undefined)
            || ((subtype === "input" || subtype === "output") && util.isInt(position)),
            "swirlnet: internal error: invalid node gene position: " + position + " for node subtype: " + subtype);

    superThat = makeSuperGene(innovationNumber, "node");

    getSubtype = function () {
        return subtype;
    };

    getActivationFunction = function () {
        return activationFunction;
    };

    getPosition = function () {
        return position;
    };


    copy = function () {
        return makeNodeGeneHelper(innovationNumber, subtype, activationFunction, position);
    };

    stringify = function () {
        var listForm = [
            superThat.getInnovationNumber(),
            superThat.getType(),
            getSubtype(),
            getActivationFunction(),
            getPosition()
        ];
        return JSON.stringify(listForm);
    };

    that = {};

    that.getInnovationNumber = superThat.getInnovationNumber;
    that.getType = superThat.getType;

    that.getSubtype = getSubtype;
    that.getActivationFunction = getActivationFunction;

    that.copy = copy;
    that.stringify = stringify;

    return that;
};

// used in making a connection gene
makeConnectionGeneHelper = function (innovationNumber, upstream, downstream, weight) {

    "use strict";

    var that, superThat, init, enabledState,
        isEnabled, getUpstream, getDownstream, getWeight,
        enable, disable, setWeight, addToWeight, copy, stringify;

    assert(util.isInt(upstream),
            "swirlnet: internal error: invalid connection gene upstream node: " + upstream);
    assert(util.isInt(downstream),
            "swirlnet: internal error: invalid connection gene downstream node: " + downstream);
    assert(typeof weight === "number" && !isNaN(weight),
            "swirlnet: internal error: invalid connection gene weight: " + weight);

    superThat = makeSuperGene(innovationNumber, "connection");

    init = function () {
        enable();
    };

    isEnabled = function () {
        return enabledState;
    };

    getUpstream = function () {
        return upstream;
    };

    getDownstream = function () {
        return downstream;
    };

    getWeight = function () {
        return weight;
    };

    enable = function () {
        enabledState = true;
    };

    disable = function () {
        enabledState = false;
    };

    setWeight = function (newWeight) {
        weight = newWeight;
    };

    addToWeight = function (weightChange) {
        weight += weightChange;
    };


    copy = function () {

        var geneCopy = makeConnectionGeneHelper(innovationNumber, upstream, downstream, weight);

        if (!isEnabled()) {
            geneCopy.disable();
        }

        return geneCopy;
    };

    stringify = function () {
        var listForm = [
            superThat.getInnovationNumber(),
            superThat.getType(),
            isEnabled(),
            getUpstream(),
            getDownstream(),
            getWeight()
        ];
        return JSON.stringify(listForm);
    };

    init();

    that = {};

    that.getInnovationNumber = superThat.getInnovationNumber;
    that.getType = superThat.getType;

    that.isEnabled = isEnabled;
    that.getUpstream = getUpstream;
    that.getDownstream = getDownstream;
    that.getWeight = getWeight;

    that.enable = enable;
    that.disable = disable;
    that.setWeight = setWeight;
    that.addToWeight = addToWeight;

    that.copy = copy;
    that.stringify = stringify;

    return that;
};

// gene super factory function
makeSuperGene = function (innovationNumber, type) {

    "use strict";

    var that, getInnovationNumber, getType;

    assert(util.isInt(innovationNumber),
            "swirlnet: internal error: invalid gene innovation number: " + innovationNumber);
    assert(type === "connection" || type === "node",
            "swirlnet: internal error: invalid gene type: " + type);

    getInnovationNumber = function () {
        return innovationNumber;
    };

    getType = function () {
        return type;
    };

    that = {};
    that.getInnovationNumber = getInnovationNumber;
    that.getType = getType;

    return that;
};


module.exports.makeNodeGene = makeNodeGene;
module.exports.makeConnectionGene = makeConnectionGene;

