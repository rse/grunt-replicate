/*
**  grunt-replicate -- Grunt Task for Replicating Directories
**  Copyright (c) 2013 Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/* global module:  false */
/* global require: false */

/*  load external requirements  */
var fs   = require("fs");
var path = require("path");

/*  constructor  */
var FTS = function (baseDir, excludePath) {
    /*  configuration  */
    this._baseDir     = (typeof baseDir     !== "undefined" ? baseDir     : ".");
    this._excludePath = (typeof excludePath !== "undefined" ? excludePath : null);
    if (typeof this._excludePath === "string")
        this._excludePath = new RegExp(this._excludePath);

    /*  results  */
    this._pathList = [];
    this._pathMap  = {};
    this._pathStat = {
        numDirs:   0,
        numFiles:  0,
        numOthers: 0,
        depthDirs: 0
    };
};

/*  methods  */
FTS.prototype = {
    scan: function () {
        /*  bootstrap scanning  */
        this._scan("", 0);
    },
    _scan: function (file, depth) {
        var self = this;

        /*  optionally short-circuit processing for excluded paths  */
        if (self._excludePath !== null)
            if (self._excludePath.test(file))
                return;

        /*  determine information about path  */
        var filepath = path.join(self._baseDir, file);
        var stat = fs.lstatSync(filepath);

        /*  capture information about path  */
        self._pathMap[file] = stat;
        self._pathList.push(file);

        /*  dispatch according to path type  */
        if (stat.isDirectory()) {
            self._pathStat.numDirs++;

            /*  determine directory tree depth  */
            if (self._pathStat.depthDirs < depth)
                self._pathStat.depthDirs = depth;

            /*  recursively interate over directory entries  */
            var files = fs.readdirSync(filepath);
            files.forEach(function (subpath) {
                self._scan(path.join(file, subpath), depth + 1); /* RECURSION */
            });
        }
        else if (stat.isFile())
            self._pathStat.numFiles++;
        else
            self._pathStat.numOthers++;
    },
    pathList: function (idx) {
        return (typeof idx === "number" ? this._pathList[idx] : this._pathList);
    },
    pathMap: function (key) {
        return (typeof key === "string" ? this._pathMap[key] : this._pathMap);
    },
    pathStat: function () {
        return this._pathStat;
    }
};

module.exports = FTS;

