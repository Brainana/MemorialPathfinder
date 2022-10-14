function switchToMapView(enable) {
    let leftPanel =  document.querySelector("#left-panel");
    leftPanel.style.display = enable ? "none" : "block";
    let rightPanel =  document.querySelector("#right-panel");
    rightPanel.style.display = enable ? "block" : "none";
}