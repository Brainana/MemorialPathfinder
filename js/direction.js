var destIdx2MemorialId;
var shortestRouteGenerated = false;

function updateTravelModeButton(travelMode) {
    let driving =  document.querySelector("#driving");
    let walking =  document.querySelector("#walking");
    let bicycling =  document.querySelector("#bicycling");
    enableTravelModeButton(driving, travelMode === "driving" ? true : false);
    enableTravelModeButton(walking, travelMode === "walking" ? true : false);
    enableTravelModeButton(bicycling, travelMode === "bicycling" ? true : false)
}

function enableTravelModeButton(button, enable) {
    if (enable) {
        button.classList = "btn btn-sm btn-info";
    } else {
        button.classList = "btn btn-sm btn-light";
    }
}

function getShortestPath(travelMode) {
    clearRenderedRoutes();
    updateTravelModeButton("");

    let startingPoint =  document.querySelector("#startingPoint");

    if (startingPointLocation === undefined) {
        startingPoint.classList = "form-control is-invalid";
        return;
    }

    let memorialTypes = document.querySelector("#memorial-types");
    let pickMemorialsLabel = document.querySelector("#pick-memorials-label");
    if (Object.keys(memorialSelected).length === 0) {
        pickMemorialsLabel.style.color = "red";
        memorialTypes.style.setProperty("--bs-accordion-border-color", "red");
        return;
    }    

    if (shortestRouteGenerated) {
        toggleLocationPickerAndDirections(false);
        return;
    }

    updateTravelModeButton(travelMode);

    adjustMapBound(true, true);

    var origins = [startingPointLocation];

    var destinations = [];
    destIdx2MemorialId = {};
    var i=0;
    for (let memorialId in memorialSelected) {
        destIdx2MemorialId[i++] = memorialId;
        destinations.push(memorialSelected[memorialId].latLng);
    }
    
    origins.push.apply(origins, destinations);

    console.log(origins);
    console.log(destinations);

    var distanceMatrixService = new google.maps.DistanceMatrixService();

    distanceMatrixService.getDistanceMatrix(
    {
        origins: origins,
        destinations: destinations,
        travelMode: travelMode.toUpperCase(),
        // transitOptions: TransitOptions,
        // drivingOptions: DrivingOptions,
        // unitSystem: UnitSystem,
        // avoidHighways: Boolean,
        // avoidTolls: Boolean,
    }, getDistanceMatrixCallback.bind(this, travelMode, destinations));

    // fetch("../data/distanceMatrixSampleResponse.json")
    // .then(response => response.json())
    // .then(function(json) {
    //     getDistanceMatrixCallback(json, travelMode);
    // });

}
var shortestDistance;
var shortestPermutation;

function getDistanceMatrixCallback(travelMode, destinations, response, status) {
    console.log(response);

    shortestDistance = Number.MAX_VALUE;
    shortestPermutation = [];

    var array = [];
    var numOfDestinations = destinations.length;
    for (var i=0; i<numOfDestinations; i++) {
        array.push(i);
    }
    generatePermutations(numOfDestinations, array, response);

    console.log("The shortest permutation is:" + shortestPermutation);
    let startingPoint =  document.querySelector("#startingPoint");
    console.log(startingPoint.value);
    for (var i=0; i<numOfDestinations; i++) {
        var memorialId = destIdx2MemorialId[shortestPermutation[i]];
        console.log(memorialSelected[memorialId].name);
    }

    renderShortestPath(shortestPermutation, travelMode);

    generateGoogleMapUrl(response, shortestPermutation, destinations, travelMode);

    shortestRouteGenerated = true;
}

var shortestPathUrl; 

function generateGoogleMapUrl(distanceMatrixResponse, shortestPermutation, destinations, travelMode) {
    shortestPathUrl = "https://www.google.com/maps/dir/?api=1";
    let startingPoint =  document.querySelector("#startingPoint");
    shortestPathUrl += "&origin=" + startingPoint.value;
    shortestPathUrl += "&destination=" + destinations[shortestPermutation[shortestPermutation.length-1]].toString();
    if (shortestPermutation.length > 1) {
        shortestPathUrl += "&waypoints="
        for (let i=0; i<shortestPermutation.length-1; i++) {
            let destinationIdx = shortestPermutation[i];
            shortestPathUrl += destinations[destinationIdx].toString() + "|"
        };
        shortestPathUrl.slice(0, -1);
    }
    shortestPathUrl += "&travelmode=" + travelMode;
    shortestPathUrl = encodeURI(shortestPathUrl);

    let startNavigation =  document.querySelector("#start-navigation");
    startNavigation.href = shortestPathUrl;
    // window.open(shortestPathUrl, "_blank");
}

function createDirectionDiv(id) {
    let directionsPanel =  document.querySelector("#directions");
    var direction = document.createElement('div');
    direction.id = "directions-" + id;
    direction.classList = "direction border";
    directionsPanel.appendChild(direction);
    return direction.id;
}

