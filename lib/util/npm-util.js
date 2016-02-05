/**
 * @fileoverview Utility for executing npm commands.
 * @author Ian VanSchooten
 * @copyright 2016 Ilya Volodin. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var fs = require("fs"),
    path = require("path"),
    shell = require("shelljs");

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Find the closest package.json file, starting at process.cwd (by default),
 * and working up to root.
 *
 * @param   {string} [startDir=process.cwd()] Starting directory
 * @returns {string}                          Absolute path to closest package.json file
 */
function findPackageJson(startDir) {
    var dir = path.resolve(startDir || process.cwd());
    do {
        var pkgfile = path.join(dir, "package.json");
        if (!fs.existsSync(pkgfile)) {
            dir = path.join(dir, "..");
            continue;
        }
        return pkgfile;
    } while (dir !== path.resolve(dir, ".."));
    return null;
}

//------------------------------------------------------------------------------
// Private
//------------------------------------------------------------------------------

/**
 * Install node modules synchronously and save to devDependencies in package.json
 * @param   {string|string[]} packages Node module or modules to install
 * @returns {void}
 */
function installSyncSaveDev(packages) {
    if (Array.isArray(packages)) {
        packages = packages.join(" ");
    }
    shell.execSync("npm i --save-dev " + packages, {stdio: "inherit"});
}

/**
 * Check whether node modules are include in a project's package.json.
 *
 * @param   {string[]} packages Array of node module names
 * @param   {Object} opt        Options Object
 * @returns {Object}            An object whose keys are the module names
 *                              and values are booleans indicating installation.
 */
function check(packages, opt) {
    var deps = [];
    var pkgJson = findPackageJson();
    if (!pkgJson) {
        throw new Error("Could not find a package.json file");
    }
    var fileJson = JSON.parse(fs.readFileSync(pkgJson, "utf8"));
    if (opt.devDependencies) {
        deps = deps.concat(Object.keys(fileJson.devDependencies));
    }
    if (opt.dependencies) {
        deps = deps.concat(Object.keys(fileJson.dependencies));
    }
    return packages.reduce(function(status, pkg) {
        status[pkg] = deps.indexOf(pkg) !== -1;
        return status;
    }, {});
}

/**
 * Check whether node modules are included in the dependencies of a project's
 * package.json.
 *
 * Convienience wrapper around check().
 *
 * @param   {string[]} packages  Array of node modules to check.
 * @returns {Object}             An object whose keys are the module names
 *                               and values are booleans indicating installation.
 */
function checkDeps(packages) {
    return check(packages, {dependencies: true});
}

/**
 * Check whether node modules are included in the devDependencies of a project's
 * package.json.
 *
 * Convienience wrapper around check().
 *
 * @param   {string[]} packages  Array of node modules to check.
 * @returns {Object}             An object whose keys are the module names
 *                               and values are booleans indicating installation.
 */
function checkDevDeps(packages) {
    return check(packages, {devDependencies: true});
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

module.exports = {
    installSyncSaveDev: installSyncSaveDev,
    checkDeps: checkDeps,
    checkDevDeps: checkDevDeps
};