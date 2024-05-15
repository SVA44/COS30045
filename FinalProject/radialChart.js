function init() {
    //code goes here!
    d3.csv("Health Expenditure_v2.csv").then(function(dataset) {

        // Data declaration
        let data = [];
        let features = ['Ancillary services', 'Healthcare system', 'Inpatient rehabilitative care', 'Long-term care', 'Medical goods', 'Outpatient rehabilitative care', 'Preventive care'];
        let countries = [];
        // Load in countries
        for (var i = 0; i < dataset.length; i ++){
            countries.push(dataset[i].Country);
        }
        let data_point = {};
        // Load the datapoints
        for (var i = 0; i< dataset.length; i++) {
            let data_point = {};
            for (var j = 0; j <features.length; j++) {
                data_point[features[j]] = dataset[i][features[j]] / 5;
            }
            data_point.Country = dataset[i].Country;
            data.push(data_point);
        }
        console.log(dataset);

        // Set up canvas
        let radius = 400;
        let margin = {"left": 210, "top":0};
        let width = 800 + margin.left;
        let height = 800 + margin.top;
        let svg = d3.select("#radialChart").append("svg")
                .attr("width", width)
                .attr("height", height);
        let radialScale = d3.scaleLinear()
                        .domain([0, 10])
                        .range([0, radius * 0.75])
        let ticks = [2, 4, 6, 8, 10]
        svg.selectAll("circle")
            .data(ticks)
            .join(
                enter => enter.append("circle")
                          .attr("cx", width / 2)
                          .attr("cy", height / 2)
                          .attr("fill", "none")
                          .attr("stroke", "gray")
                          .attr("r", d => radialScale(d))
            );
        function angleToCoordinate(angle, value) {
            let x = Math.cos(angle) * radialScale(value);
            let y = Math.sin(angle) * radialScale(value);
            return {"x" : width / 2 + x, "y": height / 2 - y};
        }
        function vectorTransform(vector, transform) {
            return {"x" : vector.x + transform.x, "y": vector.y + transform.y};
        }
        let featureData = features.map((f, i) => {
            let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
            let label_coord = vectorTransform(angleToCoordinate(angle, 10.5), {"x": 0, "y": 0});
            return {
                "name": f,
                "angle": angle,
                "line_coord": angleToCoordinate(angle, 10),
                "label_coord": label_coord
        }
    });
    // draw axis line
        svg.selectAll("line")
            .data(featureData)
            .join(
            enter => enter.append("line")
                      .attr("x1", width / 2)
                      .attr("y1", height / 2)
                      .attr("x2", d => d.line_coord.x)
                      .attr("y2", d => d.line_coord.y)
                      .attr("stroke","black")
            )
            .append("g")
            .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

    // draw axis label
        svg.selectAll(".axislabel")
            .data(featureData)
            .join(
            enter => enter.append("text")
                      .attr("x", d => d.label_coord.x)
                      .attr("y", d => d.label_coord.y)
                      .text(d => d.name)
                      .style('text-anchor', (d, i) => (i === 0 ? "middle": i === 1 ? "end" : i === 2 ? "end" : i === 3 ? "end" : null))
                    .attr('dx', d => (i === 0 ? '0.7em' : i === 1 ? '-0.7em'  : i === 2 ? '-0.5em': i === 3 ? '0.3em' : '0.6em'))
                        .attr('dy', d => (i === 0 ? '1.3em': i === 1 ? '0.4em': i === 2 ? '-0.5em': i === 3 ? '-0.5em' : '0.4em'))
        );
        let line = d3.line()
                .x(d => d.x)
                .y(d => d.y)

    // A color scale: one color for each country
        var myColor = d3.scaleOrdinal()
          .domain(countries)
          .range(d3.schemeDark2);

        console.log(d3.schemeSet2)
        function getPathCoordinates(data_point) {
            let coordinates = [];
            for (var i = 0; i < features.length; i ++) {
                let ft = features[i];
                let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
                let coords = angleToCoordinate(angle, data_point[ft]);
                coordinates.push({"Country": data_point.Country, "x": coords.x, "y": coords.y});
            }
            return coordinates;
        }

    // add the options to the button
        d3.select("#dropdown")
            .selectAll('myOptions')
            .data(countries)
            .enter()
            .append('option')
            .text(function (d) { return d; }) // text showed in the menu
            .attr("value", function (d) { return d; }) // corresponding value returned by the button
        
    // Set up radial chart
        var radio = svg.append("path")
                        .datum(getPathCoordinates(data[0]))
                        .attr("d", line)
                        .attr("stroke-width", 3)
                        .attr("stroke", (d) => myColor(d.Country))
                        .attr("fill", (d) => myColor(d.Country))
                        .attr("stroke-opacity", 1)
                        .attr("opacity", 0.5) 

    // Update the chart
        function update(selectedOption) {
            console.log(selectedOption);
            var dataFilter = data.filter(function(d){ 
                if (d.Country === selectedOption){
                    return d;
                }
            });
            console.log(dataFilter[0]);
            console.log(dataFilter[0].Country, myColor(dataFilter[0].Country))
            radio
                .datum(getPathCoordinates(dataFilter[0]))
                .transition()
                .duration(1000)
                        .attr("d", line)
                        .attr("stroke-width", 3)
                        .attr("stroke", (d) => myColor(dataFilter[0].Country))
                        .attr("fill", (d) => myColor(dataFilter[0].Country))
                        .attr("stroke-opacity", 1)
                        .attr("opacity", 0.5) 
            }

    // When the button is changed, run the updateChart function
        d3.select("#dropdown").on("change", function(d) {
    // recover the option that has been chosen
        var selectedOption = d3.select(this).property("value");
    // run the updateChart function with this selected option
        update(selectedOption);
        })

    }).catch(error => { // Handle errors
        console.error(error)
    })
}
window.onload = init;