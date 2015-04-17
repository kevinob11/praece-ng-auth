'use strict';

angular.module('pr.auth', ['ui.router', 'auth0', 'ngStorage', 'angular-jwt']);

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
  function(auth, config) {
    // Ignore loading of html templates.
    if (config.url.indexOf('.html') !== -1) return true;
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

  $rootScope.$on('authSuccess', function() {
    console.log('We\'ve successfully logged in, now load your current user!');
  });

  $rootScope.authSrvc = authSrvc;
  $rootScope.auth = auth;
}]);
'use strict';

angular.module('pr.auth').service('authSrvc', [
  'auth',
  '$localStorage',
  'jwtHelper',
  '$state',
  '$q',
  '$location',
  '$rootScope',
function (auth, $localStorage, jwtHelper, $state, $q, $location, $rootScope) {
  var refreshPromise;
  var authSrvc = this;
  var settings = {
    disableSignupAction: true,
    rememberLastLogin: false,
    gravatar: false,
    closable: false,
    authParams: {
      scope: 'openid email'
    }
  };

  /**
   * setIcon() set the icon for 
   */
  authSrvc.setIcon = function(icon) {
    settings.icon = icon;
  };

  /**
   * load() loads the token from the store if the user is not authenticated, 
   * and refreshes the token if it has expired.
   *
   * @return {object} promise
   */
  authSrvc.load = function() {
    var token = $localStorage.authToken;
    var profile = $localStorage.authProfile;

    if (token && !jwtHelper.isTokenExpired(token)) {
      $rootScope.$broadcast('authSuccess');
      return auth.authenticate(profile, token);
    }

    return $q.reject('Token is empty or expired.');
  };

  /**
   * login() calls the auth signin method, which pops up a login box for the 
   * user. Once the user has signed in, it saves the users token and profile
   * to the store and redirects to the proper page.
   */
  authSrvc.login = function(toState, toParams) {
    auth.signin(settings, function() {
      authSrvc.store();
      $rootScope.$broadcast('authSuccess');

      if (toState.name) return $state.go(toState.name, toParams);

      $location.url('/');
    }, function(error) {
      console.log(error);
    });
  };

  /**
   * store() saves the data on auth into the store which allows it to be 
   * retreived if the user refreshes the page.
   */
  authSrvc.store = function() {
    $localStorage.authToken = auth.idToken;
    $localStorage.authProfile = auth.profile;
  };

  /**
   * logout() logs the user out by removing their tokens and information from 
   * the store, and returns the user to the login() state.
   */
  authSrvc.logout = function() {
    delete $localStorage.authToken;
    delete $localStorage.authProfile;
    auth.signout();
    $state.go('login');
  };

  /**
   * refresh() refresh our token so it doesn't expire, this occurs on every
   * page load.
   */
  authSrvc.refresh = function() {
    auth.renewIdToken(auth.idToken)
      .then(function(token) {
        $localStorage.authToken = token;
        var profile = $localStorage.authProfile;
        return auth.authenticate(profile, token);
      })
      ['catch'](function() {
        authSrvc.logout();
      });
  };
}]);
'use strict';

angular.module('pr.auth').controller('loginCtrl', [
  'authSrvc',
  '$state',
  '$stateParams',
  '$location',
function (authSrvc, $state, $stateParams, $location) {
  var redirect = {};
  redirect.state = $stateParams.state || {};
  redirect.params = $stateParams.params || {};

  authSrvc.load()
    .then(function()  {
      // We've successfully loaded, refresh the token.
      authSrvc.refresh();

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