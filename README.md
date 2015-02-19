# Installation
Run `bower install --save git@github.com:praece/ng-auth.git#master`<br>
Add `pr.auth` as a dependency to your app
```

Include all javascript files:
```
<script src="../bower_components/praece-ng-auth/dist/praece-ng-auth.js"></script>
<script src="../bower_components/ui-router/release/angular-ui-router.js"></script>
<script src="../bower_components/a0-angular-storage/dist/angular-storage.js"></script>
<script src="../bower_components/angular-jwt/dist/angular-jwt.js"></script>
<script src="../bower_components/angular-cookies/angular-cookies.js"></script>
<script src="../bower_components/auth0.js/build/auth0.js"></script>
<script src="../bower_components/auth0-angular/build/auth0-angular.js"></script>
<script src="../bower_components/auth0-lock/build/auth0-lock.js"></script>
```

# Example - adding the module dependency and setting the configuration up in your angular app.
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
