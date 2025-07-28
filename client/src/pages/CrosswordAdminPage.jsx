import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import BackgroundEffects from "../components/BackgroundEffects";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

class CrosswordAdminErrorBoundary extends React.Component {
  state = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-4">Crossword Admin</h1>
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

const CrosswordAdminPage = () => {
  const { currentUser, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [puzzles, setPuzzles] = useState([]);
  const [words, setWords] = useState([]);
  const [clues, setClues] = useState([]);
  const [activeTab, setActiveTab] = useState('puzzles');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Forms
  const [showPuzzleForm, setShowPuzzleForm] = useState(false);
  const [showWordForm, setShowWordForm] = useState(false);
  const [showClueForm, setShowClueForm] = useState(false);
  const [editingPuzzle, setEditingPuzzle] = useState(null);
  
  const [puzzleForm, setPuzzleForm] = useState({
    title: '',
    difficulty: 'easy',
    gridSize: 15
  });
  
  const [wordForm, setWordForm] = useState({
    wordText: '',
    difficulty: 'easy',
    category: ''
  });
  
  const [clueForm, setClueForm] = useState({
    clueText: '',
    clueType: 'definition',
    difficulty: 'easy',
    category: ''
  });

  // Check admin permissions
  useEffect(() => {
    if (!authLoading && currentUser && !hasRole(3, 4, 5)) {
      navigate('/');
      toast.error('Access denied. Admin privileges required.');
    }
  }, [currentUser, hasRole, authLoading, navigate]);

  // Fetch data based on active tab
  useEffect(() => {
    if (currentUser && hasRole(3, 4, 5)) {
      fetchData();
    }
  }, [activeTab, currentUser, hasRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      
      switch (activeTab) {
        case 'puzzles':
          endpoint = '/api/crossword/admin/puzzles';
          break;
        case 'words':
          endpoint = '/api/crossword/admin/words';
          break;
        case 'clues':
          endpoint = '/api/crossword/admin/clues';
          break;
        default:
          return;
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "success") {
        switch (activeTab) {
          case 'puzzles':
            setPuzzles(data.data);
            break;
          case 'words':
            setWords(data.data);
            break;
          case 'clues':
            setClues(data.data);
            break;
        }
      } else {
        throw new Error(data.message || "Failed to fetch data");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create puzzle
  const createPuzzle = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/crossword/admin/puzzles`, {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(puzzleForm),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          setPuzzles([data.data, ...puzzles]);
          setPuzzleForm({ title: '', difficulty: 'easy', gridSize: 15 });
          setShowPuzzleForm(false);
          toast.success('Puzzle created successfully!');
        }
      } else {
        throw new Error('Failed to create puzzle');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Update puzzle
  const updatePuzzle = async (puzzleId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/crossword/admin/puzzles/${puzzleId}`, {
        method: 'PUT',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          setPuzzles(puzzles.map(p => p.puzzleId === puzzleId ? data.data : p));
          toast.success('Puzzle updated successfully!');
        }
      } else {
        throw new Error('Failed to update puzzle');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Delete puzzle
  const deletePuzzle = async (puzzleId) => {
    if (!confirm('Are you sure you want to delete this puzzle?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/crossword/admin/puzzles/${puzzleId}`, {
        method: 'DELETE',
        credentials: "include",
      });

      if (response.ok) {
        setPuzzles(puzzles.filter(p => p.puzzleId !== puzzleId));
        toast.success('Puzzle deleted successfully!');
      } else {
        throw new Error('Failed to delete puzzle');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Create word
  const createWord = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/crossword/admin/words`, {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wordForm),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          setWords([data.data, ...words]);
          setWordForm({ wordText: '', difficulty: 'easy', category: '' });
          setShowWordForm(false);
          toast.success('Word created successfully!');
        }
      } else {
        throw new Error('Failed to create word');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Create clue
  const createClue = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/crossword/admin/clues`, {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clueForm),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          setClues([data.data, ...clues]);
          setClueForm({ clueText: '', clueType: 'definition', difficulty: 'easy', category: '' });
          setShowClueForm(false);
          toast.success('Clue created successfully!');
        }
      } else {
        throw new Error('Failed to create clue');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!currentUser || !hasRole(3, 4, 5)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Access Denied</div>
      </div>
    );
  }

  return (
    <CrosswordAdminErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <BackgroundEffects />
        <Toaster position="top-right" />
        
        <div className="relative z-10 pt-20 pb-8 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
                Crossword Admin
              </h1>
              <p className="text-xl text-white/80">
                Manage puzzles, words, and clues
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
                <div className="flex gap-2">
                  {[
                    { id: 'puzzles', label: 'Puzzles' },
                    { id: 'words', label: 'Words' },
                    { id: 'clues', label: 'Clues' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-blue-500 text-white'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Puzzles Tab */}
            {activeTab === 'puzzles' && (
              <div>
                {/* Add Puzzle Button */}
                <div className="mb-6 flex justify-end">
                  <button
                    onClick={() => setShowPuzzleForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Puzzle
                  </button>
                </div>

                {/* Puzzles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {puzzles.map((puzzle) => (
                    <div
                      key={puzzle.puzzleId}
                      className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">
                            {puzzle.title}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                              puzzle.difficulty === 'easy' ? 'text-green-400 border-green-400/30 bg-green-500/10' :
                              puzzle.difficulty === 'medium' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10' :
                              'text-red-400 border-red-400/30 bg-red-500/10'
                            }`}>
                              {puzzle.difficulty}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                              puzzle.isPublished 
                                ? 'text-green-400 border-green-400/30 bg-green-500/10'
                                : 'text-gray-400 border-gray-400/30 bg-gray-500/10'
                            }`}>
                              {puzzle.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-white/70 text-sm mb-4">
                        <p>Grid: {puzzle.gridSize}×{puzzle.gridSize}</p>
                        <p>Created: {formatDate(puzzle.createdAt)}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => updatePuzzle(puzzle.puzzleId, { isPublished: !puzzle.isPublished })}
                          className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                            puzzle.isPublished
                              ? 'bg-gray-600 hover:bg-gray-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {puzzle.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {puzzle.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => deletePuzzle(puzzle.puzzleId)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300"
                          disabled={!hasRole(4, 5)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Words Tab */}
            {activeTab === 'words' && (
              <div>
                {/* Add Word Button */}
                <div className="mb-6 flex justify-end">
                  <button
                    onClick={() => setShowWordForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Word
                  </button>
                </div>

                {/* Words List */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/10">
                        <tr>
                          <th className="px-6 py-3 text-left text-white font-semibold">Word</th>
                          <th className="px-6 py-3 text-left text-white font-semibold">Length</th>
                          <th className="px-6 py-3 text-left text-white font-semibold">Difficulty</th>
                          <th className="px-6 py-3 text-left text-white font-semibold">Category</th>
                          <th className="px-6 py-3 text-left text-white font-semibold">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {words.map((word) => (
                          <tr key={word.wordId} className="border-b border-white/10">
                            <td className="px-6 py-4 text-white font-medium">{word.wordText}</td>
                            <td className="px-6 py-4 text-white/80">{word.wordLength}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-sm ${
                                word.difficulty === 'easy' ? 'text-green-400 bg-green-500/10' :
                                word.difficulty === 'medium' ? 'text-yellow-400 bg-yellow-500/10' :
                                'text-red-400 bg-red-500/10'
                              }`}>
                                {word.difficulty || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white/80">{word.category || 'N/A'}</td>
                            <td className="px-6 py-4 text-white/80">{formatDate(word.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Clues Tab */}
            {activeTab === 'clues' && (
              <div>
                {/* Add Clue Button */}
                <div className="mb-6 flex justify-end">
                  <button
                    onClick={() => setShowClueForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Clue
                  </button>
                </div>

                {/* Clues List */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/10">
                        <tr>
                          <th className="px-6 py-3 text-left text-white font-semibold">Clue</th>
                          <th className="px-6 py-3 text-left text-white font-semibold">Type</th>
                          <th className="px-6 py-3 text-left text-white font-semibold">Difficulty</th>
                          <th className="px-6 py-3 text-left text-white font-semibold">Category</th>
                          <th className="px-6 py-3 text-left text-white font-semibold">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clues.map((clue) => (
                          <tr key={clue.clueId} className="border-b border-white/10">
                            <td className="px-6 py-4 text-white">{clue.clueText}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded text-sm bg-blue-500/10 text-blue-400">
                                {clue.clueType}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-sm ${
                                clue.difficulty === 'easy' ? 'text-green-400 bg-green-500/10' :
                                clue.difficulty === 'medium' ? 'text-yellow-400 bg-yellow-500/10' :
                                'text-red-400 bg-red-500/10'
                              }`}>
                                {clue.difficulty || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white/80">{clue.category || 'N/A'}</td>
                            <td className="px-6 py-4 text-white/80">{formatDate(clue.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Puzzle Form Modal */}
            <AnimatePresence>
              {showPuzzleForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowPuzzleForm(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">Create Puzzle</h3>
                      <button
                        onClick={() => setShowPuzzleForm(false)}
                        className="text-white/60 hover:text-white"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={puzzleForm.title}
                          onChange={(e) => setPuzzleForm({ ...puzzleForm, title: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter puzzle title"
                        />
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Difficulty
                        </label>
                        <select
                          value={puzzleForm.difficulty}
                          onChange={(e) => setPuzzleForm({ ...puzzleForm, difficulty: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Grid Size
                        </label>
                        <select
                          value={puzzleForm.gridSize}
                          onChange={(e) => setPuzzleForm({ ...puzzleForm, gridSize: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={10}>10×10</option>
                          <option value={15}>15×15</option>
                          <option value={20}>20×20</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowPuzzleForm(false)}
                        className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createPuzzle}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-300"
                      >
                        Create
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Word Form Modal */}
            <AnimatePresence>
              {showWordForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowWordForm(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">Add Word</h3>
                      <button
                        onClick={() => setShowWordForm(false)}
                        className="text-white/60 hover:text-white"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Word
                        </label>
                        <input
                          type="text"
                          value={wordForm.wordText}
                          onChange={(e) => setWordForm({ ...wordForm, wordText: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter word"
                        />
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Difficulty
                        </label>
                        <select
                          value={wordForm.difficulty}
                          onChange={(e) => setWordForm({ ...wordForm, difficulty: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Category (Optional)
                        </label>
                        <input
                          type="text"
                          value={wordForm.category}
                          onChange={(e) => setWordForm({ ...wordForm, category: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Animals, Sports, Science"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowWordForm(false)}
                        className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createWord}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-300"
                      >
                        Add Word
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Clue Form Modal */}
            <AnimatePresence>
              {showClueForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowClueForm(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">Add Clue</h3>
                      <button
                        onClick={() => setShowClueForm(false)}
                        className="text-white/60 hover:text-white"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Clue Text
                        </label>
                        <textarea
                          value={clueForm.clueText}
                          onChange={(e) => setClueForm({ ...clueForm, clueText: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                          placeholder="Enter clue text"
                        />
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Clue Type
                        </label>
                        <select
                          value={clueForm.clueType}
                          onChange={(e) => setClueForm({ ...clueForm, clueType: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="definition">Definition</option>
                          <option value="synonym">Synonym</option>
                          <option value="antonym">Antonym</option>
                          <option value="wordplay">Wordplay</option>
                          <option value="fill-in-blank">Fill in Blank</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Difficulty
                        </label>
                        <select
                          value={clueForm.difficulty}
                          onChange={(e) => setClueForm({ ...clueForm, difficulty: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Category (Optional)
                        </label>
                        <input
                          type="text"
                          value={clueForm.category}
                          onChange={(e) => setClueForm({ ...clueForm, category: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Animals, Sports, Science"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowClueForm(false)}
                        className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createClue}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-300"
                      >
                        Add Clue
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </CrosswordAdminErrorBoundary>
  );
};

export default CrosswordAdminPage;
