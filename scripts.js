function processData(errors, data) {

	var matrix = [];

	_.each(data, function(d) {

	});

}

d3.queue()
    .defer(d3.csv, "https://raw.githubusercontent.com/footballcsv/eng-england/master/2010s/2013-14/1-premierleague.csv")
    .await(processData);