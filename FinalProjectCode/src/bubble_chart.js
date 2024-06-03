// Load data from csv file and call the display function
d3.csv('data/country.csv', display);  

// Calls bubble chart function to display inside #vis div.
function display(error, data) {
  if (error) {
    console.log(error);
  }
 
  myBubbleChart('#vis', data);
}

var myBubbleChart = bubbleChart();

// Main code that creates bubble chart
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


  // Scale radius of bubble
  var radiusScale = d3.scale.pow()
    .exponent(0.728)
    .range([2, 80]);


  // This function takes raw data from csv file
  // and use map
  function createNodes(rawData) {
    // map() is used to convert raw data into node data.
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

  // selector is a DOM element or CSS selector that points to the
  // parent element of chart. It uses rawData and add SVG element
  // to create visualization. rawData is an array of objects.
  
  var chart = function chart(selector, rawData) {
    // Set up the domain for radiusScale by utilizing maximum value
    // of year_2022
    var maxAmount = d3.max(rawData, function (d) { return +d.year_2022; });
    radiusScale.domain([0, maxAmount]);

    // Set up fillColor to generate color gradient for %increase
    var fillColor = d3.scale.quantize()
    .range(["#eff3ff","#bdd7e7","#6baed6", "#3182bd","#08519c"])
    .domain([
      d3.min(rawData, function(d) {return d.increase;}),
      d3.max(rawData, function(d) {return d.increase;})
    ]);

    // Set up the filter button
    var allGroup = d3.map(rawData, function(d){return(d.country)}).keys();
        d3.select("#selectButton")
        .selectAll('myOptions')
        .data(allGroup)
        .enter()
        .append('option')
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; }) // corresponding value returned by the button
    
    // Call the function createNodes
    nodes = createNodes(rawData);
    // Set the force's nodes to our newly created nodes array.
    force.nodes(nodes);

    // Create a SVG element inside the provided selector
    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Node data are bind to DOM elements that represent them
    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { return d.id; });

    // Circle bubbles will be created for each data nodes
    // in array, which have the id of bubble.
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

      // 3 functions below are used to
      // create dragging interactivity
      function dragstarted(d) {
        if (!force.alpha()) {
          force.alpha(0.03); 
          force.start();
        } 
        d.px = d.x;
        d.py = d.y;
      }
  
      function dragged(d) {
        d.x = d3.event.x;
        d.y = d3.event.y;
        force.resume(); 
      }
  
      function dragended(d) {
        if (!force.alpha()) {
            force.alpha(5);
        }
        d.px = d.x;
        d.py = d.y;
    }

  // Bubbles appear with correct radius with
  // fancy transition
    bubbles.transition()
      .duration(2000)
      .attr('r', function (d) { return d.radius; });

    // Set up initial layout for bubbles
    groupBubbles();

    // Return the country selected and call update function
    d3.select("#selectButton").on("change", function(d) {
      var selectedOption = d3.select(this).property("value")
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

  // Set up initial layout
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

  // Push all bubbles to center of the chart
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

   
  //  Positioning is adjusted by the force layout's
  //  alpha parameter which gets smaller and smaller as
  //  the force layout runs. This makes the impact of
  //  this moving get reduced as each node gets closer to
  // its destination, and so allows other forces like the
  //  node's charge force to also impact final location.
   
  function moveTocontinents(alpha) {
    return function (d) {
      var target = continentCenters[d.continent];
      if (target) {
        d.x = d.x + (target.x - d.x) * damper * alpha * 1.1;
        d.y = d.y + (target.y - d.y) * damper * alpha * 1.1;
      } else {
        console.log("Invalid continent:", d.continent);
        // Keep track of things if going wrong
      }
    };
  }

  
  // hide continents title when in all expenditure mode
  function hidecontinents() {
    svg.selectAll('.continent').remove();
  }
  
  // hide legends when in continents mode
  function hidelegend() {
    svg.selectAll('.legend').remove();
    svg.selectAll('.average').remove();
  }

  // shows continents
  function showcontinents() {
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

  // show legend when in all expenditure mode
  function showlegend() {   
    // sizing for size legends 
    const size = d3.scale.pow()
        .domain([
            0,
            12000
        ])  
        .range([2, 80]);  

    // Add size legends including circles,
    // segments and text
    svg
      .append("circle")
      .attr("class", "legend")
      .attr("cx", 1250)
      .attr("cy", 300)
      .attr("r", size(4986))
      .style("fill", "green")
      .attr("stroke", "black")

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
      .attr("x", 1350) 
      .attr("y", 300 + 5) 
      .text("4986$")
      .style("text-anchor", "start")
      .style("font-size", "11px")
      .style("font-family", "Arial") 
      .style("fill", "grey");

      svg
      .append("text")
      .attr("class", "average")
      .attr("x", 1295) 
      .attr("y", 380) 
      .text("Average of \n health expenditure \n per capita 2022")
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-family", "Arial") 
      .style("fill", "#555555");

    // Constants for making size legends
    var valuesToShow = [1000, 5000, 10000]
    var xCircle = 100
    var xLabel = 200
    var yCircle = 330

  
    // Create visualization for size legends
    // including circle, description, segments
    // and value text
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
    .attr("x", 100) 
    .attr("y", 150) 
    .style("text-anchor", "start")
    .style("font-size", "12px")
    .style("font-family", "Arial") 
    .style("fill", "#555555")
    .append("tspan") 
    .attr("x", 30) 
    .attr("dy", "1.2em") 
    .text("Circle are sized according to")
    .append("tspan") 
    .attr("x", 7) 
    .attr("dy", "1.2em") 
    .text("health expenditure per capita in 2022");

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

    svg
      .selectAll('.legendText')
      .data(valuesToShow)
      .enter()
      .append("text")
        .attr("class", "legend")
        .attr('x', xLabel)
        .attr('y', function(d){ return yCircle - size(d) } )
        .text(function(d) { return d + "$"; })
        .style("font-family", "Arial") 
        .style("fill", "grey")
        .style("font-size", 10)
        .attr('alignment-baseline', 'middle')

    //Create visualization for color gradient legends
    // including rectangle, text and description
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
          .attr("y", 550 - 10) //
          .text("Lowest %")
          .attr("text-anchor", "start")
          .style("font-family", "Arial") 
          .style("fill", "grey")
          .style("font-size", 11)
        

      svg.append("text")
          .attr("class", "legend")
          .attr("x", 270) 
          .attr("y", 550 -10) 
          .text("Highest %")
          .attr("text-anchor", "start")
          .style("font-family", "Arial") 
          .style("fill", "grey")
          .style("font-size", 11)

      svg.append("text")
          .attr("class", "legend")
          .attr("x", 20) 
          .attr("y", 490) 
          .text("Color shows percentage increase from 2015")
          .attr("text-anchor", "start") 
          .style("font-family", "Arial") 
          .style("fill", "#555555")
          .style("font-size", 12)



};

  // Show detail of bubble when mousing over
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

  // Hide tooltip
  function hideDetail(d) {
    // reset outline
    d3.select(this)
      .attr('stroke', d.originalStroke)
  
     

    tooltip.hideTooltip();
  }
  

  
  //  Externally accessible function which allows the visualization to toggle
  //  between "single group" and "split by continent" modes.
  //  displayName is expected to be a string and either 'continent' or 'all'.
   
  chart.toggleDisplay = function (displayName) {
    if (displayName === 'continent') {
      splitBubbles();
    } else {
      groupBubbles();
    }
  };

  // Call chart function from closure
  return chart;
}


 
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

// Convert number to string and add commas
// to improve presentation
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

setupButtons();
