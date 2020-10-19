function toggleEnterLeaveButtons() {
	var enterButton=document.getElementById('enterTheRoom');
	var leaveButton=document.getElementById('leaveTheRoom');

	// from leave to enter
	if (enterButton.style.display==='block'){
		enterButton.style.display='none';
		leaveButton.style.display='block';
	}
	// from enter to leave
	else{
		enterButton.innerText='Load';
		leaveButton.style.display='none';
		enterButton.style.display='block';
		enterButton.disabled=true;
		setTimeout(function () {
			enterButton.innerText='Enter the room';
			enterButton.disabled=false;
		}, 1000);

	}
}

function clearRemoteVideos() {
	var container = document.getElementById('foreignVideoContainer');
	while(container.firstChild){
		container.lastChild.remove();
	}
}
function toggleMediaButtons(button,on) {
	if (button ==='video'){
		if (on === true) {
			document.getElementById('videoOff').disabled=false;
			document.getElementById('videoOn').disabled=true;
		}
		else{
			document.getElementById('videoOff').disabled = true;
			document.getElementById('videoOn').disabled = false;

		}
	}
	else{

		if (on === true) {
			document.getElementById('audioOff').disabled=false;
			document.getElementById('audioOn').disabled=true;
		}
		else{
			document.getElementById('audioOff').disabled = true;
			document.getElementById('audioOn').disabled = false;
		}
	}
}

/*
*
* chat event
* */
function receiveChatMessage (data) {
	let chat = document.getElementById('messages');
	let messagesDiv = document.createElement('DIV');
	messagesDiv.innerText = data.fromName + ': ' + data.message;
	chat.appendChild(messagesDiv);
	chat.scrollTop = chat.scrollHeight;
}
