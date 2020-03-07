'use strict';


var jwt = require('jsonwebtoken');
var jwksClient = require('jwks-rsa');



function authInit(options) {

  var client = jwksClient({
    jwksUri: 'https://sso-dev.pathfinder.gov.bc.ca/auth/realms/5k8dbl4h/protocol/openid-connect/certs'
  })

  const JWT_TOKEN_HEADER = options.CAPTCHA_TOKEN_HEADER || 'Authorization'; // the request header where we expect the jwt token
  const CAPTCHA_NONCE_HEADER = options.CAPTCHA_NONCE_HEADER || 'captcha-nonce'; // the request header where we expect the client nonce

  function getKey(header, callback){
    client.getSigningKey(header.kid, function(err, key) {
      var signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  }

  return {

    verifyJWTResponseMiddleware: function(req, res, next) {
      if (req.headers[CAPTCHA_NONCE_HEADER]) {
        req.isAuthorised = false
        return next();
      }
      var token = req.headers[JWT_TOKEN_HEADER.toLowerCase()] || '';
      token = token.replace('Bearer ', '');

      jwt.verify(token, getKey, options, function(err, decoded) {
        if (err){
          req.isAuthorised = false
          return next();

        } else {
          req.isAuthorised = true
          req.userDetails = {"firstName":decoded.firstName,
            "lastName":decoded.lastName,
            "email":decoded.email,
            "birthDate":decoded.birthDate
          }
          next();
        }
      });

    }

  }

}

module.exports = authInit;
