
var memorialTypeCode2Name = {};
var memorials;
var lastOpenInfoWindow;

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

    memorials = json.features;
    let memorialsByType = {};
    
    memorials.forEach(function(memorial) {
        memorial = memorial.attributes;
        let type = memorial.TYPE_;
        if (memorial.DedicatedT === "Person" && (memorial.Monu_descr === "Cary Hall" || memorial.Monu_descr === "1605 Massachusetts Ave")) {
            return;
        }
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

function closeExceedAllowedMemorialsAlert() {
    let alert =  document.querySelector("#exceed-allowed-memorials");
    alert.style.display = "none";
}

function handleMemorialClick(event) {
    let memorialCheckBox = event.currentTarget;

    // Check if the user picked more than 10 memorials
    if (memorialSelected[memorialCheckBox.id] === undefined && Object.keys(memorialSelected).length === 10) {
        event.preventDefault();
        let alert =  document.querySelector("#exceed-allowed-memorials");
        var checkBoxRectangle = memorialCheckBox.getBoundingClientRect();
        alert.style.top = Math.ceil(checkBoxRectangle.top - 75).toString() + "px";
        alert.style.left = Math.ceil( checkBoxRectangle.left - 20).toString() + "px";
        alert.style.display = "block";
        return false;
    }
    
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

        var type = memorialCheckBox.getAttribute("memorialtype");
        var pinIcon = new google.maps.MarkerImage(
            "./images/" +  type + ".png",
            null, /* size is determined at runtime */
            null, /* origin is 0,0 */
            null, /* anchor is bottom center of the scaled image */
            new google.maps.Size(36, 36)
        );  
        // The marker, positioned at memorial
        const marker = new google.maps.Marker({
            position: latLng,
            map: window.map
            // icon: "./images/" + memorialCheckBox.getAttribute("memorialtype") + ".png"
        });
        marker.setIcon(pinIcon);

        var id = memorialCheckBox.getAttribute("id");
        var memorial = memorials.filter(memorial => memorial.attributes.OBJECTID_1 === parseInt(id))[0];
        var plaqueText = memorial.attributes.Plaque_text;
        var description = memorial.attributes.Monu_descr;
        var attachmentUrl = getAttachmentUrl(memorial);
        var history = memorial.attributes.Monument_History;
        var contentString = "";
        if (attachmentUrl) {
            contentString += '<div><img class="memorial-photo" src="' + attachmentUrl + '"/></div>';
        }
        if (description) {
            // contentString += '<div class="fs-5 fw-semibold mt-2 mb-2">Description:</div><div class="fs-6">' + plaqueText + "</div>"; 
            contentString += '<div class="fs-6">' + description + "</div>"; 
        }
        if (plaqueText) {
            // contentString += '<div class="fs-5 fw-semibold mt-2 mb-2">Plaque Text:</div><div class="fs-6">' + plaqueText + "</div>"; 
            contentString += '<div class="fs-6">' + plaqueText + "</div>"; 
        }
        if (history) {
            // contentString += '<div class="fs-5 fw-semibold mt-2 mb-2">History:</div><div class="fs-6">' + history + "</div>"; 
            contentString += '<div class="fs-6">' + history + "</div>"; 
        }

        var infoWindow;
        if (contentString) {
            infoWindow = new google.maps.InfoWindow({
                content: contentString,
                ariaLabel: memorial.Name_of_Memorial,
                maxWidth: 600
            });

            marker.addListener("click", () => {
                if (lastOpenInfoWindow) {
                    lastOpenInfoWindow.close();
                }

                lastOpenInfoWindow = infoWindow;
                infoWindow.open({
                anchor: marker,
                map,
                });
            });
        }

        memorialSelected[memorialCheckBox.id] = {
            name: memorialCheckBox.defaultValue,
            latLng: latLng,
            marker: marker,
            type: type
        }
        
        if (infoWindow) {
            memorialSelected[memorialCheckBox.id].infowindow = infoWindow;
        }

    } else {
        if (memorialSelected[memorialCheckBox.id].infowindow) {
            delete memorialSelected[memorialCheckBox.id].infowindow;
        }
        memorialSelected[memorialCheckBox.id].marker.setMap(null);
        delete memorialSelected[memorialCheckBox.id].marker;
        delete memorialSelected[memorialCheckBox.id];
    }

    adjustMapBound(false, true);
}

// async function getAttachmentUrl(memorialId) {
//     var baseAttachmentUrl = "https://services.arcgis.com/bP0owepHkr9WxF4V/arcgis/rest/services/Monument_plaques_Verified/FeatureServer/0/" + memorialId + "/attachments";
//     var getAttachmentInfoUrl = baseAttachmentUrl + "?f=json";
//     var resp = await fetch(getAttachmentInfoUrl);
//     var json = resp.json();
//     var attachmentInfos = json.attachmentInfos;
//     var attachmentId;
//     if (attachmentInfos.length > 0) {
//         attachmentId = attachmentInfos[0].id;
//     }
//     if (attachmentId) {
//         return baseAttachmentUrl + "/" + attachmentId + "?width=200";
//     } 
//     return null;
// }

function getAttachmentUrl(memorial) {
    var memorialId = memorial.attributes.OBJECTID_1;
    var attachmentId = memorial.attributes.AttachmentId;
    if (attachmentId) {
        var baseAttachmentUrl = "https://services.arcgis.com/bP0owepHkr9WxF4V/arcgis/rest/services/Monument_plaques_Verified/FeatureServer/0/" + memorialId + "/attachments";
        return baseAttachmentUrl + "/" + attachmentId + "?width=400";
    } 
    return null;
}

function createMemorialsByType(memorialsByType) {
    let accordion =  document.querySelector("#memorial-types");
    for(let type in memorialsByType) {
        let memorials = memorialsByType[type];
        memorials.sort(function(a, b){return a.Name_of_Memorial.localeCompare(b.Name_of_Memorial)});
        let checkboxes ="";
        memorials.forEach(function(memorial) {
            var memorialName = memorial.Name_of_Memorial.replace(/[\u00A0-\u9999<>\&]/g, function(i) {
                return '&#'+i.charCodeAt(0)+';';
            });
            checkboxes += `
                <div class="form-check">
                    <input class="form-check-input memorial-check-box" type="checkbox" value='${memorialName}' id="${memorial.OBJECTID_1}" lng="${memorial.x}" 
                        lat="${memorial.y}" memorialtype="${memorial.TYPE_}" onclick='handleMemorialClick(event);'>
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