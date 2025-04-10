/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

let aeOAuth = function () {
  let _redirectURL;
  let _redirectURLFromOAuth;
  let _authzCode;
  let _accessToken;
  let _refreshToken;
  let _authzSrvKey;
  let _authzSrv = {
    dropbox: {
      authzURL: `https://www.dropbox.com/oauth2/authorize?client_id=%k&redirect_uri=%r&response_type=code&token_access_type=offline`,
    },
  };


  //
  // Public methods
  //

  return {
    init(aAuthzSrv)
    {
      if (aAuthzSrv == aeConst.FILEHOST_DROPBOX) {
        _authzSrvKey = "dropbox";
      }

      let redirURL = browser.identity.getRedirectURL();

      // TO DO: The redirect URL needs to be registered with Dropbox as a new app.
      this._log("CollectionFox::aeOAuth.js: Redirect URL: " + redirURL);
      let subdomain = redirURL.substring(8, redirURL.indexOf("."));
      _redirectURL = `http://127.0.0.1/mozoauth2/${subdomain}`;
    },


    async getAPIKey()
    {
      let rv;
      
      let resp;
      try {
        resp = await fetch(`https://aecreations-oauth.up.railway.app/readnext/apikey?svc=${_authzSrvKey}`);
      }
      catch (e) {
        console.error("aeOAuth.getAPIKey(): Error calling OAPS /readnext/apikey: " + e);
        throw e;        
      }

      let respBody = await resp.json();
      if (! resp.ok) {
        console.error(`CollectionFox::aeOAuth.js: aeOAuth.getAPIKey(): HTTP error response returned from aeOAPS\nStatus: ${resp.status} - ${resp.statusText}\nDetails:`);
        console.error(respBody);

        throw Error(`Failed to get client ID from aeOAPS\nStatus: ${resp.status} - ${resp.statusText}`);
      }

      rv = respBody["api_key"];

      return rv;
    },
    

    async getAuthorizationCode()
    {
      let rv;

      if (! _authzSrvKey) {
        throw Error("Authorization service not defined");
      }

      let apiKey;
      try {
        apiKey = await this.getAPIKey();
      }
      catch (e) {
        console.error("aeOAuth.getAuthorizationCode(): " + e);
        throw e;
      }

      let authzURL = _authzSrv[_authzSrvKey].authzURL;
      authzURL = authzURL.replace("%k", apiKey);
      authzURL = authzURL.replace("%r", _redirectURL);
      let webAuthPpty = {
        url: authzURL,
        interactive: true
      };

      try {
        _redirectURLFromOAuth = await browser.identity.launchWebAuthFlow(webAuthPpty);
      }
      catch (e) {
        console.error("aeOAuth.getAuthorizationCode(): " + e);
        throw e;
      }

      rv = _authzCode = new URL(_redirectURLFromOAuth).searchParams.get("code");
      return rv;
    },


    async getAccessToken()
    {
      let rv;

      if (! _authzCode) {
        throw Error("Authorization code not defined");
      }

      let requestParams = new URLSearchParams({
        svc: _authzSrvKey,
        grant_type: "authorization_code",
        code: _authzCode,
        redirect_uri: _redirectURL,
      });
      let requestOpts = {
        method: "POST",
        body: requestParams,
      };

      let resp;  
      try {
        resp = await fetch("https://aecreations-oauth.up.railway.app/readnext/token", requestOpts);
      }
      catch (e) {
        console.error("aeOAuth.getAccessToken(): Error getting access token: " + e);
        throw e;
      }
  
      if (! resp.ok) {
        throw Error(`failed to get access token from ${_authzSrvKey}\n\nstatus: ${resp.status} - ${resp.statusText}`);
      }
  
      let respBody = await resp.json();
      _accessToken = respBody["access_token"];
      _refreshToken = respBody["refresh_token"];
      rv = {
        accessToken: _accessToken,
        refreshToken: _refreshToken,
      };

      return rv;
    },


    _log(aString)
    {
      if (aeConst.DEBUG) { console.log(aString) }
    },
  };
}();
