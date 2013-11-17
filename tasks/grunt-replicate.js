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
/* global console: false */

/*  standard Node modules  */
var constants = require("constants");
var fs        = require("fs");
var path      = require("path");

/*  foreign modules  */
var chalk     = require("chalk");
var sprintf   = require("sprintf-js").sprintf;

/*  own local modules  */
var FTS       = require("../lib/fts.js");

module.exports = function(grunt) {
    /*  define the Grunt task  */
    grunt.registerMultiTask("replicate", "Replicate Directory", function () {
        /*  prepare options  */
        var options = this.options({
            dryRun: false,
            regexpExcludeSource: null,
            regexpExcludeDestination: null
        });
        grunt.verbose.writeflags(options, "Options");

        /*  iterate over all "src-dest" pairs  */
        this.files.forEach(function(fileDef) {
            var dst = fileDef.dest;
            fileDef.src.forEach(function(src) {
                replicate(options, src, dst);
            });
        });
    });

    /*  perform a single replication  */
    var replicate = function(options, src, dst) {
        /*  sanity check source and destination directory  */
        if (!grunt.file.exists(src))
            grunt.fail.warn("Source directory \"" + chalk.green(src) + "\" not found.");
        if (!grunt.file.isDir(src))
            grunt.fail.warn("Source path \"" + chalk.green(src) + "\" already exists, but is not a directory.");
        if (!grunt.file.exists(dst)) {
            grunt.log.writeln("Destination directory \"" + chalk.green(dst) + "\" not found: creating on-the-fly now.");
            grunt.file.mkdir(dst);
        }
        if (!grunt.file.isDir(dst))
            grunt.fail.warn("Destination path \"" + chalk.green(dst) + "\" already exists, but is not a directory.");

        /*  display header  */
        grunt.log.writeln("Replication Scanning:");
        grunt.log.writeln("+-------+----------------------+-------+-------+-------+-------+");
        grunt.log.writeln("| Which | Directory            | Depth |  Dirs | Files | Other |");
        grunt.log.writeln("+-------+----------------------+-------+-------+-------+-------+");

        /*  recursively scan source directory  */
        var fts = new FTS(src, options.regexpExcludeSource);
        fts.scan();
        var srcPathList = fts.pathList();
        var srcPathMap  = fts.pathMap();
        var srcPathStat = fts.pathStat();
        grunt.log.writeln("| " +
            chalk.blue(sprintf("%-5s", "SRC")) + " | " +
            chalk.blue(sprintf("%-20s", src.substr(0, 20))) + " | " +
            chalk.blue(sprintf("%5d", srcPathStat.depthDirs)) + " | " +
            chalk.blue(sprintf("%5d", srcPathStat.numDirs)) + " | " +
            chalk.blue(sprintf("%5d", srcPathStat.numFiles)) + " | " +
            chalk.blue(sprintf("%5d", srcPathStat.numOthers)) +
        " |");

        /*  recursively scan destination directory  */
        fts = new FTS(dst, options.regexpExcludeDestination);
        fts.scan();
        var dstPathList = fts.pathList();
        var dstPathMap  = fts.pathMap();
        var dstPathStat = fts.pathStat();
        grunt.log.writeln("| " +
            chalk.blue(sprintf("%-5s", "DST")) + " | " +
            chalk.blue(sprintf("%-20s", dst.substr(0, 20))) + " | " +
            chalk.blue(sprintf("%5d", dstPathStat.depthDirs)) + " | " +
            chalk.blue(sprintf("%5d", dstPathStat.numDirs)) + " | " +
            chalk.blue(sprintf("%5d", dstPathStat.numFiles)) + " | " +
            chalk.blue(sprintf("%5d", dstPathStat.numOthers)) +
        " |");

        /*  display footer  */
        grunt.log.writeln("+-------+----------------------+-------+-------+-------+-------+");

        /*  display header  */
        grunt.log.writeln("Replication Actioning:");
        var anyAction = false;

        /*  helper function for reporting operation  */
        var reportOp = function (op, type, path) {
            switch (op) {
                case "NEW": op = chalk.green("Create: "); break;
                case "RPL": op = chalk.black("Replace:"); break;
                case "UPD": op = chalk.black("Update: "); break;
                case "TCH": op = chalk.black("Touch:  "); break;
                case "DEL": op = chalk.red  ("Delete: "); break;
            }
            if (type === "DIR")
                path = chalk.bold(path + "/");
            switch (type) {
                case "FIL": type = "[FILE] "; break;
                case "DIR": type = "[DIR]  "; break;
                case "LNK": type = "[LINK] "; break;
                case "OTH": type = "[OTHER]"; break;
            }
            console.log(op + " " + type + " " + path);
            anyAction = true;
        };

        /*  delete destination files which do not (or no longer) exist in source directory  */
        dstPathList.reverse().forEach(function (dp) {
            /*  skip base directory  */
            if (dp === "")
                return;

            /*  dispatch according to file type  */
            var dpA = path.join(dst, dp);
            if (typeof srcPathMap[dp] === "undefined") {
                if (dstPathMap[dp].isFile()) {
                    reportOp("DEL", "FIL", dp);
                    if (!options.dryRun)
                        fs.unlinkSync(dpA);
                }
                else if (dstPathMap[dp].isDirectory()) {
                    reportOp("DEL", "DIR", dp);
                    if (!options.dryRun)
                        grunt.file["delete"](dpA, { force: true });
                }
                else if (dstPathMap[dp].isSymbolicLink()) {
                    reportOp("DEL", "LNK", dp);
                    if (!options.dryRun)
                        fs.unlinkSync(dpA);
                }
            }
        });

        /*  copy source files which do not exist in the destination directory  */
        var touches = [];
        srcPathList.forEach(function (sp) {
            if (sp === "")
                return;
            var spA = path.join(src, sp);
            var dpA = path.join(dst, sp);

            /*  determine operation  */
            var op = "NEW";
            if (typeof dstPathMap[sp] !== "undefined") {
                if (srcPathMap[sp].mode !== dstPathMap[sp].mode)
                    op = "RPL";
                else if (srcPathMap[sp].mtime.getTime() > dstPathMap[sp].mtime.getTime())
                    op = "UPD";
                else
                    op = "SKP";
            }

            /*  perform delete operation for replace operation  */
            if (op === "RPL") {
                var type = "FIL";
                if (dstPathMap[sp].isDirectory())
                    type = "DIR";
                else if (dstPathMap[sp].isSymbolicLink())
                    type = "LNK";
                else
                    type = "OTH";
                reportOp("DEL", type, sp);
                if (!options.dryRun)
                    grunt.file["delete"](dpA, { force: true });
            }

            /*  perform all non-skip operations  */
            if (op !== "SKP") {
                /*  dispatch according to file type  */
                if (srcPathMap[sp].isFile()) {
                    reportOp(op, "FIL", sp);
                    if (!options.dryRun) {
                        grunt.file.copy(spA, dpA);
                        fs.chmodSync(dpA, srcPathMap[sp].mode);
                        fs.utimesSync(dpA, srcPathMap[sp].atime, srcPathMap[sp].mtime);
                    }
                }
                else if (srcPathMap[sp].isDirectory()) {
                    if (op !== "UPD")
                        reportOp(op, "DIR", sp);
                    if (!options.dryRun) {
                        if (op !== "UPD")
                            fs.mkdirSync(dpA, srcPathMap[sp].mode);
                        touches.unshift({
                            pathRel: sp,
                            pathFull: dpA,
                            atime: srcPathMap[sp].atime,
                            mtime: srcPathMap[sp].mtime
                        });
                    }
                }
                else if (srcPathMap[sp].isSymbolicLink()) {
                    reportOp(op, "LNK", sp);
                    if (!options.dryRun) {
                        fs.symlinkSync(fs.readlinkSync(spA), dpA);
                        fs.lchmodSync(dpA, srcPathMap[sp].mode);
                        if (constants.hasOwnProperty("O_SYMLINK")) {
                            var fd = fs.openSync(dpA, constants.O_SYMLINK);
                            fs.futimesSync(fd, srcPathMap[sp].atime, srcPathMap[sp].mtime);
                            fs.closeSync(fd);
                        }
                    }
                }
                else
                    throw new Error("unknown file type (only file, directory and symbolic link supported)");
            }
        });
        touches.forEach(function (entry) {
            reportOp("TCH", "DIR", entry.pathRel);
            fs.utimesSync(entry.pathFull, entry.atime, entry.mtime);
        });

        /*  final notice  */
        if (!anyAction)
            grunt.log.writeln("(none)");
    };
};

