function switchToMapView(enable) {
    let leftPanel =  document.querySelector("#left-panel");
    leftPanel.style.display = enable ? "none" : "block";
    let rightPanel =  document.querySelector("#right-panel");
    rightPanel.style.display = enable ? "block" : "none";
}

function adjustMapBound(includeStartingPoint, includeMemorials) {
    var bounds = new google.maps.LatLngBounds();

    var hasMarker = false;
    if (includeStartingPoint && startingPointMarker) {
        bounds.extend(startingPointMarker.getPosition());
        hasMarker = true;
    }

    if (includeMemorials) {
        for (var memorialId in memorialSelected) {
            hasMarker = true;
            bounds.extend(memorialSelected[memorialId].marker.getPosition());
        }
    }

    if (!hasMarker) {
        bounds.extend(lexingtonVisitorCenter);
    }

    map.fitBounds(bounds);
}