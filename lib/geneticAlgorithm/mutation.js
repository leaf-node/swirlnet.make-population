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
    pickUnconnectedNodes, isConnected,
    makeRandomWeight, perturbWeight, randomizeWeight,
    genes, settings;

genes = require('./genes.js');
settings = require('./settings.js');

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
};

// adds a connection between two nodes not previously connected in that direction
addConnection = function (genome, upstream, downstream, weight) {

    "use strict";

    var connections = genome.getGeneInnovationNumbers("connection");
    connections.forEach(function (innovationNumber) {
        var gene = genome.getGene(innovationNumber);
        console.assert(gene.getUpstream() !== upstream || gene.getDownstream() !== downstream,
            "swirljs: internal error: there is already a connection with upstream: " + upstream + " and downstream: " + downstream);
    });
    genome.addGene(genes.makeConnectionGene(upstream, downstream, weight));
};

// inserts a new node (and two new connections) to the network
// and disables the connection that was once there
insertNewNode = function (genome, upstream, downstream) {

    "use strict";

    var connections, matchingGene, newNode;

    console.assert(typeof upstream === 'number' && !isNaN(upstream), "swirljs: internal error: bad upstream node: " + upstream);
    console.assert(typeof downstream === 'number' && !isNaN(downstream), "swirljs: internal error: bad downstream node: " + downstream);

    connections = genome.getGeneInnovationNumbers("connection");

    connections.forEach(function (connection) {
        var gene;

        gene = genome.getGene(connection);

        if (upstream === gene.getUpstream() && downstream === gene.getDownstream()) {
            console.assert(matchingGene === undefined,
                "swirljs: internal error: multiple connection genes found with upstream: " + upstream + " and downstream: " + downstream + " neurons.");
            matchingGene = gene;
        }
    });
    console.assert(matchingGene !== undefined,
                "swirljs: internal error: no connection gene found with upstream: " + upstream + " and downstream: " + downstream + " neurons.");

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
// and gives them a random weight. connection may be recursive
addRandomConnection = function (genome) {

    "use strict";

    var nodesToConnect, upstream, downstream, newConnection;

    nodesToConnect = pickUnconnectedNodes(genome);
    if (nodesToConnect === undefined) { return; }

    upstream = nodesToConnect[0];
    downstream = nodesToConnect[1];

    newConnection = genes.makeConnectionGene(upstream, downstream, makeRandomWeight());

    genome.addGene(newConnection);
};

// returns a random pair of unconnected nodes
// (the pair may already be connected in the other direction.)
pickUnconnectedNodes = function (genome) {

    "use strict";

    var bias, input, hidden, output,
        upstream, downstream, unconnected, randomSelection;

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

    randomSelection = Math.floor(Math.random() * unconnected.length);

    return unconnected[randomSelection];
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

