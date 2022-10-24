var directionsService;
var lexingtonVisitorCenter;

// Initialize and add the map
function initMap() {  
    // const lexingtonVisitorCenter = { lat: 42.449115, lng: -71.228909 };
    lexingtonVisitorCenter = new google.maps.LatLng(42.449115, -71.228909);

    // The location of Lexington Visitor Center
    // The map, centered at Uluru
    window.map = new google.maps.Map(document.getElementById("map"), {
      zoom: 15,
      minZoom: 5,
      maxZoom: 15,
      center: lexingtonVisitorCenter,
      draggableCursor: 'pointer'
    });

    window.map.addListener("click", (event) => {
        console.log(event);

        let reverseGeoCodingUrl = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + 
            event.latLng.lat() + "," + event.latLng.lng() + "&key=AIzaSyCEd7Y6AiDJa52rS98IReIb1CWRbMKsMp4";
        fetch(reverseGeoCodingUrl)
            .then(response => response.json())
            .then(function(json) {
                console.log(json);

                shortestRouteGenerated = false;
                clearRenderedRoutes();
                updateTravelModeButton("");
                
                if (startingPointMarker) {
                    startingPointMarker.setMap(null);
                    startingPointMarker = undefined;
                }

                let startingPoint =  document.querySelector("#startingPoint");
                startingPoint.value = json.results[0].formatted_address;
                startingPointLocation = json.results[0].geometry.location;

                startingPointMarker = new google.maps.Marker({
                    position: startingPointLocation,
                    map: window.map
                });
            });
    });

    directionsService = new google.maps.DirectionsService();

    let startingPoint = document.querySelector("#startingPoint")

    // Create a bounding box with sides ~10km away from the center point
    const defaultBounds = {
        north: lexingtonVisitorCenter.lat() + 0.1,
        south: lexingtonVisitorCenter.lat() - 0.1,
        east: lexingtonVisitorCenter.lng() + 0.1,
        west: lexingtonVisitorCenter.lng() - 0.1,
    };
    const options = {
        bounds: defaultBounds,
        componentRestrictions: { country: "us" },
        fields: ["address_components", "geometry", "icon", "name"],
        strictBounds: false
        // types: ["establishment"]
    };
    const autocomplete = new google.maps.places.Autocomplete(startingPoint, options);

}
  
window.initMap = initMap;

let startingPointLocation;
let startingPointMarker;