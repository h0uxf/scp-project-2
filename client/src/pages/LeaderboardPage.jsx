import React, { useEffect, useState } from "react";
import { Medal, Star, Trophy, CircleUserRound } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import BackgroundEffects from "../components/BackgroundEffects";
import useApi from "../hooks/useApi";

const LeaderboardPage = () => {
  const [topPlayers, setTopPlayers] = useState([]);
  const [userRanking, setUserRanking] = useState(null);
  const { currentUser } = useAuth();
  const { makeApiCall, loading: apiLoading, error: apiError } = useApi();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await makeApiCall("/leaderboard", "GET");
        if (data.status !== "success" || !Array.isArray(data.data)) {
          throw new Error(data.message || "Unexpected API response format");
        }
        setTopPlayers(data.data);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        toast.error(err.message || "Failed to load leaderboard");
      }
    };

    fetchLeaderboard();
  }, [makeApiCall]);

  useEffect(() => {
    const fetchUserRanking = async () => {
      if (!currentUser) return;

      try {
        const data = await makeApiCall("/leaderboard/userRanking", "GET");
        if (data.status === "success" && data.data) {
          setUserRanking(data.data);
        } else {
          throw new Error(data.message || "Failed to fetch user ranking");
        }
      } catch (err) {
        console.error("Error fetching user ranking:", err);
        toast.error(err.message || "Failed to load user ranking");
      }
    };

    fetchUserRanking();
  }, [currentUser, makeApiCall]);

  const icons = [Trophy, Medal, Star];
  const colors = [
    "from-yellow-400 to-orange-400",
    "from-gray-300 to-gray-400",
    "from-orange-400 to-red-400",
  ];

  if (apiLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-900 text-white">
        Loading leaderboard...
      </div>
    );
  }

  return (
    <div className="font-sans bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen scroll-smooth relative overflow-hidden">
      <BackgroundEffects />
      <Toaster position="top-right" />
      <div className="py-20 px-4 sm:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-12"
          >
            Leaderboard
          </motion.h1>

          {apiError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500/20 backdrop-blur-md rounded-xl p-6 border border-red-400/30 mb-8"
            >
              <p className="text-red-300">{apiError}</p>
              <button
                onClick={() => fetchLeaderboard()}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full transition-all duration-300"
                aria-label="Retry loading leaderboard"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {!apiError && topPlayers.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mb-8"
            >
              <p className="text-white/80">No leaderboard data available.</p>
            </motion.div>
          )}

          {/* Top 3 Players */}
          {!apiError && topPlayers.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6 mb-12"
            >
              {topPlayers.slice(0, 3).map((user, index) => {
                const Icon = icons[index];
                const isCurrentUser = currentUser?.username === user.username;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`bg-gradient-to-r ${
                      colors[index]
                    } p-0.5 rounded-2xl transform hover:scale-105 transition-all duration-300 ${
                      isCurrentUser ? "ring-4 ring-cyan-400" : ""
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
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* All other players */}
          {!apiError && topPlayers.length > 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 max-w-xl mx-auto"
            >
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
                        }`}
                      aria-label={`Rank ${rank}: ${user.username}, ${user.points} points`}
                    >
                      <span className="text-white font-medium">
                        #{rank} {user.username}
                      </span>
                      <span className="text-gray-300">{user.points} pts</span>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}

          {/* User's ranking */}
          {userRanking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`fixed bottom-10 left-0 right-0 mx-auto
                p-0.5 rounded-2xl shadow-xl z-50
                max-w-[90vw] sm:max-w-md md:max-w-lg lg:max-w-xl
                w-full
                ${
                  userRanking.rank <= 3
                    ? `bg-gradient-to-r ${colors[userRanking.rank - 1]}`
                    : "bg-gradient-to-r from-indigo-500 to-cyan-500"
                }`}
            >
              <div className="bg-black/80 backdrop-blur-lg p-3 rounded-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center 
                      ${
                        userRanking.rank <= 3
                          ? `bg-gradient-to-r ${colors[userRanking.rank - 1]}`
                          : "bg-gradient-to-r from-indigo-500 to-cyan-500"
                      }`}
                  >
                    {userRanking.rank <= 3 ? (
                      React.createElement(icons[userRanking.rank - 1], {
                        className: "text-white text-lg",
                      })
                    ) : (
                      <CircleUserRound className="text-white text-lg" />
                    )}
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
                  <span
                    className={`bg-clip-text text-transparent font-bold text-xl 
                      ${
                        userRanking.rank <= 3
                          ? `bg-gradient-to-r ${colors[userRanking.rank - 1]}`
                          : "bg-gradient-to-r from-indigo-500 to-cyan-500"
                      }`}
                  >
                    {userRanking.points}
                  </span>
                  <p className="text-gray-400 text-xs">points</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;