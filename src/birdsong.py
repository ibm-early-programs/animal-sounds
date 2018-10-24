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

import thinkdsp
import os
import glob
import json


def searchInArray(last, freq, data):
    curr = last
    #print('Looking for %d' % freq)
    for s in range(last, data.size):
        if freq < int(data[s]):
            if s > 0:
                 curr = s
                 break
    return curr

def writeSpectogramToFile(file, spectrum):
    pos = 0
    #print('In writeSpectoramToFile')
    for freq in range(10, 8000, 53):
        pos = searchInArray(pos, freq, spectrum.fs)
        file.write(str(spectrum.hs[pos].real))
        file.write(',')
    file.write('\n')


print('BirdSong OSP Converter Application is starting')

filedir = "../audio/birdsong/train/wav/"
fileList = glob.glob("../audio/birdsong/train/wav/*.wav")
#print(fileList)

file = open('../output/birdsgenus.csv', 'w')

for c in range(1, 153):
    colName = "COLUMN{}".format(c)
    file.write(colName)
    file.write(',')

file.write('\n')

with open('../audio/birdsong/train/birdsong.json') as json_file:
    data = json.load(json_file)
    for b in data:
        try:
            #print(b)
            #print(b['file_id'])
            #print('******')
            fileName = filedir + 'xc' + str(b['file_id']) + '.wav'
            #print(fileName)
            test_wave = thinkdsp.read_wave(fileName)
            file.write(b['english_cname'])
            file.write(',')
            # print(test_wave.ys)
            # print(test_wave.ys.size)
            # print(test_wave.ts)
            spectrum = test_wave.make_spectrum()
            writeSpectogramToFile(file, spectrum)

        except FileNotFoundError:
            print('File not found error %s' % fileName)

file.close()

print('Finished')
