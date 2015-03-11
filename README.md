[![Build Status](https://travis-ci.org/jiaola/marc8.svg?branch=0.0.1)](https://travis-ci.org/jiaola/marc8)

A Node.js module to convert MARC8 encoded string to UTF-8.

## Installation

    npm install marc8

## Usage

```javascript
var marc8 = require('marc8');

var options = {
    normalization: 'NFC',
    invalid: 'replace',
    replace: '',
    expandNCR: false
};
marc8(marc8_string, options);
```

### Options

the options parameter is optional. If used, the following options can be set.

* `normalization`: by default return NFC normalized, but set :normalization option to:
    "NFC", "NFD", "NFKC", "NFKD", or false. Set to false for higher performance.
* `expandNCR`: By default, escaped unicode 'named character references' in Marc8 will
    be translated to actuall UTF8. Eg. "&#x200F;". But pass expandNCR: false to disable.
* `invalid`: Bad Marc8 bytes? By default will throw an error message. Set option invalid: "replace"
    to instead silently replace bad bytes with a replacement char -- by default Unicode
    Replacement Char, but can set option replace to something else include empty string.
* `replace`: used with the option invalid. For example:
    `marc8(bad_marc8, {invalid: "replace", replace: "")`


### Example

```javascript
var marc8 = require('marc8');

var marc8Str = "Conversa\xF0c\xE4ao \xC1";
var unicodeStr = "Conversação \u2113";

var converted = marc8(marc8Str);

console.log(converted === unicodeStr); // will print true
```
