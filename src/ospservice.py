# -*- coding: utf-8 -*-
# Copyright 2018 IBM Corp. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import base64
from flask import Flask, jsonify, render_template
from flask import request, redirect, url_for

from werkzeug.utils import secure_filename

import thinkdsp

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = set(['wav', 'mp3'])

app = Flask(__name__)
app.config['SECRET_KEY'] = 'please subtittute this string with something hard to guess'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


def genUploadDir(theDir):
    if not os.path.exists(theDir):
        app.logger.info('Creating directory %s' % theDir)
        os.mkdir(theDir)

def fileCheck(request):
    file = None
    errorTxt = ''
    if 'file' not in request.files:
        app.logger.info('no file part')
        errorTxt = 'No file provided'
    else:
        file = request.files['file']
        if file.filename == '':
            app.logger.info('no file selected')
            errorTxt = 'Unable to determine filename'
        else:
            app.logger.info('filename found')
    return file, errorTxt

def allowed_file(filename):
    app.logger.info('file is allowed')
    app.logger.info('filename is %s ' % filename)
    ext = filename.rsplit('.', 1)[1].lower()
    return '.' in filename and ext in ALLOWED_EXTENSIONS

def read_wave(filepath):
    sounds = []
    test_wave = thinkdsp.read_wave(filepath)

    if (test_wave) :
        spectrum = test_wave.make_spectrum()
        app.logger.info('Have spectrum')
        if (spectrum) :
            pos = 0
            for freq in range(10, 8000, 53):
                pos = searchInArray(pos, freq, spectrum.fs)
                sounds.append(spectrum.hs[pos].real)

    return sounds

def searchInArray(last, freq, data):
    curr = last
    #print('Looking for %d' % freq)
    for s in range(last, data.size):
        if freq < int(data[s]):
            if s > 0:
                 curr = s
                 break
    return curr

def read_wave_numbers(filepath):
    app.logger.info('----------------------')
    app.logger.info('will be reading file from %s ' % filepath)
    app.logger.info('----------------------')
    sounds = []
    test_wave = thinkdsp.read_wave(filepath)
    app.logger.info('Have response from wave processing')

    if (test_wave) :
        spectrum = test_wave.make_spectrum()
        app.logger.info('Have spectrum')
        if (spectrum) :
            pos = 0
            for freq in range(10, 8000, 53):
                pos = searchInArray(pos, freq, spectrum.fs)
                sounds.append(spectrum.hs[pos].real)

    return sounds

def generateColumnHeaders():
    columns = []
    for c in range(2, 153):
        colName = "COLUMN{}".format(c)
        columns.append(colName)
    return columns


@app.route('/audio', methods=['GET', 'POST'])
def mlhome():
    app.logger.info('mlhome page requested')
    allinfo = {}
    if request.method == 'POST':
        app.logger.info('it is a POST')
        # check if the post request has the file part
        file, errorTxt = fileCheck(request)
        if not file:
            allinfo['error'] = errorTxt
        elif not allowed_file(file.filename):
            allinfo['error'] = 'Only accepting audio files'
        else:
            app.logger.info('file ready to upload')
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            file.close()
            results = read_wave(filepath)
            print(results)
            allinfo['results'] = results
        #return redirect(url_for('mlhome'))
        return render_template('/audio.html', info=allinfo)
    else:
        app.logger.info('it is a GET request')
        return render_template('/audio.html', info=allinfo)

@app.route('/audio/api', methods=['POST'])
def getResults():
    app.logger.info('REST API for process has been invoked')
    results = {}
    theData = {"error":"Application Not Finished"}

    print('request files are', request.files)
    print('request files are', request.files.to_dict())

    file = request.files.get('audiodata', None)
    if not file:
        theData['error'] = 'No Audio File Submitted'
    elif not allowed_file(file.filename):
        theData['error'] = 'Unable to process submitted file'
    else:
        print(file.filename)
        if allowed_file(file.filename):
            app.logger.info('file ready to upload')
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            app.logger.info('Saving file in %s' % filepath)
            file.save(filepath)
            file.close()
            theData['results'] = read_wave(filepath)
            del theData['error']
            app.logger.info(theData['results'])

    results["results"] = theData;
    return jsonify(results), 201


@app.route('/audio/nodered', methods=['POST'])
def getNodeRedResults():
    app.logger.info('REST API for process has been invoked')
    results = {}
    theData = {"error":"Application Not Finished"}

    print('request files are', request.files)
    audiotemp = request.form['audio_file']
    audio = base64.b64decode(audiotemp)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'sound.wav')
    newfile = open(filepath, 'wb')
    newfile.write(audio)
    newfile.close()
    if newfile:
        app.logger.info('file ready to upload')
        theData['values'] = []
        theData['values'].append(read_wave_numbers(filepath))
        theData['fields'] = generateColumnHeaders()
        del theData['error']
        app.logger.info(theData['values'])

    results["results"] = theData;
    return jsonify(results), 201




genUploadDir(app.config['UPLOAD_FOLDER'])
port = os.getenv('PORT', '5000')
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(port), debug=True)
