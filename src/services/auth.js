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