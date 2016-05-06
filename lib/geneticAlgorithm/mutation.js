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

var randomlyMutate, addConnection, insertNewNode,
    randomlyInsertNode, addRandomConnection,
    toggleRandomConnection,
    listUnconnectedNodes, isConnected, willBeCyclic,
    makeRandomWeight, perturbWeight, randomizeWeight,
    genes, settings, util, ct;

genes = require('./genes.js');
settings = require('./settings.js');
util = require('../util.js');

// cycle detection
ct = require('cycle-test');

// randomly mutates a genome
randomlyMutate = function (genome) {

    "use strict";

    var connections;

    if (Math.random() < settings.getSetting("weightMutationRate")) {

        connections = genome.getGeneInnovationNumbers("connection");

        connections.forEach(function (connection) {

            if (Math.random() < settings.getSetting("weightPerturbanceRate")) {

                perturbWeight(genome, connection);

            } else {

                randomizeWeight(genome, connection);
            }
        });
    }

    if (Math.random() < settings.getSetting("addNodeMutationRate")) {

        randomlyInsertNode(genome);
    }

    if (Math.random() < settings.getSetting("addLinkMutationRate")) {

        addRandomConnection(genome);
    }

    if (Math.random() < settings.getSetting("toggleDisablementRate")) {

        toggleRandomConnection(genome);
    }
};

// adds a connection between two nodes not previously connected in that direction
addConnection = function (genome, upstream, downstream, weight) {

    "use strict";

    var connections = genome.getGeneInnovationNumbers("connection");
    connections.forEach(function (innovationNumber) {
        var gene = genome.getGene(innovationNumber);
        console.assert(gene.getUpstream() !== upstream || gene.getDownstream() !== downstream,
            "swirlnet: internal error: there is already a connection with upstream: " + upstream + " and downstream: " + downstream);
    });
    genome.addGene(genes.makeConnectionGene(upstream, downstream, weight));
};

// inserts a new node (and two new connections) to the network
// and disables the connection that was once there
insertNewNode = function (genome, upstream, downstream) {

    "use strict";

    var connections, matchingGene, newNode;

    console.assert(util.isInt(upstream), "swirlnet: internal error: bad upstream node: " + upstream);
    console.assert(util.isInt(downstream), "swirlnet: internal error: bad downstream node: " + downstream);

    connections = genome.getGeneInnovationNumbers("connection");

    connections.forEach(function (connection) {
        var gene;

        gene = genome.getGene(connection);

        if (upstream === gene.getUpstream() && downstream === gene.getDownstream()) {
            console.assert(matchingGene === undefined,
                "swirlnet: internal error: multiple connection genes found with upstream: " + upstream + " and downstream: " + downstream + " neurons.");
            matchingGene = gene;
        }
    });
    console.assert(matchingGene !== undefined,
                "swirlnet: internal error: no connection gene found with upstream: " + upstream + " and downstream: " + downstream + " neurons.");

    matchingGene.disable();

    newNode = genes.makeNodeGene("hidden", "sigmoid", undefined, upstream, downstream);
    genome.addGene(newNode);

    genome.addGene(genes.makeConnectionGene(upstream, newNode.getInnovationNumber(), 1));
    genome.addGene(genes.makeConnectionGene(newNode.getInnovationNumber(), downstream, matchingGene.getWeight()));
};

// inserts a new nodes in a random location
randomlyInsertNode = function (genome) {

    "use strict";

    var connections, gene, upstream, downstream, randomSelection;

    connections = genome.getGeneInnovationNumbers("connection");

    randomSelection = Math.floor(Math.random() * connections.length);
    gene = genome.getGene(connections[randomSelection]);

    upstream = gene.getUpstream();
    downstream = gene.getDownstream();

    insertNewNode(genome, upstream, downstream);

};

