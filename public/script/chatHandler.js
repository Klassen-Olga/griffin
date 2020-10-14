

/*function initChatEvents(){
	socket.on('chat message', function (msg) {
		let chat = document.getElementById('messages');
		let messagesDiv = document.createElement('DIV');
		messagesDiv.innerText = msg;
		chat.appendChild(messagesDiv);
		chat.scrollTop = chat.scrollHeight;
	});

}*/
/*
*
* listener on message attach
* */
function receiveChatMessage (data) {
	let chat = document.getElementById('messages');
	let messagesDiv = document.createElement('DIV');
	messagesDiv.innerText = data.fromName + ': ' + data.message;
	chat.appendChild(messagesDiv);
	chat.scrollTop = chat.scrollHeight;
}
