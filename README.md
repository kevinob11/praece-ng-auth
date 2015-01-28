#Installation

Use bower install to install the following dependencies:
```
auth0-angular
a0-angular-storage
angular-jwt
angular-cookies
auth0-lock
```

Add the `pr.auth` module dependency to your angular app definition (index.js file) and configure it by calling the init method of the authProvider. Use your own domain and clientID (provided by auth0).
```js
angular.module('pr.auth').config( [
  'authProvider',
function (authProvider) {
    authProvider.init({
      domain: 'your-domain.auth0.com',
      clientID: 'bjrT2sObtN7szbJfnEniLjkXOPmFDtxZ'
    });
}]);
```
