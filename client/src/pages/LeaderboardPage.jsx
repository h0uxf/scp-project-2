import React, { useEffect, useState } from "react";
import { Medal, Star, Trophy } from "lucide-react";

const LeaderboardPage = () => {
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/leaderboard");
        if (!response.ok) throw new Error("Failed to fetch leaderboard");
        const data = await response.json();
        setTopPlayers(data.data);
        console.log(topPlayers)
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const icons = [Trophy, Medal, Star];
  const colors = [
    "from-yellow-400 to-orange-400",
    "from-gray-300 to-gray-400",
    "from-orange-400 to-red-400",
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-900 text-white">
        Loading leaderboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-4 sm:px-8 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-12">
          Leaderboard
        </h1>

        <div className="space-y-6 mb-12">
          {topPlayers.slice(0, 3).map((user, index) => {
            const Icon = icons[index];
            return (
              <div
                key={index}
                className={`bg-gradient-to-r ${colors[index]} p-0.5 rounded-2xl transform hover:scale-105 transition-all duration-300`}
              >
                <div className="bg-black/80 backdrop-blur-lg p-6 rounded-2xl flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${colors[index]} rounded-full flex items-center justify-center`}
                    >
                      <Icon className="text-white text-xl" />
                    </div>
                    <div className="text-left">
                      <span className="text-white font-bold text-xl">
                        #{index + 1}
                      </span>
                      <p className="text-gray-300 font-medium">{user.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`bg-gradient-to-r ${colors[index]} bg-clip-text text-transparent font-bold text-2xl`}
                    >
                      {user.points}
                    </span>
                    <p className="text-gray-400 text-sm">points</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 max-w-xl mx-auto">
          <h2 className="text-white text-xl font-semibold mb-4">All Players</h2>
          <ul className="space-y-2 text-left">
            {topPlayers.slice(3).map((user, index) => (
              <li
                key={index + 3}
                className="flex justify-between items-center bg-white/5 p-3 rounded-lg hover:bg-white/10 transition"
              >
                <span className="text-white font-medium">
                  #{index + 4} {user.username}
                </span>
                <span className="text-gray-300">{user.points} pts</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
