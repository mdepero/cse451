/* All code by Matt DePero for CSE451 */

function promptAndGetLocation(){
	if ("geolocation" in navigator) {
		$('#output').append('<li>Finding current location...</li>');
		navigator.geolocation.getCurrentPosition(function(position) {
			$('#map').html("");// clear the "allow location services" message
			$('#output').append('<li>Current location found, displaying map...</li>');
			showCurrentLocation(position.coords.latitude, position.coords.longitude);
		});
	} else {
		// Recursively call the function until the user allows location, or the user has an out of date browser
		bootbox.alert("Please use a modern browser.");
	}

}



function showCurrentLocation(lat, long) {
	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: {lat: lat, lng: long}
	});
	var image = 'https://cdn3.iconfinder.com/data/icons/glypho-free/64/home-32.png';
	var beachMarker = new google.maps.Marker({
		position: {lat: lat, lng: long},
		map: map,
		icon: image
	});
	$('#output').append('<li>Enter a destination...</li>');
	$('#output').append('<li id="destForm"><input type="text" id="dest" class="form-control" placeholder="Address or Place"><button type="button" class="btn btn-primary" onclick="setDestination();">Submit</button></li>');
}



function setDestination(){
	if($('#dest').val()==""){
		bootbox.alert("No destination entered");
		return;
	}
	$.ajax({
		url:"https://maps.googleapis.com/maps/api/geocode/json?address="+$('#dest').val()+"&key=AIzaSyACnVBGCT_qPTAZHmWdOsE8HQhy2dAAVBM",
		dataType: "application/json",
		success: gotDestination,
	    error: function(error){
	    	bootbox.alert("An error occurred: "+error);
	    }
	});
}


function gotDestination(result){
	console.log(retult);
	bootbox.alert("got it");
}