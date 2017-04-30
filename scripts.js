function getHistoryMatch(data, date, team1, team2) {

	var match = matchToString(team1, team2),
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

function getTeamRanking(data, team){
	teamRanking = _.findIndex(data, function(d){
		return d.team === team;
	});
	return teamRanking;
}

function getTeamPos(data, team){
	teamPos = _.filter(data, function(d){
		if (team === d.team) {
			return d;
		}
	})
	return teamPos;
}

function getTeamCon(homePld, homeRank, awayRank){
	diff = Math.abs(homeRank - awayRank);
    if (homePld < 6) {
        return 1;
    }
    else if (diff <= 7 && homeRank < awayRank) {
        return (1 - (diff / 7))
    }
    else if (diff <= 7 && homeRank > awayRank){
        return 1;
    }
    else if (diff > 7 && homeRank < awayRank){
        return 1 / 7;
    }
    else if (diff > 7 && homeRank > awayRank){
        return 1;
    }
}

function teamConcentration(data, team1, team2, date){

	var concentration = [],

	standing = calcStandings(data, date);

	team1Ranking = getTeamRanking(standing.table, team1);
	team2Ranking = getTeamRanking(standing.table, team2);

	team1Pos = getTeamPos(standing.table, team1);
	team2Pos = getTeamPos(standing.table, team2);

	team1Pld = team1Pos.pld;
	team2Pld = team2Pos.pld;

	diff = team1Ranking - team2Ranking;

	team1Con = getTeamCon(team1Pld, team1Ranking, team2Ranking);
	team2Con = getTeamCon(team2Pld, team2Ranking, team1Ranking);

	concentration.push(team1Con, team2Con);

	return concentration;
}

function teamForm(data, team, date){

	newDate = moment(date);

	filterByDate =	_.filter(data, function(d) {
		if (moment(d["Date"]).isBefore(newDate))
			return d;
	});

	filterByTeam = _.filter(filterByDate, function(d){
		if (team === d["Team 1"] || team === d["Team 2"]){
			return d;
		}
	});

	filterByTeam = _.takeRight(filterByTeam, 10);

	var form = 0;
	if (!_.isEmpty(filterByTeam)) {
		_.each(filterByTeam, function(d) {
			form += result(d.FT);
		});
	}

	return form / 10;
}

function different(match) {
	if (match.length) {
		var goal1 = 0,
			goal2 = 0;
		_.each(match, function(m) {
			score = (m.FT).split("-");
			goal1 += +score[0];
			goal2 += +score[1];
		})
		return (_.max([goal1, goal2]) == 0) ? 0 : ((1/2) - (Math.abs(goal1 - goal2) / (2 * _.max([goal1, goal2]))));
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
	if (match.length) {
		var total = 0;
		_.each(match, function(m) {
			total += result(m.FT);
		});
		return (total / match.length);
	} else {
		return 0;
	}
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

			tour = (tour + nearestDist) / 2;

			motivation = _.min([_.max([nearestToPos, derby, tour]), 1]);
		}
	});

	return motivation;
}

function winRatio(data, home, away, date) {

	var newDate = moment(date),
		wonHome = 0,
		wonAway = 0;

	filterByDate =	_.filter(data, function(d) {
		if (moment(d["Date"]).isBefore(newDate))
			return d;
	});

	filterByHome = _.filter(filterByDate, function(d){
		if (home === d["Team 1"]){
			return d;
		}
	});
	_.each(filterByHome, function(d) {
		if (result(d.FT) == 0) {
			wonHome++;
		}
	});

	filterByAway = _.filter(filterByDate, function(d){
		if (away === d["Team 2"]){
			return d;
		}
	});
	_.each(filterByAway, function(d) {
		if (result(d.FT) == 1) {
			wonAway++;
		}
	});

	var homeRatio = (filterByHome.length == 0) ? 0 : (wonHome / filterByHome.length),
		awayRatio = (filterByAway.length == 0) ? 0 : (wonAway / filterByAway.length);

	return [homeRatio, awayRatio];
}

// JSON to CSV Converter
function toCSV(data, filename) {

    var str = '';

    if (typeof data == 'string') {
    	str = data;
    } else {

    	var array = typeof data != 'object' ? JSON.parse(data) : data;

	    for (var i = 0; i < array.length; i++) {
	        var line = '';
	        for (var index in array[i]) {
	            if (line != '')
	            	line += ',';
	            line += array[i][index];
	        }
	        str += line + '\r\n';
	    }
    }

    var blob = new Blob([str]);

    if (window.navigator.msSaveOrOpenBlob) {
    	// IE hack; see http://msdn.microsoft.com/en-us/library/ie/hh779016.aspx
        window.navigator.msSaveBlob(blob, filename);
    } else {
        var a = window.document.createElement("a");
        a.href = window.URL.createObjectURL(blob, {type: "text/plain"});
        a.download = filename;
        document.body.appendChild(a);
        a.click();  // IE: "Access is denied"; see: https://connect.microsoft.com/IE/feedback/details/797361/ie-10-treats-blob-url-as-cross-origin-and-denies-access
        document.body.removeChild(a);
    }

    return str;
}

