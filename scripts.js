function result(goal1, goal2){
	if(goal1 > goal2)
		return 0;
	else 
		if (goal1 < goal2) return 2;
	else return 1;
}

function processData(errors, data) {

	// console.log(data);
	var matrix = [];

	_.each(data, function(d) {

		// calculate goal for each team
		goal = d["FT"].split("-");
		goal1 = +goal[0];
		goal2 = +goal[1];

		// calculate form
		

		// add to object
		var sample = {
			"team1": d["Team 1"],
			"team2": d["Team 2"],
			"result": result(goal1, goal2) / 2
		}
		// console.log(goal1, goal2);
		matrix.push(sample);
	});

	// console.log(matrix);
}

d3.queue()
    .defer(d3.csv, "https://raw.githubusercontent.com/footballcsv/eng-england/master/2010s/2013-14/1-premierleague.csv")
    .await(processData);