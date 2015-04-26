'use strict';

var app = angular.module('traveller', []);

app.controller('testController', function() {
  var testController = this;
  testController.test = 'This is a test variable.';
  testController.roger = 'I love potatoes !';
  testController.gulp = 'I love potatoes but tomatoes to, with a bit of sauce !';
});
