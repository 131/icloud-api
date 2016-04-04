"use strict";

/*
* icloud return albums summary in a binary (bit wise) base64 encoded format.
* summary contains very little info about the picture : assetId, ratio & orientation
* This is mostly (only?) used for "greyed out" preloading pannels on icloud.com/#photo
*
* see https://github.com/picklepete/pyicloud/blob/master/pyicloud/services/photos.py
*/

var fs       = require('fs');
var util     = require('util');
var readUInt = require('bitwise').readUInt;

var  contains = require('mout/array/contains');

var  ASSET_PAYLOAD = 255;
var  ASSET_WITH_ORIENTATION_PAYLOAD = 254;
var  ASPECT_RATIOS = [
      0.75,
      4.0 / 3.0 - 3.0 * (4.0 / 3.0 - 1.0) / 4.0,
      4.0 / 3.0 - 2.0 * (4.0 / 3.0 - 1.0) / 4.0,
      1.25,
      4.0 / 3.0, 1.5 - 2.0 * (1.5 - 4.0 / 3.0) / 3.0,
      1.5 - 1.0 * (1.5 - 4.0 / 3.0) / 3.0,
      1.5,
      1.5694444444444444,
      1.6388888888888888,
      1.7083333333333333,
      16.0 / 9.0,
      2.0 - 2.0 * (2.0 - 16.0 / 9.0) / 3.0,
      2.0 - 1.0 * (2.0 - 16.0 / 9.0) / 3.0,
      2,
      3
  ];

module.exports = function parse(buf){

  var payload_encoding = buf[0];

  var  valid_payloads = [ASSET_PAYLOAD, ASSET_WITH_ORIENTATION_PAYLOAD];
  if (!contains(valid_payloads, payload_encoding))
    throw util.format("Unknown payload encoding '%s'", payload_encoding);

  var assets = {}, pos = 8;

  var range_start , range_length , range_end, previous_asset_id;
  while( buf.length - pos >= 48) {
    
    range_start  = readUInt(buf, pos, 24); pos+= 24;
    range_length = readUInt(buf, pos, 24); pos+= 24;
    range_end    = range_start + range_length;

    //console.log({ range_start:range_start , range_length:range_length, range_end:range_end});
    previous_asset_id = 0;

    for(var index = range_start; index < range_end; index++) {
      var aspect_ratio = readUInt(buf, pos, 4); pos+= 4;
      aspect_ratio = ASPECT_RATIOS[aspect_ratio];

      var asset_id;
      var id_size = readUInt(buf, pos, 2); pos+= 2;
      if(id_size) {// A size has been reserved for the asset id
          var size = 2 +  8 * id_size;
          asset_id = readUInt(buf, pos,  size); pos+= size;
      } else {
          // The id is just an increment to a previous id
          var inc = readUInt(buf, pos,  2); pos+= 2;
          asset_id = previous_asset_id + inc + 1;
      }

      var orientation = null;
      if(payload_encoding == ASSET_WITH_ORIENTATION_PAYLOAD) {
        orientation = readUInt(buf, pos,  3); pos+= 3;
      }

      assets[index] = {
        index    : index,
        asset_id : asset_id,
        aspect_ratio: aspect_ratio,
        orientation:orientation,
      };

      previous_asset_id = asset_id
    }
  }

  return assets;
}
