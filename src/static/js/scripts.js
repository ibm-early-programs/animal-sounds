/*
   Copyright 2018 IBM Corp. All Rights Reserved.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

$(document).ready(function() {
  javascriptCheck();
});


function javascriptCheck() {
  // if javascript is enabled on the browser then can
  // remove the warning message
  $('#no-script').remove();
}

function onPerformClick(urlForAPI){
  console.log('Will be sendingrequest to ', urlForAPI);

  $('#id_errormessagefromserver').text(
         'Service has been invoked, waiting for response');

  var files = $('#audiofile');
  if (files && files['0'] && files['0'].files
            && files['0'].files[0]
            && files['0'].files[0]['name']) {
    var filename = files['0'].files[0]['name'];
    var audioBlob = files['0'].files[0];
	  var fd = new FormData();
    fd.append('fname', filename);
  	fd.append('audiodata', audioBlob);

    $.ajax({
  		type: 'POST',
      url: urlForAPI,
  		data: fd,
  		processData: false,
  		contentType: false,
      success: processOK,
      error: processNotOK
  	});
  } else {
    $('#id_errormessagefromserver').text(
           'File not specified');
  }
}

function processNotOK() {
  // There was a problem in the request
  console.log('REST API call failed');
  $('#id_errormessagefromserver').text('Service has failed');
}

function processOK(response) {
  console.log('REST API call was good');
  console.log(response);
  // Check for Error
  var outerresults = response['results'];
  if (outerresults && outerresults['results']) {
    results = outerresults['results'];
    console.log('Processing results');
    console.log(results);
    var errMessage = results['error'];
    if (errMessage) {
      $('#id_errormessagefromserver').text(errMessage);
    } else if (Array.isArray(results)){
      $('#id_errormessagefromserver').text(results.join());
    } else {
      $('#id_errormessagefromserver').text('Nothing to show');
    }

    console.log(results);
  }
}
