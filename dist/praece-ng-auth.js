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

'use strict';

angular.module('pr.auth').service('authSrvc', [
  'auth',
  'store',
  'jwtHelper',
  '$state',
  '$q',
function (auth, store, jwtHelper, $state, $q) {
  var refreshPromise;

  return {
    /**
    * login() calls the auth signin method, which
    * pops up a login box for the user. Once the user
    * has signed in, it saves the user's details and,
    * if this method was called on state change start,
    * advances the page to the next page
    */
    login: function(toState, toParams) {
      var _this = this;
      toParams = toParams || {};
      auth.signin(_this.settings, function() {
        _this.save();
        if(toState) {
          $state.go(toState.name, toParams);
        }  
      }, function(error) {
        console.log(error);
      });
    },

    /**
    * save() saves the data on auth into the store
    * which allows it to be retreived if the user
    * refreshes the page
    */
    save: function() {
      store.set('token', auth.idToken);
      store.set('refreshToken', auth.refreshToken);
      store.set('profile', auth.profile);
    },

    /**
    * load() loads the token from the store if the user is not 
    * authenticated, and refreshes the token if it has expired
    *
    * @return {String} token
    */
    load: function() {
      if (!auth.isAuthenticated) {
        var token = store.get('token');

        if (token && !jwtHelper.isTokenExpired(token)) {
          auth.authenticate(store.get('profile'), token, null, null, store.get('refreshToken'));
        }
        return token;
      }
    },

    /**
    * refresh() gets the refresh token from the store if auth doesn't have one
    * and then gets a new token from auth0 and saves it in the store
    * and resolves the promise it returns.
    * If anything goes wrong during this process, it logs the user out.
    * If there is already an unresolved refreshIdToken promise, refresh simply returns
    * that promise rather than creating a new one.
    *
    * @return {Object} promise
    */
    refresh: function() {
      var deferred = $q.defer();
      var refreshToken = auth.refreshToken || store.get('refreshToken');
      var _this = this;

      if (refreshPromise) {
        return refreshPromise;
      } else {
        auth.refreshIdToken(refreshToken).then(function(idToken) {
          auth.authenticate(store.get('profile'), idToken, null, null, refreshToken)
          .then(function() {
            _this.save();
            deferred.resolve(idToken);
          }, function(error) {
            console.log(error);
            _this.logout();
          });
        }, function(error) {
          console.log(error);
          _this.logout();
        })
        .finally(function() {
          refreshPromise = null;
        });
        refreshPromise = deferred.promise;
        return deferred.promise;
      }
    },

    /**
    * logout() logs the user out by removing their tokens and information
    * from the store, and returns the user to the login() state
    */
    logout: function() {
      store.remove('token');
      store.remove('refreshToken');
      store.remove('profile');

      this.login('home');
    },

    /**
    * settings used when signing in or refreshing the token
    */
    settings: {
      disableSignupAction: true,
      rememberLastLogin: false,
      authParams: {
        scope: 'openid email offline_access'
      }
    }

  };
}]);