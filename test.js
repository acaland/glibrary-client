var sync = require('synchronize');
var glibrary = require('./lib/glibrary');
var exec = require('child_process').exec;
var fs = require('fs');

sync(fs, 'stat');
var execSync = sync(exec);
//sync(child_process, 'exec');


function main() {
	var response = glibrary.uploadFileSync({filename: 'test.js', vo: 'vo.dch-rp.eu', relativePath: 'test/'});
	console.log(response);
	if (response.status == 'success') {
		console.log("upload completed");
		glibrary.createEntrySync({
			repo: 'EEE',
			type: 'Bin',
			replicas: ['https://prod-se-03.ct.infn.it/dpm/ct.infn.it/home/vo.dch-rp.eu/test/test.js'],
			metadata: {
				FileName: 'test.js',
				Description: 'file di test bla bla bla',
				Keywords: 'pippo,pappo,filippo',
				SubmissionDate: '2014-04-16 14:55',
				LastModificationDate: '2013-12-14 10:42',
				Size: 13245,
				FileType: 'JS',
				CaptureLocation: 'Catania',
				CaptureDate: '2014-12-14 10:42',
				StartTime: '2014-10-10 10:32',
				StopTime: '2013-10-04 03:32'
			}
		});
	} else {
		console.log("some error occurred");
		//console.log(response.body);
	}
}

function apiTest() {
	var response = glibrary.createEntrySync({
			repo: 'EEE',
			type: 'Bin',
			replicas: ['https://prod-se-03.ct.infn.it/dpm/ct.infn.it/home/vo.dch-rp.eu/test/test.js'],
			metadata: {
				FileName: 'test.js',
				Description: 'file di test bla bla bla',
				Keywords: 'pippo,pappo,filippo',
				SubmissionDate: '2014-04-16 14:55',
				LastModificationDate: '2013-12-14 10:42',
				Size: 13245,
				FileType: 'JS',
				CaptureLocation: 'Catania',
				CaptureDate: '2014-12-14 10:42',
				StartTime: '2014-10-10 10:32',
				StopTime: '2013-10-04 03:32'
			}
		});
	console.log(response);
}

function uploadAndRegisterTest() {
	var response = glibrary.uploadAndRegisterSync({
		filename: process.argv[2] || process.argv[1],
		repo: 'EEE',
		type: 'Bin',
		metadata: {
				FileName: 'test222.js',
				Description: 'questa una prova di upload',
				Keywords: 'pippo,pappo,filippo',
				SubmissionDate: '2014-04-16 14:55',
				LastModificationDate: '2013-12-14 10:42',
				Size: 13245,
				FileType: 'JS',
				CaptureLocation: 'Catania',
				CaptureDate: '2014-12-14 10:42',
				StartTime: '2014-10-10 10:32',
				StopTime: '2013-10-04 03:32'
		}
	});
	console.log("io ho finito adesso");
	console.log(response);
};


function formatDate(date) {
	return date.toISOString().substr(0,10) + ' ' + date.toLocaleTimeString();
};


function uploadAndRegisterRawData() {
	var path = process.argv[2]; //read the path from command line
	if (!path) {
		console.log("path is a required parameter");
		return;
	}
	//var results = child_process.exec('ls -1 *.bin'); //, function(err, stdout, stderr) {
	try {
		process.chdir(path);
		console.log("Current directory: " + process.cwd());
		var stdout = execSync('ls -1 *.bin');
		//console.log(JSON.stringify(stdout));
	} catch(err) {
		console.error(err);
		return;
	}
	var files = stdout.split('\n');
	files.pop(); // remove the last empty line
	//console.log(files);
	for (var i=0; i < files.length; i++) {
		console.log("Processing: " + files[i]);
		var mtime = fs.statSync(files[i]).mtime;
		var metadata = {
			FileName: files[i],
			SubmissionDate: formatDate(new Date()),
			LastModificationDate: formatDate(mtime),
			Size: fs.statSync(files[i]).size,
			CaptureLocation: files[i].substr(0,5),
			CaptureDate: files[i].substr(6,10),
			StopTime: formatDate(mtime)
		} 
		console.log(metadata);
		try {
			var response = glibrary.uploadAndRegisterSync({
			 	filename: files[i],
			 	repo: 'EEE',
			 	type: 'Bin',
			 	metadata: metadata
			});
			console.log(response);
		} catch(e) {
			console.log(e);
			console.log("Upload failed for " + files[i]);
			return;
		}
		
	}
}


glibrary.configure({
        //defaultStorage: 'se.reef.man.poznan.pl',
        defaultStorage: 'prod-se-03.ct.infn.it',
        //defaultVO: 'vo.dch-rp.eu',
        defaultVO: 'vo.earthserver.eu',
        //defaultRootPath: '/dpm/reef.man.poznan.pl/home/'      
        defaultRootPath: '/dpm/ct.infn.it/home/'
});





sync.fiber(uploadAndRegisterRawData);

