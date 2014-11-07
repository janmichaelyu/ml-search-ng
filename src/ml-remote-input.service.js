(function () {

  'use strict';

  angular.module('ml.search')
    .service('MLRemoteInputService', MLRemoteInputService);

  MLRemoteInputService.$inject = ['$route'];

  function MLRemoteInputService($route) {
    var service = this;

    service.input = '';
    service.mlSearch = null;
    service.callbacks = [];

    function unsubscribe(idx) {
      service.callbacks.splice(idx);
    }

    /**
     * sets the service.input instance property and invokes the registered callbacks
     *
     * @param {string} input
     */
    service.setInput = function setInput(val) {
      service.input = val;
      _.each(service.callbacks, function(callback) {
        callback(service.input);
      });
    };

    /**
     * registers a callback, returning a de-registration function
     *
     * @param {function} callback
     * @return {function} callback de-registration function
     */
    service.subscribe = function subscribe(callback) {
      var idx = service.callbacks.length;
      service.callbacks.push(callback);
      return function() {
        unsubscribe(idx);
      };
    };

    /**
     * helper function for mlRemoteInput directive
     * registers and de-registers a callback that
     *   - updates the $scope parameter
     *   - updates the mlSearch parameter with the mlSearch instance property
     *     (if it exists)
     *
     * @param {object} $scope
     * @param (object) mlSearch
     */
    service.initInput = function initInput($scope, mlSearch) {
      var unsubscribe = service.subscribe(function(input) {
        $scope.qtext = input;
        mlSearch = service.mlSearch || mlSearch;
      });

      $scope.$on('destroy', unsubscribe);
    };

    /**
     * helper function for Search controller
     *
     * - registers and de-registers a callback that
     *   - updates the qtext property of the model parameter
     *   - invokes the searchCallback
     * - sets the mlSearch instance property
     * - initializes the qtext property of the model parameter
     *   (unless it's already set and the instance input property is not)
     *
     * @param {object} $scope
     * @param {object} search ctrl model
     * @param {MLSearchContext} ctrl mlSearch instance
     * @param {function} search callback
     */
    service.initCtrl = function initCtrl($scope, model, mlSearch, searchCallback) {
      var unsubscribe = service.subscribe(function(input) {
        if (model.qtext !== input) {
          model.qtext = input;

          searchCallback();
        }
      });

      $scope.$on('$destroy', unsubscribe);

      service.mlSearch = mlSearch;

      if ( model.qtext.length && !service.input.length ) {
        service.setInput( model.qtext );
      } else {
        model.qtext = service.input;
      }
    };

    /**
     * gets the path for a specified controller from the $route service
     *
     * @param {string} search ctrl name
     * @return {string} search ctrl path
     */
    service.getPath = function getPath(searchCtrl) {
      var matches = _.where($route.routes, { controller: searchCtrl }),
          route = { originalPath: '/' };

      if ( matches.length === 0 ) {
        // TODO: get route from attr, or throw Error('can\t find Search controller') ?
        console.error('can\t find Search controller: ' + searchCtrl);
      }
      else {
        route = matches[0];

        if ( matches.length > 1 ) {
          console.log('multiple Search controller routes; choosing \'' +
                      route.originalPath + '\'');
        }
      }

      return route.originalPath;
    };

  }

}());
