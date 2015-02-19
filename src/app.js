'use strict';

var demo = angular.module('demo', ['pr.auth']);

demo.controller('demoCtrl', [
  'authSrvc',
  'auth',
  'jwtHelper',

function(authSrvc, auth, jwtHelper){
  var demo = this;

  console.log(jwtHelper.decodeToken(auth.idToken));

  demo.logout = function() {
    authSrvc.logout()
  };
}]);

demo.config([
  '$stateProvider',
  '$urlRouterProvider',
  'authProvider',

function ($stateProvider, $urlRouterProvider, authProvider) {
  //TODO This location does not currently exist. Need to choose/create a home page and set it here
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
