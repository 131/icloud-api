"use strict";

var fs               = require('fs');

var session_path     = "./session.json";
var credentials_path = "./credentials.json";

var iCloud = require('./');
var client = new iCloud();


(function init(chain){
  //or
  client.loadSessionFile(session_path, function(err) {
    if(!err)
      return chain();

    client.login(require(credentials_path), function(err) {
      if(err)
        chain("Nope");

      client.saveSession(session_path);
      chain();
    });
  });

})(function(err){

  if(err)
    throw err;

  if(false) 
    client.contact.fetchAll(function(err, contacts) { });



  client.photo.fetchAlbums(function(err, albums) {

    var album = albums["all-photos"];

    // list photo (&video) in an album
    client.photo.fetchMedias(album, function(err, medias){

      var media = medias[Object.keys(medias)[1]];
      client.photo.downloadMedia(media, function(err, stream){
        var dest = fs.createWriteStream(media.details.filename);
        stream.pipe(dest).on("finish", function(){
          console.log("TADAAAA");
        });
      });

    });

  });




});





