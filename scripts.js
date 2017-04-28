
function getHistoryMatch(data, date, match){
	newDate = moment(date);
	
	filterByDate =	_.filter(data, function(d){
		if(moment(d["Date"]).isBefore(newDate)){
				return d;	
		}
	})

	filterByMatch = _.filter(filterByDate, function(d){
		submatch = generateMatch(d["Team 1"], d["Team 2"]);
		if (submatch===match) {
			return d;
		}
	})

	return filterByMatch;
}

function generateMatch(team1, team2){
	var match = [];
	match.push(team1, team2);
	return match.sort().toString();
}

function different(match){
	if (match.length) {
		score = (match[0].FT).split("-");
		// console.log(match);
		goal1 = +score[0];
		goal2 = +score[1];
		
		return Math.abs(goal1-goal2) / 10;
	}
	else return 0;
}

function result(score){
	score = score.split("-");
	goal1 = +score[0];
	goal2 = +score[1];
	
	res = 0;
	
	if(goal1 > goal2)
		res = 0;
	else 
		if (goal1 < goal2) res = 2;
	else res = 1;

	return res / 2;
}

function history(match){
	if (match.length) {
		return result(match[0].FT);
	}
	else return 0;
}

function processData(errors, data) {
	// console.log(data);
	var matrix = [];

	_.each(data, function(d) {

		match = generateMatch(d["Team 1"], d["Team 2"]);
		// console.log(match);
		historyMatch = getHistoryMatch(data, d["Date"], match);
		
		// add to object
		var sample = {
			"team1": d["Team 1"],
			"team2": d["Team 2"],
			"history": history(historyMatch),
			"dif": different(historyMatch)
		}
		// console.log(goal1, goal2);
		matrix.push(sample);
	});

	console.log(matrix);
}

d3.queue()
    .defer(d3.csv, "https://raw.githubusercontent.com/footballcsv/eng-england/master/2010s/2013-14/1-premierleague.csv")
    .await(processData);