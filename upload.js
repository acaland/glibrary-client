var sync = require('synchronize');
var glibrary = require('./lib/glibrary');
var exec = require('child_process').exec;
var fs = require('fs');
var path_module = require('path');

var execSync = sync(exec);


function formatDate(date) {
	return date.toISOString().substr(0,10) + ' ' + date.toLocaleTimeString();
};

function xIndexOf(Val, Str, x)  
 {  
   if (x <= (Str.split(Val).length - 1)) {  
     Ot = Str.indexOf(Val);  
     if (x > 1) { for (var i = 1; i < x; i++) { var Ot = Str.indexOf(Val, Ot + 1) } }  
     return Ot;  
   } else { alert(Val + " Occurs less than " + x + " times"); return 0 }  
 }  


function uploadAndRegisterRawData() {
	var path = process.argv[2]; //read the path from command line
	if (!path) {
		console.log("path is a required parameter");
		return;
	}
	
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
	
	for (var i=0; i < files.length; i++) {
		console.log("Processing: " + files[i]);
		var mtime = fs.statSync(files[i]).mtime;
		var metadata = {
			FileName: files[i],
			FileType: 'bin',
			SubmissionDate: formatDate(new Date()),
			LastModificationDate: formatDate(mtime),
			Size: fs.statSync(files[i]).size,
			CaptureLocation: files[i].substr(0, xIndexOf("-", files[i], 2)), // cut to the first dash
			CaptureDate: files[i].substr(xIndexOf("-", files[i], 2) + 1, 10),  // adeguate
			StopTime: formatDate(mtime)   // as above
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

function uploadAndRegisterErrorLogs(path) {
	
	try {
        process.chdir(path);
        console.log("Current directory: " + process.cwd());
	} catch(e) {
		console.log("Cannot change dir");
	}
	if (!fs.existsSync("ErrorLog.txt")) {
		console.log("No errors has beed detected");
		return;
	}
	var stat = fs.statSync('ErrorLog.txt');
	var file = fs.readFileSync('ErrorLog.txt');
	
	var data = file.toString().split('\n');
	console.log("error lines:" + data);
	var errors = [];
	var location = "", capDate = "";
	for (var i=0; i < data.length; i++) {
		var line = data[i].split('\t');
		if (!location) {
			location = line[2].substr(0, xIndexOf("-", line[2], 2));
			capDate = line[2].substr(xIndexOf("-", line[2], 2) + 1, 10);
		}
		var error = line.pop();
		if (error) {
			errors.push(error.trim());
		}
	}
	var remoteFilename = location + '-' + capDate + '-ErrorLog.txt';
	console.log("error types:" + errors);
	var metadata = {
		FileName: remoteFilename,
        SubmissionDate: formatDate(new Date()),
        LastModificationDate: formatDate(stat.mtime),
        Size: stat.size,
        FileType: 'txt',
		CaptureLocation: location,
		CaptureDate: capDate, 
		NumOfErrors: (data.length-1) /2 ,
		ErrorType: errors
	}
	console.log("metadata: " + JSON.stringify(metadata));
	try {
              var response = glibrary.uploadAndRegisterSync({
                        filename: 'ErrorLog.txt',
                        remoteFilename: remoteFilename,
                        repo: 'EEE',
                        type: 'ErrorLog',
                        metadata: metadata
              });
              console.log(response);
              } catch(e) {
                    console.log(e);
                    console.log("Upload failed for " + "ErrorLog.txt");
                    return;
             } 

}

function uploadAndRegisterDailyTimFile(path) {

	try {
        process.chdir(path);
        console.log("Current directory: " + process.cwd());
	} catch(e) {
		console.log("Cannot change dir");
	}
	try {
		var timfile = execSync('ls -1 *-tim.txt').trim();
	} catch(e) {
		console.log("Cannot find any tim file in the current directory");
		return;
	}
	
	var stat = fs.statSync(timfile);
	var file = fs.readFileSync(timfile);
	
	var data = file.toString().split('\n');
	//console.log("Tim File content:" + data);

	var location = timfile.substr(0, xIndexOf("-", timfile, 2));;
	var capDate = path_module.basename(path);
	var remoteFilename = location + '-' + capDate + '-tim.txt';

	
	// algoritm to determine the acquisition rate
	//
	// at the end we moved it as an attribute to each TIM file

	var metadata = {
		FileName: remoteFilename,
        SubmissionDate: formatDate(new Date()),
        LastModificationDate: formatDate(stat.mtime),
        Size: stat.size,
        FileType: 'txt',
		CaptureLocation: location,
		CaptureDate: capDate 
		//CaptureRate: 'to be calculated'
		
	}
	console.log("metadata: " + JSON.stringify(metadata));
	try {
              var response = glibrary.uploadAndRegisterSync({
                        filename: timfile,
                        remoteFilename: remoteFilename,
                        repo: 'EEE',
                        type: 'DailyTim',
                        metadata: metadata
              });
              console.log(response);
              } catch(e) {
                    console.log(e);
                    console.log("Upload failed for " + timfile);
                    return;
             } 
}

function uploadAndRegisterSumFiles (path) {
	
	try {
		process.chdir(path);
		console.log("Current directory: " + process.cwd());
		var stdout = execSync('ls -1 *.sum');
		//console.log(JSON.stringify(stdout));
	} catch(err) {
		console.error(err);
		return;
	}
	var files = stdout.split('\n');
	files.pop(); // remove the last empty line
	
	for (var i=0; i < files.length; i++) {
		console.log("Processing: " + files[i]);
		var mtime = fs.statSync(files[i]).mtime;
		var metadata = {
			FileName: files[i],
			FileType: 'sum',
			SubmissionDate: formatDate(new Date()),
			LastModificationDate: formatDate(mtime),
			Size: fs.statSync(files[i]).size,

			CaptureLocation: files[i].substr(0, xIndexOf("-", files[i], 2)), 
			CaptureDate: files[i].substr(xIndexOf("-", files[i], 2) + 1, 10)
			
		} 
		console.log(metadata);
		try {
			var response = glibrary.uploadAndRegisterSync({
			 	filename: files[i],
			 	repo: 'EEE',
			 	type: 'Sum',
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

function uploadAndRegisterOutFiles (path) {
	
	try {
		process.chdir(path);
		console.log("Current directory: " + process.cwd());
		var stdout = execSync('ls -1 *.out');
		//console.log(JSON.stringify(stdout));
	} catch(err) {
		console.error(err);
		return;
	}
	var files = stdout.split('\n');
	files.pop(); // remove the last empty line
	
	for (var i=0; i < files.length; i++) {
		console.log("Processing: " + files[i]);

		var file = fs.readFileSync(files[i]);
		var data = file.toString().split('\n');
		data.pop(); // remove the latest \n

		var mtime = fs.statSync(files[i]).mtime;
		var metadata = {
			FileName: files[i],
			SubmissionDate: formatDate(new Date()),
			LastModificationDate: formatDate(mtime),
			Size: fs.statSync(files[i]).size,
			FileType: 'out',
			CaptureLocation: files[i].substr(0, xIndexOf("-", files[i], 2)), 
			CaptureDate: files[i].substr(xIndexOf("-", files[i], 2) + 1, 10),
			NumOfEvents: data.length
		} 
		console.log(metadata);
		try {
			var response = glibrary.uploadAndRegisterSync({
			 	filename: files[i],
			 	repo: 'EEE',
			 	type: 'Out',
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

function uploadAndRegister2TTs(path) {

	try {
		process.chdir(path);
		console.log("Current directory: " + process.cwd());
		var stdout = execSync('ls -1 *.2tt');
		//console.log(JSON.stringify(stdout));
	} catch(err) {
		console.error(err);
		return;
	}
	var files = stdout.split('\n');
	files.pop(); // remove the last empty line
	
	for (var i=0; i < files.length; i++) {
		console.log("Processing: " + files[i]);

		var file = fs.readFileSync(files[i]);
		var data = file.toString().split('\n');
		data.pop(); // remove the latest \n

		var mtime = fs.statSync(files[i]).mtime;
		var metadata = {
			FileName: files[i],
			SubmissionDate: formatDate(new Date()),
			LastModificationDate: formatDate(mtime),
			Size: fs.statSync(files[i]).size,
			FileType: '2tt',
			CaptureLocation: files[i].substr(0, xIndexOf("-", files[i], 2)), 
			CaptureDate: files[i].substr(xIndexOf("-", files[i], 2) + 1, 10),
			NumOfEvents: data.length
		} 
		console.log(metadata);
		try {
			var response = glibrary.uploadAndRegisterSync({
			 	filename: files[i],
			 	repo: 'EEE',
			 	type: '2tt',
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


function captureRateForEvent(dailytim, runNum) {

	var startRunRowIndex = (runNum - 1) * 2;

	// check if the first run is repeted (due to a bug probably)
	var row0 = dailytim[0].split('\t');
	var row3 = dailytim[3].split('\t');
	if (row0[1] == row3[1]) {
		startRunRowIndex = startRunRowIndex + 2;
	}
	
	var startRunRow = dailytim[startRunRowIndex].split('\t');
	var endRunRow = dailytim[startRunRowIndex + 1].split('\t');

	if (startRunRow[1] != runNum || endRunRow[1] != runNum) {
		console("cannot find the correct run row into the daily tim file");
		return NaN;
	};
	var eventNum = endRunRow[2];
	var endTime = endRunRow[3];
	var startTime = startRunRow[3];
	return eventNum / (endTime - startTime);
}


function uploadAndRegisterTIMs(path) {

	try {
		process.chdir(path);
		console.log("Current directory: " + process.cwd());
		var stdout = execSync('ls -1 *.tim');
		//console.log(JSON.stringify(stdout));
	} catch(err) {
		console.log("Cannot find " + path + "directory");
		console.error(err);
		return;
	}
	var files = stdout.split('\n');
	files.pop(); // remove the last empty line

	// try to calculate CaptureRate reading the daily TIM file in the root directory
	try {
		var dailytimfilename = execSync('ls -1 ../*-tim.txt').trim();
		var dailytimfile = fs.readFileSync(dailytimfilename);
		var dailytim = dailytimfile.toString().split('\n');
		dailytim.pop(); // remove the latest \n

	} catch(e) {
		console.log("Cannot find any daily tim file in the parent directory");
	}
		
	for (var i=0; i < files.length; i++) {
		console.log("Processing: " + files[i]);
		var mtime = fs.statSync(files[i]).mtime;
		var rate = dailytim ? captureRateForEvent(dailytim, i+1) : NaN;
		var metadata = {
			FileName: files[i],
			SubmissionDate: formatDate(new Date()),
			LastModificationDate: formatDate(mtime),
			Size: fs.statSync(files[i]).size,
			FileType: 'tim',
			CaptureLocation: files[i].substr(0, xIndexOf("-", files[i], 2)), 
			CaptureDate: files[i].substr(xIndexOf("-", files[i], 2) + 1, 10),
			CaptureRate: rate
			
		} 
		console.log(metadata);
		try {
			var response = glibrary.uploadAndRegisterSync({
			 	filename: files[i],
			 	repo: 'EEE',
			 	type: 'Tim',
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

function main() {
	var path = process.argv[2]; //read the path from command line
        if (!path) {
                console.log("Usage: node upload.js <path>");
                console.log("\nwhere <path> is the directory containing the daily run");
                console.log("Example: node upload.js ../2013/2013-01-01");
                return;
        }
	
	//uploadAndRegisterRawData(path);
	//uploadAndRegisterErrorLogs(path);
	//uploadAndRegisterDailyTimFile(path);
	//uploadAndRegisterSumFiles(path + '/sum');
	//uploadAndRegisterOutFiles(path + '/out');
	//uploadAndRegister2TTs(path + '/2tt');
	uploadAndRegisterTIMs(path + '/tim');
}



sync.fiber(main);

