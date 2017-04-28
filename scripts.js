function getHistoryMatch(data, date, match) {

	newDate = moment(date);

	filterByDate =	_.filter(data, function(d) {
		if (moment(d["Date"]).isBefore(newDate))
			return d;
	});

	filterByMatch = _.filter(filterByDate, function(d){
		submatch = matchToString(d["Team 1"], d["Team 2"]);
		if (submatch === match)
			return d;
	});

	return filterByMatch;
}

function matchToString(team1, team2) {
	var match = [];
	match.push(team1, team2);
	return match.sort().toString();
}

function different(match) {
	if (match.length) {
		score = (match[0].FT).split("-");
		goal1 = +score[0];
		goal2 = +score[1];

		return Math.abs(goal1 - goal2) / 10;
	} else {
		return 0;
	}
}

function result(score) {

	score = score.split("-");
	goal1 = +score[0];
	goal2 = +score[1];

	res = 0;

	if (goal1 > goal2)
		res = 0;
	else if (goal1 < goal2)
		res = 2;
	else
		res = 1;

	return (res / 2);
}

function history(match) {
	if (match.length)
		return result(match[0].FT);
	else
		return 0;
}

function calcStandings(data, date) {

	var date = moment(date),
		standings = {
			"table": []
		};

	var teams = _.uniq(data.map(function(d) { return d["Team 1"] }));

	_.each(teams, function(d) {
		standings.table.push({ "team": d, "pld": 0, "for": 0, "against": 0, "diff": 0, "pts": 0 });
	});

	_.each(data, function(d) {

		var currDate = moment(d.Date);

		if (currDate.isBefore(date)) {

			var team1 = standings.table.filter(function(t) { return (d["Team 1"] == t.team) })[0],
				team2 = standings.table.filter(function(t) { return (d["Team 2"] == t.team) })[0];

			goal = d.FT.split("-");
			goal1 = +goal[0];
			goal2 = +goal[1];

			_.each(standings.table, function(t) {
				if (t.team == team1.team) {
					t.for += goal1;
					t.against += goal2;
					if (result(d.FT) == 0)
						t.pts += 3;
				} else if (t.team == team2.team) {
					t.for += goal2;
					t.against += goal1;
					if (result(d.FT) == 1)
						t.pts += 3;
				}
				if (t.team == team1.team || t.team == team2.team) {
					t.pld += 1;
					t.diff = t.for - t.against;
					if (result(d.FT) == 0.5)
						t.pts += 1;
				}
			});
		}

	});
	standings.table = _.orderBy(standings.table, ["pts", "diff", "for", "team"], ["desc", "desc", "desc", "asc"]);
	standings.date = date.subtract(1, "days").format("dddd, MMMM Do YYYY");
	return standings;
}

function isDerby(team1, team2) {
	var derdies = [
			["Man City", "Man United"],
			["Man City", "Everton"],
			["Liverpool", "Man United"],
			["Liverpool", "Everton"],
			["Chelsea", "Arsenal"],
			["Chelsea", "Fulham"],
			["Arsenal", "Tottenham"],
			["Arsenal", "Man United"],
			["Newcastle", "Sunderland"],
			["Aston Villa", "West Brom"],
			["Cardiff", "Swansea"]
		];

	var match = matchToString(team1, team2);

	_.each(derdies, function(m) {
		if (match == matchToString(m[0], m[1]))
			return true;
	})

	return false;
}

function teamMotivation(standing, home, away) {
	var derby = (isDerby(home, away)) ? 1 : 0,
		tour = 0,
		totalTour = 38;

	_.each(standing.table, function(d) {
		if (d.team == home && (totalTour - d.pld) < 6)
			tour = 1;
	});

}

function processData(errors, data) {

	var fea = [],
		gnd = [],
		standings = calcStandings(data, "2014-04-07");

	console.log(standings);

	_.each(data, function(d) {

		match = matchToString(d["Team 1"], d["Team 2"]);

		historyMatch = getHistoryMatch(data, d["Date"], match);

		var sample = {
			"team1": d["Team 1"],
			"team2": d["Team 2"],
			"history": history(historyMatch),
			"diff": different(historyMatch)
		}

		fea.push(sample);
		gnd.push(result(d.FT));

	});
}

d3.queue()
    .defer(d3.csv, "https://raw.githubusercontent.com/footballcsv/eng-england/master/2010s/2013-14/1-premierleague.csv")
    .await(processData);