function renderShortestPath(shortestPermutation, travelMode) {
    var memorialId = destIdx2MemorialId[shortestPermutation[0]];
    startingPointMarker.setIcon("./images/1.JPG");
    var directionDivId = createDirectionDiv("start");
    let startingPoint =  document.querySelector("#startingPoint");
    renderRoute(travelMode, {latLng: startingPointLocation, name: startingPoint.value}, memorialSelected[memorialId], directionDivId), 1;

    for (var i=0; i<shortestPermutation.length-1; i++) {
        var memorialAId = destIdx2MemorialId[shortestPermutation[i]];
        var memorialBId = destIdx2MemorialId[shortestPermutation[i+1]];
        var number = i+2;
        memorialSelected[memorialAId].marker.setIcon("./images/" + number.toString() + ".JPG")
        var directionDivId = createDirectionDiv(shortestPermutation[i].toString())
        renderRoute(travelMode, memorialSelected[memorialAId], memorialSelected[memorialBId], directionDivId);
    }

    var number = shortestPermutation.length + 1;
    var memorialId = destIdx2MemorialId[shortestPermutation[shortestPermutation.length-1]];
    memorialSelected[memorialId].marker.setIcon("./images/" + number.toString() + ".JPG");   
    var directionDivId = createDirectionDiv(shortestPermutation[shortestPermutation.length-1].toString());
    renderLastDestination(memorialSelected[memorialId], directionDivId);
}

var directionsRenderers = [];

function renderRoute(travelMode, start, end, directionDivId) {
    toggleLocationPickerAndDirections(false);

    var request = {
        origin: start.latLng,
        destination: end.latLng,
        travelMode: travelMode.toUpperCase()
    };
    directionsService.route(request, function(result, status) {
        if (status == 'OK') {
            console.log(result);

            var polylineOptions;
            if (travelMode === "walking") {
                var lineSymbol = {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillOpacity: 1,
                    scale: 3
                };

                polylineOptions = new google.maps.Polyline({
                    strokeColor: '#347aeb',
                    strokeOpacity: 0,
                    icons: [{
                        icon: lineSymbol,
                        offset: '0',
                        repeat: '10px'
                    }]
                })
            } else {
                polylineOptions = new google.maps.Polyline({
                    strokeColor: '#347aeb',
                    strokeWeight: 5,
                    strokeOpacity: 1
                });
            }

            var rendererOptions = {
                preserveViewport: true,         
                suppressMarkers:true,
                polylineOptions: polylineOptions
            };
            
            var directionsRenderer = new google.maps.DirectionsRenderer(rendererOptions);
            directionsRenderer.setMap(map);
            directionsRenderer.setDirections(result);
            directionsRenderers.push(directionsRenderer)

            var route = result.routes[0];
            const directionPanel = document.getElementById(directionDivId);
      
            directionPanel.innerHTML = "";
      
            // For each route, display summary information.
            for (let i = 0; i < route.legs.length; i++) {
              const routeSegment = i + 1;
      
              directionPanel.innerHTML +=
                '<div class="fs-5 fw-bolder start-address">' + start.name + "</div>";
              directionPanel.innerHTML += route.legs[i].distance.text + "<br>";
              for (let y=0; y<route.legs[i].steps.length; y++) {
                var step = route.legs[i].steps[y];
                directionPanel.innerHTML += `
                    <div class="step">
                        <div class="instructions">
                            ${step.maneuver ? 
                            `<img class="${step.maneuver}" src="./images/${step.maneuver}.png">` : ''}
                            <span>${step.instructions}</span>
                        </div>
                        <div class="distance">
                            <div class="distance-grey-line"></div>
                            <div class="distance-text">${step.distance.text}</div>
                        </div>
                    </div>
                `;
              }
            }
      
        }
    });
}

function renderLastDestination(memorial, directionDivId) {
    let directionDiv =  document.querySelector("#" + directionDivId);
    directionDiv.innerHTML +=
    '<div class="fs-5 fw-bolder start-address">' + memorial.name + "</div>";
}

function clearRenderedRoutes() {
    shortestRouteGenerated = false;

    if (startingPointMarker) {
        startingPointMarker.setIcon(null);
    }

    for (var memorialId in memorialSelected) {
        memorialSelected[memorialId].marker.setIcon(null);

        var pinIcon = new google.maps.MarkerImage(
            "./images/" +  memorialSelected[memorialId].type + ".png",
            null, /* size is determined at runtime */
            null, /* origin is 0,0 */
            null, /* anchor is bottom center of the scaled image */
            new google.maps.Size(36, 36)
        ); 
        memorialSelected[memorialId].marker.setIcon(pinIcon);
    }
    directionsRenderers.forEach(function(directionsRenderer) {
        directionsRenderer.setMap(null);
    })
    directionsRenderers = [];

    let directionsPanel =  document.querySelector("#directions");
    directionsPanel.innerHTML = "";
}

function calculateDistance(permutation, response) {
    var distance = response.rows[0].elements[permutation[0]].distance.value;
    for (var y=0; y<permutation.length-1; y++) {
        var row = permutation[y]+1;
        var element = permutation[y+1]; 
        distance += response.rows[row].elements[element].distance.value;
    }
    if (distance < shortestDistance) {
        shortestDistance = distance;
        shortestPermutation = Array.from(permutation);
    }
}

function goBackToLocationPicker() {
    toggleLocationPickerAndDirections(true);
}

function toggleLocationPickerAndDirections(showLocationPicker) {
    let locationPickerPanel =  document.querySelector("#locations-picker-panel");
    locationPickerPanel.style.display = showLocationPicker ? "block" : "none";

    let directionsPanel =  document.querySelector("#directions-panel");
    directionsPanel.style.display = showLocationPicker ? "none" : "block";
}




