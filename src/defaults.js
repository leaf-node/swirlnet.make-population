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

var defaults;

// These are the default settings for the genetic algorithm. If you wish to use
// different values, use the settings argument of makePopulation(). If you
// belive that the defaults should be changed for everyone by default then feel
// free to let me know.

defaults = {};

// number of genomes in a population
defaults.populationSize                     = 100;

// whether to allow recurrent networks
defaults.allowRecurrent                     = true;

// fraction of parents in a species that survive to reproduce
defaults.survivalThreshold                  = 0.2;
// when species population is greater than this, the speicies champion is copied unmodified
defaults.championCloneThreshold             = 5;

// constants used to determine how different two genomes are
defaults.disjointCoefficient                = 1.0;
defaults.excessCoefficient                  = 1.0;
defaults.weightDifferenceCoefficient        = 0.4;

// divide excess and disjoint terms by max gene count?  if set to true,
// you may want to pick larger disjoint and excess coefficients
// and/or set a smaller compatibilityThreshold and compatibilityModifier
defaults.normalizeCoefficients              = false;
// if normalizing coefficients, then when the gene count
// is less than this number, do not normalize
defaults.normalizationThreshold             = 0;

// the rate at which genomes from different species reproduce
defaults.interspeciesMatingRate             = 0.001;

// threshold over which two genomes are considered different species
defaults.compatibilityThreshold             = 3.0;
// the amount by which this threshold changes per generation
defaults.compatibilityModifier              = 0.0;

// rate at which genomes are selected to mutate any of their connection weights
defaults.genomeWeightMutationRate           = 0.8;
// rate at which such genomes mutate connection weight genes by perturbing a random amount uniform across affected genes
defaults.geneUniformWeightPerturbanceRate   = 0.9;
// rate at which such genomes mutate connection weight genes by perturbing a unique random amount
defaults.geneRandomWeightPerturbanceRate    = 0.0;
// rate at which such genomes mutate connection weight genes by resetting to a unique random amount
defaults.geneRandomWeightResetRate          = 0.1;

// the variance of random connection weight changes
defaults.weightPerturbanceVariance          = 1.0;
// the variance of new random connection weights
defaults.randomWeightVariance               = 5.0;

// structural mutation rates
defaults.addNodeMutationRate                = 0.03;
defaults.addLinkMutationRate                = 0.05;

// rate at which genomes reproduce asexually only
defaults.asexualReproductionOnlyRate        = 0.25;

// rate at which matching genes are inherited from the fitter genome
defaults.fitterGenomeInheritanceRate        = 0.5;


// To understand the impact of gene disablement options, read the VS-NEAT.md
// file in this repository.

// rate of random connection gene disablement toggling
defaults.randomDisablementRate              = 0.00;
defaults.randomEnablementRate               = 0.00;

// rate at which gene enablement in a fitter genome is forced onto the child's gene
// (regardless of which parent the rest of the gene with its connection weight was inherited from)
defaults.fitterGenomeEnablementOverrideRate     = 1.0;
// rate at which gene disablement in a weaker genome is forced onto the child's gene
defaults.weakerGenomeDisablementOverrideRate    = 0.0;

// rate at which gene disablement in a fitter genome is forced onto the child's gene
defaults.fitterGenomeDisablementOverrideRate    = 1.0;
// rate at which gene enablement in a weaker genome is forced onto the child's gene
defaults.weakerGenomeEnablementOverrideRate     = 0.0;

// rate at which gene enablement is forced onto the child's gene if neither parent's gene is enabled.
defaults.neitherGenomeEnablementOverrideRate    = 0.0;


// settings for network functionality

// steepness of sigmoidal curve used by network nodes to modulate input
defaults.sigmoidSteepness                   = 4.9;
// the automatic "bias" node input value (should not be 0)
defaults.biasValue                          = 1;


module.exports = defaults;

