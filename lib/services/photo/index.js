"use strict";

var url    = require('url');
var util   = require('util');
var qs     = require('querystring');


var Class   = require('uclass');
var merge   = require('mout/object/merge');
var request = require('nyks/http/request');
var forIn   = require('mout/object/forIn');
var pluck   = require('mout/object/pluck');
var values  = require('mout/object/values');
var combine = require('nyks/object/combine');
var mapLimit    = require('async/mapLimit');


var parseChildAssetsBinaryFeed = require('./_parseChildAssetsBinaryFeed');


var iCloud = new Class({
  Binds : ['_fetchAssetsPageInfos'],

  syncToken : null,

  initialize : function(icloud, chain){
    var self = this;

    this.icloud = icloud;

    var params = {
     // 'clientBuildNumber' : '14E45',
     // 'clientId'          : guid(),
    };

    params = merge(params, {'dsid': icloud.session['dsInfo']['dsid']});

    var service_root = icloud.session.webservices['photos']['url'];
    this.service_endpoint = util.format('%s/ph', service_root);
    var remote_url = util.format('%s/startup', this.service_endpoint);

    var query = merge(url.parse(remote_url));

    console.log("Requesting sync token for photo API");

    icloud.request(query, null, function(err, response){

      self.syncToken = response['syncToken'];
      params = merge(params, {
        'syncToken': self.syncToken,
        //'clientInstanceId': params.clientId,
      });

      console.log("Got sync token", self.syncToken);
      chain();

      if(false) res.headers['set-cookie'].forEach(function(cookie){
        cookie = parse(cookie);
        icloud.session.jar[cookie.name] = cookie;
      });
    });

  },


  fetchAlbums : function(chain){

    var folder_url = util.format('%s/folders', this.service_endpoint);
    var query = merge(url.parse(folder_url), {
      qs : { 'syncToken': this.syncToken },
    });

    var albums = {};

    this.icloud.request(query, null, function(err, response) {
      forIn(response.folders, function(album){
        albums[album.serverId] = album;
        if(!album.childAssetsBinaryFeed)
          return;

        try {
          album.assets = parseChildAssetsBinaryFeed(Buffer(album.childAssetsBinaryFeed, 'base64'));
        } catch(e){ console.error(e); }

        delete album.childAssetsBinaryFeed;
      
      });

      chain(null, albums);
    });
  },


  fetchMedias : function(album, chain){
    var assetsIds = values(pluck(album.assets, "asset_id"));

    var tasks = [];
    var page = 200;

    for(var i = 0; i<assetsIds.length ; i+= page)
      tasks.push(assetsIds.slice(i, i+page));

    //console.log("Fetching %d assets, slicing in %d tasks", assetsIds.length, tasks.length);

    mapLimit(tasks, 2, this._fetchAssetsPageInfos, function(err, results){
      results = merge.apply({}, results);

      chain(null, results);
    });
  },

  _fetchAssetsPageInfos : function (assetsIds, chain) {

    var fetch_url = util.format('%s/assets', this.service_endpoint);

    var data = {
      'syncToken': this.syncToken,
      'methodOverride': 'GET',
      'clientIds': assetsIds,
    };

    var query = merge(url.parse(fetch_url), {
      qs : { 'syncToken': this.syncToken },
    });

    this.icloud.request(query, data, function(err, response) {
      var assets = {};
      forIn(response.assets, function(asset){
        assets[asset.serverId] = asset;
        asset.versions = {};

        forIn(asset.derivativeInfo, function(v) {
          var headers = ["version", "width", "height", "size", "mimetype",  "u1", "u2", "filemtime", "url", "filename"];
          v = combine(headers, v.split(":"));
          v.url = qs.unescape(v.url);
          asset.versions[v.version] = v;
        });

        delete asset.derivativeInfo;
      });

      chain(null, assets);
    });
  },


  downloadMedia :function(/*media, [quality = 'original',] chain*/){
    var args = [].slice.apply(arguments),
      media = args.shift(),
      chain = args.pop(),
      quality = args.shift() || 'original';

    var version = media.versions[quality];
    request(version.url, chain);
  },


});


module.exports = iCloud;
