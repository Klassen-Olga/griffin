
function handleError(error){
  if((error.name === 'NotFoundError' )||( error.name ===  'DevicesNotFoundError')){
    alert("Your device is disabled or you don't have appropriate one");
  }
  else if((error.name === 'NotAllowedError' )||( error.name ===  'PermissionDeniedError')){
    alert("Access to your device was denied, please check your browser settings");
  }
  else if((error.name === 'NotReadableError' )||( error.name ===  'TrackStartError')){
    alert("Requested device is already in use");
  }
  else if((error.name === 'OverconstrainedError' )||( error.name ===  'ConstraintNotSatisfiedError')){
    alert(error.message);
  }
}

