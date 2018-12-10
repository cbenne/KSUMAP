function updatePin(x,y) {
    var point = new OpenSeadragon.Point(x,y);
    viewer.updateOverlay('pin',point,OpenSeadragon.Placement.BOTTOM)
    viewer.viewport.panTo(point,false)
    viewer.viewport.zoomTo(2.5)
  }
  setTimeout(function () {
          updatePin(0.6,0.4);
      }, 5000);

function changeSource(building,level,element_id) {
    
    var viewerElement = document.getElementById(element_id)
    while (viewerElement.hasChildNodes()) {
        viewerElement.removeChild(viewerElement.firstChild);
    }
    /* ADD IN OVERLAY FUNCTION CALL */
    var jsontext = '{"elements":[' +
        '{"x":0.489,"y":0.595,"image":"coffee.png","text":"Radinas","width":"25" },' +
        '{"x":0.54,"y":0.375,"image":"bathroom.png","text":"","width":"30" },' +
        '{"x":0.407,"y":0.3,"image":"bathroom.png","text":"","width":"30" },' +
        '{"x":0.298,"y":0.533,"image":"men.png","text":"","width":"25" },' +
        '{"x":0.361,"y":0.534,"image":"women.png","text":"","width":"25"},' +
        '{"x":0.614,"y":0.526,"image":"men.png","text":"","width":"25" },' +
        '{"x":0.55,"y":0.526,"image":"women.png","text":"","width":"25" }]}'
    var overlaydata = JSON.parse(jsontext);
    new_overlays = getOverlays(overlaydata);
    var viewer = OpenSeadragon({
        id: element_id,
        immediateRender: true,
        showNavigator: false,
        showNavigationControl: false,
        defaultZoomLevel: 2,
        minZoomLevel: 1,
        maxZoomLevel: 15,
        overlays: new_overlays,
        tileSources: "http://192.168.1.6:8182/iiif/2/B_" + building + "_L_"+ level +".tif"
    });
    return viewer;
}

function getOverlays(overlaydata) {
    /* Get rid of all current overlay items */
    var olditems = document.getElementsByClassName('overlayItem');
    while(olditems[0]) {
        olditems[0].parentNode.removeChild(olditems[0]);
    }
    /* For tying to the seadragonviewer*/
    var overlayArray = [];
    for (var i = 0; i < overlaydata.elements.length; i++) {
        /*This is the array that is sent to the new SeaDragon viewer */
        overlayArray.push( {
            id: 'overlay'+i,
            x: overlaydata.elements[i].x,
            y: overlaydata.elements[i].y * 0.75,
            placement: 'CENTER',
            checkResize: false
        })
        var element = document.createElement('div');
        element.id = 'overlay'+i;
        element.className = "overlayItem";
        var overlayimg = document.createElement('img');
        overlayimg.src = "./img/" + overlaydata.elements[i].image;
        overlayimg.width = overlaydata.elements[i].width;
        overlayimg.className = "overlayItem-img"
        element.appendChild(overlayimg);
        element.innerHTML += "<br>" + overlaydata.elements[i].text;
        document.body.append(element);
    }
    overlayArray.push({
        id: 'pin',
        x: 0,
        y: 0,
        placement: 'BOTTOM',
        checkResize: false
      })
    return overlayArray;
}

function updateMap(pointdata) {
    if (pointdata.building == building && pointdata.level == level && pointdata.type == 'point') {
        updatePin(pointdata.x,pointdata.y);
    }
    else {
        changeSource(pointdata.building,pointdata.level);
        if (pointdata.type == 'point') {
            updatePin(pointdata.x, pointdata.y);
        } 
    }
}
function getBuildingFromLocation( position) {
    viewer = changeSource(1,1,"openseadragon1");
    return viewer;
}
function defaultBuilding() {
    viewer = changeSource(1,1,"openseadragon1");
    return viewer;
}
viewer = null;
function getLocation() {
    viewer = changeSource(1,1,"openseadragon1");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(getBuildingFromLocation);
    } else {
      defaultBuilding()
    }
  }

getLocation();
