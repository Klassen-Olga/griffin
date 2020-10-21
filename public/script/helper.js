/*
* This module contains help function which use both modules peerConnectionHandler and kurentoFroupCall
*
* */




/*
* The function used to attach new message to the chat area
* */
function receiveChatMessage(data) {
	let chat = document.getElementById('messages');
	let messagesDiv = document.createElement('DIV');
	messagesDiv.innerText = data.fromName + ': ' + data.message;
	chat.appendChild(messagesDiv);
	chat.scrollTop = chat.scrollHeight;
}
/*
* The function used to replace enter to leave button when user enters the room
* and leave to enter button when user leaves the room
*
* */
function toggleEnterLeaveButtons() {
	var enterButton = document.getElementById('enterTheRoom');
	var leaveButton = document.getElementById('leaveTheRoom');

	// from leave to enter
	if (enterButton.style.display === 'block') {
		enterButton.style.display = 'none';
		leaveButton.style.display = 'block';
	}
	// from enter to leave
	else {
		enterButton.innerText = 'Load';
		leaveButton.style.display = 'none';
		enterButton.style.display = 'block';
		enterButton.disabled = true;
		setTimeout(function () {
			enterButton.innerText = 'Enter the room';
			enterButton.disabled = false;
		}, 1000);

	}
}
/*
* The function used to clear all video windows when user presses leave button
*
* */
function clearRemoteVideos() {
	var container = document.getElementById('foreignVideoContainer');
	while (container.firstChild) {
		container.lastChild.remove();
	}
}

/**
 * Function to make audio on, video on, audio off, video off buttons available or not
 * @param {*} button 'video' or 'audio'
 * @param {boolean} on true if on, false if off
 */
function toggleMediaButtons(button, on) {
	if (button === 'video') {
		if (on === true) {
			document.getElementById('videoOff').disabled = false;
			document.getElementById('videoOn').disabled = true;
		} else {
			document.getElementById('videoOff').disabled = true;
			document.getElementById('videoOn').disabled = false;

		}
	} else {

		if (on === true) {
			document.getElementById('audioOff').disabled = false;
			document.getElementById('audioOn').disabled = true;
		} else {
			document.getElementById('audioOff').disabled = true;
			document.getElementById('audioOn').disabled = false;
		}
	}
}
/*
* The function will be called when user presses leave room button
* It makes name input available and removes self name
* */
function enableNameInputAndRemoveSelfName() {
	document.getElementById('fullName').innerText = '';
	document.getElementsByName('fullName')[0].value = '';
	let nameDiv = document.getElementById('nameDiv');
	let errorNameInput = document.getElementsByClassName('error')[0];
	nameDiv.style.display = 'block';

	if (typeof errorNameInput !== 'undefined') {
		nameDiv.removeChild(errorNameInput);
	}
}

/**
 *
 * @param {*} str which string should be validated
 * @param {*} length which length should str contain
 * @param {HTMLElement} appendElement to which element should error be appended
 * @param {string} message which error should it be
 */
function validateStrLength(str, length, appendElement, message) {
	if (str.length < length) {
		if (appendElement.lastChild.tagName !== 'P') {
			let p = document.createElement('p');
			p.classList.add('error');
			p.innerText = message;
			appendElement.appendChild(p);
		}
		return false;
	}
	return true;
}
/*
* opposite function to enableNameInputAndRemoveSelfName
* */
function disableNameInputAndPrintSelfName() {

	let fullName = document.getElementsByName('fullName')[0].value;

	document.getElementById('fullName').innerText = fullName;
	document.getElementById('nameDiv').style.display = 'none';
}


/*
* variables for managing device access
* */
// give number of users audio and video devices
var audioDeviceNumber = 0;
var videoDeviceNumber = 0;
// indicates if user gave permissions to these devices (for kurento only)
var acceptAudio = false;
var acceptVideo = false;
// indicates if user wants to have his devices off or on after he enters the room
var audioBeforeEnterTheRoom = false;
var videoBeforeEnterTheRoom = false;

/*
*
* before user can enter the room, he will be asked for permission to use his camera and microphone
* user can also see himself in separate window and temporarily turn off his camera and microphone
*
* if user has given permissions to his media devices,he can anytime make the camera and microphone on
* if he didn't give the permissions user will be notified to reload the web page
*
* @param {*} videoElement is set, when the function is used for peer to many use case,
* otherwise for kurento use case
*
* */
function checkUsersDevicesAndAccessPermissions(videoElement) {

	// which devices has user
	navigator.mediaDevices.enumerateDevices()
		.then(function (devices) {

			videoDeviceNumber = devices.filter(device => device.kind === 'videoinput').length;
			audioDeviceNumber = devices.filter(device => device.kind === 'audioinput').length;
			console.log("Number of video devices: " + videoDeviceNumber);
			console.log("Number of audio devices: " + audioDeviceNumber);

			requestAudioDevice(videoElement);
			requestVideoDevice(videoElement);
		})
		.catch(function (err) {
			console.error(err.name + ": " + err.message);
		});
}
/**
 * The function used to make a request for audio device permissions when user enters the room
 * If the param videoElement is present, will be called  peerConnection handler, otherwise kurento handler
 *
 * @param {string} videoElement 'video' or 'audio'
 */
function requestAudioDevice(videoElement) {
	if (audioDeviceNumber > 0) {
		navigator.mediaDevices.getUserMedia({audio: true})
			.then(stream => {
				if (videoElement) {
					addTrackToSrcObject('audio', stream, videoElement);
				} else {
					acceptAudio = true;
					audioBeforeEnterTheRoom = true;
				}
				toggleMediaButtons('audio', true);
				console.log('Got MediaStream:', stream);
			})
			.catch(error => {
				if (!videoElement) {
					acceptAudio = false;
					audioBeforeEnterTheRoom = false;
				}
				toggleMediaButtons('audio', false);
				console.error('Error accessing media devices.', error);
			});
	}
}
/**
 * The function used to make a request for video device permissions when user enters the room
 * If the param videoElement is present, will be called  peerConnection handler, otherwise kurento handler
 *
 * @param {string} videoElement 'video' or 'audio'
 */
function requestVideoDevice(videoElement) {
	if (videoDeviceNumber > 0) {
		navigator.mediaDevices.getUserMedia({video: true})
			.then(stream => {
				if (videoElement) {
					addTrackToSrcObject('video', stream, videoElement);
				} else {
					document.getElementById('videoTest').srcObject = stream;
					acceptVideo = true;
				}
				videoBeforeEnterTheRoom = true;
				toggleMediaButtons('video', true);
				console.log('Got MediaStream:', stream);

			})
			.catch(error => {
				if (!videoElement) {
					acceptVideo = false;
				}
				videoBeforeEnterTheRoom = false;
				toggleMediaButtons('video', false);
				console.error('Error accessing media devices.', error);
			});
	}
}
/*
* The function used to validate moderator response
* */
function moderatorResponse(accepted) {
	if (accepted === true) {
		enter();
	} else {
		alert('Moderator does not accept your entry');
	}
}
