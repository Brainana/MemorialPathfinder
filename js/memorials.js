
var memorialTypeCode2Name = {};

fetch("./data/memorials.json")
  .then(response => response.json())
  .then(function(json) {
    console.log(json);

    let fields = json.fields;
    fields.forEach(function(field) {
        if (field.name === "TYPE_") {
            field.domain.codedValues.forEach(function(type){
                memorialTypeCode2Name[type.code] = type.name;
            }) 
        }
    })

    let memorials = json.features;
    let memorialsByType = {};
    
    memorials.forEach(function(memorial) {
        memorial = memorial.attributes;
        let type = memorial.TYPE_;
        if (type !== undefined) {
            if (memorialsByType[type] === undefined) {
                memorialsByType[type] = [memorial];
            } else {
                memorialsByType[type].push(memorial);
            }
        }
    })
    console.log(memorialsByType);

    createMemorialsByType(memorialsByType);

});

var memorialSelected = {};
var markers = {};

function handleMemorialClick(memorialCheckBox) {
    console.log(memorialCheckBox);

    // let noLocationAlert =  document.querySelector("#no-location-alert");
    // noLocationAlert.style.display = "none";

    let memorialTypes = document.querySelector("#memorial-types");
    memorialTypes.style.setProperty("--bs-accordion-border-color", "var(--bs-body-color)");
    let pickMemorialsLabel = document.querySelector("#pick-memorials-label");
    pickMemorialsLabel.style.color = null;

    updateTravelModeButton("");
    clearRenderedRoutes();

    if (memorialSelected[memorialCheckBox.id] === undefined) {
    // if (markers[memorialCheckBox.id] === undefined) {
        var latLng = new google.maps.LatLng(parseFloat(memorialCheckBox.getAttribute("lat")), parseFloat(memorialCheckBox.getAttribute("lng")));
        // const memorialGIS = { lat: parseFloat(memorialCheckBox.getAttribute("lat")), lng: parseFloat(memorialCheckBox.getAttribute("lng")) };

        // The marker, positioned at memorial
        const marker = new google.maps.Marker({
            position: latLng,
            map: window.map,
        });

        memorialSelected[memorialCheckBox.id] = {
            name: memorialCheckBox.defaultValue,
            latLng: latLng,
            marker: marker
        }
    } else {
        memorialSelected[memorialCheckBox.id].marker.setMap(null);
        delete memorialSelected[memorialCheckBox.id];
    }
}

function createMemorialsByType(memorialsByType) {
    let accordion =  document.querySelector("#memorial-types");
    for(let type in memorialsByType) {
        let memorials = memorialsByType[type];
        let checkboxes ="";
        memorials.forEach(function(memorial) {
            checkboxes += `
                <div class="form-check">
                    <input class="form-check-input memorial-check-box" type="checkbox" value="${memorial.Name_of_Memorial}" id="${memorial.OBJECTID_1}" lng="${memorial.x}" 
                        lat="${memorial.y}" onclick='handleMemorialClick(this);'>
                    <label class="form-check-label" for="flexCheckDefault">
                        ${memorial.Name_of_Memorial}
                    </label>
                </div>
            `;
        })

        var typeHeading = type + "Heading";
        var typeCollapse = type + "Collapse";
        const innerHTML = `
            <h2 class="accordion-header" id=${typeHeading}>
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${typeCollapse}" aria-expanded="false" aria-controls="collapseTwo">
                ${memorialTypeCode2Name[type]}
                </button>
            </h2>
            <div id="${typeCollapse}" class="accordion-collapse collapse" aria-labelledby="${typeHeading}" data-bs-parent="#memroial-types">
                <div class="accordion-body">
                    ${checkboxes}
                </div>
            </div>`;
        // this can't be HTML text because it will handle the events like hover and click
        let accordionItem = document.createElement("div");
        accordionItem.innerHTML = innerHTML;
        accordionItem.className = "accordion-item";

        accordion.appendChild(accordionItem);
    }
}
