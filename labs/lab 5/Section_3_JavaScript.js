var websocket = null;

$(document).ready(function() {
  allofit();
});

function allofit() {
  javascriptCheck();
  uiHandlers();
  websocketConnect();
}

function javascriptCheck() {
  $('#no-script').remove();
}

function uiHandlers() {
}

function processNotOK() {
  console.log('Error Invoking AJAX');
  reportRESTError('Error Invoking AJAX');
}


function reportRESTError(msg) {
  $('#birds-result').append(createNewDiv(msg));
}

function onAudioSendClick() {
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
      url: 'performBirdAudioReco',
  		data: fd,
  		processData: false,
  		contentType: false,
      success: processAudioOK,
      error: processNotOK
  	});
  } else {
    reportRESTError('File not specified');
  }
}

function processAudioOK(response) {
  $('#birds-result').empty();
  var ok = false;
  if (response) {
    if (response.error) {
      reportRESTError(response.error);
    } else {
      ok = true;
      processAudioClassifiers(response);
    }
  }
  if (!ok) {
    reportRESTError('No Response from VR API');
  }
}

function processAudioClassifiers(response) {
  var table = $('#birds-result').append(createNewTable());
  table.append(createNewTableHeaders());
  table.append(createNewTableRow(response.results[3], response.results[1][scoreColumn])) ;
}


function createNewDiv(message) {
  return $('<div></div>').text(message);
}

function createNewTable() {
  return $('<table class="birdtable" border="1"></table>');
}

function createNewTableHeaders() {
  return $('<thead><tr><th>Name</th><th>Score</th></tr></thead>');
}

function createNewTableRow(classification, score) {
  return $('<tr><td><b>' + classification
                 + '</b></td><td><i>' + score
                 + '</i></td></tr>');
}


// ******************************************************
// Web Socket stuff
// ******************************************************

function determineWSUri() {
  var wsUri = "ws:";
  var loc = window.location;
  if (loc.protocol === "https:") {
    wsUri = "wss:";
  }
  // This needs to point to the web socket in the Node-RED flow
  // ... in this case it's ws/birdsong
  wsUri += "//" + loc.host + "/ws/birdsong";

  return wsUri;
}

function processPredictionResult(result) {
  if (Array.isArray(result)) {
    var first = 0, second = 0;
    var firstPos = 0, secondPos = 0;
    if (result.length >= 5) {
      result[1].forEach(function(e, i, a) {
        if (e > first) {
          if (first > 0) {
            second = first;
            secondPos = firstPos;
          }
          first = e;
          firstPos = i;
        } else if (e > second ){
          second = e;
          secondPos = i
        }
      });
      addToTable(result, firstPos);
      addToTable(result, secondPos);
    }
  }
}

function addToTable(result, pos) {
  if (! result[4][pos].toLowerCase().startsWith('other')) {
    $('.birdtable').append(createNewTableRow(result[4][pos], result[1][pos]))
  }
}

function setupSockectListeners() {
  websocket.onmessage = function(msg) {
    if (msg.data) {
      var data = null;
      try {
        data = JSON.parse(msg.data);
        if (data.result) {
          processPredictionResult(data.result);
        }
      } catch (e) {
        console.log('Error parsing json data');
      }
    }
  }

  websocket.onopen = function() {
    $('#status-socket').text('Connected');
  }

  websocket.onclose = function() {
    $('#status-socket').text('not connected');
    // in case of lost connection tries to reconnect every 2 secs
    setTimeout(websocketConnect, 2000);
  }
}

function websocketConnect() {
  var uri = determineWSUri()
  websocket = new WebSocket(uri);

  setupSockectListeners();
}