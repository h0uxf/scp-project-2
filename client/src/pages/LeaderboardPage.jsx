import React, { useEffect, useState } from "react";
import { Medal, Star, Trophy, CircleUserRound } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import BackgroundEffects from "../components/BackgroundEffects";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const LeaderboardPage = () => {
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRanking, setUserRanking] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/leaderboard`);
        if (!response.ok) throw new Error("Failed to fetch leaderboard");
        const data = await response.json();
        setTopPlayers(data.data);
        console.log(topPlayers);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  useEffect(() => {
    const fetchUserRanking = async () => {
      if (!currentUser) return; // stop fetching if the user does not login (no token)

      try {
        const res = await fetch(`${API_BASE_URL}/api/leaderboard/userRanking`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch user ranking");
        const json = await res.json();
        if (json.status === "success") {
          setUserRanking(json.data);
        }
      } catch (error) {
        console.error("Error fetching user ranking:", error);
      }
    };

    fetchUserRanking();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || topPlayers.length === 0) return;

    const index = topPlayers.findIndex(
      (user) => user.username === currentUser.username
    );

    if (index !== -1) {
      setUserRanking({
        rank: index + 1,
        username: currentUser.username,
        points: topPlayers[index].points,
      });
    }
  }, [currentUser, topPlayers]);

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
    <div className="font-sans bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen scroll-smooth relative overflow-hidden">
      <BackgroundEffects />
      <div className="py-20 px-4 sm:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-12">
            Leaderboard
          </h1>
          {/* Top 3 Players */}
          <div className="space-y-6 mb-12">
            {topPlayers.slice(0, 3).map((user, index) => {
              const Icon = icons[index];
              const isCurrentUser = currentUser?.username === user.username;

              return (
                <div
                  key={index}
                  className={`bg-gradient-to-r ${
                    colors[index]
                  } p-0.5 rounded-2xl transform hover:scale-105 transition-all duration-300 ${
                    isCurrentUser ? "ring-4 ring-indigo-400" : ""
                  }`}
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
                        <p className="text-gray-300 font-medium">
                          {user.username}
                        </p>
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

          {/* All other players */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 max-w-xl mx-auto">
            <h2 className="text-white text-xl font-semibold mb-4">
              All Players
            </h2>
            <ul className="space-y-2 text-left">
              {topPlayers.slice(3).map((user, index) => {
                const rank = index + 4;
                const isCurrentUser = currentUser?.username === user.username;

                return (
                  <li
                    key={rank}
                    className={`flex justify-between items-center p-3 rounded-lg transition 
        ${
          isCurrentUser
            ? "bg-indigo-500/30 ring-2 ring-indigo-500"
            : "bg-white/5 hover:bg-white/10"
        }
      `}
                  >
                    <span className="text-white font-medium">
                      #{rank} {user.username}
                    </span>
                    <span className="text-gray-300">{user.points} pts</span>
                  </li>
                );
              })}{" "}
            </ul>
          </div>
        </div>

        {/* User's ranking */}
        {userRanking && (
          <div
            className="
            fixed bottom-10 left-1/2 transform -translate-x-1/2
            bg-gradient-to-r from-indigo-500 to-cyan-500
            p-0.5 rounded-2xl shadow-xl z-50
            max-w-[90vw] sm:max-w-md md:max-w-lg lg:max-w-xl
            w-full
          "
          >
            <div className="bg-black/80 backdrop-blur-lg p-3 rounded-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <CircleUserRound className="text-white text-lg" />
                </div>
                <div className="text-left">
                  <span className="text-white font-bold text-lg">
                    #{userRanking.rank}
                  </span>
                  <p className="text-gray-300 text-sm">
                    {userRanking.username}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent font-bold text-xl">
                  {userRanking.points}
                </span>
                <p className="text-gray-400 text-xs">points</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
