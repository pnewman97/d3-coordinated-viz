(function(){

//variables for data join
    var attrArray = ["White", "Black or African American", "American Indian and Alaska Native", "Asian", "Other", "Two or more races", "Hispanic or Latino"];
	var expressed = attrArray[0];
	
	//chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 460;
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
		
	//scale y (height) proportinally to frame
	var yScale = d3.scaleLinear()
        .range([460, 0])
        .domain([0, 100]);
		
	//create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
		
	//create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);	
		
	//place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);	

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
	//map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on USA
    var projection = d3.geoAlbers();
		
    var path = d3.geoPath()
        .projection(projection);
	
	
    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/race_ethnicity.csv")); //load attributes from csv
    promises.push(d3.json("data/states.topojson")); //load choropleth spatial data
    Promise.all(promises).then(callback);
	
	function callback(data){

	csvData = data[0];	
	statesdata = data[1];
    console.log(statesdata);
	
	setGraticule(map, path);

	//translate to topoJSON
	console.log(csvData);
	var statestopo = topojson.feature(statesdata, statesdata.objects.ne_10m_admin_1_states_provinces).features;
	console.log(statestopo);

    
	statestopo = joinData(statestopo, csvData);


	
	    //create the color scale
		var colorScale = makeColorScale(csvData);

		//Example 1.3 line 24...add enumeration units to the map
		setEnumerationUnits(statestopo, map, path, colorScale);
		
		//add coordinated visualization to the map
        setChart(csvData, colorScale);
		
		createDropdown(csvData);
 	
	
    };
	

	

};

//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};



//function to create coordinated bar chart
function setChart(csvData, colorScale){

		
	//create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
		
 //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
//			alert(d.Name);
            return "bar " + d.Name;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
		.on("mouseover", highlight)
		.on("mouseout",dehighlight)
		.on("mousemove", moveLabel);
		
		 var desc = bars.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0px"}');
/*         .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        }); */
		
/* 	//annotate bars with attribute value text
    var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "numbers " + d.adm1_code;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i){
            var fraction = chartWidth / csvData.length;
            return i * fraction + (fraction - 1) / 2;
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed])) + 15;
        })
        .text(function(d){
            return d[expressed];
        }); */
		



		
	//creates a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 150)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Race/Ethnicity Percentage by State (" + expressed + ")");
		
	//create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);	
		
	//set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale);
		
};

function updateChart(bars, n, colorScale) {
    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
		.transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        //resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });		
		
		var chartTitle = d3.select(".chartTitle")
        .text("Race/Ethnicity Percentage by State (" + expressed + ")");
};

//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
		.on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });		
		
};

//dropdown change listener handler
function changeAttribute(attribute, csvData){

	
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);
	
	//update axis to max value
	max = d3.max(csvData, function(d) {return parseFloat(d[expressed]); });

		
	//remove current chart to create new one
 	d3.select(".axis").remove();
	/* var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");  */
	   //place axis

	
	yScale = d3.scaleLinear()
        .range([460, 0])
        .domain([0, max]);
		
	var yAxis = d3.axisLeft()
        .scale(yScale);
		
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);	

    //recolor enumeration units
    var states = d3.selectAll(".states")
		.transition()
		.duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });
		
	var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })

		updateChart(bars, csvData.length, colorScale);
		
};

//function to highlight enumeration units and bars
function highlight(props){
//	alert(props);
    //change stroke
    /* var selected = d3.selectAll("." + props)
        .style("stroke", "blue")
        .style("stroke-width", "2"); */
		
	var selected = d3.selectAll("." + props.adm1_code)
        .style("stroke", "blue")
        .style("stroke-width", "2");
		
	var selected = d3.selectAll("." + props.Name)
        .style("stroke", "blue")
        .style("stroke-width", "2");

	var selected = d3.selectAll("." + props.name)
        .style("stroke", "blue")
        .style("stroke-width", "2");	
			
	
	setLabel(props);
	console.log(selected);	
};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.adm1_code)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });
		
	var selected = d3.selectAll("." + props.Name)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });	
		
	var selected = d3.selectAll("." + props.name)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });		

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
	
	d3.select(".infolabel")
        .remove();
};

//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "%</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.adm1_code + "_label")
        .html(labelAttribute);
	
	
	var name = props.name
	if (name == null) name = props.Name;	

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(name);
};

//function to move info label with mouse
function moveLabel(){
	//get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;
    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;
		
		//horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

function setGraticule(map, path){
    //create graticule generator
    var graticule = d3.geoGraticule()
        .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
    //create graticule lines
    //create graticule background
    var gratBackground = map.append("path")
        .datum(graticule.outline()) //bind graticule background
        .attr("class", "gratBackground") //assign class for styling
        .attr("d", path) //project graticule

		
	//Example 2.6 line 5...create graticule lines
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
		
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
        .data(graticule.lines()) //bind graticule lines to each element to be created
        .enter() //create an element for each datum
        .append("path") //append each element to the svg as a path element
        .attr("class", "gratLines") //assign class for styling
        .attr("d", path); //project graticule lines
		
};

function joinData(statestopo, csvData){
    //loop through csv to assign each set of csv attribute values to geojson state
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current state
        var csvKey = csvRegion.Name; //the CSV primary key

        //loop through geojson regions to find correct state
        for (var a=0; a<statestopo.length; a++){

            var geojsonProps = statestopo[a].properties; //the current state geojson properties
            var geojsonKey = geojsonProps.gn_name; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };

    return statestopo;
};

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};

function setEnumerationUnits(statestopo, map, path, colorScale){
    	//add states to map
    var states = map.selectAll(".states")
        .data(statestopo)
        .enter()
        .append("path")
        .attr("class", function(d){
			return "states " + d.properties.adm1_code;
        })
        .attr("d", path)
		.style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
		.on("mouseover", function(d){
//			console.log(d.properties.name);
            highlight(d.properties);
        })
		.on("mouseout", function(d){
            dehighlight(d.properties);
        })
		.on("mousemove", moveLabel);
		
		 var desc = states.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};

})();