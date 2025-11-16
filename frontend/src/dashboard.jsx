import { useState, useEffect } from "react";
import "./css/dashboard.css";

const Matchs = () => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState({}); // store team details by id

  useEffect(() => {
    const fetchMatches = async () => {
      const res = await fetch("http://localhost:5000/matchs");
      const data = await res.json();
      setMatches(data);

      // Collect all team IDs so we fetch each team only once
      const allTeamIds = new Set();

      data.forEach(m => {
        allTeamIds.add(m.team1_id);
        allTeamIds.add(m.team2_id);
      });

      // Fetch teams parallel
      const teamPromises = [...allTeamIds].map(async (id) => {
        const resp = await fetch(`http://localhost:5000/teams/${id}`);
        const teamData = await resp.json();
        // console.log(teamData);
        return { id, teamData };
      });

      const results = await Promise.all(teamPromises);

      // Save team data in object: teams[id] = team details
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
          <div key={match.match_id} className="matchCard">
            <p className="teamTitle">
              {team1 ? team1[0].team_name : "Loading..."} vs {team2 ? team2[0].team_name : "Loading..."}
            </p>
            <p>Venue: {match.venue}</p>
            <p>Date: {match.match_date}</p>
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
