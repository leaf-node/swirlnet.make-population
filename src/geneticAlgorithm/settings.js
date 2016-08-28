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

var defaults, settings, defaults,
    initSettings, getSetting, getSettings,
    util;

defaults = require('./defaults.js');

util = require('../util.js');

// initializes settings
initSettings = function (userSettings) {

    "use strict";

    console.assert(settings === undefined, "swirlnet: internal error: cannot initialize settings more than once.");

    userSettings = userSettings || {};

    Object.keys(userSettings).forEach(function (setting) {
        console.assert(defaults[setting] !== undefined, "swirlnet: error: bad setting name: " + setting);
        console.assert(typeof defaults[setting] === "number" || typeof defaults[setting] === "boolean",
                "swirlnet: internal error: unexpected default setting type: " + typeof defaults[setting]);
        if (typeof defaults[setting] === "number") {
            console.assert(typeof userSettings[setting] === "number",
                    "swirlnet: error: bad type for setting: " + setting + " (" + typeof userSettings[setting] + ").");
        } else if (typeof defaults[setting] === "boolean") {
            console.assert(typeof userSettings[setting] === "boolean",
                    "swirlnet: error: bad type for setting: " + setting + " (" + typeof userSettings[setting] + ").");
        }
    });

    settings = {};

    Object.keys(defaults).forEach(function (setting) {
        settings[setting] = (userSettings[setting] !== undefined) ? userSettings[setting] : defaults[setting];
    });
};

// returns the object containing all of the settings
getSettings = function () {

    "use strict";

    console.assert(settings !== undefined, "swirlnet: internal error: cannot return settings before they are initialized.");

    return util.copy(settings);
};

// returns the value of the specified setting
getSetting = function (setting) {

    "use strict";

    console.assert(settings[setting] !== undefined, "swirlnet: internal error: bad settings name: " + setting);

    return util.copy(settings[setting]);
};

module.exports.initSettings = initSettings;
module.exports.getSettings = getSettings;
module.exports.getSetting = getSetting;

