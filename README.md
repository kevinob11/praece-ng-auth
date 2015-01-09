#ng-auth

Add the auth0 module dependency to your angular app definition and configure it by calling the init method of the authProvider.
```js
authProvider.init({
  domain: 'your-domain.auth0.com',
  clientID: 'bjrT2sObtN7szbJfnEniLjkXOPmFDtxZ'
});
```

Because auth.refreshIdToken doesn't support passing in a scope and doesn't automatically return the same scope as was used to get the id_token the first time (see [this github issue](https://github.com/auth0/auth0-angular/issues/101) and [this one](https://github.com/auth0/auth0.js/issues/49)), tokens will no longer have the same scope after refreshing. This is a known issue with auth0.js and should be fixed soon.
