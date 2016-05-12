/* All code by Matt DePero for CSE451 */

function promptAndGetLocation(){
	if ("geolocation" in navigator) {
		$('#output').append('<li>Finding current location...</li>');
		navigator.geolocation.getCurrentPosition(function(position) {
			$('#map').html("");// clear the "allow location services" message
			showCurrentLocation(position.coords.latitude, position.coords.longitude);
			$('#output').append('<li>Current location found, displaying map...</li>');
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
	$('#output').append('<li id="destForm"><input type="text" id="dest" class="form-control" placeholder="Address or Place"><br/><button type="button" class="btn btn-primary" onclick="setDestination();">Submit</button></li>');
}



function setDestination(){
	alert($('#dest').val());
}