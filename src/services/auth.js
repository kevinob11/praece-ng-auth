'use strict';

angular.module('pr.auth').service('authSrvc', [
  'auth',
  'store',
  'jwtHelper',
  '$state',
  '$q',
  '$location',
function (auth, store, jwtHelper, $state, $q, $location) {
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
    var token = store.get('token');
    var profile = store.get('profile');

    if (token && !jwtHelper.isTokenExpired(token)) {
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

      if (toState.name) {
        $state.go(toState.name, toParams);
      } else {
        $location.url('/');
      }
    }, function(error) {
      console.log(error);
    });
  };

  /**
   * store() saves the data on auth into the store which allows it to be 
   * retreived if the user refreshes the page.
   */
  authSrvc.store = function() {
    store.set('token', auth.idToken);
    store.set('profile', auth.profile);
  };

  /**
   * logout() logs the user out by removing their tokens and information from 
   * the store, and returns the user to the login() state.
   */
  authSrvc.logout = function() {
    store.remove('token');
    store.remove('profile');
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
        store.set('token', token);
        authSrvc.load();
      })
      ['catch'](function() {
        authSrvc.logout();
      });
  };
}]);