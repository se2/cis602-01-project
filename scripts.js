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
		if (match == matchToString(m[0], m[1])) {
			return true;
		}
	})

	return false;
}

function teamMotivation(standing, home, away) {

	var derby = (isDerby(home, away)) ? 1 : 0,
		tour = 0,
		totalTour = 38,
		nearestToPos = 0;
		keyPos = [0, 1, 2, 3, 4, 5, 16, 17],
		motivation = 1;

	_.each(standing.table, function(d, i) {

		if (d.team == home && (totalTour - d.pld) < 6 && _.includes(keyPos, i)) {
			tour = 1;
		}

		if (d.pld > 6 && d.team == home) {
			var distToNearPos = [];

			var left = _.filter(keyPos, function(x) { return (x < i) }),
				right = _.filter(keyPos, function(x) { return (x > i) }),
				nearestPos = _.union(_.takeRight(left), _.take(right));

			_.each(nearestPos, function(x) {
				var dist = Math.abs(standing.table[i]["pts"] - standing.table[x]["pts"])
					distToPos = { "key": x, "value": dist };
				distToNearPos.push(distToPos);
			});

			var nearestDist = _.minBy(distToNearPos, "value").value,
				matchLeft = totalTour - d.pld;

			nearestToPos = 1 - ( nearestDist / ( 3 * matchLeft ) );

			motivation = _.max([nearestToPos, derby, tour]);
		}
	});

	return motivation;
}

function processData(errors, data) {

	var fea = [],
		gnd = [],
		standing = calcStandings(data, "2014-04-07");

	// debug
	console.log(standing);

	_.each(data, function(d) {

		var match = matchToString(d["Team 1"], d["Team 2"]);

		var motivation1 = teamMotivation(calcStandings(data, d.Date), d["Team 1"], d["Team 2"]),
			motivation2 = teamMotivation(calcStandings(data, d.Date), d["Team 2"], d["Team 1"]);

		// debug
		console.log(d["Team 1"] + " - " + d["Team 2"] + ": " + motivation1 + " - " + motivation2);

		var historyMatch = getHistoryMatch(data, d["Date"], match);

		var sample = {
			"team1": d["Team 1"],
			"team2": d["Team 2"],
			"history": history(historyMatch),
			"diff": different(historyMatch),
			"motivation1": motivation1,
			"motivation2": motivation2
		}

		fea.push(sample);
		gnd.push(result(d.FT));
	});
}

d3.queue()
    .defer(d3.csv, "https://raw.githubusercontent.com/footballcsv/eng-england/master/2010s/2013-14/1-premierleague.csv")
    .await(processData);
