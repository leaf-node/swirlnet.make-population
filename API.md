# API Documentation

This library evolves neural networks that may perform well at some control
tasks.

For a full example, see the `./test/xor.js` program.

Install the library locally into your project's `node_modules`

        $ npm install swirlnet

Import the library into your javascript program

        swirlnet = require('swirlnet');

User-defined settings are optional. Default settings and their values may be
found in the `./src/defaults.js` file. Default settings and values may change
in future versions of swirlnet. Refer to the release notes for a listing of
prior changes.

        genomeSettings = {

            "populationSize":   150,
            "allowRecursion":   true
        };

To get started, make a new population. The first argument is the number of
inputs. The second is the number of outputs. The so-called 'bias' input is
handled automatically by swirlnet.

        population = swirlnet.makePopulation(2, 1, genomeSettings);

Get a list of all the genomes from the current (first) generation

        genomes = population.getGenomes();

Loop through and process each of the genomes. Create a phenotype for each
genome and use that to create each net. This process is broken up into more
than one step and uses text based formats so that you can evolve genomes on one
machine and test them in parallel on many others.

        genome = genomes[i];
        phenotype = swirlnet.genoToPheno(genome);
        net = swirlnet.makeNet(phenotype);

Once you have your net, you can reset its internal cell states to `0` with
`flush()`. This is only needed between multiple tests of the same network.

        net.flush();

Set the inputs to the network

        net.setInputs([0, 1]);

Step the network forward to propagate signals downstream. The optional
parameter may be used for steping multiple times. If inputs are constant, you
don't need to reset inputs before every `step()`.

        net.step(5);

Get the network outputs

        results0 = net.getOutputs();
        net.step();
        results1 = net.getOutputs();

Calculate your network's fitness. In practice you'll want to sample multiple
outputs from a variety of inputs and combine them together using a fitness
formula. Some people wait for network output to stabilize before sampling
results but be aware that some recurrent networks do not stabilize.

        fitness = results0[0] * results1[0];

Set genome fitness. This determines which genomes reproduce to create the next
generation.

        population.setFitness(net.getGenomeID(), fitness);

Create the next generation

        population.reproduce();

Repeat the above steps until you have a network that meets your fitness target

        genomes = population.getGenomes();
        ...

For a full example, see the `./test/xor.js` program.


## Other methods

Returns the current generation number:

        population.getCurrentGenerationNumber()

Returns a list of internal node states ordered by phenotype node number:

        net.getNodeStates()

Returns the number of nodes in the network:

        net.getNodeCount()

Returns the genomeID of the network which may be used for setting fitness:

        net.getGenomeID()

## Default settings

Most of these you won't need to worry about. To override any of these settings,
refer to the method at the top of this page.

Default settings and their values may be found in the `./src/defaults.js` file.
Default settings and values may change in future versions of swirlnet. Refer to
the release notes for a listing of prior changes.

