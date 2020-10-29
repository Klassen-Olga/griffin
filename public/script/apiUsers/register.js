document.getElementById("submitRegister").addEventListener("click", function (e) {
	e.preventDefault();
	var firstName = document.getElementById('firstName');
	var lastName = document.getElementById('lastName');
	var email = document.getElementById('email');
	var password = document.getElementById('password');
	var repeatPassword = document.getElementById('repeatPassword');
	var registerForm = document.getElementById('registerForm');
	let user = {
		user: {
			firstName: firstName.value,
			lastName: lastName.value,
			email: email.value,
			password: password.value,
			repeatPassword: repeatPassword.value
		}
	}
	xhrRequest(user, registerForm, function (xhr) {
		if (xhr.status >= 200 && xhr.status < 300) {

			console.log(JSON.parse(xhr.response).user);

			window.location = '/login';
		} else {
			var error = document.getElementById('serverError');
			var errorMessage = JSON.parse(xhr.response);
			error.innerText = errorMessage.error;

		}
	});
});