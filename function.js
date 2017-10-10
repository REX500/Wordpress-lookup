'use strict';
const co = require('co');

var request = require('request');
var rp = require('request-promise');

let result = {};
let resultBad = {};
let resultSemiBed = {};
resultSemiBed.wordpress = true;
resultSemiBed.version = null;
resultBad.wordpress = false;
resultBad.version = null;
let regexMeta = /(<meta name="generator" content="WordPress )+(\d\.\d\.\d)(" \/>)/g;

function getWebsiteFramework(url) {
  return co(function *() {
      /********************************************/
      /* CASES THAT TEST IF THE SITE IS WORDPRESS */
      /********************************************/

    // let value ?= yield checkWebsiteWordpress(url);
    if (yield checkWebsiteWordpress(url)) {
      // we can now run our tests :)

      // #1 case - checking the whole body for the version
      const caseOneValue = yield checkMainUrlBody(url);
      if (caseOneValue !== false && caseOneValue !== undefined) {
        // console.log('CASE ONE VALUE: ' + caseOneValue);
        result.wordpress = true;
        result.version = caseOneValue;
        return result;
      }
      // #2 case - checking if /url/feed has a version
      const caseTwoValue = yield checkIfFeed(url);
      if (caseTwoValue !== false && caseTwoValue !== undefined) {
        // console.log('CASE TWO VALUE: ' + caseTwoValue);
        result.wordpress = true;
        result.version = caseTwoValue;
        return result;
      }
      return resultSemiBed;
    } else {
      return resultBad;
    }
  });
}

function checkWebsiteWordpress(url) {
  return co(function *() {
    // IS IT A WORDPRESS WEBSITE?

    // check if we can load at least one of the uri/extention links
    if (yield checkMainUrlBody(url)) {
      // console.log('Check main body fired');
      return true;
    } else if (yield checkIfWpLogin(url)) {
      // console.log('Wp login fired!');
      return true;
    } else if (yield checkIfAdmin(url)) {
      // console.log('Admin fired!');
      return true;
    } else if (yield checkIfFeed(url, 1)) {
      // console.log('Feed fired');
      return true;
    } else if (yield checkIfWpTrackback(url)) {
      // console.log('Trackback fired');
      return true;
    }
    // console.log('Returning false');
    return false;
  });
}

function checkMainUrlBody(url) {
  return co(function *() {
    const request = yield rp('http://' + url);
    return request;
  }).then(function(value) {
    if (regexMeta.test(value)) {
      let found = value.match(regexMeta);
      let version = found[0].slice(42, 47);
      // version var is the wp version we are looking for
      return version;
    }
    return false;
  }, function(err) {
    // console.error(err.stack);
    return false;
  });
}

// CHECKS IF THE url/feed EXTENSION
function checkIfFeed(url, load = 0) {
  return co(function *() {
    const request = yield rp('http://' + url + '/feed');
    return request;
  }).then(function(value) {
    if (load === 1) {
      return true;
    } else {
      if (value.indexOf('wordpress')) {
        // looking for a <generator> tag that holds the version of wordpress
        let regexOne = /(<generator>)(http(s)?:\/\/wordpress\.org\/\?v=)+(\d\.\d\.\d)(<\/generator>)/g;

        if (regexOne.test(value)) {
          let found = value.match(regexOne);
          let version = found[0].slice(36, 41);
          return version;
        } else if (regexMeta.test(value)) {
          let found = value.match(regexMeta);
          let version = found[0].slice(42, 47);
          return version;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }, function(err) {
    // console.error(err.stack);
    return false;
  });
}

// CHECKS IF url/wp-login EXTENSION EXISTS
// CANT GET VERSION NUMBER TROUGH THIS
function checkIfWpLogin(url) {
  return co(function *() {
    const request = yield rp('http://' + url + '/wp-login.php');
    return request;
  }).then(function(value) {
    // console.log('Wp login works');
    return true;
  }, function(err) {
    // console.error(err.stack);
    return false;
  });
  // return rp('http://' + url + '/wp-login.php')
  // .then(function(body) {
  //   return true;
  // })
  // .catch(function(err) {
  //   // console.log(err);
  //   return false;
  // });
}

// CHECKS IF url/wp-trackback.php EXTENSION EXISTS
// CANT GET VERSION NUMBER TROUGH THIS
function checkIfWpTrackback(url) {
  return co(function *() {
    const requestBody = yield rp('http://' + url + '/wp-trackback.php');
    return requestBody;
  }).then(function(value) {
    return true;
  }, function(err) {
    // console.error(err.stack);
    return false;
  });
  // return rp('http://' + url + '/wp-trackback.php')
  //  .then(function(body) {
  //    return true;
  //  })
  // .catch(function(err) {
  //   return false;
  // });
}

// CHECKS IF url/wp-admin EXTENSION EXISTS
// CANT GET VERSION NUMBER TROUGH THIS
function checkIfAdmin(url) {
  return co(function *() {
    const request = yield rp('http://' + url + '/wp-admin');
    return request;
  }).then(function(value) {
    return true;
  }, function(err) {
    // console.error(err.stack);
    return false;
  });
  // return rp('http://' + url + '/wp-admin').then(function(body) {
  //   return true;
  // }).catch(function(err) {
  //   // console.log(err);
  //   return false;
  // });
}

module.exports = {
  getWebsiteFramework
};
