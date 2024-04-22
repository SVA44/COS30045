function init()
{
    // Width and Height
    var w = 500;
    var h = 300;

    var projection = d3.geoMercator()
                       .center([145,-36.5])
                       .translate([w / 2, h / 2])
                       .scale(2450);

    var path = d3.geoPath()
                 .projection(projection);
    
    var svg = d3.select("body")
                .append("svg")
                .attr("width", w)
                .attr("height", h)
                .attr("fill", "grey");

    var color = d3.scaleQuantize()
                  .range(["#f2f0f7","#cbc9e2","#9e9ac8","#756bb1","#54278f"])

    
    d3.csv("VIC_LGA_unemployment.csv").then(function(data) {
        
        color.domain([
            d3.min(data, function(d) {return d.unemployed;}),
            d3.max(data, function(d) {return d.unemployed;})
        ])
        d3.json("LGA_VIC.json").then(function(json) {

            

            for(var i = 0; i < data.length; i++)
            {
                var dataLGA = data[i].LGA;

                var dataValue = data[i].unemployed;
                
                for(var j = 0; j < json.features.length; j++)
                {
                    var jsonLGA = json.features[j].properties.LGA_name;

                    if(jsonLGA == dataLGA)
                    {
                        json.features[j].properties.unemployed = dataValue;
                        break;
                    }
                }
            }
            svg.selectAll("path")
               .data(json.features)
               .enter()
               .append("path")
               .attr("d", path)
               .style("fill", function(d) {
                var value = d.properties.unemployed;
                if (value) {
                    return color(value)
                } else {
                    return "#ccc";
                }
               })
               d3.csv("VIC_city.csv").then(function(data) {
                // console.table(data, ["place","lat","lon"])
                svg.selectAll("circle")
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr("cx", function(d) {
                        return projection([d.lon, d.lat])[0];
                    })
                    .attr("cy", function(d) {
                        return projection([d.lon, d.lat])[1];
                    })
                    .attr("r", 5)
                    .style("fill", "yellow")
                    .style("stroke", "gray")
                    .style("stroke-width", 0.25)
                    .style("opacity", 0.75)
                    .append("title")
                    .text(function(d) {
                        return d.place;
                    })
            })
        });
    })

    
    

}
window.onload = init