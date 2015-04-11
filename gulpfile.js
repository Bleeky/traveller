'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var _ = require('lodash');

var gJSBuild = [];

gulp.task('styles', function() {
  gulp.src('/assets/css/dev/*.scss')
    .pipe(sass({
      onError: function(e) {
        console.log(e);
      }
    }))
    .pipe(gulp.dest('dist/css/build/'));
});

gulp.task('javascripts', function() {
  gulp.src(['app/*.js', 'app/components/**/*.js', 'app/shared/**/*.js'])
    .pipe(concat('traveller.js'))
    .pipe(gulp.dest('app/build/'));
  gJSBuild.push('./app/build/traveller.js');
});


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

function buildJsDependencies(name, debug, jsFiles) {
  var buildedFiles = gulp.src(jsFiles)
    .pipe(concat(name + '.js'));
  if (!debug)
    buildedFiles.pipe(uglify());
  buildedFiles.pipe(gulp.dest('./app/build/'));
  gJSBuild.push('./app/build/' + name + '.js');
}

function buildCssDepdendencies(name, cssFiles) {

}

gulp.task('dependencies', function(done) {
  var module = require('./app/dependencies.json');
  var input = _.map(module.js, addPackage);
  var jsfiles = [];
  var cssfiles = [];
  cssfiles = cssfiles.concat(module.css);

  _.forEach(input, function(obj) {
    // If we have a string, it means this is a JS one
    if (_.isArray(obj)) {
      jsfiles = jsfiles.concat(obj);
    } else if (_.isObject(obj)) {
      jsfiles = jsfiles.concat(obj.js);
      cssfiles = cssfiles.concat(obj.css);
    }
  });
  console.log(jsfiles, cssfiles);
  buildJsDependencies(module.name, module.debug, _.uniq(jsfiles));
  buildCssDepdendencies(module.name, _.uniq(cssfiles));
});

gulp.task('concat', function() {
  gulp.src(gJSBuild)
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./app/build/'));
});

gulp.task('default', ['dependencies', 'javascripts', 'styles', 'concat']);
