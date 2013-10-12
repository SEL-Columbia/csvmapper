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
				var row = $('<tr></tr>').addClass('bar');

				if(index == 0){
					headerLine = line;
					_.each(line.split(","), function(col){
						row.append($('<th class=\"header-row btn-primary\">' + col + '</th>'));
					});
				}else{
					_.each(line.split(","), function(col){
						row.append($('<td>' + col + '</td>'));
					});
				}
				table.append(row);	
			});

			$("#csvimporthint").append(table);
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

/*function renderView(reply){
	$("#csvimporthinttitle").empty();
	var TwitterWidget = Backbone.View.extend({
	    el: '#csvimporthinttitle',
	    initialize: function () {
	      this.render();
	    },
	    render: function () {
    		$(this.el).append(_.template($("#csv_template").html(), {rows : reply.statuses}));
	    }
  	});
  	new TwitterWidget();
}*/

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

// gets the user to choose the lat lng field from the csv
function getLatLngField(line){
	var fieldModalBody  = $("#fieldModal .modal-body")
	var innerHTML = _.template($("#latlng_selection_template").html(), {fields : line.split(',')});
	fieldModalBody.append(innerHTML);

	// trigger the modal
	$('#fieldModal').modal('show');

	// bind the click of fields
	$(".modalLatLngField").on("click", function(e){
		// toggle the classes based on selection
		$(".modalLatLngField").removeClass("btn-primary");
		$(this).addClass("btn-primary");
	});

	// bind the save click
	$("#saveLatLng").on("click", function(e){
		//get the selected element
		var chosenLatLngField = $(".modalLatLngField.btn-primary").text()
		var fieldIndex = $(".modalLatLngField.btn-primary").attr("field-Index")
		if( chosenLatLngField != ""){
			// modify the global csv
			readCSV = readCSV.replace(line, line.replace(chosenLatLngField, "lat,lng"));
			$('#fieldModal').modal('hide');	
			geoCSV(readCSV, fieldIndex);
		}else{
			$('#fieldModal').modal('show');	
		}
	});
}

//map the csv onto the map
function geoCSV(csv, geoFieldIndex){
	initmap();

	//split by line and then replace geo location with 2 cols lat lng
	var csvLines = csv.split(/[\r\n|\n]+/);
	var refinedCsv = "";
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
			line = line.replace(fields[geoFieldIndex], fields[geoFieldIndex].split(' '))
		}
		refinedCsv += line + "\n";
	});

	// create a geo layer from the csv
	var mi_geocsv = L.geoCsv (null, {firstLineTitles: true, fieldSeparator: ','});
	mi_geocsv.addData(refinedCsv);
	
    map.addLayer(mi_geocsv);
    //point map to the correct location
    map.fitBounds(mi_geocsv.getBounds());
}


