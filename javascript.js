/* All code by Matt DePero for CSE451 */

function promptAndGetLocation(){
	if(!checkPopUpBlocker() || !checkLocationServices()){
		return;
	}
	if ("geolocation" in navigator) {
		$('#output').append('<li>1. Finding current location...</li>');
		navigator.geolocation.getCurrentPosition(function(position) {
			$('#map').html("");// clear the "allow location services" message
			$('#output').append('<li>2. Current location found, displaying map...</li>');
			showCurrentLocation(position.coords.latitude, position.coords.longitude);
		},function(failure) {

		    bootbox.alert("Geolocation error: "+failure.message,function(){
		    	if(failure.message.indexOf("Only secure origins are allowed") == 0) {
			       bootbox.alert("Chrome 50 and newer does not allow geolocation on insecure connection (http) for this project, to view this demo, please use firefox or an older version of Chrome");
			       $('#output').append('<li>**Insecure connection error, please use firefox or an older version of Chrome.</li>');
			    }
		    });
		    return;
		  });
	} else {
		// Recursively call the function until the user allows location, or the user has an out of date browser
		bootbox.alert("Please use a modern browser.");
	}

}

var map;
var markers = [];

function showCurrentLocation(lat, long) {
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 15,
		center: {lat: lat, lng: long}
	});
	var image = 'https://cdn3.iconfinder.com/data/icons/glypho-free/64/home-32.png';
	markers.push( new google.maps.Marker({
			position: {lat: lat, lng: long},
			map: map,
			icon: image
		})
	);
	$('#output').append('<li>3. Enter a destination...</li>');
	$('#output').append('<li><input type="text" id="dest" class="form-control destForm" placeholder="Address or City"><button type="button" class="btn btn-primary destForm" onclick="setDestination();">Submit</button></li>');
}



