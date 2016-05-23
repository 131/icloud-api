"use strict";

var fs     = require('fs');
var url    = require('url');
var Class  = require('uclass');

var merge   = require('mout/object/merge');
var series  = require('async/series');
var request = require('nyks/http/request');
var sort    = require('nyks/object/sort');
var detach  = require('nyks/function/detach');




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
    var age = (Date.now() - Number(this.session.session_creation || 0))/1000;
    if(age > 86400 * 5)
      return chain("Session too old");

      //detach callback so there is a return value !!
    var self = this;
    series([function(chain){
      self.photo   = new Photo(self, detach(chain));
    }, function(chain){
      self.contact = new Contact(self, detach(chain));
    }], chain);

  },

  saveSession : function(session_path){
    fs.writeFileSync(session_path, JSON.stringify(this.session, null, 2));
    console.log("Wrote session in %s", session_path);
  },


  login : function(credentials, chain) {

    var remote = 'https://setup.icloud.com/setup/ws/1/login';


    var data = merge({
        'extended_login': true,
    }, credentials), self = this;

    request(merge(url.parse(remote), {headers: HEADERS, json:true}), data, function(err, body, res) {

      console.log("Hi %s !", body.dsInfo.fullName);
  
      var cookies = res.headers['set-cookie'],
          jar = {},
          session_path = 'session.json';

      cookies.forEach(function(cookie){
        cookie = parse(cookie);
        jar[cookie.name] = cookie;
      });

      self.session = sort(body, ['dsInfo', 'webservices']);
      self.session.jar = jar;
      self.session.session_creation = Date.now();
      chain();
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
