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
	messagesDiv.classList.add('chatOutput');
	chat.appendChild(messagesDiv);
	chat.scrollTop = chat.scrollHeight;
}

/*
* The function used to replace enter to leave button when user enters the room
* and leave to enter button when user leaves the room
*
* */
function toggleEnterLeaveButtons() {
	var enterButtonEnd = document.getElementById('enterTheRoomEnd');
	var enterButtonStart = document.getElementById('enterTheRoomStart');
	var leaveButton = document.getElementById('leaveTheRoom');
	//display none for this block to besser display video grid
	var fullnameEnterGiveMediaBlock=document.getElementById('fullname-giveMedia-enterRoom');
	var foreignContainer=document.getElementById('foreignVideoContainer');
	// from enter to leave
	if (enterButtonEnd.style.display === 'block') {
		enterButtonEnd.style.display = 'none';
		leaveButton.style.display = 'block';
		fullnameEnterGiveMediaBlock.style.display='none';
		foreignContainer.style.display="block";
	}
	// from leave to enter
	else {
		leaveButton.style.display = 'none';
		enterButtonStart.style.display = 'block';
		fullnameEnterGiveMediaBlock.style.display='block';
		foreignContainer.style.display="none";

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
			// turn video on
			document.getElementById('videoOn').style.display = 'none';
			document.getElementById('videoOn').disabled = true;
			document.getElementById('videoOff').style.display = 'block';
			document.getElementById('videoOff').disabled = false;


		} else {
			// turn video off
			document.getElementById('videoOff').style.display = 'none';
			document.getElementById('videoOff').disabled = true;
			document.getElementById('videoOn').style.display = 'block';
			if (acceptVideo == false) {
				document.getElementById('videoOn').disabled = true;
			} else {
				document.getElementById('videoOn').disabled = false;

			}

		}
	} else {

		if (on === true) {
			//turn audio on
			document.getElementById('audioOn').style.display = 'none';
			document.getElementById('audioOn').disabled = true;
			document.getElementById('audioOff').style.display = 'block';
			document.getElementById('audioOff').disabled = false;

		} else {
			// turn audio off
			document.getElementById('audioOff').style.display = 'none';
			document.getElementById('audioOff').disabled = true;
			document.getElementById('audioOn').style.display = 'block';
			document.getElementById('audioOn').disabled = false;
			if (acceptAudio == false) {
				document.getElementById('audioOn').disabled = true;
			} else {
				document.getElementById('audioOn').disabled = false;

			}
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
function disableNameInput() {

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
function checkUsersDevicesAndAccessPermissions(videoElement, useCase) {

	// which devices has user
	navigator.mediaDevices.enumerateDevices()
		.then(function (devices) {

			videoDeviceNumber = devices.filter(device => device.kind === 'videoinput').length;
			audioDeviceNumber = devices.filter(device => device.kind === 'audioinput').length;
			console.log("Number of video devices: " + videoDeviceNumber);
			console.log("Number of audio devices: " + audioDeviceNumber);

			requestMediaDevices(videoElement, useCase);
		})
		.catch(function (err) {
			console.error(err.name + ": " + err.message);
			buttonsOnstart();
			toggleMediaButtons('audio', false);
			toggleMediaButtons('video', false);
		});
}

/**
 * The function used to make a request for audio device permissions when user enters the room
 * If the param videoElement is present, will be called  peerConnection handler, otherwise kurento handler
 *
 * @param {string} videoElement 'video' or 'audio'
 */
function requestMediaDevices(videoElement, useCase) {
	if (audioDeviceNumber > 0) {
		navigator.mediaDevices.getUserMedia({audio: true})
			.then(stream => {
				console.log('Got MediaStream:', stream);

				acceptAudio = true;
				audioBeforeEnterTheRoom = true;

				if (useCase !== 'kurento') {
					addTrackToSrcObject('audio', stream, videoElement);
				}
				toggleMediaButtons('audio', true);
				if (videoDeviceNumber > 0) {
					requestVideoDevice(videoElement);
				} else {
					buttonsOnstart();
					toggleMediaButtons('video', false);
				}


			})
			.catch(error => {
				console.error('Error accessing media devices.', error);

				acceptAudio = false;
				audioBeforeEnterTheRoom = false;

				toggleMediaButtons('audio', false);
				if (videoDeviceNumber > 0) {
					requestVideoDevice(videoElement);
				} else {
					buttonsOnstart();
					toggleMediaButtons('video', false);
				}
			});
	} else {
		toggleMediaButtons('audio', false);
		if (videoDeviceNumber > 0) {
			requestVideoDevice(videoElement);
		} else {
			buttonsOnstart();
			toggleMediaButtons('video', false);
		}
	}
}

/**
 * The function used to make a request for video device permissions when user enters the room
 * If the param videoElement is present, will be called  peerConnection handler, otherwise kurento handler
 *
 * @param {string} videoElement 'video' or 'audio'
 */
function requestVideoDevice(videoElement) {

	navigator.mediaDevices.getUserMedia({video: true})
		.then(stream => {
			console.log('Got MediaStream:', stream);

			acceptVideo = true;
			videoBeforeEnterTheRoom = true;

			addTrackToSrcObject('video', stream, videoElement);
			toggleMediaButtons('video', true);
			buttonsOnstart();
		})
		.catch(error => {
			console.error('Error accessing media devices.', error);

			acceptVideo = false;
			videoBeforeEnterTheRoom = false;

			toggleMediaButtons('video', false);
			buttonsOnstart();
		});

}

/*
* The function used to validate moderator response
* */
function moderatorResponse(accepted, socket) {
	if (accepted === true) {
		enter('participant');

	} else {
		socket.close();
		socket = null;
		alert('Moderator does not accept your entry');
	}
}

/**
 * Adds a media track to the source object of any video element before user enters the room
 * @param {*} mediaType 'audio' or 'video' for track type
 * @param {*} stream stream from which tracks should be taken
 * @param {string} videoElement to which source object should be added
 */
function addTrackToSrcObject(mediaType, stream, videoElement) {

	let tracks = getTracksFromStream(stream, mediaType);

	//insert media track for first time
	if (videoElement.srcObject !== null) {
		let localStream = videoElement.srcObject;
		localStream.addTrack(tracks[0]);
		videoElement.srcObject = null;
		videoElement.srcObject = localStream;
	} else {
		videoElement.srcObject = stream;
	}

}

function getTracksFromStream(stream, mediaType) {
	let tracks = null;
	if (mediaType === 'video') {
		tracks = stream.getVideoTracks();
	} else {
		tracks = stream.getAudioTracks();
	}
	return tracks;
}


function putNameOverVideo(video) {
	let divAroundVideoAndSpan = video.parentNode;
	let span = divAroundVideoAndSpan.childNodes[1];

	span.style.fontSize = 'xx-large';
	span.style.position = 'relative';

	if (video.nodeName === 'VIDEO') {
		span.style.bottom = '150px';
	}
	//case audio tag
	else {
		span.style.top = '120px';

	}

}

function putVideoOverName(video) {
	let divAroundVideoAndSpan = video.parentNode;
	let span = divAroundVideoAndSpan.childNodes[1];
	span.style.position = 'static';
	span.style.bottom = '0px';
	span.style.left = '0px';
	span.style.fontSize = 'medium';
}

function buttonsOnstart() {
	document.getElementById('enterTheRoomEnd').style.display = 'block';
	document.getElementById('enterTheRoomStart').style.display = 'none';
	document.getElementById('nameDiv').style.display = 'block';

}


function buttonsOnLoadThePage() {
	document.getElementById('leaveTheRoom').style.display = 'none';
	document.getElementById('enterTheRoomEnd').style.display = 'none';
	document.getElementById('videoOn').style.display = 'none';
	document.getElementById('videoOff').style.display = 'none';
	document.getElementById('audioOn').style.display = 'none';
	document.getElementById('audioOff').style.display = 'none';
	document.getElementById('nameDiv').style.display = 'none';
}

/*
*
* functions for handling select DOM element of chat participants
* */
function insertOptionToSelect(userId, fullName) {
	let participants = document.getElementById('participants');
	appendNewOption(userId, fullName, participants)

}

function removeOptionFromSelect(userId) {
	let participants = document.getElementById('participants');
	for (var i = 0; i < participants.options.length; i++) {
		if (participants[i].value === userId) {
			participants.remove(i)
		}
	}

}

function clearAllSelectOptions() {
	let participants = document.getElementById('participants');
	var i, length = participants.options.length - 1;
	for (i = length; i >= 0; i--) {
		participants.remove(i);
	}
	appendNewOption('', 'Everyone', participants)
}

function appendNewOption(value, innerText, select) {
	let option = document.createElement('option');
	option.value = value;
	option.innerHTML = innerText;
	select.appendChild(option);
}

/*
* creates modal for each new participant
* modal appears on moderator side
* */

function addModal(name, onclickYes, onclickNo) {
	var modalContainer = document.getElementById('modalContainer');
	var modalsNumber = modalContainer.childNodes.length;

	var divModal = document.createElement('DIV');
	divModal.classList.add('modal');

	divModal.setAttribute('id', 'modal_'+modalsNumber+1);
	modalContainer.appendChild(divModal);

	var modalContentDiv = document.createElement('DIV');
	modalContentDiv.classList.add('modal-content');
	divModal.appendChild(modalContentDiv);

	var containerDiv = document.createElement('DIV');
	containerDiv.classList.add('containerM');
	modalContentDiv.appendChild(containerDiv);

	var h3_1 = document.createElement('H3');
	h3_1.innerHTML = `New user "${name}" wants to join the conference room`;
	var h3_2 = document.createElement('H3');
	h3_2.innerHTML = 'Are you agree?';

	containerDiv.appendChild(h3_1);
	containerDiv.appendChild(h3_2);

	var clearfixDiv = document.createElement('DIV');
	clearfixDiv.classList.add('clearfix');
	containerDiv.appendChild(clearfixDiv);

	var yesButton = document.createElement('BUTTON');
	yesButton.classList.add('yesbtn');
	yesButton.textContent = 'Yes';
	var noButton = document.createElement('BUTTON');
	noButton.classList.add('nobtn');
	noButton.textContent = 'No';
	yesButton.addEventListener('click', function (){
		onclickYes(divModal.id);
	});
	noButton.addEventListener('click', function (){
		onclickNo(divModal.id);
	});
	clearfixDiv.appendChild(yesButton);
	clearfixDiv.appendChild(noButton);

	divModal.style.display = 'block';
	return divModal.id;
}