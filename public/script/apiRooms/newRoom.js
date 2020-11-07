document.getElementById("submitNewRoom").addEventListener("click", function (e) {
	e.preventDefault();
	var error = document.getElementById('serverError');
	let selectedValue = document.getElementById('participantsNum').value;
	let participantsNum = null;
	if (selectedValue === 'peer') {
		participantsNum = 3;
	} else if (selectedValue === 'kurento') {
		participantsNum = 10;

	} else {
		error.innerText = 'DOM-Element is modified, please reload the page';
		return;
	}
	var data = {
		room: {
			participantsNumber: participantsNum
		}
	}
	var newRoomForm = document.getElementById('newRoomForm');
	xhrRequest(data, newRoomForm, function (xhr) {
		if (xhr.status >= 200 && xhr.status < 300) {
			let room=JSON.parse(xhr.response).room;
			let p = document.getElementById('uuid');
			p.innerText = window.location.href + 'room/' + room.uuid+'/'+room.participantsNumber;
			document.getElementById('link-container').appendChild(p);

		} else {
			var errorMessage = JSON.parse(xhr.response);
			error.innerText = errorMessage.error;

		}
	});

});