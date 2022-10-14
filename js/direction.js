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

    if (startingPointLocation === undefined ) {
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
    }, getDistanceMatrixCallback);

    // fetch("../data/distanceMatrixSampleResponse.json")
    // .then(response => response.json())
    // .then(function(json) {
    //     getDistanceMatrixCallback(json, travelMode);
    // });

}
var shortestDistance;
var shortestPermutation;

function getDistanceMatrixCallback(response, travelMode) {
    console.log(response);

    shortestDistance = Number.MAX_VALUE;
    shortestPermutation = [];

    var array = [];
    var numOfDestinations = response.destinationAddresses.length;
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

    renderShortestPath(shortestPermutation);

    generateGoogleMapUrl(response, shortestPermutation, travelMode);

    shortestRouteGenerated = true;
}

var shortestPathUrl; 

function generateGoogleMapUrl(distanceMatrixResponse, shortestPermutation, travelMode) {
    shortestPathUrl = "https://www.google.com/maps/dir/?api=1";
    let startingPoint =  document.querySelector("#startingPoint");
    shortestPathUrl += "&origin=" + startingPoint.value;
    shortestPathUrl += "&destination=" + distanceMatrixResponse.destinationAddresses[shortestPermutation[shortestPermutation.length-1]];
    if (shortestPermutation.length > 1) {
        shortestPathUrl += "&waypoints="
        for (let i=0; i<shortestPermutation.length-1; i++) {
            let destinationIdx = shortestPermutation[i];
            shortestPathUrl += distanceMatrixResponse.destinationAddresses[destinationIdx] + "|"
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

function renderShortestPath(shortestPermutation) {
    var memorialId = destIdx2MemorialId[shortestPermutation[0]];
    startingPointMarker.setIcon("./images/1.JPG");
    var directionDivId = createDirectionDiv("start");
    let startingPoint =  document.querySelector("#startingPoint");
    renderRoute({latLng: startingPointLocation, name: startingPoint.value}, memorialSelected[memorialId], directionDivId), 1;

    for (var i=0; i<shortestPermutation.length-1; i++) {
        var memorialAId = destIdx2MemorialId[shortestPermutation[i]];
        var memorialBId = destIdx2MemorialId[shortestPermutation[i+1]];
        var number = i+2;
        memorialSelected[memorialAId].marker.setIcon("./images/" + number.toString() + ".JPG")
        var directionDivId = createDirectionDiv(shortestPermutation[i].toString())
        renderRoute(memorialSelected[memorialAId], memorialSelected[memorialBId], directionDivId);
    }

    var number = shortestPermutation.length + 1;
    var memorialId = destIdx2MemorialId[shortestPermutation[shortestPermutation.length-1]];
    memorialSelected[memorialId].marker.setIcon("./images/" + number.toString() + ".JPG");   
    var directionDivId = createDirectionDiv(shortestPermutation[shortestPermutation.length-1].toString());
    renderLastDestination(memorialSelected[memorialId], directionDivId);
}

var directionsRenderers = [];

function renderRoute(start, end, directionDivId) {
    toggleLocationPickerAndDirections(false);

    var request = {
        origin: start.latLng,
        destination: end.latLng,
        travelMode: 'DRIVING'
    };
    directionsService.route(request, function(result, status) {
        if (status == 'OK') {
            console.log(result);
            var rendererOptions = {
                preserveViewport: true,         
                suppressMarkers:true
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




