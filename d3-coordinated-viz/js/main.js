//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
	//map frame dimensions
    var width = 960,
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

	//translate to topoJSON
	console.log(csvData);
	var statestopo = topojson.feature(statesdata, statesdata.objects.ne_10m_admin_1_states_provinces).features;
	console.log(statestopo);
		
		
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
		
		
		
	//add states to map
    var states = map.selectAll(".states")
        .data(statestopo)
        .enter()
        .append("path")
        .attr("class", function(d){
			return "states " + d.properties.adm1_code;
        })
        .attr("d", path);
	
    };
	

};