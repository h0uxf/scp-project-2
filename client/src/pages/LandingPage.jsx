import React, { useState, useEffect } from "react";
import { Crown, Play, GraduationCap, Star, Trophy, Medal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import BackgroundEffects from "../components/BackgroundEffects";
import useApi from "../hooks/useApi";

const LandingPage = () => {
  const [navOpen, setNavOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();
  const { makeApiCall, loading: apiLoading, error: apiError } = useApi();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await makeApiCall("/leaderboard", "GET");
        if (data.status !== "success" || !Array.isArray(data.data)) {
          throw new Error(data.message || "Unexpected API response format");
        }
        setLeaderboard(data.data);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
        toast.error(err.message || "Failed to load leaderboard");
      }
    };

    fetchLeaderboard();
  }, [makeApiCall]);

  const handleButtonClick = () => {
    navigate("/login");
  };

  const handleLearnMoreClick = () => {
    navigate("/learn-more?from=landing&section=hero&user_type=visitor");
  };

  return (
    <div className="font-sans bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen scroll-smooth relative overflow-hidden">
      <BackgroundEffects />
      <Toaster position="top-right" />
      
      {/* Hero Section */}
      <section id="home" className="py-20 px-4 sm:px-8 text-center relative">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl sm:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            Welcome to School of Computing @ SP
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-300 text-xl sm:text-2xl mb-8 leading-relaxed"
          >
            Discover the future of computing through immersive AR experiences
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={handleButtonClick}
              className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 overflow-hidden"
              aria-label="Start scanning"
            >
              <span className="relative z-10 flex items-center gap-2 font-semibold">
                <Play className="group-hover:rotate-12 transition-transform" />
                Start Scanning
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button
              onClick={handleLearnMoreClick}
              className="group bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-full shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
              aria-label="Learn more about School of Computing"
            >
              <span className="flex items-center gap-2 font-semibold">
                <GraduationCap className="group-hover:rotate-12 transition-transform" />
                Learn More
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-10 px-4 sm:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold mb-8 text-white"
          >
            About{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              SP & SoC
            </span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl"
          >
            <p className="text-gray-300 text-lg sm:text-xl leading-relaxed mb-6">
              The School of Computing (SoC) at SP offers cutting-edge diploma
              courses and flexible pathways to shape your future in technology.
            </p>
            <p className="text-gray-300 text-lg sm:text-xl leading-relaxed">
              Explore SoC through our revolutionary AR game — scan markers,
              complete challenges, and earn real rewards while discovering your
              passion for computing!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Scan Section */}
      <section id="scan" className="py-10 px-4 sm:px-8 text-center relative">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold mb-8 text-white"
          >
            Start Your{" "}
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Exploration
            </span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-8 items-center"
          >
            <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <Play className="text-6xl text-green-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-2xl font-semibold text-white mb-4">
                AR Scanning
              </h3>
              <p className="text-gray-300 mb-6">
                Use your device camera to discover hidden content and
                interactive experiences throughout the School of Computing.
              </p>
              <button
                onClick={handleButtonClick}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
                aria-label="Begin AR scanning"
              >
                Begin Scanning
              </button>
            </div>
            <div className="space-y-4">
              {[
                {
                  feature: "Discover Hidden Content",
                  color: "from-blue-500 to-purple-500",
                },
                {
                  feature: "Interactive Experiences",
                  color: "from-purple-500 to-pink-500",
                },
                {
                  feature: "Real-time Rewards",
                  color: "from-pink-500 to-rose-500",
                },
              ].map(({ feature, color }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/15 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 bg-gradient-to-r ${color} rounded-full flex items-center justify-center`}
                    >
                      <Star className="text-white text-sm" />
                    </div>
                    <span className="text-white font-medium">{feature}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Games & Activities Section */}
      <section id="games" className="py-10 px-4 sm:px-8 text-center relative">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold mb-12 text-white"
          >
            Games &{" "}
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Activities
            </span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Crossword Puzzle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-orange-400/50 transition-all duration-300 hover:scale-105"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">📝</span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Crossword Puzzles
              </h3>
              <p className="text-gray-300 mb-6">
                Challenge your knowledge with themed crossword puzzles. Test your vocabulary and problem-solving skills!
              </p>
              <button
                onClick={() => navigate("/crossword")}
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300 font-semibold"
                aria-label="Play crossword puzzles"
              >
                Play Crossword
              </button>
            </motion.div>

            {/* Quiz */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:scale-105"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">❓</span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Personality Quiz
              </h3>
              <p className="text-gray-300 mb-6">
                Discover your ideal computing course path with our interactive personality assessment quiz.
              </p>
              <button
                onClick={() => navigate("/quiz")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300 font-semibold"
                aria-label="Take personality quiz"
              >
                Take Quiz
              </button>
            </motion.div>

            {/* AR Scanning */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-green-400/50 transition-all duration-300 hover:scale-105"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Play className="text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                AR Exploration
              </h3>
              <p className="text-gray-300 mb-6">
                Scan QR codes and markers around campus to unlock hidden content and earn rewards.
              </p>
              <button
                onClick={handleButtonClick}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300 font-semibold"
                aria-label="Start AR exploration"
              >
                Start Scanning
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard" className="py-10 px-4 sm:px-8 text-center relative">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold mb-12 text-white"
          >
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Leaderboard
            </span>
          </motion.h2>

          {apiLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white text-xl mb-8"
            >
              Loading leaderboard...
            </motion.div>
          )}

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

          {!apiLoading && !apiError && leaderboard.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mb-8"
            >
              <p className="text-white/80">No leaderboard data available.</p>
            </motion.div>
          )}

          {!apiLoading && !apiError && leaderboard.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto space-y-4 mb-8"
            >
              {leaderboard.slice(0, 3).map((user, index) => {
                const icons = [Trophy, Medal, Star];
                const Icon = icons[index];
                const colors = [
                  "from-yellow-400 to-orange-400",
                  "from-gray-300 to-gray-400",
                  "from-orange-400 to-red-400",
                ];

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
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
                          <p className="text-gray-300 font-medium">{user.name}</p>
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

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onClick={() => navigate("/leaderboard")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
            aria-label="View full leaderboard"
          >
            <span className="flex items-center gap-2">
              <Crown className="animate-pulse" />
              View Full Leaderboard
            </span>
          </motion.button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;