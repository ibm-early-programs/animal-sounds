$(document).ready(function() {
  allofit();
});

function allofit() {
  javascriptCheck();
  uiHandlers();
}

function javascriptCheck() {
  $('#no-script').remove();
}

function uiHandlers() {
  var animalButton = $('#id_analyzeAnimal');
  animalButton.click(
    () => {
      runVRFor($('#id_listcatsdogs').val());
    });
}

function processNotOK() {
  console.log('Error Invoking AJAX');
  reportRESTError('Error Invoking AJAX');
}

function reportRESTError(msg) {
  $('#cats-dogs-result').append(createNewDiv(msg));
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
      url: 'performAudioReco',
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
  var table = $('#cats-dogs-result').append(createNewTable());
  table.append(createNewTableHeaders());
  var scoreColumn = 0;
  if ('dog' == response.results[3]) {
    scoreColumn = 1;
  }
  table.append(createNewTableRow(response.results[3], response.results[1][scoreColumn])) ;
}


function createNewDiv(message) {
  return $('<div></div>').text(message);
}

function createNewTable() {
  return $('<table border="1"></table>');
}

function createNewTableHeaders() {
  return $('<thead><tr><th>Name</th><th>Score</th></tr></thead>');
}

function createNewTableRow(classification, score) {
  return $('<tr><td><b>' + classification
                 + '</b></td><td><i>' + score
                 + '</i></td></tr>');
}
