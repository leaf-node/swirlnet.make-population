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


var growNet;

// converts between swirlGenomeJSON and swirlNetJSON
growNet = function (swirlGenomeJSON) {

    "use strict";

    var getNodeID, nextNodeID, innovationNodeIDMap,
        swirlNetJSON, translateGenomeToPhenotype,
        genome;

    nextNodeID = 0;
    innovationNodeIDMap = [];

    getNodeID = function (innovationNumber) {

        if (innovationNodeIDMap[innovationNumber] === undefined) {
            innovationNodeIDMap[innovationNumber] = nextNodeID;
            nextNodeID += 1;
        }

        return innovationNodeIDMap[innovationNumber];
    };

    translateGenomeToPhenotype = function (genome) {

        var phenotype, cellCount, i, innovNumber,
            activationFunction,
            weight,
            upstream, downstream, gene, role, nodeID;

        phenotype = {
            "format": "swirlNetJSON",
            "version": "0.0",
            "generation": genome.generation,
            "genomeID": genome.genomeID,
            "cellCount": -1,
            "roles": {"bias": [], "input": [], "output": [], "hidden": []},
            "functions": {},
            "connections": []
        };

        cellCount = 0;

        for (i in genome.genes) {
            if (genome.genes.hasOwnProperty(i)) {

                gene = genome.genes[i];
                innovNumber = gene[0];

                if (gene !== null) {

                    if (gene[1] === "node") {

                        role = gene[2];
                        activationFunction = gene[3];

                        nodeID = getNodeID(innovNumber);
                        phenotype.roles[role].push(nodeID);

                        phenotype.functions[activationFunction] = phenotype.functions[activationFunction] || [];
                        phenotype.functions[activationFunction].push(nodeID);

                        phenotype.connections[nodeID] = phenotype.connections[nodeID] || {};

                        cellCount += 1;

                    } else if (gene[1] === "connection") {

                        if (gene[2] === true) {

                            upstream = getNodeID(gene[3]);
                            downstream = getNodeID(gene[4]);
                            weight = gene[5];

                            phenotype.connections[upstream] = phenotype.connections[upstream] || {};
                            phenotype.connections[upstream][downstream] = weight;
                        }
                    }
                }
            }
        }

        phenotype.cellCount = cellCount;

        return phenotype;
    };

    genome = JSON.parse(swirlGenomeJSON);
    swirlNetJSON = JSON.stringify(translateGenomeToPhenotype(genome));

    return swirlNetJSON;
};

module.exports.growNet = growNet;


