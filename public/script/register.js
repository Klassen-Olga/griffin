document.getElementById("submitRegister").addEventListener("click", function (e) {
	e.preventDefault();
	var firstName = document.getElementById('firstName');
	var lastName = document.getElementById('lastName');
	var email = document.getElementById('email');
	var password = document.getElementById('password');
	var repeatPassword = document.getElementById('repeatPassword');
	var registerForm = document.getElementById('registerForm');
	var xhr = new XMLHttpRequest();
	console.log(registerForm.getAttribute('action'));
	xhr.open(registerForm.getAttribute('method'), registerForm.getAttribute('action'));
	xhr.setRequestHeader('Content-Type', 'application/json');
	var start = new Date();

	xhr.onload=function(){
		var end = new Date();
		var duration = 820 - (end.getTime() - start.getTime());
		duration = duration < 0 ? 0 : duration;

		setTimeout(function () {
			if (xhr.status >= 200 && xhr.status < 300) {

				console.log(xhr.response)
				/*setTimeout(function () {
					window.location = '/';
				}, 300);*/
			} else {
				console.log(xhr.response);

			}
		}, duration);
	}
	xhr.send(JSON.stringify({
		user: {
			firstName: firstName.value,
			lastName: lastName.value,
			email: email.value,
			password: password.value,
			repeatPassword: repeatPassword.value
		}
	}));
});