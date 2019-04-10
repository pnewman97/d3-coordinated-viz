(function(){

//variables for data join
    var attrArray = ["White", "Black or African American", "American Indian and Alaskan Native", "Asian", "Two or more races", "Hispanic or Latino"];
	var expressed = attrArray[0];

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
        .range([463, 0])
        .domain([0, 100]);

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
		
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
            return "bar " + d.adm1_code;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
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
        });
		
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
		
	//create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
		
	//creates a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 200)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Race/Ethnicity Percentage by State (" + attrArray[0] + ")");
		
	//create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);	
		
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
            return colorScale(d.properties[expressed]);
        });
};

})();