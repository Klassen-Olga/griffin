document.getElementById("submitNewRoom").addEventListener("click", function (e) {
	e.preventDefault();
	var newRoomForm=document.getElementById('newRoomForm');
	xhrRequest('', newRoomForm, function (xhr) {
		if (xhr.status >= 200 && xhr.status < 300) {

			let p = document.createElement('p');
			p.innerText = window.location.href + 'room/' + uuid;
			document.getElementById('link-container').appendChild(p);

		} else {
			var error = document.getElementById('serverError');
			var errorMessage = JSON.parse(xhr.response);
			error.innerText = errorMessage.error;

		}
	});

});