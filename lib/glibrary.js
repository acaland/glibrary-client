/** @module gLibrary client */

var request = require('request');
var fs = require('fs');
var synchronize = require('synchronize');

var server = 'http://glibrary.ct.infn.it';
var glibraryAPI = server + ':3000';
var gridboxAPI = server + '/dm';


var defaultSE = 'prod-se-03.ct.infn.it';
var defaultVO = 'vo.earthserver.eu';
var defaultRootPath = '/dpm/ct.infn.it/home/';
var defaultPath = defaultRootPath + defaultVO + '/';

/**
 * Configure the gLibrary client to contact the server
 * @param {Object}	options	- Settings for the server
 * @param {string} 	options.server 			- Hostname of the gLibrary Server
 * @param {integer} options.port  			- Listening port
 * @param {string}	options.defaultStorage	- set a defaultStorage
 * @param {string}	options.defaultVO		- set a default VO
 */

exports.configure = function(options) {
	server = options.server || server;
	defaultSE = options.defaultStorage || defaultStorage;
	defaultVO = options.defaultVO || defaultVO;
	defaultRootPath = options.defaultRootPath || defaultRootPath;
	defaultPath = defaultRootPath + defaultVO + '/';
};

exports.base64encode = function(filename) {
	try {
  		var thumb = fs.readFileSync(filename);
        var thumb64 = new Buffer(thumb).toString('base64');
        return thumb64;
    } catch(err) {
        console.log(err);
        console.log("filename not found!");
    }
}

/**
 *	Add metadata to files
 *	@param {Object}	parameters
 *	@param {string} 
	@param {string}
 *
 *
 */

/* example 
addMetadata({
	repo: 'deroberto', 
	type: 'manuscripts', 
	replicas: ['http://blah', 'http://blah'],
	thumbdata: base64encode('pippo_thumb.jpg')
	metadata: {
		filename: 'pippo.jpg',
		fileType: 'JPG',
		genre: 'manuscripts',
		pagNum: 10
	}
}); */




exports.createEntry = function (parameters, callback) {


	if (!parameters.repo || !parameters.type) {
		callback({error: 1, message: 'repo or type is missing'});
	}
	var body = parameters.metadata;
	var repo = parameters.repo;
	var type = parameters.type;
	
	if (parameters.replicas) {
		body.__Replicas = parameters.replicas.join(",");
	}
	if (parameters.thumbdata) {
		body.__ThumbData = parameters.thumbdata;
	}
	var url = glibraryAPI + '/' + repo + '/' + type + '/';

	request.post({url: url, form: body}, function(error, response, body) {
		if (!error && !JSON.parse(body).error) {
			//console.log(body);
			callback(null, {status: 'success', id: JSON.parse(body).id});
		} else {
			console.log(response);
			console.log(body);
			callback(error, JSON.parse(body).error);
		}
	});
	
	



};

/**
 * Upload a local file to a Storage Server
 * @param {Object} 	parameters 					- 	Dictionary to set up the upload process
 * @param {string}	parameters.filename			-	name of the file to be uploaded, with relative or absolute path
 * @param {string}	[parameters.se]				-	destination storage server 
 * @param {string}	[parameters.absolutePath]	-	destination absolute path in the given storage
 * @param {string}	[parameters.relativePath]	- 	destination path relative to defaultPath
 * @param {string}	[parameters.vo]				-	Virtual Organization
 * @param {uploadCallback}	callback 			- 	called once the upload is completed
 */
	
/** 
 * @callback uploadCallback
 * @param {Object}	error		- 	Object containing evenutal errors
 * @param {string}	response	-	the response from the server
 */

exports.uploadFile = function(parameters, callback) {
	if (!parameters.filename) {
		callback({error: 1, message: 'You need to specify a filename'});
	}
	var vo = parameters.vo || defaultVO;
	var filename = parameters.filename;
	var remoteFilename = parameters.remoteFilename || filename;
	var se = parameters.se || defaultSE;
	var path = defaultPath;
	if (parameters.absolutePath) {
		path = parameters.absolutePath;
	} else if (parameters.relativePath) {
		path = defaultRootPath + vo + '/' + parameters.relativePath + '/';
	}
	var url = gridboxAPI + '/put/' + vo + '/' + remoteFilename + '/' + se + path;
	console.log('GridBox URL: ' + url);
	request(url, function(error, response, body) {

		  if (!error && response.statusCode == 200) {

		  	//console.log(body);
		  	 var info = JSON.parse(body);
		  	 var uploadURL = info.redirect;
		  	 console.log('Redirect PUT URL: ' + uploadURL);
		  	 fs.createReadStream(parameters.filename).pipe(request.put(uploadURL, function(error, response, body) {
		  	 	if (!error && response.statusCode == 201) {
		  	 		callback(null, {'status': 'success', 'turl':'https://' + se + path + remoteFilename});
		  	 	} else {
		  	 		console.log("PUT upload failed");
                    console.log(error);
                    console.log(body);
		  	 		callback(response.statusCode, body);
		  	 	}
		  	 }));
		  } else {

		  	//console.log(callback);
		  	//console.log("in upload " + response.statusCode);
		  	//console.log('io ho finito la prima parte' + response.statusCode);
		  	callback(response.statusCode, body);
		  	//console.log(body);
		  }
	})  
};

/* This API allows upload of an input file and registration of its metadata

	example:

	uploadAndRegister({
		filename: 'pippo.jpg',
		repo: 'EEE',
		type: 'Bin',
		thumbdata: base64encode('pippo.jpg'),
		metadata: { ... }
	});
*/

exports.uploadAndRegister = function(parameters, callback) {
	if (!parameters.repo || !parameters.type || !parameters.metadata || !parameters.filename) {
		callback({error: 1, message: 'repo or type or filename or metadata is missing'});
	}
	var vo = defaultVO;
	if (parameters.vo) {
		vo = parameters.vo;
	}
	var se = defaultSE;
	if (parameters.se) {
		se = parameters.se;
	}
	exports.uploadFile({
		filename: parameters.filename,
		remoteFilename: parameters.remoteFilename || parameters.filename,
		relativePath: parameters.relativePath || 'glibrary/' + parameters.repo + '/' +  parameters.type,
		vo: vo,
		se: se
	}, function(err, resp) {
		//console.log("ma qui ci arrivo?");		

		if (!err) {
			console.log("Upload completed");
			exports.createEntry({
				repo: parameters.repo,
				type: parameters.type,
				metadata: parameters.metadata,
				replicas: [resp.turl]
			}, function(err, resp) {
				if (!err) {
					//console.log(resp);
					console.log("Metadata registered");
					callback(null, {success: true, id: resp.id});
				} else {
					//callback("sono qui");
					callback(err, {success: false});
				}
			});
		} else {
			//console.log("forse non ha funzionato qualcosa" + err + "// " +resp + callback);
			//console.log(err);
			callback(resp);
		}
	});
};



exports.uploadFileSync = synchronize(exports.uploadFile);
exports.createEntrySync = synchronize(exports.createEntry);
exports.uploadAndRegisterSync = synchronize(exports.uploadAndRegister);

/*function updateMetadata();
function updateFileWithMetadata()
function addReplica();
function removeReplica();
function fetchMetadata(); */

