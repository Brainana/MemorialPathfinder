var directionsService;

// Initialize and add the map
function initMap() {  
    // The location of Lexington Visitor Center
    const lexingtonVisitorCenter = { lat: 42.449115, lng: -71.228909 };
    // The map, centered at Uluru
    window.map = new google.maps.Map(document.getElementById("map"), {
      zoom: 15,
      minZoom: 11,
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
}
  
window.initMap = initMap;

let startingPointLocation;
let startingPointMarker;
