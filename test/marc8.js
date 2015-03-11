'use strict';

var marc8 = require('../lib/marc8');
var unorm = require('unorm');
var fs = require('fs');

describe('marc8', function () {
    it('should convert example one', function (done) {
        var value = marc8("Conversa\xF0c\xE4ao", {normalization: 'NFC'});
        expect(value).equal(unorm.nfc("Conversação"));
        done();
    });

    it('should work for many cases from testing files', function(done) {
        var utf8_lines = fs.readFileSync('test/data/test_utf8.txt').toString().split("\n");
        var marc8_lines = fs.readFileSync('test/data/test_marc8.txt').toString().split("\n");
        for (var i = 0; i < utf8_lines.length; i++) {
            var utf8_line = utf8_lines[i];
            var marc8_line = marc8_lines[i];
            var value = marc8(marc8_line, {normalization: 'NFC'});
            expect(value).equal(utf8_line);
        }
        done();
    });

    it('should translate with explicit normalization', function(done) {
        var marc8_string = "Conversa\xF0c\xE4ao \xC1";
        var unicode_string = "Conversação \u2113";

        var unicode_c   = unorm.nfc(unicode_string);
        var unicode_kc  = unorm.nfkc(unicode_string);
        var unicode_d  = unorm.nfd(unicode_string);
        var unicode_kd  = unorm.nfkd(unicode_string);

        expect(marc8(marc8_string, {normalization: 'nfc'})).equal(unicode_c);
        expect(marc8(marc8_string, {normalization: 'nfkc'})).equal(unicode_kc);
        expect(marc8(marc8_string, {normalization: 'nfd'})).equal(unicode_d);
        expect(marc8(marc8_string, {normalization: 'nfkd'})).equal(unicode_kd);

        expect(marc8(marc8_string, {})).equal(unicode_string);
        done();
    });

    it('should throw an error when finding bad bytes', function(done) {
        var bad_marc8 = "\x1b$1!PVK7oi$N!Q1!G4i$N!0p!Q+{6924f6}\x1b(B";
        expect(function() { marc8(bad_marc8); }).to.throw(/MARC8, input byte offset/);
        done();
    });

    it('should replace bad bytes', function(done) {
        var bad_marc8 = "\x1b$1!PVK7oi$N!Q1!G4i$N!0p!Q+{6924f6}\x1b(B";
        var value = marc8(bad_marc8, {invalid: 'replace'});
        expect(value).equal("米国の統治の仕組�");
        done();
    });

    it('should replace bad bytes with empty string', function(done) {
        var bad_marc8 = "\x1b$1!PVK7oi$N!Q1!G4i$N!0p!Q+{6924f6}\x1b(B";
        var value = marc8(bad_marc8, {invalid: 'replace', replace: ""});
        expect(value).equal("米国の統治の仕組");
        done();
    });

    it('should handle ncr (named character references)', function(done) {
        var marc8_ncr = "Weird &#x200F; &#xFFFD; but these aren't changed #x2000; &#200F etc.";
        var value = marc8(marc8_ncr);
        var value_no_ncr = marc8(marc8_ncr, {expandNCR: false});
        expect(value).equal("Weird \u200F \uFFFD but these aren't changed #x2000; &#200F etc.");
        expect(value_no_ncr).equal(marc8_ncr);
        done();
    });
});
