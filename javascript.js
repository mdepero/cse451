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

var map;

function showCurrentLocation(lat, long) {
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 15,
		center: {lat: lat, lng: long}
	});
	var image = 'https://cdn3.iconfinder.com/data/icons/glypho-free/64/home-32.png';
	var beachMarker = new google.maps.Marker({
		position: {lat: lat, lng: long},
		map: map,
		icon: image
	});
	$('#output').append('<li>Enter a destination...</li>');
	$('#output').append('<li><input type="text" id="dest" class="form-control destForm" placeholder="Address or Place"><button type="button" class="btn btn-primary destForm" onclick="setDestination();">Submit</button></li>');
}



function setDestination(){
	if($('#dest').val()==""){
		bootbox.alert("No destination entered");
		return;
	}
	$('.destForm').prop("disabled",true);
	$('#output').append('<li>Querying Google Geocoding API for lat long of your address...</li>');
	$.ajax({
		url:"https://maps.googleapis.com/maps/api/geocode/json?address="+$('#dest').val()+"&key=AIzaSyBkqzqS1B7Jl-8zUfN1K-Atdp2XMIehnOg",
		dataType: "json",
		type: "GET",
		success: function(result){
			gotDestination(result);
		},
	    error: function(xhr, status, error){
	    	console.log(error);
	    	bootbox.alert("An error occurred: "+xhr.responseText);
	    }
	});
}


function gotDestination(result){
	console.log(result);

	$('#output').append('<li>Got lat long, adding marker to map</li>');

	var latlng = result.results[0].geometry.location;

	var marker = new google.maps.Marker({
		position: latlng,
		map: map,
		animation: google.maps.Animation.DROP,
		title: result.results[0].address_components[0].long_name,
		label: result.results[0].address_components[0].long_name
	});

	console.log(label: result.results[0].address_components[0].long_name);
	
}