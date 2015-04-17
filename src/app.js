'use strict';

var demo = angular.module('demo', ['pr.auth']);

demo.controller('demoCtrl', [
  'authSrvc',
  'auth',
  'jwtHelper',

function(authSrvc, auth, jwtHelper){
  var demo = this;

  demo.logout = function() {
    authSrvc.logout()
  };
}]);

demo.config([
  '$stateProvider',
  '$urlRouterProvider',
  'authProvider',

function ($stateProvider, $urlRouterProvider, authProvider) {
  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'demo.html',
      controller: 'demoCtrl as demo'
    });

  $urlRouterProvider.otherwise('/');

  authProvider.init({
    domain: 'praece.auth0.com',
    clientID: 'IUFBVNSyPtMV4qAG2ZOQs5GwUf9099Fc'
  });
}]);


demo.run([
  'authSrvc',
  '$rootScope',

function(authSrvc, $rootScope) {
  authSrvc.setIcon('http://praece.com/images/logos/praece_dark.png');

  $rootScope.$on('authSuccess', function() {
    console.log('We\'ve successfully logged in, now load your current user!');
  });
}

]);