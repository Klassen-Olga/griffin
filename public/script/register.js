function registerButton(){
  var firstName=document.getElementById('firstName');
  var lastName=document.getElementById('lastName');
  var email=document.getElementById('email');
  var password=document.getElementById('password');
  var registerForm=document.getElementById('registerForm');
  var xhr = new XMLHttpRequest();
  console.log(registerForm.getAttribute('action'));
  xhr.open(registerForm.getAttribute('method'), registerForm.getAttribute('action'));
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.send(JSON.stringify({
    user: {
      firstName:firstName.value,
      lastName:lastName.value,
      email: email.value,
      password: password.value
    }
  }));
}
