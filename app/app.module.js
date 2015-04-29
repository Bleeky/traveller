'use strict';

angular
    .module('traveller', [])
    .controller('testController', function () {
        var vm = this;
        vm.test = 'This is a test variable. Maybe ?';
        vm.roger = 'I love potatoes ! Yet creamy #creamyyy !';
        vm.gulp = 'I love potatoes but tomatoes to, with a bit of sauce !';
    });
