
/* global module: true */
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        replicate: {
            "foo": {
                src:  "src",
                dest: "bld",
                options: {
                    dryRun: true,
                    regexExcludeDestination: "(?:.*?/)?\\.(?:(?:svn|git)(?:/.*)?|gitignore)$"
                }
            }
        },
        clean: {
            clean:     [ "build/*", "build" ],
            distclean: [ "node_modules" ]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadTasks("../tasks");

    grunt.registerTask("default", [ "replicate" ]);
};

