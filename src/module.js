'use strict';

angular.module('pr.auth', ['ui.router', 'auth0', 'angular-storage', 'angular-jwt']);

/**
* config() registers a function to 
* jwtInterceptorProvider.tokenGetter
* and adds jwtInterceptor as an interceptor to $httpProvider
*/
angular.module('pr.auth').config( [
  '$httpProvider',
  '$stateProvider',
  'jwtInterceptorProvider',
function ($httpProvider, $stateProvider, jwtInterceptorProvider) {
  jwtInterceptorProvider.tokenGetter = [
    'store',
    'jwtHelper',
    'auth',
    'authSrvc',
    'config',
  function(store, jwtHelper, auth, authSrvc, config) {
    if (config.url.indexOf('.html') !== -1) return true;
    if (auth.idToken && jwtHelper.isTokenExpired(auth.idToken)) {
      return authSrvc.refresh();
    } else if (auth.idToken) {
      return auth.idToken;
    }

    return null;
  }];

  $httpProvider.interceptors.push('jwtInterceptor');

  $stateProvider
    .state('login', {
      url: '/login',
      template: '<div></div>'
    });
}]);

/**
* run() registers a method which is called whenever a state change begins.
* This function loads our token, if we now have a token and it has expired,
* it prevents the page from loading and refreshes the token.
* Once the token has been refreshed, it loads the page.
* If we are not authenticated, it prevents the page from loading, and
* asks the user to log in.   
*/
angular.module('pr.auth').run( [
  'authSrvc',
  'auth',
  '$rootScope',
  '$state',
  'store',
  'jwtHelper',
function (authSrvc, auth, $rootScope, $state, store, jwtHelper) {
  var redirect = {state: {}, params: {}};

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      var token = authSrvc.load();
      var refresh = store.get('refreshToken');

      if (!auth.isAuthenticated) {
        if (toState.name !== 'login') {
          redirect = {
            state: toState,
            params: toParams
          };
          event.preventDefault();
          return $state.go('login');
        }

        if (token && refresh && jwtHelper.isTokenExpired(token)) {
          authSrvc.refresh().then(function() {
            $state.go(redirect.state, redirect.params);
          });
          return true;
        }

        authSrvc.login(redirect.state, redirect.params);
      }
  });

  $rootScope.authSrvc = authSrvc;
  $rootScope.auth = auth;
}]);