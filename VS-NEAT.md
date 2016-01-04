# Differences between swirljs and NEAT

While some features in NEAT are currently missing, others are intentionally
excluded or changed.

## Disabling disablement during crossover

The original [NEAT](http://www.cs.ucf.edu/~kstanley/neat.html)
[paper](http://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf) suggests
that new genomes produced through crossover should randomly inherit or not
inherit the 'disabled' status of a connection gene if it is disabled in either
parent, regardless of parental fitness.

This leads to a choice between frequently inheriting disablement from weaker
parents or rarely inheriting disablement from fitter parents.
Neither option is appealing, as both options will frequently disrupt effective
structure.
Attempting to compromise with a fifty percent chance will not fully succeed, as
structure will then regularly be disrupted both ways.

swirljs treats disablement as structural change.
Disablement status is inherited from the fitter parent's genome along with its
excess and disjoint genes.
The connection weight of the gene is still inheritable from either parent if
both have it.

Removing this feature greatly increased the rate at which solutions to the XOR
problem were found.

### Future plans

A planned feature of swirljs will be to allow use of disablement toggling as a
type of post-crossover random mutation, if desired.
This should avoid the above mentioned problems while offering a useful means of
generating further genetic diversity.

## Genomes with equal fitness

If two genomes with equal fitness scores are undergoing crossover, one of them
is selected as the fitter genome in swirljs.
Excess and disjoint genes are inherited from the 'fitter' parent instead of
randomly inheriting disjoint and excess genes from both.

Removing this feature greatly increased the rate at which solutions to the XOR
problem are found.

