
var socket = io.connect('http://localhost:4200');


var info = document.getElementById('in'),
	output = document.getElementById('output'),
	btn = document.getElementById('send'),
	con = document.getElementById('con'),
	commandIn = document.getElementById('commandIn'),
	commandIn2 = document.getElementById('commandIn2');
	treeRes = document.getElementById('treeRes');
	tree = document.getElementById('tree');

output.addEventListener('keyup',function() {
	socket.emit('code',{
		mes: output.value
	});
});

socket.on('code',function(data){
	output.innerHTML = data;
});
socket.on('console',function(data){
	con.innerHTML += data;
	
});
socket.on('path',function(data){
	commandIn2.innerHTML = data;
});

btn.addEventListener('click',function() {
	commandIn2.innerHTML = ' ';
	socket.emit('startConsole', {
		command: commandIn.value
	});
});

tree.addEventListener('click',function(){
	socket.emit('openTree');
});
socket.on('tree',function(data){
	
	treeRes.innerHTML += data;
});

