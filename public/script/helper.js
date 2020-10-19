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

function enableNameInputAndRemoveSelfName() {
	document.getElementById('fullName').innerText='';
	document.getElementsByName('fullName')[0].value='';
	let nameDiv= document.getElementById('nameDiv');
	let errorNameInput=document.getElementsByClassName('error')[0];
	nameDiv.style.display='block';

	if (typeof errorNameInput!=='undefined'){
		nameDiv.removeChild(errorNameInput);
	}
}
function disableNameInputAndPrintSelfName() {

	let fullName=document.getElementsByName('fullName')[0].value;

	document.getElementById('fullName').innerText = fullName;
	document.getElementById('nameDiv').style.display = 'none';
}


