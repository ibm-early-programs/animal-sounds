var websocket = null;
const picks = ['woodpecker', 'goose', 'crow', 'swift', 'skylark',
                'plover', 'sparrow', 'jackdaw', 'warbler', 'oyster',
                'loon', 'dove', 'pipit', 'pigeon', 'sandpiper',
                'wryneck'];
var pickpos = 0;
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
  $('#cats-dogs-result').append(createNewDiv(msg));
}
function getFilename(filename) {
  picks.forEach((e, i, a) => {
    if (filename.toLowerCase().includes(e)) {
      pickpos = i;
    }
    console.log('Looking out for ', picks[pickpos]);
  });
}
function onAudioSendClick() {
  console.log('Audio Button Clicked');
  var files = $('#audiofile');
  if (files && files['0'] && files['0'].files
            && files['0'].files[0]
            && files['0'].files[0]['name']) {
    let filename = files['0'].files[0]['name'];
    let audioBlob = files['0'].files[0];
	  let fd = new FormData();
    fd.append('fname', filename);
  	fd.append('audiodata', audioBlob);
    getFilename(filename);
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
  $('#cats-dogs-result').empty();
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
  let table = $('#cats-dogs-result').append(createNewTable());
  table.append(createNewTableHeaders());
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
                 + '</b></td><td><i class="score">' + score
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
  console.log('Have result ', result);
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
      console.log('First is ', result[4][firstPos]);
      console.log('Second is ', result[4][secondPos]);
      addToTable(result, firstPos);
      addToTable(result, secondPos);
    } else {
      console.log('New Style result is', result[0]);
      addToTableV4(result[0]);
    }
  }
}
function unhiglightRows(rows) {
  rows.forEach(function(r) {
      r.removeClass('highlightrow');
  });
}
function highlightRows(rows) {
  rows.forEach(function(r) {
      r.addClass('highlightrow');
  });
}
function checkBest(table) {
  //console.log('Looking at all rows in table');
  let rows = table.children('tbody').children('tr');
  if (rows) {
    let bestscore = 0;
    let bestrows = [];
    let allrows = [];
    rows.each(function() {
      let r = $(this);
      let field = r.find('.score');
      if (field) {
        allrows.push(r);
        let score = field.html();
        if (score > bestscore) {
           bestscore = score;
           bestrows = []
           bestrows.push(r);
        }
        else if (score === bestscore) {
           bestrows.push(r);
        }
      }
    });
    unhiglightRows(allrows);
    highlightRows(bestrows);
  }
}
function addToTable(result, pos) {
  //if ('other' !== result[4][pos].toLowerCase()) {
  if (! result[4][pos].toLowerCase().startsWith('other')) {
    let bird = result[4][pos];
    let score = result[1][pos];
    //let score = result[1][pos].toFixed(2);
    $('.birdtable').append(createNewTableRow(bird, score.toFixed(2)));
    checkBest($('.birdtable'));
  }
}
function addToTableV4(prediction) {
  if (! prediction[0].toLowerCase().startsWith('other')) {
    let high = 0.0;
    prediction[1].forEach((s) => {
      if (s > high) {
        high = s;
      }
    })
    $('.birdtable').append(createNewTableRow(prediction[0], high.toFixed(2)));
    checkBest($('.birdtable'));
  }
}
function setupSockectListeners() {
  websocket.onmessage = function(msg) {
    console.log('data received from websocket', msg);
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
    console.log("connected");
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
  //$('#id_startButton').data("webSocket", ws);
  setupSockectListeners();
}