'use strict';

var app = angular.module('traveller', []);

app.controller('testController', function() {
  this.test = 'This is a test variable. I\'ll not modify.';
  this.roger = 'Roger.';
});
