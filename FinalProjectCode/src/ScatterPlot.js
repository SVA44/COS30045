// Set the dimensions and margins of the graph
var margin = {top: 60, right: 50, bottom: 40, left: 40},
    width = 1200 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

// Append the SVG object to the body of the page
var svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Set the fixed domain for the axes
var xDomain = [0, 12000]; 
var yDomain = [70, 90];   

// Scales
var x = d3.scaleLinear()
    .domain(xDomain)
    .range([0, width]);

var y = d3.scaleLinear()
    .domain(yDomain)
    .range([height, 0]);

// Color scale
var color = d3.scaleOrdinal()
    .domain(["Africa", "Asia", "Europe", "North America", "Oceania", "South America"])
    .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b"]);

// Axes
var xAxis = svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

var yAxis = svg.append("g")
    .call(d3.axisLeft(y));

// Create a tooltip div that is hidden by default
var tooltip = d3.select("#tooltip");

// Function to update the scatter plot
function update(data) {
    // Bind data
    var circles = svg.selectAll("circle")
        .data(data, d => d.Country);

    // Enter new data
    circles.enter()
        .append("circle")
        .attr("cx", d => x(d.Value))
        .attr("cy", d => y(d.LifeExpectancy))
        .attr("r", 10)
        .style("fill", d => color(d.Continent))
        .style("opacity", 1)
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`${d.Country}<br>Health Expenditure per capita: ${d.Value}<br>Life Expectancy: ${d.LifeExpectancy}<br>Continent: ${d.Continent}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
                            // Dim other circles
            svg.selectAll("circle")
            .filter(e => e !== d)
            .transition()
            .style("fill", "gray")
            .style("opacity", 0.3);
        })
        .on("mousemove", function (event, d) {
            tooltip.style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function (event, d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);

            // Reset opacity of all circles
            svg.selectAll("circle")
                .transition()
                .style("fill", d => color(d.Continent))
                .style("opacity", 1);
        })
        .merge(circles)
        .transition()
        .attr("cx", d => x(d.Value))
        .attr("cy", d => y(d.LifeExpectancy));

    // Remove old data
    circles.exit().remove();

    // Update title
    svg.selectAll("text.title").remove();
    svg.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "30px")
        .text(`Life expectancy vs Health Expenditure, ${data[0].Year}`);
    
    // Remove old milestone lines
    svg.selectAll("line.milestone").remove();

    // Add milestone lines at specific values on the x-axis and y-axis
    var xMilestones = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000]; 
    var yMilestones = [72, 74, 76, 78, 80, 82, 84, 86, 88, 90];        

    xMilestones.forEach(xVal => {
        svg.append("line")
            .attr("class", "milestone")
            .attr("x1", x(xVal))
            .attr("y1", 0)
            .attr("x2", x(xVal))
            .attr("y2", height)
            .attr("stroke", "black")
            .attr("opacity", 0.3)
            .attr("stroke-dasharray", "5,5");
    });

    yMilestones.forEach(yVal => {
        svg.append("line")
            .attr("class", "milestone")
            .attr("x1", 0)
            .attr("y1", y(yVal))
            .attr("x2", width)
            .attr("y2", y(yVal))
            .attr("stroke", "black")
            .attr("opacity", 0.3)
            .attr("stroke-dasharray", "5,5");
    });
}

// Load data and initialize plot
d3.csv("last_data.csv").then(data => {
    // Ensure the data has the required fields
    data.forEach(d => {
        d.Year = +d.Year;
        d.Value = +d.Value;
        d.LifeExpectancy = +d.LifeExpectancy;
    });

    // Initial plot for the first year
    var initialYear = 2015;
    var filteredData = data.filter(d => d.Year === initialYear);

    // Get unique list of countries and continents
    var countries = Array.from(new Set(data.map(d => d.Country)));
    var continents = Array.from(new Set(data.map(d => d.Continent)));

    // Create checkboxes for each country
    var checkboxes = d3.select(".checkbox-container")
        .selectAll("div")
        .data(countries)
        .enter()
        .append("div");

    checkboxes.append("input")
        .attr("type", "checkbox")
        .attr("id", d => `checkbox-${d}`)
        .attr("value", d => d)
        .property("checked", false)
        .on("change", function() {
            updateFilteredData();
        });

    checkboxes.append("label")
        .attr("for", d => `checkbox-${d}`)
        .text(d => d);

    // Create a slider
    var slider = d3.sliderBottom()
        .min(d3.min(data, d => d.Year))
        .max(d3.max(data, d => d.Year))
        .step(1)
        .width(500)
        .tickFormat(d3.format("d"))
        .ticks(5)
        .default(initialYear)
        .on("onchange", val => {
            d3.select('p#value').text(val);
            updateFilteredData();
        });

    var gSlider = d3.select('#sliderContainer')
        .append('svg')
        .attr('width', 700)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)');

    gSlider.call(slider);

    // Create a note for each continent
    var continentNote = d3.select("#continentNote");

    continents.forEach(continent => {
        continentNote.append("div")
            .html(`<div class="color-box" style="background-color:${color(continent)};"></div>${continent}`);
    });


    // Function to update filtered data based on selected year, countries, and continent
    function updateFilteredData() {
        var selectedYear = slider.value();
        var selectedCountries = checkboxes.selectAll("input")
            .filter(function() { return this.checked; })
            .data();

        // If no countries are selected, show all
        if (selectedCountries.length === 0) {
            selectedCountries = countries;
        }

        var filteredData = data.filter(d => d.Year === selectedYear && selectedCountries.includes(d.Country));
        
        update(filteredData);
    }

    // Initial plot
    update(filteredData);
});

