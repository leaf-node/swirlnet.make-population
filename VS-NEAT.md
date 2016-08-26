# Differences between swirlnet and NEAT

While some features in NEAT are currently missing, others are intentionally
excluded or changed.

## Expanded options for disablement during crossover

The original [NEAT](http://www.cs.ucf.edu/~kstanley/neat.html)
[paper](http://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf) seems to
suggest that new genomes produced through crossover should randomly inherit the
disablement of a connection gene if it is disabled in either parent, regardless
of the relative fitness of the parent carrying the disabled gene.

This leads to a choice between, at one extreme, allowing frequent inheritence
of disablement from weak parents, or rarely inheriting disablement from fit
parents, at the other.
Neither option is appealing, as both options frequently disrupt effective
structure.
Attempting to compromise with a fifty percent chance of inheriting
disablement from either parent leads to frequently disrupted structure in both
of these problematic scenarios.
This is caused by an effective double bind due to there being only one
probability covering multiple scenarios.

swirlnet gives you flexible options through six probability settings.

* Firstly, you have the option of of using these settings to disable the
  special inheritence rules for gene disablement.

    * This causes disablement and enablement to be inherited along with
      connection weight according to the gene inheritence rules.

* You can set gene disablement status to always be inherited from the gene of
  the fitter parent, along with other structural differences.

    * In the case of the XOR challenge, this setting and settings with similar
      probabilities are the most effective options I've tried since they reduce
attraction to the the local minimum of creating genomes with every connection
gene disabled.
Connections get disabled when a weak genome with an added (and reconnected)
node and disabled (short) connection reproduces with a fitter genome.
The additional connected node is not inherited from the weaker genome since it
is either disjoint or excess; if the disabled connection is randomly inherited
from the weaker genome then the result is a new genome with a missing
connection.
Once all connections are deleted, genomes always create the same output that
is situated half way between the correct and inccorect answer for every test case.
In early stages of evolution, this disconnected genome may outperform connected
genomes.  Using the above approach solves this issue.

* By changing four settings in swirlnet you may differentiate the probabilities
  of inheriting disablement, inheriting enablement or non-interference, each
acccording to whether the fitter or weaker parent has the disabled gene.

* You may set the gene enablement rate for cases in which both parents' genes
  are disabled.

* You can also set the frequency of asexual gene disablement toggling.

* Tweaking these settings allows you to follow the same, or a similar, approach
  as the one outlined in the original NEAT paper.

The additional rules for sexually inherited disablement occur after each
connection weight is randomly inherited from either parent.

## Genomes with equal fitness

If two genomes with equal fitness scores are undergoing crossover, one of them
is selected as the fitter genome in swirlnet.
Excess and disjoint genes are inherited from the 'fitter' parent instead of
randomly inheriting disjoint and excess genes from both.

Removing this feature greatly increased the rate at which solutions to a prior
(naive) version of the XOR problem were found.

