var express = require('express');
var socket = require('socket.io');
var autofill = require('./tab-autofill.js');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const { StringDecoder } = require('string_decoder');
const stripAnsi = require('strip-ansi');
let http = require('http');

var app = express();
const decoder = new StringDecoder('utf8');

let server = http.Server(app);
let socketIO = require('socket.io');
let io = socketIO(server);
let obj = {
	name: '',
	depth: {},
	directory: true,
	expanded: true,
};
const port = process.env.PORT || 3000;

server.listen(3000, function(){
	console.log("listening to reqq on 3000: ");
});


io.on('connection',function(socket){
	// pathh e patot na konzolata kade pocnuvash da pisuvas komandi, najdi proekt preku folderi i kopirajgo patot, pazi na forwardslashes -> \ treba da se / promenigi od koga
	// ke gi kopirash. i stavi / na krajot!!!
	var pathh = '/home/ivan/Documents/Projects/websockets-textTransfer/';
	// path e patot od kade drvoto ke bide prikazano, gledaj da e nekoj proekt angular za da razberesh kako izgleda, no mora na linuks da e za da mozes da rabotissh so podatocite.
	// path = '/C://projects/shopper/'   primer ako ti se vika proektot shopper. i stavi / na krajot!!!
	var path = '/home/ivan/Documents/Projects/'
	console.log('direktorija e ova? : ' + fs.lstatSync(path).isDirectory());
	console.log('direktorija e ova? : ' + fs.lstatSync(path).isFile());
	var filePath = '/home/ivan/Documents/Projects/websockets-textTransfer/text.txt/'

	console.log('made soc conne', socket.id);

	socket.on('filePath', function(data) {
		filePath = data.filePath.substring(0, data.filePath.lastIndexOf("/"));
		console.log('noviot pat e ' + filePath);

		fs.readFile(filePath,(err, data)=> {
		if(err) console.log(err);

		socket.emit('code', {
			code: data.toString(),
			path: filePath + "/"
		});
		console.log('data has been sent! code' + filePath);
	});
	});

	socket.on('code',function(data){
		console.log("test done");
		fs.writeFile(filePath,data.mes,(err)=>{
			if(err) console.log(err);
			console.log('The file has been saved!');

		});
		io.sockets.emit('code', 
			{
				code: data.mes,
				path: filePath + "/"
			});
		console.log("this is the data", data.mes);
		
	});

	socket.on('startConsole',function(data){
		console.log("console Started!!! \\", pathh);
		// smeni sh so cmd.exe   smeni -c so /c 
		const bat = spawn('sh', ['-c', data.command], {
		cwd: pathh,
		env: process.env
		});
		if(data.command[0]==='c' && data.command[1]==='d')
		{
			if(data.command[3]==='.' && data.command[4]==='.')
			{
				pat = pathh.split("/");
				pathh = (pat.slice(0,pat.length-2).join("/"))+'/';
				pathh =  pathh.replace('../', '');
				tabPathAutofill(pathh);
				
			}
			if(data.command[3]&&data.command[3] !==' '){
			pathh = pathh + data.command.substring(3) + "/";
			pathh =  pathh.replace('../', '');
			tabPathAutofill(pathh);
			}
		}
		
		console.log('patot so go proveruva e: ' + pathh);
		socket.emit('path', pathh);
		

		bat.stdout.on('data', (data) => {
		  socket.emit('console', 
		  	stripAnsi(decoder.write(data)));
		  	socket.emit('path', pathh);
		});

		bat.stderr.on('data', (data) => {
		  console.log(data.toString());
		  socket.emit('console', stripAnsi(decoder.write(data)));
		});

		bat.on('exit', (code) => {
		  console.log(`Child StartConsole exited with code ${code}`);
		    socket.emit('console', stripAnsi(decoder.write(code)));
		});

	});
	function tabPathAutofill(pathh) {
	
		autofill();
		const bat = spawn('sh', ['-c','find . -maxdepth 1 -type d'], {
		cwd: pathh,
		env: process.env
		});

		bat.stdout.on('data', (data) => {
			console.log("ova e patot za autofil" + stripAnsi(decoder.write(data)));
		  socket.emit('pathAutofill', 
		  	stripAnsi(decoder.write(data)));
		});

		bat.stderr.on('data', (data) => {
		  console.log(data.toString());
		  socket.emit('console', stripAnsi(decoder.write(data)));
		});

		bat.on('exit', (code) => {
		  console.log(`Child tabAutofill exited with code ${code}`);
		    socket.emit('console', stripAnsi(decoder.write(code)));
		});

	};
	socket.on('openTree',function(data){
		let str = '';
		if(data.path != null)
		{
			path = data.path;
			console.log(path);
		}
		// promenit sh so cmd.exe    promeni -c so /c  promeni find so tree /f /a   ili so golemi bukvi F A ne pamta. se razbira seto toa vo ''
		const bat = spawn('sh', ['-c','find -maxdepth 1'], {
		cwd: path,
		env: process.env
		});
		bat.stdout.on('data', (data) => {
			str+=data;
		//socket.emit('tree',stripAnsi(decoder.write(data)));

		});

		bat.stderr.on('data', (data) => {
		  console.log(data.toString());
		  socket.emit('console', stripAnsi(decoder.write(data)));
		});

		bat.on('exit', (code) => {
		  console.log(`Child tree exited with code ${code}`);
		  rez = [{
		  }]
		  
		  stripAnsi(decoder.write(str)).split('./').map((ime) => 
		  	{ 
		  		ime = ime.replace('\n','');
				if("." != ime) {
			  		rez.push({
			  			dir: fs.lstatSync(path + ime).isDirectory(),
			  			name: ime,
			  			file: fs.lstatSync(path + ime).isFile(),
			  			path: path + ime + '/',
			  		})
		  		} 
			})
	
		  console.log(stripAnsi(decoder.write(str)));
		  	socket.emit('tree',{
		  		rez: rez,
		  	});
		    socket.emit('console', stripAnsi(decoder.write(code)));
		});
		
	});

});