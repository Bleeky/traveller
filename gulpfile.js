'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var _ = require('lodash');
var clean = require('gulp-clean');
var browserSync = require('browser-sync');
var minifyCSS = require('gulp-minify-css');

var gJSBuild = [];
var gCSSBuild = [];
var debugMode;

// Compile, concat and minify all developped CSS.
gulp.task('styles', ['javascripts'], function() {
  gCSSBuild.push('./assets/css/build/traveller.css');
  return gulp.src(['./assets/css/*.scss', './assets/css/dev/*.scss'])
    .pipe(sass({
      onError: function(e) {
        console.log(e);
      }
    }))
    .pipe(concat('traveller.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('assets/css/build/'));
});

// Compile, concat and minify all developped JS.
gulp.task('javascripts', ['dependencies'], function() {
  gJSBuild.push('./app/build/traveller.js');
  return gulp.src(['./app/*.js', './app/components/**/*.js', './app/shared/**/*.js'])
    .pipe(concat('traveller.js'))
    .pipe(gulp.dest('app/build/'));
});

// Add packages and their dependencies recursivly.
function addPackage(name) {
  var
    packagesOrder = {
      css: [],
      js: []
    },
    bowerDir = './bower_components',
    info = require(bowerDir + '/' + name + '/bower.json'),
    main = info.main,
    dependencies = info.dependencies;
  if (dependencies) {
    _.forEach(dependencies, function(value, key) {
      var object = addPackage(key);
      packagesOrder.js.concat(object.js);
      packagesOrder.css.concat(object.css);
    });
  }
  if (!_.isArray(main)) {
    main = [main];
  }
  _.forEach(main, function(file) {
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
  console.log(cssFiles);
  gulp.src(cssFiles)
    .pipe(sass())
    .pipe(concat(name + '.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./assets/css/build/'))
}

gulp.task('dependencies', ['clean'], function(done) {
  var dependencies = require('./app/dependencies.json');
  debugMode = dependencies.debug;
  var input = _.map(dependencies.js, addPackage);
  var jsfiles = [];
  var cssfiles = [];
  _.forEach(input, function(obj) {
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

gulp.task('clean', function() {
  gulp.src('./app/build/*.js')
    .pipe(clean());
  return gulp.src('./assets/css/build/*.css')
    .pipe(clean());
});

gulp.task('concat', ['styles'], function(done) {
  var finalJS = gulp.src(gJSBuild)
    .pipe(concat('all.js'));
  if (!debugMode) {
    finalJS.pipe(uglify({
      mangle: false,
      warnings: false
    }));
  }
  finalJS.pipe(gulp.dest('./app/build/'));

  var finalCSS = gulp.src(gCSSBuild)
    .pipe(concat('all.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./assets/css/build/'));
  done();
});

gulp.task('reload', ['concat'], function(done) {
  browserSync.reload();
  done();
});

gulp.task('build', ['concat'], function() {
  var files = [
    'index.html',
    'app/components/**/*.html',
    'app/shared/**/*.html'
  ];
  browserSync(files, {
    server: {
      baseDir: './'
    }
  });

  gulp.watch([
      'app/*.js', 'app/components/**/*.js', 'app/shared/**/*.js',
      'assets/css/*.scss', 'assets/css/**/*.scss'
    ],
    function() {
      console.log('Some modifications appeared !');
      gulp.start('reload');
    });
});

gulp.task('default', ['build']);
