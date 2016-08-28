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

// These are the default settings for the genetic algorithm. If you merely wish
// to use different values, use the settings argument of makePopulation(). If
// you belive that the defaults should be changed for everyone, consider making
// a patch and pushing your changes upstream.

defaults = {};

// number of genomes in a population
defaults.populationSize                     = 100;

// whether to allow the existence of recurrent networks
defaults.allowRecursion                     = true;

// fraction of parents in a species that survive to reproduce
defaults.survivalThreshold                  = 0.2;
// when species population is greater than this, the speicies champion is copied unmodified
defaults.championCloneThreshold             = 5;

// constants used in speciation equation
defaults.disjointCoefficient                = 1.0;
defaults.excessCoefficient                  = 1.0;
defaults.weightDifferenceCoefficient        = 0.4;

// also used in speciation equation
defaults.compatibilityThreshold             = 3.0;
defaults.compatibilityModifier              = 0.0;

// rate at which genomes are selected to mutate any of their connection weights
defaults.genomeWeightMutationRate           = 0.8;
// rate at which such genomes mutate individual connection weight genes
defaults.geneWeightPerturbanceRate          = 0.4;

// the variance of random connection weight changes
defaults.weightPerturbanceVariance          = 1.0;
// the variance of new random connection weights
defaults.randomWeightVariance               = 5.0;

// structural mutation rates
defaults.addNodeMutationRate                = 0.03;
defaults.addLinkMutationRate                = 0.05;

// rate at which genomes reproduce asexually only
defaults.asexualReproductionOnlyRate        = 0.25;

// rate at which matching genes are selected from fitter genome
defaults.fitterGenomeInheritanceRate        = 0.5;


// rate of random connection gene disablement toggling
defaults.randomDisablementRate              = 0.00;
defaults.randomEnablementRate               = 0.00;

// rate at which gene enablement in a fitter genome is forced onto the child's gene
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
//
// steepness of sigmoidal curve used by network nodes to modulate input
defaults.sigmoidSteepness                   = 4.9;
// the automatic "bias" node input value (should not be 0)
defaults.biasValue                          = 1;


module.exports = defaults;

