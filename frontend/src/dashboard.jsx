import { useState, useEffect } from "react";
import moment from "moment";
import "./css/dashboard.css";

const Matchs = () => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState({});
  const showMatchDetails = () => {
    
  }

  useEffect(() => {
    const fetchMatches = async () => {
      const res = await fetch("http://localhost:5000/matchs");
      const data = await res.json();
      setMatches(data);

      const allTeamIds = new Set();

      data.forEach(m => {
        allTeamIds.add(m.team1_id);
        allTeamIds.add(m.team2_id);
      });

      const teamPromises = [...allTeamIds].map(async (id) => {
        const resp = await fetch(`http://localhost:5000/teams/${id}`);
        const teamData = await resp.json();
        return { id, teamData };
      });

      const results = await Promise.all(teamPromises);

      const teamMap = {};
      results.forEach(r => {
        teamMap[r.id] = r.teamData;
      });

      setTeams(teamMap);
    };

    fetchMatches();
  }, []);

  return (
    <div className="matchContainer">
      {matches.map((match) => {
        const team1 = teams[match.team1_id];
        const team2 = teams[match.team2_id];

        return (
          <div key={match.match_id} className="matchCard" onClick={()=> showMatchDetails(match.match_id)}>
            <p className="teamTitle">
              {team1 ? team1[0].team_name : "Loading..."} vs {" "}
              {team2 ? team2[0].team_name : "Loading..."}
            </p>

            <p>Venue: {match.venue}</p>

            {/* Moment.js Date Formatting */}
            <p>Date: {moment(match.match_date).format("DD MMM YYYY, h:mm A")}</p>
            {/* Example output: 10 Nov 2026 */}
          </div>
        );
      })}
    </div>
  );
};

export const Dashboard = () => {
  return (
    <div>
      <h1>Matches</h1>
      <Matchs />
    </div>
  );
};
