# Motivation
This is an API for iCloud services.

# API : login
```
var client = new iCloud();
client.login({
  apple_id : "your_apple_id",
  password : password,
}, function(err) {
  if(err)
    throw "nope";

  client.saveSession("session.json");//for future usage
});

//or
client.loadSessionFile("session.json", function(err) {
  if(err)
    throw "try refreshing your credentials (session has expired)";
});

```

## API : contacts
```
// Fetch iCloud contacts
client.contact.fetchAll(function(err, contacts){
  //tada
});
```

## API : photo (&videos)

```
//list icloud photo albums
client.photo.fetchAlbums(function(err, albums){
  //albums are like [{album:title}, {album:title}]
});

// list photo (&video) in an album
client.photo.fetchMedias(album, function(err, medias){
  //medias are like [{photo:title}, {photo:title}]
});


// download something
client.photo.downloadMedia(media, [quality = original], function(err, stream){
  var dest = fs.createWriteStream(photo.title);
  stream.pipe(dest).on("end", function(){
    console.log("TADAAAA");
  });
});
```

# Notes
iCloud use well balanced GUID indexed JSON models for contacts & medias, so this API forward them unmodified (see examples above).

# Disclaimer
iCloud is a property of Apple and they might do whatever they want with it, anytime. Use this - unofficial - module accordingly.


# Credits
* 131
* https://github.com/matin/icloud/
* https://github.com/picklepete/pyicloud/


