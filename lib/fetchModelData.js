var Promise = require("Promise");

/**
  * FetchModel - Fetch a model from the web server.
  *     url - string - The URL to issue the GET request.
  * Returns: a Promise that should be filled
  * with the response of the GET request parsed
  * as a JSON object and returned in the property
  * named "data" of an object.
  * If the requests has an error the promise should be
  * rejected with an object contain the properties:
  *    status:  The HTTP response status
  *    statusText:  The statusText from the xhr request
  *
*/


function fetchModel(url) {
  return new Promise(function(resolve, reject) {
      let xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if(xhr.readyState !== 4){
          return;
        }

        // Process our return data
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.response));
        }else{
          reject({
            status: xhr.status, 
            statusText: xhr.statusText
          });
        }
      }

      xhr.open('GET', url);
      xhr.send();
  });
}

export default fetchModel;
