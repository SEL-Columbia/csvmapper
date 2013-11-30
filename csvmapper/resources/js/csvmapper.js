var _map;
var ajaxRequest;
var readCSV;
var _refinedCsv;
var _mi_layer_geocsv;

// upload the csv
$("#filename").change(function(e) {
	var ext = $("input#filename").val().split(".").pop().toLowerCase();

	//check if the extension is a csv
	if($.inArray(ext, ["csv"]) == -1) {
		alert('Upload CSV');
		return false;
	}
	    
	if (e.target.files != undefined) {
		var reader = new FileReader();
		reader.onload = function(e) {
			var csvLines = e.target.result.split(/[\r\n|\n]+/);
			var headerLine = "";

			var table = $('<table></table>').addClass('csv-table table table-hover table-bordered');
			_.each(csvLines, function(line, index){
				var row = $('<tr></tr>');

				if(index == 0){
					headerLine = line;
					_.each(line.split(","), function(col, index){
						var colClass = 'header-row btn-primary column column' + index;
						row.append($('<th class=\"' + colClass + '\">' + col + '</th>'));
					});
				}else{
					_.each(line.split(","), function(col, index){
						var colClass = 'column column' + index;
						row.append($('<td class=\"' + colClass +'\">' + col + '</td>'));
					});
				}
				table.append(row);	
			});

			$("#csvimporthint").append(table);
			// hide all the columns initially
			$(".column").hide();
			$("#csvimporthinttitle").show();

			// save to global object
			readCSV = e.target.result;
			getLatLngField(headerLine);
			//geoCSV(e.target.result);

		};
		reader.readAsText(e.target.files.item(0));
	}
	return false;
});

// code to make header freeze
function UpdateTableHeaders() {
   $(".csv-table").each(function() {
   
       var el             = $(this),
           offset         = el.offset(),
           scrollTop      = $(window).scrollTop(),
           floatingHeader = $(".floatingheader", this)
       
       if ((scrollTop > offset.top) && (scrollTop < offset.top + el.height())) {
           floatingHeader.css({
            "visibility": "visible"
           });
       } else {
           floatingHeader.css({
            "visibility": "hidden"
           });      
       };
   });
}

function MakeHeaderFrozen(){
	//make header frozen
	var clonedHeaderRow;

   $(".csv-table").each(function() {
       clonedHeaderRow = $(".header-row", this);
       clonedHeaderRow
         .before(clonedHeaderRow.clone())
         .css("width", clonedHeaderRow.width())
         .addClass("floatingheader");
         
   });
   
   $(window)
    .scroll(UpdateTableHeaders)
    .trigger("scroll");
}
//done with code to make frozen header


function GetXmlHttpObject() {
	if (window.XMLHttpRequest) { return new XMLHttpRequest(); }
	if (window.ActiveXObject)  { return new ActiveXObject("Microsoft.XMLHTTP"); }
	return null;
}

function initmap() {

	ajaxRequest=GetXmlHttpObject();
	if (ajaxRequest==null) {
		alert ("This browser does not support HTTP Request");
		return;
	}

	// set up the map
	_map = new L.Map('map');

	// create the tile layer with correct attribution
	var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data © OpenStreetMap contributors';
	var osm = new L.TileLayer(osmUrl, {minZoom: 1, maxZoom: 12, attribution: osmAttrib});		

	// start the map in South-East England
	_map.setView(new L.LatLng(51.3, 0.7),5);
	_map.addLayer(osm);

	//get the markers for the map
	//askForPlots();
	//map.on('moveend', onMapMove)
}

// modal radio button change
function latlngRadioChanged(){
	// hide the input field
	if(this.value == 'single'){
		// show the separator div
		$("#latlngSeparatorDiv").show();
		// change the labels and hide the longitude selection
		$("#defaultDropdownLabel").text("Select the Geo-location column");
		$("#longitudeDropdownDiv").hide();
	}else{
		// hide the separator div
		$("#latlngSeparatorDiv").hide();
		// change the labels and show the longitude selection
		$("#defaultDropdownLabel").text("Select Latitude");
		$("#longitudeDropdownDiv").show();
	}
}

