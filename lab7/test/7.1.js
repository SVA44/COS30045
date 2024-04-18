function init() {

   
    var w=600;
    var h=300;


    d3.csv("Unemployment_78-95.csv", function(d) {
        return {
            
            date: new Date(+d.year, +d.month-1),
            number: +d.number
        }
    }).then(function(data){
        dataset = data;
        console.table(dataset, ["date", "number"]);
    });



    
}

window.onload = init;
