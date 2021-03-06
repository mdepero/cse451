/* All code by Matt DePero for CSE451 */

// Use browser side geolocation to get the current lat and long
function promptAndGetLocation(){
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

// global map variables
var map;
var markers = [];

// add custom marker to map for current location
function showCurrentLocation(lat, long) {

	$('#start').prop("disabled",true);

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


// Use Google geocoding to get the lat long of the location entered by the user
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


// take the lat long retrieved from Google and plot it on the map, also redraw map with new boundaries to fit
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


// Take the two locations (in lat and long) generated so far and send them to Bing Map Services to get a route
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


// Parse the data returned from Microsoft and create an array of every lat long point on the route, send this to the PHP script to be generated into KML
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

// global variable for the URL of the KML file generated
var kmlURL = "";

// Once the PHP script finishes creating an uploading the KML file, display a link to the file and the option to share it
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


// Use OAuth to authenticate twitter, and then send a tweet with a link to the newly generated KML
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
            status: 'Auto generated tweet with a link to a KML file of my route: '+kmlURL
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
	    bootbox.alert("An OAuth Error Occurred: "+err+'<br/>Is pop up blocker enabled?');
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

// calls the two types of requests that require permissions, giving the user the ability to grant permissions before starting the project
function permissionsPopUp() {
	bootbox.alert('When prompted, allow pop ups and location services to use this project<br/><b>Be sure to mark "always allow" for this site</b>',function(){

    	promptLocationServices();
	});
	promptPopUps();// must be run automatically (not initiated by user click) in order for pop up blocker to run
}

// Makes a request for a pop up, giving the user the ability to "allow popups"
function promptPopUps(){

	console.log("Prompting user to allow pop ups");

    // prompt the user to allow popups
    var popUp = window.open("popuptest.html");
    if(popUp){
    	popUp.close();
    }
}

// Makes a request for location services, giving the user the ability to allow location services
function promptLocationServices(){

	console.log("Prompting user to allow location services");

	if ("geolocation" in navigator) {
		navigator.geolocation.getCurrentPosition(function(position) {
			
			console.log("Geolocation enabled");
			return true;

		},function(failure) {

		    bootbox.alert("Geolocation error: "+failure.message,function(){
		    	if(failure.message.indexOf("Only secure origins are allowed") == 0) {
			       bootbox.alert("Chrome 50 and newer does not allow geolocation on insecure connection (http) for this project, to view this demo, please use firefox or an older version of Chrome");
			       $('#output').append('<li>**Insecure connection error, please use firefox or an older version of Chrome.</li>');
			    }
		    });
		    console.log("Geolocation disabled or blocked");
		    return false;
		  });
	} else {
		// Recursively call the function until the user allows location, or the user has an out of date browser
		bootbox.alert("Location services not available, please use a modern browser.");
		console.log("Geolocation disabled or blocked");
		return false;
	}
}