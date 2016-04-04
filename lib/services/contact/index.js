"use strict";

var util  = require('util');
var merge = require('mout/object/merge');

var Class = require('uclass');


var Contact = new Class({

  initialize : function(icloud, chain) {
    this.icloud = icloud;
    //this.session = icloud.session;
    chain();
  },

  fetchAll : function (chain){

    var contact_url = this.icloud.session.webservices.contacts.url;
    contact_url = util.format("%s/co/startup", contact_url);

    //params = merge(params, {'dsid': session['dsInfo']['dsid']});
    var params = merge({}, {
    //    clientVersion : "2.1",
        locale : "en_US",
        order : "last,first",
    });

    var query = merge(url.parse(contact_url), {
      qs : params,
    });

    this.icloud.request(query, null, function(err, body){
      console.log(res.statusCode, body);
    });

  }

});


module.exports = Contact;
