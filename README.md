
# grunt-replicate

Grunt Task for Replicating Directories

<p/>
<img src="https://nodei.co/npm/grunt-replicate.png?downloads=true&stars=true" alt=""/>

<p/>
<img src="https://david-dm.org/rse/grunt-replicate.png" alt=""/>

## Getting Started

This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/)
before, be sure to check out the [Getting
Started](http://gruntjs.com/getting-started) guide, as it explains how
to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as
install and use Grunt plugins. Once you're familiar with that process,
you may install this plugin with this command:

```shell
npm install grunt-replicate --save-dev
```

Once the plugin has been installed, it may be enabled inside your
Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks("grunt-replicate");
```

## Task Options

- `dryRun`: (default `false`) controls whether any destructive filesystem operations
   should be performed at all. Set to true for performing a pre-flight/dry run.

- `regexpExcludeSource`: (default `null`) regular expression (string or RegExp object)
   to exclude paths in the source directory.

- `regexpExcludeDestination`: (default `null`) regular expression (string or RegExp object)
   to exclude paths in the destination directory.

## Replicate Task

_Run this task with the `grunt replicate` command._

Task targets, files and options may be specified according to the Grunt
[Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

## Usage Example

Assuming we have the following build environment:

- `Gruntfile.js`:

```js
// [...]
grunt.initConfig({
    replicate: {
        "sample": {
            src: "src",
            dest: "out",
            options: {
                regexExcludeSource: "(?:.*?/)?node_modules(?:/.*)?$",
                regexExcludeDestination: "(?:.*?/)?\\.(?:git(?:/.*)?|gitignore)$"
            }
        }
    }
});
// [...]
```

