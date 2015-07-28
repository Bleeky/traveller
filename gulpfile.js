'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var _ = require('lodash');
var rimraf = require('gulp-rimraf');
var browserSync = require('browser-sync').create();
var minifyCSS = require('gulp-minify-css');
var karma = require('gulp-karma');
var gprompt = require('gulp-prompt');
var git = require('gulp-git');
var shell = require('gulp-shell');

var gJSBuild = [];
var gCSSBuild = [];
var debugMode;

// Compile, concat and minify all developped CSS.
gulp.task('styles', ['javascripts'], function () {
    gCSSBuild.push('./assets/css/build/traveller.css');
    return gulp.src(['./assets/css/*.scss', './assets/css/dev/*.scss'])
        .pipe(sass({
            onError: function (e) {
                console.log(e);
            }
        }))
        .pipe(concat('traveller.css'))
        .pipe(minifyCSS())
        .pipe(gulp.dest('assets/css/build/'));
});

// Compile, concat and minify all developped JS.
gulp.task('javascripts', ['dependencies'], function () {
    gJSBuild.push('./app/build/traveller.js');
    return gulp.src(['./app/*.js', './app/components/**/*.js', './app/shared/**/*.js'])
        .pipe(concat('traveller.js'))
        .pipe(gulp.dest('app/build/'));
});

// Add packages and their dependencies recursivly.
function addPackage(name) {
    var packagesOrder = {
        css: [],
        js: []
    };
    var bowerDir = './bower_components';
    var info = require(bowerDir + '/' + name + '/bower.json');
    var main = info.main;
    var dependencies = info.dependencies;
    if (dependencies) {
        _.forEach(dependencies, function (value, key) {
            var object = addPackage(key);
            packagesOrder.js.concat(object.js);
            packagesOrder.css.concat(object.css);
        });
    }
    if (!_.isArray(main)) {
        main = [main];
    }
    _.forEach(main, function (file) {
        var filename = bowerDir + '/' + name + '/' + file;
        if (_.endsWith(file, '.js')) {
            packagesOrder.js.push(filename);
        } else if (_.endsWith(file, '.css')) {
            packagesOrder.css.push(filename);
        }
    });
    return packagesOrder;
}

function buildJsDependencies(name, jsFiles) {
    var buildedFiles = gulp.src(jsFiles)
        .pipe(concat(name + '.js'));
    gJSBuild.push('./app/build/' + name + '.js');
    buildedFiles.pipe(gulp.dest('./app/build/'));
}

function buildCssDepdendencies(name, cssFiles) {
    if (cssFiles.length > 0) {
        gCSSBuild.push('./assets/css/build/' + name + '.css');
    }
    gulp.src(cssFiles)
        .pipe(sass({
            onError: function (e) {
                console.log(e);
            }
        }))
        .pipe(concat(name + '.css'))
        .pipe(minifyCSS())
        .pipe(gulp.dest('./assets/css/build/'));
}

gulp.task('dependencies', function (done) {
    var dependencies = require('./app/dependencies.json');
    debugMode = dependencies.debug;
    var input = _.map(dependencies.js, addPackage);
    var jsfiles = [];
    var cssfiles = [];
    _.forEach(input, function (obj) {
        if (_.isArray(obj)) {
            jsfiles = jsfiles.concat(obj);
        } else if (_.isObject(obj)) {
            jsfiles = jsfiles.concat(obj.js);
            cssfiles = cssfiles.concat(obj.css);
        }
    });
    buildJsDependencies(dependencies.name, _.uniq(jsfiles));
    cssfiles = cssfiles.concat(dependencies.css);
    buildCssDepdendencies(dependencies.name, _.uniq(cssfiles));
    done();
});

// Concat all the Js and Css files
gulp.task('concat', ['styles'], function (done) {
    var finalJS = gulp.src(gJSBuild)
        .pipe(concat('all.js'));
    if (!debugMode) {
        finalJS.pipe(uglify({
            mangle: false,
            warnings: false
        }));
    }
    finalJS.pipe(gulp.dest('./app/build/'));

    gulp.src(gCSSBuild)
        .pipe(concat('all.css'))
        .pipe(minifyCSS())
        .pipe(gulp.dest('./assets/css/build/'));
    done();
});

gulp.task('reload', ['concat'], function (done) {
    browserSync.reload();
    done();
});

// Build the application and watch the files
gulp.task('build', ['concat'], function () {
    var files = [
        'index.html',
        'app/components/**/*.html',
        'app/shared/**/*.html'
    ];
    browserSync.init(files, {
        server: {
            baseDir: './'
        }
    });

    gulp.watch([
            './app/*.js', './app/components/**/*.js', './app/shared/**/*.js',
            './assets/css/*.scss', './assets/css/**/*.scss'
        ],
        function () {
            console.log('Some modifications appeared !');
            gCSSBuild = [];
            gJSBuild = [];
            gulp.start('reload');
        });
});

// Lint the code and output errors
gulp.task('lint', ['clean'], function (done) {
    gulp.src(['./app/*.js', './app/components/**/*.js', './app/shared/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
    gulp.src(['./app/*.js', './app/components/**/*.js', './app/shared/**/*.js'])
        .pipe(jscs());
    console.log('Some modifications appeared !');
    done();
});

// Lauches Karma unit tests
gulp.task('test', function () {
    return gulp.src('tests/**/*.js')
        .pipe(karma({
            configFile: './karma.conf.js',
            action: 'run'
        }))
        .on('error', function (err) {
            throw err;
        });
});

// Commit the current content on the current branch
gulp.task('commit', function () {
    gulp.src('')
        .pipe(gprompt.prompt([{
                type: 'input',
                name: 'first',
                message: 'Enter your issue name :'
            }, {
                type: 'input',
                name: 'second',
                message: 'Enter the time :'
            }, {
                type: 'input',
                name: 'third',
                message: 'Enter your commit message :'
            }],
            function (res) {
                return gulp.src('./')
                    .pipe(git.commit(res.first + ' #time ' + res.second + ' #comment ' + res.third, {
                        args: '-a'
                    }));
            }));
});

// Push the current content on the current branch
gulp.task('push', function () {

});

// Generate the application documentation
gulp.task('doc', shell.task([
    'node_modules/jsdoc/jsdoc.js ' +
    '-c node_modules/angular-jsdoc/conf.json ' +
    '-t node_modules/ink-docstrap/template ' +
    '-d doc/ ' +
    '-r app/'
]));

// Obfuscate the application code
gulp.task('obfuscate', function () {

});

// Delete the builded content
gulp.task('clean', function (done) {
    gulp.src('./assets/css/build/*.css', {
            read: false
        })
        .pipe(rimraf());
    gulp.src('./app/build/*.js', {
            read: false
        })
        .pipe(rimraf());
    gulp.src('./doc/*', {
            read: false
        })
        .pipe(rimraf({
            force: true
        }));
    done();
});

gulp.task('default', ['clean', 'build']);
