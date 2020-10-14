/*
* chat handler
* */


function sendMessageInChat(elm) {
	var textarea = document.getElementById('message');
	socket.emit('chat message', textarea.value, roomId);
	textarea.value = '';
}
function initChatEvents(){
	socket.on('chat message', function (msg) {
		let chat = document.getElementById('messages');
		let messagesDiv = document.createElement('DIV');
		messagesDiv.innerText = msg;
		chat.appendChild(messagesDiv);
		chat.scrollTop = chat.scrollHeight;
	});

}
function receiveChatMessage (data) {
	let chat = document.getElementById('messages');
	let messagesDiv = document.createElement('DIV');
	messagesDiv.innerText = data.fromName + ': ' + data.message;
	chat.appendChild(messagesDiv);
	chat.scrollTop = chat.scrollHeight;
}
