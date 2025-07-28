import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Puzzle, Clock, Trophy, Play, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import toast, { Toaster } from "react-hot-toast";
import NavBar from "../components/NavBar";
import BackgroundEffects from "../components/BackgroundEffects";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

class CrosswordListErrorBoundary extends React.Component {
  state = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-4">Crossword Puzzles</h1>
          <p className="text-lg sm:text-xl text-red-300">{this.state.errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 text-sm sm:text-base"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const CrosswordListPage = () => {
  const navigate = useNavigate();
  const { currentUser, authLoading } = useAuth();
  
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  // Fetch all puzzles
  const fetchPuzzles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/crossword`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch puzzles: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "success") {
        setPuzzles(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch puzzles");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPuzzles();
  }, []);

  // Filter puzzles by difficulty
  const filteredPuzzles = selectedDifficulty === 'all' 
    ? puzzles 
    : puzzles.filter(puzzle => puzzle.difficulty.toLowerCase() === selectedDifficulty);

  // Difficulty colors
  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400 border-green-400/30 bg-green-500/10';
      case 'medium': return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10';
      case 'hard': return 'text-red-400 border-red-400/30 bg-red-500/10';
      default: return 'text-blue-400 border-blue-400/30 bg-blue-500/10';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading puzzles...</div>
      </div>
    );
  }

  return (
    <CrosswordListErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <BackgroundEffects />
        <NavBar />
        <Toaster position="top-right" />
        
        <div className="relative z-10 pt-20 pb-8 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex justify-center mb-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-full p-4 border border-white/20">
                    <Puzzle className="w-12 h-12 text-blue-400" />
                  </div>
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4">
                  Crossword Puzzles
                </h1>
                <p className="text-xl text-white/80 max-w-2xl mx-auto">
                  Challenge your mind with our collection of crossword puzzles. 
                  Test your knowledge and vocabulary skills!
                </p>
              </motion.div>
            </div>

            {/* Difficulty Filter */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
                <div className="flex gap-2">
                  {['all', 'easy', 'medium', 'hard'].map((difficulty) => (
                    <button
                      key={difficulty}
                      onClick={() => setSelectedDifficulty(difficulty)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        selectedDifficulty === difficulty
                          ? 'bg-blue-500 text-white'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="text-center mb-8">
                <div className="bg-red-500/20 backdrop-blur-md rounded-xl p-6 border border-red-400/30 max-w-md mx-auto">
                  <p className="text-red-300">{error}</p>
                  <button
                    onClick={fetchPuzzles}
                    className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full transition-all duration-300"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Puzzles Grid */}
            {!error && (
              <AnimatePresence mode="wait">
                {filteredPuzzles.length === 0 ? (
                  <motion.div
                    key="no-puzzles"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 max-w-md mx-auto">
                      <Puzzle className="w-16 h-16 text-white/40 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No Puzzles Found
                      </h3>
                      <p className="text-white/80">
                        {selectedDifficulty === 'all' 
                          ? "No puzzles are available at the moment."
                          : `No ${selectedDifficulty} puzzles are available.`
                        }
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="puzzles-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filteredPuzzles.map((puzzle, index) => (
                      <motion.div
                        key={puzzle.puzzleId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden hover:border-white/40 transition-all duration-300 group"
                      >
                        <div className="p-6">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                                {puzzle.title}
                              </h3>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(puzzle.difficulty)}`}>
                                  {puzzle.difficulty}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-white/70">
                              <div className="w-4 h-4 bg-white/20 rounded-sm grid place-items-center">
                                <div className="w-2 h-2 bg-white/60 rounded-sm"></div>
                              </div>
                              <span className="text-sm">Grid: {puzzle.gridSize}×{puzzle.gridSize}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/70">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">Created: {formatDate(puzzle.createdAt)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => navigate(`/crossword/${puzzle.puzzleId}`)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Play
                            </button>
                          </div>
                        </div>

                        {/* Hover Effect */}
                        <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Login Prompt for Non-authenticated Users */}
            {!currentUser && !authLoading && (
              <div className="mt-12 text-center">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 max-w-md mx-auto">
                  <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Login to Save Progress
                  </h3>
                  <p className="text-white/80 mb-6">
                    Create an account or login to save your puzzle progress and compete on the leaderboard.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => navigate("/login")}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => navigate("/register")}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
                    >
                      Register
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Section */}
            {puzzles.length > 0 && (
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {puzzles.length}
                  </div>
                  <div className="text-white/80">Total Puzzles</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {puzzles.filter(p => p.difficulty.toLowerCase() === 'easy').length}
                  </div>
                  <div className="text-white/80">Easy Puzzles</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
                  <div className="text-3xl font-bold text-red-400 mb-2">
                    {puzzles.filter(p => p.difficulty.toLowerCase() === 'hard').length}
                  </div>
                  <div className="text-white/80">Hard Puzzles</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CrosswordListErrorBoundary>
  );
};

export default CrosswordListPage;