// function that handles the modal save click
function modalSaveClick(e){
	// get the line for the event data
	line = e.data.line;
	// single or multiple selection for lat and long
	if($("input[name='latlngRadios']:checked").val() == 'single'){
		//get the selected element
		var chosenLatLngField = $("#latDropdown option:selected").text();
		var fieldIndex = $("#latDropdown option:selected").val();
		var separator = $('#latlngSeparatorId').val();

		if( chosenLatLngField != "" && separator != ""){
			// modify the global csv
			var tempCSV = readCSV.replace(line, line.replace(chosenLatLngField, "lat,lng"));

			// hide the modal, show the column picker and map
			$('#fieldModal').modal('hide');
			columnPicker(line);
			geoCSV(tempCSV, fieldIndex, separator);
		}else{
			// show the modal, selection not complete
			$('#fieldModal').modal('show');
			var alertHTML = _.template($("#incompleteSelection_templateId").html());
			$("#modalFooterAlertId").prepend(alertHTML);
		}
	}else{
		// separate cols for lat and lng
		var chosenLatField = $("#latDropdown option:selected").text();
		var chosenLongField = $("#longDropdown option:selected").text();

		if( chosenLatField != "" && chosenLongField != "" ){
			// need to replace cols so that geo csv can understand them
			var newHeader = line.replace(chosenLatField, "lat");
			newHeader = newHeader.replace(chosenLongField, "lng");

			// replace header line in csv
			var tempCSV = readCSV.replace(line, newHeader);

			// hide the modal, show the column picker and 
			$('#fieldModal').modal('hide');
			columnPicker(line);
			geoCSV(tempCSV);
		}else{
			// show the modal, selection not complete
			$('#fieldModal').modal('show');
			var alertHTML = _.template($("#incompleteSelection_templateId").html());
			$("#modalFooterAlertId").prepend(alertHTML);
		}
	}
}

// gets the user to choose the lat lng field from the csv
function getLatLngField(line){
	// get the modal body and empty it
	var fieldModalBody  = $("#dynamicModalBodyId");
	fieldModalBody.empty();
	var latlng_innerHTML = 
		_.template($("#latlng_selection_template").html(), 
			{fields : line.split(',')});
	fieldModalBody.append(latlng_innerHTML);

	// trigger the modal
	$('#fieldModal').modal('show');

	// capture the modal radio button change event
	$("input[name='latlngRadios']").change(latlngRadioChanged);

	// bind the save click
	$("#saveLatLng").on("click", {line: line}, modalSaveClick);
}

// function that handles the change of col selection
function colSelectionChanged(e){
	// column from the csv
	var chosenColumn = $(this).val();
	var newColClass = "th.column"+ chosenColumn + ", td.column" + chosenColumn;

	// which place to put this column into
	var columnChosenFor = $(this).attr("index");
	var earlierColClass = "th:visible:eq(" + columnChosenFor + "),td:visible:eq(" + columnChosenFor + ")";

	$('.csv-table tr').each(function() {
	    var tr = $(this);
	    var td1 = tr.find(newColClass);
	    var td2 = tr.find(earlierColClass);
	    if (td2.length != 0){
		    td2.hide();
		    td1.detach().insertAfter(td2);
		    //td1.detach().insertBefore(td2);
		}
	});
	$(newColClass).show();
}

