'use strict';

angular.module('pr.auth', ['ui.router', 'auth0', 'angular-storage', 'angular-jwt']);

/**
* config() registers a function to 
* jwtInterceptorProvider.tokenGetter
* and adds jwtInterceptor as an interceptor to $httpProvider
*/
angular.module('pr.auth').config( [
  '$httpProvider',
  'jwtInterceptorProvider',
function ($httpProvider, jwtInterceptorProvider) {
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
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
    var token = authSrvc.load();

    //if we have a token and the token has expired
    //refresh the token
    if (token && jwtHelper.isTokenExpired(token)) {
      event.preventDefault();
      authSrvc.refresh().then(function() {
        $state.go(toState.name, toParams);
      });
    } else if (!auth.isAuthenticated) {
      event.preventDefault();
      authSrvc.login(toState, toParams);
    }
  });

  $rootScope.authSrvc = authSrvc;
  $rootScope.auth = auth;
}]);
