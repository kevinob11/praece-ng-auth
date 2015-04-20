'use strict';

angular.module('pr.auth').controller('loginCtrl', [
  'authSrvc',
  '$state',
  '$stateParams',
  '$location',
  '$injector',
function (authSrvc, $state, $stateParams, $location, $injector) {
  var redirect = {};
  redirect.state = $stateParams.state || {};
  redirect.params = $stateParams.params || {};

  authSrvc.load()
    .then(function()  {
      // We've successfully loaded, refresh the token.
      authSrvc.refresh();

      if ($injector.has('$ionicHistory')) {
        var $ionicHistory = $injector.get('$ionicHistory');

        $ionicHistory.nextViewOptions({
          disableAnimate: false,
          disableBack: true
        });

        $ionicHistory.clearHistory();
      }

      if (redirect.state.name) {
        $state.go(redirect.state.name, redirect.params);
      } else {
        $location.url('/');
      }
    })
    ['catch'](function() {
      authSrvc.login(redirect.state, redirect.params);
    });
}]);