function processData(errors, data1, data2) {

	if (errors) throw errors;

	var dataset = [data1, data2];

	_.each(dataset, function(data) {

		var fea = [],
			gnd = [];

		// log running time
		var t0 = performance.now();

		_.each(data, function(d) {

			var motivation1 = teamMotivation(calcStandings(data, d.Date), d["Team 1"], d["Team 2"]),
				motivation2 = teamMotivation(calcStandings(data, d.Date), d["Team 2"], d["Team 1"]);

			var historyMatch = getHistoryMatch(data, d["Date"], d["Team 1"], d["Team 2"]);

			var winRatioHome = winRatio(data, d["Team 1"], d["Team 2"], d.Date)[0],
				winRatioAway = winRatio(data, d["Team 1"], d["Team 2"], d.Date)[1];

			concentration = teamConcentration(data, d["Team 1"], d["Team 2"], d.Date);

			var sample = {
				"history": history(historyMatch),
				"diff": different(historyMatch),
				"motivation1": motivation1,
				"motivation2": motivation2,
				"form1": teamForm(data, d["Team 1"], d.Date),
				"form2": teamForm(data, d["Team 2"], d.Date),
				"con1": concentration[0],
				"con2": concentration[1],
				"homeRatio": winRatioHome,
				"awayRatio": winRatioAway
			}
			fea.push(sample);
			if (result(d.FT) == 0)
				gnd.push(0);
			else if (result(d.FT) == 0.5)
				gnd.push(1);
			else if (result(d.FT) == 1)
				gnd.push(2);

		});

		var t1 = performance.now();
		console.log("process data: " + numeral((t1 - t0) / 1000).format('0.000') + " seconds.");

		// export csv files
		toCSV(fea, "fea.csv");
		toCSV(gnd.join(","), "gnd.csv");

	});

}

// d3.queue()
// 	.defer(d3.csv, "https://raw.githubusercontent.com/footballcsv/eng-england/master/2010s/2012-13/1-premierleague.csv")
//     .defer(d3.csv, "https://raw.githubusercontent.com/footballcsv/eng-england/master/2010s/2013-14/1-premierleague.csv")
//     .await(processData);

d3.queue()
    .defer(d3.csv, "https://raw.githubusercontent.com/footballcsv/eng-england/master/2010s/2013-14/1-premierleague.csv")
    .await(testLabel);

function testLabel(errors, data) {

	if (errors) throw errors;
	// season 2013 - 2014
	var gnd = [2,0,1,2,2,2,0,0,2,0,0,2,1,2,0,1,1,0,0,0,1,1,0,0,0,0,2,0,0,2,2,0,1,1,0,1,2,0,1,1,0,2,2,2,0,2,0,2,2,0,0,2,0,2,0,2,1,2,2,0,2,0,1,0,0,2,2,0,2,1,0,0,0,1,1,1,0,2,2,2,2,2,0,0,1,0,0,0,1,0,0,2,0,0,0,1,0,1,0,1,0,1,1,0,0,0,0,0,1,2,0,1,2,2,0,0,2,1,0,1,1,2,0,0,0,0,0,0,0,1,0,0,2,0,2,2,1,2,0,2,0,0,2,1,0,2,2,1,0,1,0,0,0,1,0,1,1,2,1,2,2,2,0,0,0,1,1,2,2,1,2,2,0,2,2,0,0,2,1,2,1,1,0,0,2,1,0,0,2,0,0,1,0,0,2,2,1,2,2,0,2,0,2,2,0,0,0,2,2,2,0,0,1,0,0,1,2,0,2,1,0,0,0,1,1,0,0,1,0,2,0,0,2,1,2,0,0,0,1,2,2,0,0,0,1,1,2,0,1,0,1,2,1,0,1,2,2,1,0,2,0,2,0,1,0,0,0,0,0,2,2,2,0,0,1,0,0,0,2,1,2,0,0,0,2,0,0,1,2,2,2,2,0,0,0,0,0,0,2,2,0,1,2,2,0,0,1,0,0,0,0,0,1,2,0,2,2,2,0,0,0,2,2,0,2,0,0,0,2,0,2,1,0,2,0,2,1,1,1,2,2,0,2,0,2,2,0,1,0,0,2,0,0,2,2,0,0,0,2,0,0,2,0,2,0,1,1,0,0,0,2,1,2,0,0,2,1,2,0,2],
		prediction = [0,2,0,0,0,2,2,2,2,2,0,0,0,2,0,0,0,2,2,2,0,2,0,0,2,2,2,0,2,2,2,0,0,2,2,0,0,0,0,2,2,0,2,2,0,2,2,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,2,0,0,2,2,0,0,2,0,2,0,0,0,0,0,2,0,2,0,2,2,0,0,0,0,0,2,0,2,2,0,2,2,0,0,2,0,2,0,2,0,0,0,0,0,0,2,0,0,0,2,0,0,0,0,2,0,0,0,0,0,2,0,2,0,0,0,0,0,0,0,0,2,0,0,0,0,0,2,2,0,2,0,0,0,2,2,0,0,0,0,0,2,2,0,2,0,2,2,0,2,2,0,0,0,0,0,0,0,2,2,0,0,0,2,0,0,0,2,2,2,0,0,2,0,0,0,2];

	gnd = _.slice(gnd, 190);

	var wrong = [];

	_.each(gnd, function(d, i) {

		var standing = calcStandings(data, data[190 + i].Date),
			ranking1 = getTeamRanking(standing.table, data[190 + i]["Team 1"]),
			ranking2 = getTeamRanking(standing.table, data[190 + i]["Team 2"]);

		if (gnd[i] != prediction[i] && gnd[i] == 1) {

			wrong.push({
				"gnd": gnd[i],
				"prediction": prediction[i],
				"match": data[190 + i],
				"ranking1": ranking1,
				"ranking2": ranking2
			});
		}

	});

	console.log(wrong);
}

