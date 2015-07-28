(function () {
    'use strict';
    angular
        .module('traveller')
        .controller('TestController', TestController);

    TestController.$inject = ['$http'];
    /**
     * @ngdoc controller
     * @desc An test controller
     * @param  {String} $httprouter description
     * @memberof Controllers
     */
    function TestController($http) {
        var vm = this;
        vm.test = 'This is a test variable. Maybe ?';
        vm.roger = 'I love potatoes ! Yet creamy #saucy #creamy !';
        vm.gulp = 'I love potatoes but tomatoes to, with a bit of sauce !';

        vm.anExample = anExample;
        vm.printVal = printVal;


        /**
         * @ngdoc method
         * @name anExample
         * @desc output the given paramter in the console.
         * @param  {String} firstParam description
         * @param  {String} secondParam description
         * @memberof Controllers.TestController
         */
        function anExample(firstParam, secondParam) {
            console.log(firstParam);
            secondParam += secondParam;
            return secondParam;
        }


        /**
         * @ngdoc method
         * @name printVal
         * @desc output the given paramter in the console.
         * @param  {String} toPrint description
         * @memberof Controllers.TestController
         */
        function printVal(toPrint) {
            console.log(toPrint);
        }
    }
})();