// adds a connection between two random unconnected nodes
// and gives them a random weight. recursive connections
// may be disallowed.
addRandomConnection = function (genome) {

    "use strict";

    var nodePair, upstream, downstream,
        unconnected, randomSelection, i,
        allowRecursion;

    allowRecursion = settings.getSetting("allowRecursion");

    unconnected = listUnconnectedNodes(genome);

    for (i = 0; i < unconnected.length; i += 1) {

        randomSelection = Math.floor(Math.random() * unconnected.length);
        nodePair = unconnected[randomSelection];

        upstream = nodePair[0];
        downstream = nodePair[1];

        if (!allowRecursion && willBeCyclic(genome, upstream, downstream)) {

            unconnected.splice(randomSelection, 1);

        } else {

            addConnection(genome, upstream, downstream, makeRandomWeight());
            return;
        }
    }

};

// randomly toggles enablement of one connection gene
toggleRandomConnection = function (genome) {

    "use strict";

    var connections, randomSelection, gene;

    connections = genome.getGeneInnovationNumbers("connection");

    randomSelection = Math.floor(Math.random() * connections.length);
    gene = genome.getGene(connections[randomSelection]);

    if (gene.isEnabled()) {
        gene.disable();
    } else {
        gene.enable();
    }
};

// returns a list of unconnected nodes
// (the pair may already be connected in the other direction.)
listUnconnectedNodes = function (genome) {

    "use strict";

    var bias, input, hidden, output,
        upstream, downstream, unconnected;

    bias = genome.getGeneInnovationNumbers("node", "bias");
    input = genome.getGeneInnovationNumbers("node", "input");
    hidden = genome.getGeneInnovationNumbers("node", "hidden");
    output = genome.getGeneInnovationNumbers("node", "output");

    upstream    = [].concat(bias).concat(input).concat(hidden).concat(output);
    downstream  = [].concat(hidden).concat(output);

    if (settings.getSetting("allowRecursionToInputs")) {
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

    return unconnected;
};

// returns true if the upstream node has a downstream connection to the other node
isConnected = function (genome, upstream, downstream) {

    "use strict";

    var i, connection, connections;

    connections = genome.getGeneInnovationNumbers("connection");

    for (i = 0; i < connections.length; i += 1) {

        connection = connections[i];

        if (upstream === genome.getGene(connection).getUpstream()
                && downstream === genome.getGene(connection).getDownstream()) {

            return true;
        }
    }

    return false;
};

// returns true if genome will have recursive connections if a connection is
// made between the specified upstream and dowstream nodes
willBeCyclic = function (genome, upstream, downstream) {

    "use strict";

    var innovationNums, genes, connections, paths;

    // it's ok if both upstream and downstream are undefined, but not just one.
    console.assert((((upstream !== null && downstream !== null)
            && (upstream !== undefined && downstream !== undefined))
            || (upstream === undefined && downstream === undefined)),
            "swirlnet: internal error: invalid upstream and downstream: "
            + upstream + ", " + downstream);

    innovationNums = genome.getGeneInnovationNumbers("connection");
    genes = innovationNums.map(genome.getGeneCopy);
    connections = genes.map(function (gene) { return [gene.getUpstream(), gene.getDownstream()]; });

    if (upstream !== undefined && downstream !== undefined) {
        connections.push([upstream, downstream]);
    }

    paths = [];
    connections.forEach(function (connection) {
        var upstr, downstr;
        upstr = connection[0];
        downstr = connection[1];

        paths[upstr] = paths[upstr] || [];
        paths[upstr].push(downstr);
    });

    return ct.hasCycle(paths);
};

// changes weight of connection by random amount
perturbWeight = function (genome, connection) {

    "use strict";

    var gene;

    gene = genome.getGene(connection);
    gene.addWeight(makeRandomWeight());
};

// sets weight of connection to random weight
randomizeWeight = function (genome, connection) {

    "use strict";

    var gene;

    gene = genome.getGene(connection);
    gene.setWeight(makeRandomWeight());
};

// adds to connection weight
// makes a random weight for new connections
makeRandomWeight = function () {

    "use strict";

    var min, max;

    max = settings.getSetting("mutationPower");
    min = -max;

    return (max - min) * Math.random() + min;
};

module.exports.randomlyMutate = randomlyMutate;

module.exports.randomizeWeight = randomizeWeight;
module.exports.perturbWeight = perturbWeight;

