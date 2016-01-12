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
defaults.populationSize                     = 100;

defaults.survivalThreshold                  = 0.2;

defaults.disjointCoefficient                = 1.0;
defaults.excessCoefficient                  = 1.0;
defaults.weightDifferenceCoefficient        = 0.4;

defaults.compatibilityThreshold             = 3.0;
defaults.compatibilityModifier              = 0.0;

defaults.weightMutationRate                 = 0.8;
defaults.weightPerturbanceRate              = 0.9;
defaults.mutationPower                      = 2.5;

defaults.addNodeMutationRate                = 0.03;
defaults.addLinkMutationRate                = 0.05;
defaults.toggleDisablementRate              = 0.00;

defaults.fitterGenomeInheritanceRate        = 0.5;

defaults.linearInputsFunction               = true;
defaults.allowRecursionToInputs             = false;


module.exports = defaults;

