function updatePin(x,y,oviewer) {
    var point = new OpenSeadragon.Point(x,y);
    oviewer.updateOverlay('pin',point,OpenSeadragon.Placement.BOTTOM)
    oviewer.viewport.panTo(point,false)
    oviewer.viewport.zoomTo(2.5)
  }

function changeSource(building_id,level_id,element_id,overlaydata) {
    
    var viewerElement = document.getElementById(element_id)
    while (viewerElement.hasChildNodes()) {
        viewerElement.removeChild(viewerElement.firstChild);
    }
    building = building_id;
    level = level_id;
    new_overlays = getOverlays(overlaydata);
    var new_viewer = OpenSeadragon({
        id: element_id,
        immediateRender: true,
        showNavigator: false,
        showNavigationControl: false,
        defaultZoomLevel: 2,
        minZoomLevel: 1,
        maxZoomLevel: 15,
        overlays: new_overlays,
        visibilityRatio: 0.8,
        tileSources: "http://tile.ksumap.com/iiif/2/B_" + building + "_L_"+ level +".tif"
    });
    return new_viewer;
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
            y: overlaydata.elements[i].y,
            placement: 'CENTER',
            checkResize: false
        })
        var element = document.createElement('div');
        element.id = 'overlay'+i;
        element.className = "overlayItem";
        var overlayimg = document.createElement('img');
        overlayimg.src = "static/img/" + overlaydata.elements[i].IMAGE;
        overlayimg.width = overlaydata.elements[i].WIDTH;
        overlayimg.className = "overlayItem-img"
        element.appendChild(overlayimg);
        element.innerHTML += "<br>" + overlaydata.elements[i].TEXT;
        document.body.append(element);
    }
    var pin = document.createElement('img');
    pin.src = "static/img/pin.png"; 
    pin.width = '40';
    pin.id = 'pin';
    document.body.append(pin);
    overlayArray.push({
        id: 'pin',
        x: overlaydata.point.x,
        y: overlaydata.point.y,
        placement: 'BOTTOM',
        checkResize: false
      })
    return overlayArray;
}

function updateMap(err,jsondata) {
    if (err !== null) {
        return;
    }
    pointdata = jsondata.point
    if (pointdata.building == building && pointdata.level == level && pointdata.type == 'point') {
        updatePin(pointdata.x,pointdata.y,viewer); 
        var resultnode = document.getElementById("ResultNode");
        resultnode.innerText = pointdata.building_name + " " + pointdata.node_name;
    }
    else if (pointdata.type == 'point') {
        if (pointdata.building != building) {
            getJSON("http://data.ksumap.com:8182/building="+pointdata.building,updateLevels)
        }
        viewer = changeSource(pointdata.building,pointdata.level,"openseadragon1",jsondata);
        updatePin(0,0,viewer);
        updatePin(pointdata.x, pointdata.y,viewer);
        var resultnode = document.getElementById("ResultNode");
        resultnode.innerText = pointdata.building_name + " " + pointdata.node_name;
    }
    else {
        var resultnode = document.getElementById("ResultNode")
        resultnode.innerText = "No Results Found"
    }
}
function updateLevels(err,jsondata) {
    if (err != null) {
        return;
    }
    var olditems = document.getElementsByClassName('floor');
    while(olditems[0]) {
        olditems[0].parentNode.removeChild(olditems[0]);
    }
    var olditems = document.getElementsByClassName('floor-cur');
    while(olditems[0]) {
        olditems[0].parentNode.removeChild(olditems[0]);
    }
    for (var i = 0; i < jsondata.length; i++) {
        var newfloor = document.createElement('div');
        //newclass = (i == 0 ? "floor first" : (i == 1 ? "floor second" :(i==2 ? "floor third" : "floor fourth")))
        newfloor.className = level == (jsondata[i].id) ? "floor active" : "floor";
        newfloor.innerText = jsondata[i].id;
        newfloor.style.bottom = (60 + i*60) + "px";
        newfloor.onclick = function() {
            getJSON("http://data.ksumap.com:8182/search=Engineering Floor " + this.innerText,updateMap)
            var floors = document.getElementsByClassName("floor")
            for (var j = 0; j < floors.length; j++) {
                floors[j].className = "floor";
            }
                
            this.className = "floor active";
        }
        document.body.append(newfloor);
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
building = -1;
level = 1;
