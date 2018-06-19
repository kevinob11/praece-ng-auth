'use strict';

angular.module('pr.auth', ['ui.router', 'auth0.auth0', 'ngStorage', 'angular-jwt']);

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
    'auth',
    'config',
    'jwtHelper',
    'authSrvc',
  function(auth, config, jwtHelper, authSrvc) {
    // Ignore loading of html templates.
    if (config.url.indexOf('.html') !== -1) return true;

    if (!auth.idToken || jwtHelper.isTokenExpired(auth.idToken)) {
      authSrvc.logout();
      return;
    }

    return auth.idToken;
  }];

  $httpProvider.interceptors.push('jwtInterceptor');

  $stateProvider
    .state('login', {
      url: '/login',
      template: '<div></div>',
      controller: 'loginCtrl',
      params: {state: null, params: null}
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
function (authSrvc, auth, $rootScope, $state) {
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
    if (auth.isAuthenticated || toState.name === 'login') return;
    event.preventDefault();
    $state.go('login', {state: toState, params: toParams});
  });

  $rootScope.$on('unauthenticated', function() {
    $state.go('login', {state: $state.current, params: $state.params});
  });

  $rootScope.authSrvc = authSrvc;
  $rootScope.auth = auth;
}]);
