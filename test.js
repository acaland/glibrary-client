var sync = require('synchronize');

var glibrary = require('./lib/glibrary');

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
	//console.log("sono qui");
	console.log(response);
}

glibrary.configure({
        //defaultStorage: 'se.reef.man.poznan.pl',
        defaultStorage: 'prod-se-03.ct.infn.it',
        //defaultVO: 'vo.dch-rp.eu',
        defaultVO: 'vo.earthserver.eu',
        //defaultRootPath: '/dpm/reef.man.poznan.pl/home/'      
        defaultRootPath: '/dpm/ct.infn.it/home/'
});

sync.fiber(uploadAndRegisterTest);

