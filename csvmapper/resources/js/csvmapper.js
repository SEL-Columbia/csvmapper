var map;
var ajaxRequest;
var readCSV;

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
	map = new L.Map('map');

	// create the tile layer with correct attribution
	var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data © OpenStreetMap contributors';
	var osm = new L.TileLayer(osmUrl, {minZoom: 1, maxZoom: 12, attribution: osmAttrib});		

	// start the map in South-East England
	map.setView(new L.LatLng(51.3, 0.7),5);
	map.addLayer(osm);

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
			readCSV = readCSV.replace(line, line.replace(chosenLatLngField, "lat,lng"));

			// hide the modal, show the column picker and map
			$('#fieldModal').modal('hide');
			columnPicker(line);
			geoCSV(readCSV, fieldIndex, separator);
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
			readCSV = readCSV.replace(line, newHeader);

			// hide the modal, show the column picker and 
			$('#fieldModal').modal('hide');
			columnPicker(line);
			geoCSV(readCSV);
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
}

//map the csv onto the map
function geoCSV(csv, geoFieldIndex, separator){
	if(!map){
		initmap();
	}

	//split by line
	var csvLines = csv.split(/[\r\n|\n]+/);
	var refinedCsv = "";

	// in case of single col need to make separate cols for lat and long
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

	// create a geo layer from the csv
	var mi_geocsv = L.geoCsv (null, {firstLineTitles: true, fieldSeparator: ','});
	mi_geocsv.addData(refinedCsv);
	
    map.addLayer(mi_geocsv);
    //point map to the correct location
    map.fitBounds(mi_geocsv.getBounds());
}


