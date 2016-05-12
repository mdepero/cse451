/* All code by Matt DePero for CSE451 */

function promptAndGetLocation(){

	bootbox.alert("Please accept the prompt asking to allow the browser to see your location...",function(){
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(function(position) {
			  showCurrentLocation(position.coords.latitude, position.coords.longitude);
			});
		} else {
			bootbox.alert("Geolocation is not available. Please reload your browser and grant the browser permission to view your location, or use a modern web browser.");
		}
	})

}



function showCurrentLocation(lat, long) {
	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 4,
		center: {lat: lat, lng: long}
	});
	var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
	var beachMarker = new google.maps.Marker({
		position: {lat: lat, lng: long},
		map: map,
		icon: image
	});
}