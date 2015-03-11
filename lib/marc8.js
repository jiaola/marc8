'use strict';

var CODESETS = require('./marc8_mapping').CODESETS;
var unorm = require('unorm');

var translate = function(marc8_string, options) {
    var basic_latin = 0x42;
    var ansel = 0x45;

    options = options || {};
    var normalization = options.normalization;
    var invalidReplacement = options.replace;
    if (typeof invalidReplacement === 'undefined') {
        invalidReplacement = "\uFFFD";
    }
    var expandNCR = options.expandNCR;
    if (typeof expandNCR === 'undefined') {
        expandNCR = true;
    }

    var g0 = options.G0 || basic_latin; // basic_latin
    var g1 = options.G1 || ansel; // ansel

    var G0_SET = ['(', ',', '$'];
    var G1_SET = [')', '-', '$'];

    if (!marc8_string) return '';

    var buffer = new Buffer(marc8_string, 'ascii');

    var uniList = [];
    var combinings = [];
    var pos = 0;

    var charset, nextByte, codePoint, codeSet, uniString;
    while (pos < buffer.length) {
        if (buffer[pos] === 0x1b) {
            nextByte = buffer[pos+1]
            if (G0_SET.indexOf(String.fromCharCode(nextByte)) >=0) {
                if (buffer.length >= pos+3) {
                    if (buffer[pos+2] == 0x2c /*,*/ && nextByte == 0x24 /*'$'*/) {
                        pos += 1;
                    }
                    g0 = buffer[pos+2];
                    pos = pos + 3;
                    continue;
                } else {
                    uniList.append(String.fromCharCode(buffer[pos]));
                    pos += 1;
                    continue;
                }
            } else if (G1_SET.indexOf(String.fromCharCode(nextByte)) >= 0) {
                if (buffer[pos+2] == 0x2d /*'-'*/ && nextByte == 0x24 /*'$'*/) {
                    pos += 1;
                }
                g1 = buffer[pos+2];
                pos += 3;
                continue;
            } else {
                charset = nextByte;
                if (charset in CODESETS) {
                    g0 = charset;
                    pos += 2;
                } else if (charset === 0x73) {
                    g0 = basic_latin;
                    pos += 2;
                    if (pos === buffer.length) {
                        break;
                    }
                }
            }
        }
        var isMultibyte = (g0 === 0x31);
        if (isMultibyte) {
            codePoint = buffer[pos]*65536 + buffer[pos+1]*256 + buffer[pos+2];
            pos += 3;
        } else {
            codePoint = buffer[pos]
            pos += 1;
        }

        if (codePoint < 0x20 || (codePoint > 0x80 && codePoint < 0xa0)) {
            uni = String.fromCharCode(codePoint);
            continue;
        }

        codeSet = (codePoint > 0x80 && !isMultibyte) ? g1 : g0;
        if (codeSet in CODESETS && codePoint in CODESETS[codeSet]) {
            var pair = CODESETS[codeSet][codePoint];
            var uni = pair[0];
            var cflag = pair[1];
            if (cflag == 1) {
                combinings.push(String.fromCharCode(uni));
            } else {
                uniList.push(String.fromCharCode(uni));
                if (combinings.length > 0) {
                    uniList = uniList.concat(combinings);
                    combinings = [];
                }
            }
        } else {
            if (options.invalid === 'replace') {
                if (uniList[uniList.length-1] !== invalidReplacement) {
                    uniList.push(invalidReplacement);
                    pos += 1;
                }
            } else {
                throw "MARC8, input byte offset " + pos + ", code set: 0x" + codeSet.toString(16) +
                ", code point: 0x" + codePoint.toString(16);
            }
        }

    }
    uniString = uniList.join('');

    if (expandNCR) {
        uniString = uniString.replace(/&#x([0-9A-F]{4,6});/gi, function(_, x) {
            return String.fromCharCode(parseInt("0x"+x));
        });
    }


    if (normalization) {
        switch (normalization.toUpperCase()) {
            case 'NFC':
                uniString = unorm.nfc(uniString);
                break;
            case 'NFD':
                uniString = unorm.nfd(uniString);
                break;
            case 'NFKC':
                uniString = unorm.nfkc(uniString);
                break;
            case 'NFKD':
                uniString = unorm.nfkd(uniString);
                break;
        }
    }

    return uniString;
};


module.exports = translate;
