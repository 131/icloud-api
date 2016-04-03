"use strict";

var fs     = require('fs');
var url    = require('url');
var Class  = require('uclass');

var merge   = require('mout/object/merge');
var series  = require('async/series');
var request = require('nyks/http/request');
var sort    = require('nyks/object/sort');


var Photo  = require('./services/photo');
var Contact = require('./services/contact');


var HEADERS = {
  'origin': 'https://www.icloud.com',
  'content-type': 'text/plain',
};


var parse = require('nyks/http/header/parse').parse_cookie;

var iCloud = new Class({

  initialize : function() {

  },


  loadSessionFile : function(session_path, chain){
    var session;
    try {
      session = fs.readFileSync(session_path);
      session = JSON.parse(session);
    } catch(e){ return chain(e) ;}
    this.loadSession(session, chain);
  },

  loadSession : function(session, chain){
    this.session = session;

    var self = this;
    series([function(chain){
      self.photo   = new Photo(self, chain);
    }, function(chain){
      self.contact = new Contact(self, chain);
    }], chain);

  },


  login : function(credentials) {

    var remote = 'https://setup.icloud.com/setup/ws/1/login';


    var params = merge({
        'extended_login': true,
    }, credentials);

    request(merge(url.parse(remote), {headers: HEADERS, json:true}), params, function(err, body, res) {
      console.log("Hi %s !", body.dsInfo.fullName);
  
      var cookies = res.headers['set-cookie'],
          jar = {},
          session_path = 'session.json';

      cookies.forEach(function(cookie){
        cookie = parse(cookie);
        jar[cookie.name] = cookie;
      });


      var session = sort(body, ['dsInfo', 'webservices']);
      session.jar = jar;

      fs.writeFileSync(session_path, JSON.stringify(session, null, 2));
      console.log("Wrote session in %s", session_path);
    });
  },

  request : function(query, data, chain){

    var query = merge(query, {
      jar : this.session.jar,
      headers: HEADERS,
      json : true,

    });

    request(query, data, chain);
  },

});


module.exports = iCloud;
