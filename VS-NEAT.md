# Differences between swirlnet and NEAT

While some features in NEAT are currently missing, others are intentionally
excluded or changed.

## Disabling disablement during crossover

The original [NEAT](http://www.cs.ucf.edu/~kstanley/neat.html)
[paper](http://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf) suggests
that new genomes produced through crossover should randomly inherit (or not
inherit) the disablement of a connection gene if it is disabled in either
parent, regardless of parental fitness.

This leads to a choice between rather frequently inheriting disablement from
parents, including weak ones about as frequently as fit ones; or rarely
inheriting disablement from parents, including fit ones.
Neither option is appealing, as both options will frequently disrupt effective
structures.
Attempting to compromise with a fifty percent chance will not fully succeed, as
structure will then regularly be disrupted both ways.

swirlnet treats disablement as structural change.
Disablement status is inherited from the fitter parent's genome along with its
excess and disjoint genes.
The connection weight of the gene is still inheritable from either parent if
both have it.

Removing this feature greatly increased the rate at which solutions to the XOR
problem were found.

### Future plans

A planned feature of swirlnet will be to allow use of disablement toggling as a
type of post-crossover random mutation, if desired.
This should avoid the above mentioned problems while offering a useful means of
generating further genetic diversity.

## Genomes with equal fitness

If two genomes with equal fitness scores are undergoing crossover, one of them
is selected as the fitter genome in swirlnet.
Excess and disjoint genes are inherited from the 'fitter' parent instead of
randomly inheriting disjoint and excess genes from both.

Removing this feature greatly increased the rate at which solutions to the XOR
problem were found.