// redraw layer based on column clicked
function redrawLayer(columnClick){
	var regexp = new RegExp('\\d');
	var columnVal = columnClick[0].match(regexp)[0];

	var geojsonMarkerOptions = {
	    radius: 8,
	    fillColor: "#ff78ff",
	    color: "#fff",
	    weight: 1,
	    opacity: 1,
	    fillOpacity: 0.8
	};

	var pointToLayerFunction = function (feature, latlng) {
											var localGeojsonMarkerOptions = {};
											localGeojsonMarkerOptions = $.extend(localGeojsonMarkerOptions, geojsonMarkerOptions);
											var index = 0;
											for(var prop in feature.properties){
												if(index == columnVal){
													if(feature.properties[prop] == "PRIVATE")
														localGeojsonMarkerOptions.fillColor = "#ff7800";
													break;
												}
												index++;
											}
												
											var marker =  L.circleMarker(latlng, localGeojsonMarkerOptions);
											var popup = marker.bindPopup("<b>" + feature.properties["prop-3"] + "</b>");
											marker.on('click', function(e){
												popup.openPopup();
											});
											return marker;
										}
	// Remove the previous layer from the map
    _map.removeLayer(_mi_layer_geocsv);
	drawMapFromCsv(pointToLayerFunction);
}

// function that handles clearing the column
function colSelectionReset(e){
	$(".column").hide();
}

// function that gets called when column on the csv is clicked
function columnClicked(e){
	var columnClass = $(this).attr("class");
	// matches column followed by a digit
	var columnClick = columnClass.match(/column\d/);
	redrawLayer(columnClick);
}

// function that allows the user to pick max 6 cols to display
function columnPicker(line){
	var columnCount = 6;
	var columns = line.split(',');
	// count of the no of cols
	if( columns.length < 6 )
		columnCount = columns.length();

	// get the HTML from the template
	var columnPickerHTML = _.template($("#columnPicker_templateId").html(), 
			{fields : columns, columnCount: columnCount});
	
	// add the HTML to the columnPicker
	$("#columnPickerId").empty();
	$("#columnPickerId").append(columnPickerHTML);

	// bind the changed of dropdowns
	$(".colSelectDropdown").change(colSelectionChanged);
	// bind reset of column selection
	$("#resetColumnSelectionId").click(colSelectionReset);
	// bind the column click
	$(".column").click(columnClicked);
}

// draw the map, expect this function to be called repeatedly to draw
function drawMapFromCsv(pointToLayerFunction){
	if(!pointToLayerFunction){
		var geojsonMarkerOptions = {
		    radius: 8,
		    fillColor: "#ff7800",
		    color: "#fff",
		    weight: 1,
		    opacity: 1,
		    fillOpacity: 0.8
		};
		pointToLayerFunction = function (feature, latlng) {
			var marker =  L.circleMarker(latlng, geojsonMarkerOptions);
			var popup = marker.bindPopup("<b>Hello world!</b><br>I am a popup.");
			marker.on('click', function(e){
				popup.openPopup();
			});
			return marker;
		}
	}

	// create a geo layer from the csv
	_mi_layer_geocsv = L.geoCsv (null, {
										pointToLayer: pointToLayerFunction,
									 	firstLineTitles: true, 
									 	fieldSeparator: ','
								 	});
	_mi_layer_geocsv.addData(_refinedCsv);
	
    _map.addLayer(_mi_layer_geocsv);
    //point map to the correct location
    _map.fitBounds(_mi_layer_geocsv.getBounds());
}

//map the csv onto the map
function geoCSV(csv, geoFieldIndex, separator){
	if(!_map){
		initmap();
	}
	var refinedCsv = "";
	var csvLines = csv.split(/[\r\n|\n]+/);

	// in case of single col need to make separate cols for lat and long
	// geoFieldindex tells us its position
	if(geoFieldIndex){
		_.each(csvLines, function(line, index){
			if(index == 0){
				//getLatLngField(line);
				//line = line.replace("Geolocation", "lat,lng");
				/*_.each(line.split(','), function(field, field_index){
					if(field == "Geolocation" ){
						//
						console.log(field_index);
					}
				});*/
			}else{
				fields = line.split(',');
				line = line.replace(fields[geoFieldIndex], fields[geoFieldIndex].split(separator))
			}
			refinedCsv += line + "\n";
		});
	}else{
		_.each(csvLines, function(line, index){
			refinedCsv += line + "\n";
		});
	}

	// we save the refined csv to draw again based on user selection
	_refinedCsv = refinedCsv;

	// draw map from csv
	drawMapFromCsv();
}


