function bubbleChart() {
  
  // Sizing constants
  var width = 1450;
  var height = 700;

  
  // tooltip for functionality of mouseover and mouseout
  var tooltip = floatingTooltip('gates_tooltip', 240);

  // Locations to move bubbles when in Total Health Expenditure mode
  var center = { x: width / 2, y: height / 2 -20 };

  // Locations to move bubbles when in mode of Continents
  var continentCenters = {
    "North America": { x: 190, y: height / 2 },
    "South America": { x: 190 + 1 * width / 5.5, y: height / 2 },
    "Oceania": { x: 190 + 2 * width / 5.5, y: height / 2 },
    "Europe": { x: 190 + 3 * width / 5.5, y: height / 2 },
    "Asia": { x: 190 + 4 * width / 5.5, y: height / 2 },
  };

  // X locations of the continent titles.
  var continentsTitleX = {
    "North America": 100,
    "South America": 100 + 1 * width / 5,
    "Ocenia": 30 + 2 * width / 4.9,
    "Europe": 100 + 3 * width / 4.8,
    "Asia": 150 + 4 * width / 4.7,
  };

  // Used when setting up force and
  // moving around nodes
  var damper = 0.135;

  // These variables will be set in create_nodes and create_vis
  var svg = null;
  var bubbles = null;
  var nodes = [];

  // Charge function is called for each bubble
  // so that they would repel each other because
  // value is set to negative. 4.8 is chosen
  // to make approriate repulsion
  function charge(d) {
    return -Math.pow(d.radius, 2.0)/4.8;
  }

  // Force layout is set up to use the charge
  // that is created above. gravity is used to
  // pushed to bubbles to the center of layout, 
  // friction is velocity decay.
  var force = d3.layout.force()
    .size([width, height])
    .charge(charge)
    .gravity(0.01)
    .friction(0.9);


  // Size of bubbles is based on the radius
  // rather than the size
  var radiusScale = d3.scale.pow()
    .exponent(0.728)
    .range([2, 80]);


  // This function takes raw data from csv file
  // and use map
  function createNodes(rawData) {
    // Use map() to convert raw data into node data.
    var myNodes = rawData.map(function (d) {
     

      return {
        id: d.id,
        increase: d.increase,
        radius: radiusScale(+d.year_2022),
        value: d.year_2022,
        name: d.country,
        group: d.group,
        continent: d.continent,
        x: Math.random() * 900,
        y: Math.random() * 800,
      };
    });

    

      // sort them to prevent occlusion of smaller nodes.
      myNodes.sort(function (a, b) { return b.value - a.value; });

      return myNodes;
    }

  /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG continer for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
  var chart = function chart(selector, rawData) {
    // Use the max year_2022 in the data as the max in the scale's domain
    // note we have to ensure the year_2022 is a number by converting it
    // with `+`.
    var maxAmount = d3.max(rawData, function (d) { return +d.year_2022; });
    radiusScale.domain([0, maxAmount]);

    var fillColor = d3.scale.quantize()
    .range(["#eff3ff","#bdd7e7","#6baed6", "#3182bd","#08519c"])
    .domain([
      d3.min(rawData, function(d) {return d.increase;}),
      d3.max(rawData, function(d) {return d.increase;})
    ]);

    var allGroup = d3.map(rawData, function(d){return(d.country)}).keys();
        d3.select("#selectButton")
        .selectAll('myOptions')
        .data(allGroup)
        .enter()
        .append('option')
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; }) // corresponding value returned by the button
    
    
   var simulation = d3.layout.force()
    .size([width, height])
    .charge(-15) // Equivalent to forceManyBody().strength(-15)
    .gravity(0) // Equivalent to d3.forceCenter()
  
  
  

    nodes = createNodes(rawData);
    // Set the force's nodes to our newly created nodes array.
    force.nodes(nodes);

    // Create a SVG element inside the provided selector
    // with desired size.
    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Bind nodes data to what will become DOM elements to represent them.
    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { return d.id; });

    // Create new circle elements each with class `bubble`.
    // There will be one circle.bubble for each object in the nodes array.
    // Initially, their radius (r attribute) will be 0.
    bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) { return fillColor(+d.increase); })
      .each(function(d) {
        // Store the original stroke color in a property
        d.originalStroke = d3.rgb(fillColor(+d.increase)).darker();
      })
      .attr('stroke', function (d) { return d.originalStroke; }) // Use the stored original stroke color
      .attr('stroke-width', 2)
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail)
      .call(d3.behavior.drag()
      .on("dragstart", dragstarted)
      .on("drag", dragged)
      .on("dragend", dragended));

      function dragstarted(d) {
        if (!force.alpha()) {
          force.alpha(0.03); // Set alpha value
          force.start();
        }
        d.px = d.x;
        d.py = d.y;
    }
  
      function dragged(d) {
        d.px = d3.event.x;
        d.py = d3.event.y;
        d.x = d3.event.x;
        d.y = d3.event.y;
        simulation.resume(); // resume simulation
      }
  
      function dragended(d) {
        if (!force.alpha()) {
            force.alpha(0.03);
        }
        d.px = d.x;
        d.py = d.y;
    }

    // Fancy transition to make bubbles appear, ending with the
    // correct radius
  
    bubbles.transition()
      .duration(2000)
      .attr('r', function (d) { return d.radius; });

    // Set up initial layout for bubbles
    groupBubbles();

    // Dropbox
    d3.select("#selectButton").on("change", function(d) {
      // recover the option that has been chosen
      var selectedOption = d3.select(this).property("value")
      // run the updateChart function with this selected option
      update(selectedOption)
    })

    function update(selectedGroup) {
      // Filter the rawData based on the selected group
      var dataFilter = rawData.filter(function(d) { return d.country == selectedGroup });
    
 
    
      // Transition only the filtered bubbles to red
      bubbles.filter(function(d) {
          return dataFilter.some(function(filtered) { return filtered.id === d.id; });
        })
        .transition()
        .duration(2000)
        .attr('fill', 'red')
        .transition() // Add another transition
        .duration(1000) // Transition duration back to original color
        .attr('fill', function(d) { return fillColor(+d.increase); });

    }
  };


  function groupBubbles() {
    hidecontinents();

    force.on('tick', function (e) {
      nodes.sort(function(a, b) {
        return b.increase - a.increase;
    });
      bubbles.each(moveToCenter(e.alpha))
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; });
    });
    
    force.start();
    showlegend()

    
  }



  /*
   * Helper function for "single group mode".
   * Returns a function that takes the data for a
   * single node and adjusts the position values
   * of that node to move it toward the center of
   * the visualization.
   *
   * Positioning is adjusted by the force layout's
   * alpha parameter which gets smaller and smaller as
   * the force layout runs. This makes the impact of
   * this moving get reduced as each node gets closer to
   * its destination, and so allows other forces like the
   * node's charge force to also impact final location.
   */
  function moveToCenter(alpha) {
    return function (d) {
      d.x = d.x + (center.x - d.x) * damper * alpha;
      d.y = d.y + (center.y - d.y) * damper * alpha;
    };
  }

  /*
   * Sets visualization in "split by continent mode".
   * The continent labels are shown and the force layout
   * tick function is set to move nodes to the
   * continentCenter of their data's continent.
   */
  function splitBubbles() {
    showcontinents();
    hidelegend();

    force.on('tick', function (e) {
      bubbles.each(moveTocontinents(e.alpha))
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; });
    });

    force.start();
  }

  /*
   * Helper function for "split by continent mode".
   * Returns a function that takes the data for a
   * single node and adjusts the position values
   * of that node to move it the continent center for that
   * node.
   *
   * Positioning is adjusted by the force layout's
   * alpha parameter which gets smaller and smaller as
   * the force layout runs. This makes the impact of
   * this moving get reduced as each node gets closer to
   * its destination, and so allows other forces like the
   * node's charge force to also impact final location.
   */
  function moveTocontinents(alpha) {
    return function (d) {
      var target = continentCenters[d.continent];
      if (target) {
        d.x = d.x + (target.x - d.x) * damper * alpha * 1.1;
        d.y = d.y + (target.y - d.y) * damper * alpha * 1.1;
      } else {
        console.log("Invalid continent:", d.continent);
        // Handle the error gracefully, such as setting default coordinates
        // or skipping the movement for this data point.
      }
    };
  }

  /*
   * Hides continent title displays.
   */
  function hidecontinents() {
    svg.selectAll('.continent').remove();
  }
  
  function hidelegend() {
    svg.selectAll('.legend').remove();
    svg.selectAll('.average').remove();
  }

  /*
   * Shows continent title displays.
   */
  function showcontinents() {
    // Another way to do this would be to create
    // the continent texts once and then just hide them.
    var continentsData = d3.keys(continentsTitleX);
    var continents = svg.selectAll('.continent')
      .data(continentsData);

    continents.enter().append('text')
      .attr('class', 'continent')
      .attr('x', function (d) { return continentsTitleX[d]; })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d; });
  }

  function showlegend() {    

   
      


    const size = d3.scale.pow()
        .domain([
            0,
            12000
        ])  
        .range([2, 80]);  

  

    svg
      .append("circle")
      .attr("class", "legend")
      .attr("cx", 1250)
      .attr("cy", 300)
      .attr("r", size(4986))
      .style("fill", "red")
      .attr("stroke", "black")
      // .attr("stroke-dasharray", "5,5");

    svg.append("line")
      .attr("class", "average")
      .attr("x1", 1285)
      .attr("y1", 300)
      .attr("x2", 1350)
      .attr("y2", 300)
      .attr("stroke", "black")
      .attr("stroke-dasharray", "5,5");

    svg
      .append("text")
      .attr("class", "average")
      .attr("x", 1350) // Position text to the right of the circle
      .attr("y", 300 + 5) // Slightly adjust the y position to align vertically with the circle
      .text("4986$")
      .style("text-anchor", "start")
      .style("font-size", "12px")
      .style("font-family", "Arial") // Change the font family here
      .style("fill", "black");

      svg
      .append("text")
      .attr("class", "average")
      .attr("x", 1295) 
      .attr("y", 380) 
      .text("Average of \n health expenditure \n per capita 2022")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-family", "Tahoma") // Change the font family here
      .style("fill", "black");


    var valuesToShow = [1000, 5000, 10000]
    var xCircle = 100
    var xLabel = 200
    var yCircle = 330

  

    svg
      .selectAll('.legendCircle')
      .data(valuesToShow)
      .enter()
      .append("circle")
        .attr("class", "legend")
        .attr("cx", xCircle)
        .attr("cy", function(d){ return yCircle - size(d) } )
        .attr("r", function(d){ return size(d) })
        .style("fill", "none")
        .attr("stroke", "black")

    svg
    .append("text")
    .attr("class", "average")
    .attr("x", 100) // x position for both lines
    .attr("y", 150) // y position for the first line
    .style("text-anchor", "start")
    .style("font-size", "12px")
    .style("font-family", "RM Serif") // Customize the font family here
    .style("fill", "grey")
    .append("tspan") // First line
    .attr("x", 30) // Maintain the same x position
    .attr("dy", "1.2em") // Position relative to the y position
    .text("Circle are sized according to")
    .append("tspan") // Second line
    .attr("x", 7) // Maintain the same x position
    .attr("dy", "1.2em") // Position relative to the previous line
    .text("health expenditure per capita in 2022");

    

    // Add legend: segments
    svg
      .selectAll('.legendSegment')
      .data(valuesToShow)
      .enter()
      .append("line")
        .attr("class", "legend")
        .attr('x1', function(d){ return xCircle + size(d) } )
        .attr('x2', xLabel)
        .attr('y1', function(d){ return yCircle - size(d) } )
        .attr('y2', function(d){ return yCircle - size(d) } )
        .attr('stroke', 'black')
        .style('stroke-dasharray', ('2,2'))

    // Add legend: labels
    svg
      .selectAll('.legendText')
      .data(valuesToShow)
      .enter()
      .append("text")
        .attr("class", "legend")
        .attr('x', xLabel)
        .attr('y', function(d){ return yCircle - size(d) } )
        .text(function(d) { return d + "$"; })
        .style("font-size", 10)
        .attr('alignment-baseline', 'middle')

    //Append a defs (for definition) element to your SVG
    var defs = svg.append("defs");

    //  Append a linearGradient element to the defs and give it a unique id
    var linearGradient = defs.append("linearGradient")
    .attr("id", "linear-gradient");

    linearGradient
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

    // Define color stops and colors
      var stops = [
          { offset: "0%", color: "#eff3ff" },
          { offset: "25%", color: "#bdd7e7" },
          { offset: "50%", color: "#6baed6" },
          { offset: "75%", color: "#3182bd" },
          { offset: "100%", color: "#08519c" }
      ];

      // Append multiple stops to the linearGradient
      stops.forEach(function(stop) {
          linearGradient.append("stop")
              .attr("offset", stop.offset)
              .attr("stop-color", stop.color);
      });

      svg.append("rect")
          .attr("class", "legend")
          .attr("x", 20)
          .attr("y", 500)
          .attr("width", 300)
          .attr("height", 20)
          .style("fill", "url(#linear-gradient)");



      // Add labels for lowest and highest increase
      svg.append("text")
          .attr("x", 20)  
          .attr("class", "legend")
          .attr("y", 500 - 10) //
          .text("Lowest %")
          .attr("text-anchor", "start")
        

      svg.append("text")
          .attr("class", "legend")
          .attr("x", 260) 
          .attr("y", 500 -10) 
          .text("Highest %")
          .attr("text-anchor", "start")

      svg.append("text")
          .attr("class", "legend")
          .attr("x", 30) 
          .attr("y", 550) 
          .text("Color shows percentage increase from 2015")
          .attr("text-anchor", "start") 



};

  /*
   * Function called on mouseover to display the
   * details of a bubble in the tooltip.
   */
  function showDetail(d) {
    // change outline to indicate hover state.
    d3.select(this)
    .attr('stroke', 'black')


    var content = '<span class="name">Country: </span><span class="value">' +
                  d.name +
                  '</span><br/>' +
                  '<span class="name">Current price per capita: </span><span class="value">$' +
                  addCommas(d.value) +
                  '</span><br/>' +
                  '<span class="name">Percentage increase from 2015: </span><span class="value">' +
                  d.increase + "%"
                  '</span>';
    tooltip.showTooltip(content, d3.event);
  }

  /*
   * Hides tooltip
   */
  function hideDetail(d) {
    // reset outline
    d3.select(this)
      .attr('stroke', d.originalStroke)
  
     

    tooltip.hideTooltip();
  }
  

  function clickbubble(event, d) {
    // console.log(d.healthExpenditure);

    var xScale = d3.scale.linear()
                  .domain([2015,2022])
                  .range([1150,1400]);

    var yScale = d3.scale.linear()
                    .domain([1000,
                    12000]).range([400, 150])


    var xAxis = d3.svg.axis()
                  .scale(xScale)
                  .orient("bottom")
                  .ticks(6)  // Set the number of ticks
                  .tickFormat(d3.format("d"));

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + 400 + ")") 
        .call(xAxis);


    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(5)  // Set the number of ticks
        // .tickFormat(d3.format("d"));


    // Append the y-axis to the SVG
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + 1150 + ",0)")
        .call(yAxis);        
    
        var healthExpenditureData = d.id;

        // Check if healthExpenditureData is properly defined and has a length
        if (healthExpenditureData && healthExpenditureData.length > 0) {
            // Append a new path element for the line chart
            var line = svg.append('g')
                .append("path")
                .datum(healthExpenditureData)
                .attr("d", d3.line()
                    .x(function(_, i) { return xScale(i + 2015); }) // Assuming 2015 is the start year
                    .y(function(d) { return yScale(+d); }) // Assuming d is the health expenditure value
                );
        } else {
            console.error('Health expenditure data is missing or empty.');
        }
    }
    
    
  

  

  /*
   * Externally accessible function (this is attached to the
   * returned chart function). Allows the visualization to toggle
   * between "single group" and "split by continent" modes.
   *
   * displayName is expected to be a string and either 'continent' or 'all'.
   */
  chart.toggleDisplay = function (displayName) {
    if (displayName === 'continent') {
      splitBubbles();
    } else {
      groupBubbles();
    }
  };


  // return the chart function from closure.
  return chart;
}

/*
 * Below is the initialization code as well as some helper functions
 * to create a new bubble chart instance, load the data, and display it.
 */

var myBubbleChart = bubbleChart();

/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
function display(error, data) {
  if (error) {
    console.log(error);
  }
 
  myBubbleChart('#vis', data);
}

/*
 * Sets up the layout buttons to allow for toggling between view modes.
 */
function setupButtons() {
  d3.select('#toolbar')
    .selectAll('.button')
    .on('click', function () {
      // Remove active class from all buttons
      d3.selectAll('.button').classed('active', false);
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as the active button
      button.classed('active', true);

      // Get the id of the button
      var buttonId = button.attr('id');

      // Toggle the bubble chart based on
      // the currently clicked button.
      myBubbleChart.toggleDisplay(buttonId);
    });
}



/*
 * Helper function to convert a number into a string
 * and add commas to it to improve presentation.
 */
function addCommas(nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  return x1 + x2;
}



// Load the data.
d3.csv('data/country.csv', display);

// setup the buttons.
setupButtons();
// lib/d3.js