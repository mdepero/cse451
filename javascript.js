/* All code by Matt DePero for CSE451 */

function promptAndGetLocation(){
	if ("geolocation" in navigator) {
		navigator.geolocation.getCurrentPosition(function(position) {
		  showCurrentLocation(position.coords.latitude, position.coords.longitude);
		});
	} else {
		// Recursively call the function until the user allows location, or the user has an out of date browser
		bootbox.alert("Please accept the prompt asking to allow the browser to see your location.<br/><br/>If you keep getting this message, please use a modern browser.",function(){promptAndGetLocation()});
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
}