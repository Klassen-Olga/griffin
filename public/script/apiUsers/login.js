document.getElementById("submitLogin").addEventListener("click", function (e) {
	e.preventDefault();

	var email = document.getElementById('email');
	var password = document.getElementById('password');
	var loginForm = document.getElementById('loginForm');

	let user = {
		user: {
			email: email.value,
			password: password.value
		}
	}
	xhrRequest(user, loginForm, function (xhr) {
		if (xhr.status >= 200 && xhr.status < 300) {

			window.location = '/';

		} else {
			var error = document.getElementById('serverError');
			var errorMessage = JSON.parse(xhr.response);
			error.innerText = errorMessage.error;

		}
	});

});