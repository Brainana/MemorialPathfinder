document.querySelector("#startingPoint").addEventListener('change', onStartingPointChange);

function setPlaceHolderText() {
    var startingPoint = document.querySelector("#startingPoint");
    if (window.innerWidth >= 770) {
        startingPoint.placeholder = "Enter a location, or click on the map";
    }
}

setPlaceHolderText();

function onStartingPointChange() {
    // Need a delay for the autocomplete to fill in the address.
    setTimeout(onStartingPointChangeHelper, 100);
}

function onStartingPointChangeHelper() {
    shortestRouteGenerated = false;
    clearRenderedRoutes();
    updateTravelModeButton("");

    var startingPoint = document.querySelector("#startingPoint");
    startingPointLocation = undefined;
    if (startingPointMarker) {
        startingPointMarker.setMap(null);
        startingPointMarker = undefined;
    }

    if (startingPoint.value == "") return;

    let geoCodingUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" + 
        encodeURI(startingPoint.value) + "&key=AIzaSyCEd7Y6AiDJa52rS98IReIb1CWRbMKsMp4";
    fetch(geoCodingUrl)
    .then(response => response.json())
    .then(function(json) {
        console.log(json);

        if (json.status !== "OK") {
            startingPoint.classList = "form-control is-invalid";
            return;
        }

        startingPoint.classList = "form-control";
        startingPointLocation = json.results[0].geometry.location;

        startingPointMarker = new google.maps.Marker({
            position: startingPointLocation,
            map: window.map,
        });

        adjustMapBound(true, true);
    });
}

function onLocateMe() {
    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    function success(pos) {
        const crd = pos.coords;

        console.log('Your current position is:');
        console.log(`Latitude : ${crd.latitude}`);
        console.log(`Longitude: ${crd.longitude}`);
        console.log(`More or less ${crd.accuracy} meters.`);

        startingPointLocation = undefined;
        if (startingPointMarker) {
            startingPointMarker.setMap(null);
            startingPointMarker = undefined;
        }

        var startingPoint = document.querySelector("#startingPoint");

        startingPoint.classList = "form-control";
        startingPointLocation = {
            lat: crd.latitude,
            lng: crd.longitude
        };

        startingPointMarker = new google.maps.Marker({
            position: startingPointLocation,
            map: window.map,
        });

        adjustMapBound(true, true);

        let geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: startingPointLocation })
        .then((response) => {
          if (response.results[0]) {
            startingPoint.value = response.results[0].formatted_address;
          }
        })
    
    }

    function error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    navigator.geolocation.getCurrentPosition(success, error, options);
}

