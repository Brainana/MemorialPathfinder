function switchToMapView(enable) {
    let leftPanel =  document.querySelector("#left-panel");
    leftPanel.style.display = enable ? "none" : "block";
    let rightPanel =  document.querySelector("#right-panel");
    rightPanel.style.display = enable ? "block" : "none";
}

function adjustMapBound() {
    var bounds = new google.maps.LatLngBounds();

    if (startingPointMarker) {
        bounds.extend(startingPointMarker.getPosition());
    }

    for (var memorialId in memorialSelected) {
        bounds.extend(memorialSelected[memorialId].marker.getPosition());
    }

    map.fitBounds(bounds);
}