function setDestination(){
	if($('#dest').val()==""){
		bootbox.alert("No destination entered");
		return;
	}
	$('.destForm').prop("disabled",true);
	$('#output').append('<li>4. Querying Google Geocoding API for lat long of your address...</li>');
	$.ajax({
		url:"https://maps.googleapis.com/maps/api/geocode/json?address="+$('#dest').val()+"&key=AIzaSyBkqzqS1B7Jl-8zUfN1K-Atdp2XMIehnOg",
		dataType: "json",
		type: "GET",
		success: function(result){
			console.log(result);

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

	$('#output').append('<li>5. Got lat long, adding marker to map</li><li><button type="button" id="genRoute" class="btn btn-primary" onclick="generateDirections()">Generate Directions</button></li>');

	var latlng = result.results[0].geometry.location;

	markers.push( new google.maps.Marker({
			position: latlng,
			map: map,
			animation: google.maps.Animation.DROP,
			title: result.results[0].address_components[0].long_name
		})
	);
	makeMapFitMarkers();
	
}


function generateDirections(){

	$('#output').append('<li>6. Getting route data from lat long data using Bing Maps REST service...');
	$.ajax({
		url: "http://dev.virtualearth.net/REST/v1/Routes?wayPoint.1="+markers[0].getPosition().lat()+","+markers[0].getPosition().lng()+"&wayPoint.2="+markers[1].getPosition().lat()+","+markers[1].getPosition().lng()+"&key=AkRn4tv0Mk98zABu8tq_k6EYgAyeHHkDZZ2z3xUhpNMAAkB7HnBFBa0_IXkzhEFD",
		dataType: "jsonp",
        jsonp: "jsonp",
		type: "GET",
		success: function(result){
			console.log(result);

			plotRouteAndGenerateKMLFromRoute(result);
		},
		error: function( xhr, status, error){
			console.log(error);
			bootbox.alert("An error occurred: "+xhr.responseText);
		}
	});

}



function plotRouteAndGenerateKMLFromRoute(result){

	$('#genRoute').prop("disabled",true);

	// check and make sure at least one route exists
	try{
		var route = result.resourceSets[0].resources[0];
		var legs = route.routeLegs[0];
	}catch(err){
		bootbox.alert("No route could be found. Please refresh the page and try again");
		$('#output').append('<li>Encountered an error, refresh the page...</li>');
		return;
	}

	$('#output').append('<li>7. Got route data back, plotting route and generating KML from data...</li>');
	var coords = [];
	var route = result.resourceSets[0].resources[0];
	var legs = route.routeLegs[0];

	coords.push(legs.actualStart.coordinates);

	for(var i = 0; i < legs.itineraryItems.length; i++){

		coords.push(legs.itineraryItems[i].maneuverPoint.coordinates);

		markers.push( new google.maps.Marker({
				position: {lat:legs.itineraryItems[i].maneuverPoint.coordinates[0],lng:legs.itineraryItems[i].maneuverPoint.coordinates[1]},
				map: map,
				animation: google.maps.Animation.DROP,
				title: "waypoint"
			})
		);
	}

	coords.push(legs.actualEnd.coordinates);

	console.log(coords);

	$.ajax({
		url: "http://ceclnx01.cec.miamioh.edu/~deperomm/cse451/final/kml.php?generate",
		dataType: "json",
		type: "POST",
		data: JSON.stringify(coords),
		success: function(result){
			console.log(result);

			displayLinkAndShare(result);
		},
		error: function( xhr, status, error){
			console.log(error);
			bootbox.alert("An error occurred: "+xhr.responseText);
		}
	});

}

var kmlURL = "";
function displayLinkAndShare(result){

	if(result.status != "success"){
		bootbox.alert("Error generating KML: "+result.message);
		return;
	}

	kmlURL = result.downloadURL;

	$('#output').append('<li>8.KML file generated, displaying generated file on map...<br/><a href="'+kmlURL+'" target="_blank">Download KML file</a></li>');


	var ctaLayer = new google.maps.KmlLayer({
	    url: kmlURL,
	    map: map
	  });

	$('#output').append('<li><button type="button" id="shareKML" class="btn btn-primary" onclick="shareKML()">Share KML</button></li>');

}


function shareKML(){


	// popups are allowed, check that KML url was generated
	if(kmlURL == ""){
		bootbox.alert("KML document URL not generated correctly");
		return;
	}

	OAuth.initialize('02SpHM9-IHixOnQ9wnEglUUn9bY');


	// KML URL was generated, run OAuth and send a tweet with the URL
	OAuth.popup('twitter')
	.done(function(result) {
	    result.post('1.1/statuses/update.json', {
        data: {
            status: 'Hey, check out the KML file for the route I just found: '+kmlURL
        }
	    })
	    .done(function (response) {
	        //this will display the id of the message in the console
	        console.log(response);
	        $('#shareKML').prop("disabled",true);
	        $('#output').append('<li>9. A tweet with a link to your KML has been sent.</li>');
	    })
	    .fail(function (err) {
	        //handle error with err
	        console.log(err);
	        bootbox.alert("An API Error Occurred: "+err);
	    });
	})
	.fail(function (err) {
	    //handle error with err
	    console.log(err);
	    bootbox.alert("An OAuth Error Occurred: "+err);
	});
}




/* Extra Functions */

// Resizes the map to fit all markers on it
// http://stackoverflow.com/questions/16331430/resizing-a-google-map-to-fit-a-group-of-markers
function makeMapFitMarkers() {

    var bounds = new google.maps.LatLngBounds();
    for (var i=0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition());
    }
    map.fitBounds(bounds);
}


function checkPopUpBlocker() {
    var result = false;

    var poppedWindow = window.open('./index.html');

    try {
        if (typeof poppedWindow == 'undefined') {
            // Safari with popup blocker... leaves the popup window handle undefined
            result = true;
        }
        else if (poppedWindow && poppedWindow.closed) {
            // This happens if the user opens and closes the client window...
            // Confusing because the handle is still available, but it's in a "closed" state.
            // We're not saying that the window is not being blocked, we're just saying
            // that the window has been closed before the test could be run.
            result = false;
        }
        else if (poppedWindow && poppedWindow.test) {
            // This is the actual test. The client window should be fine.
            result = false;
        }
        else {
            // Else we'll assume the window is not OK
            result = true;
        }

    } catch (err) {
        //if (console) {
        //    console.warn("Could not access popup window", err);
        //}
    }
    if(!result){
    	bootbox.alert('Please allow pop ups to use this project<br/><b>Be sure to mark "always allowed"</b>');
    }
    console.log('Popup blocker status: '+result);
    return result;
}


function checkLocationServices(){
	if ("geolocation" in navigator) {
		navigator.geolocation.getCurrentPosition(function(position) {
			
			return true;

		},function(failure) {

		    bootbox.alert("Geolocation error: "+failure.message,function(){
		    	if(failure.message.indexOf("Only secure origins are allowed") == 0) {
			       bootbox.alert("Chrome 50 and newer does not allow geolocation on insecure connection (http) for this project, to view this demo, please use firefox or an older version of Chrome");
			       $('#output').append('<li>**Insecure connection error, please use firefox or an older version of Chrome.</li>');
			    }
		    });
		    return false;
		  });
	} else {
		// Recursively call the function until the user allows location, or the user has an out of date browser
		bootbox.alert("Location services not available, please use a modern browser.");
		return false;
	}
}