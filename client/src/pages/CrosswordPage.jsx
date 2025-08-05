import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Eye, HelpCircle, Check, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import toast, { Toaster } from "react-hot-toast";
import BackgroundEffects from "../components/BackgroundEffects";
import CrosswordGrid from "../components/CrosswordGrid";
import useApi from "../hooks/useApi";

class CrosswordErrorBoundary extends React.Component {
  state = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-4">Crossword Puzzle</h1>
          <p className="text-lg sm:text-xl text-red-300">{this.state.errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 text-sm sm:text-base"
            aria-label="Retry loading page"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const CrosswordPage = () => {
  const { puzzleId } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const { makeApiCall, loading: apiLoading, error: apiError } = useApi();
  
  const [puzzle, setPuzzle] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentGrid, setCurrentGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [direction, setDirection] = useState('across');
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showClues, setShowClues] = useState(true);

  // Timer effect
  useEffect(() => {
    if (startTime && !progress?.isCompleted) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, progress?.isCompleted]);

  // Fetch puzzle data
  const fetchPuzzle = async () => {
    try {
      const data = await makeApiCall(`/crossword/${puzzleId}`, 'GET');
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to fetch puzzle");
      }
      setPuzzle(data.data);
      initializeGrid(data.data);
    } catch (err) {
      console.error("Error fetching puzzle:", err);
      toast.error(err.message);
    }
  };

  // Fetch user progress
  const fetchProgress = async () => {
    if (!currentUser) return;

    try {
      const data = await makeApiCall(`/crossword/${puzzleId}/progress`, 'GET');
      if (data.status === "success" && data.data) {
        setProgress(data.data);
        setHintsUsed(data.data.hintsUsed || 0);
        setTimeSpent(data.data.timeSpent || 0);
        if (data.data.currentGrid && puzzle) {
          const savedGrid = JSON.parse(data.data.currentGrid);
          const newGrid = [...currentGrid];
          for (let row = 0; row < newGrid.length; row++) {
            for (let col = 0; col < newGrid[row].length; col++) {
              if (savedGrid[row] && savedGrid[row][col] && !newGrid[row][col].isBlack) {
                newGrid[row][col] = {
                  ...newGrid[row][col],
                  letter: savedGrid[row][col].letter || ''
                };
              }
            }
          }
          setCurrentGrid(newGrid);
        }
      }
    } catch (err) {
      console.error("Failed to fetch progress:", err);
    }
  };

  // Start puzzle
  const startPuzzle = async () => {
    if (!currentUser) {
      toast.error("Please login to start the puzzle");
      navigate("/login");
      return;
    }

    try {
      const data = await makeApiCall(`/crossword/${puzzleId}/start`, 'POST');
      if (data.status === "success") {
        setProgress(data.data);
        setStartTime(Date.now());
        toast.success("Puzzle started!");
      } else if (data.status === "error" && data.message.includes("already started")) {
        await fetchProgress();
        setStartTime(Date.now() - (progress?.timeSpent || 0) * 1000);
      }
    } catch (err) {
      console.error("Error starting puzzle:", err);
      toast.error(err.message || "Failed to start puzzle");
    }
  };

  // Save progress
  const saveProgress = async (gridData, completed = false) => {
    if (!currentUser || !progress) return;

    try {
      const progressData = {
        currentGrid: JSON.stringify(gridData),
        isCompleted: completed,
        timeSpent: timeSpent,
        hintsUsed: hintsUsed,
        score: completed ? calculateScore() : null,
      };

      const data = await makeApiCall(`/crossword/${puzzleId}/progress`, 'PUT', progressData);
      if (data.status === "success") {
        setProgress(data.data);
        if (completed) {
          toast.success("Puzzle completed! Well done!");
        }
      }
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  };

  // Initialize empty grid
  const initializeGrid = (puzzleData) => {
    const size = puzzleData.gridSize;
    const grid = Array(size).fill(null).map(() => 
      Array(size).fill({ letter: '', isBlack: true, clueNumber: null })
    );

    puzzleData.puzzleWords.forEach(wordData => {
      const { startRow, startCol, direction, clueNumber, word } = wordData;
      const wordText = word.wordText.toUpperCase();
      const normalizedDirection = direction.toLowerCase();
      
      for (let i = 0; i < wordText.length; i++) {
        const row = normalizedDirection === 'down' ? startRow + i : startRow;
        const col = normalizedDirection === 'across' ? startCol + i : startCol;
        
        if (row < size && col < size) {
          const existingCell = grid[row][col];
          grid[row][col] = {
            letter: '',
            isBlack: false,
            clueNumber: i === 0 ? clueNumber : (existingCell.clueNumber || null),
            wordId: wordData.word.wordId,
            direction: normalizedDirection,
          };
        }
      }
    });

    setCurrentGrid(grid);
  };

  // Calculate score
  const calculateScore = () => {
    const baseScore = 1000;
    const timeBonus = Math.max(0, 300 - Math.floor(timeSpent / 60));
    const hintPenalty = hintsUsed * 50;
    return Math.max(0, baseScore + timeBonus - hintPenalty);
  };

  // Format time
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Check if puzzle is completed
  const checkCompletion = (grid) => {
    if (!puzzle) return false;
    
    return puzzle.puzzleWords.every(wordData => {
      const { startRow, startCol, direction, word } = wordData;
      const wordText = word.wordText.toUpperCase();
      const normalizedDirection = direction.toLowerCase();
      
      for (let i = 0; i < wordText.length; i++) {
        const row = normalizedDirection === 'down' ? startRow + i : startRow;
        const col = normalizedDirection === 'across' ? startCol + i : startCol;
        
        if (grid[row][col].letter !== wordText[i]) {
          return false;
        }
      }
      return true;
    });
  };

  // Handle grid changes
  const handleGridChange = (newGrid) => {
    setCurrentGrid(newGrid);
    
    const isCompleted = checkCompletion(newGrid);
    if (isCompleted && !progress?.isCompleted) {
      saveProgress(newGrid, true);
    } else {
      const saveTimer = setTimeout(() => {
        saveProgress(newGrid, false);
      }, 2000);
      return () => clearTimeout(saveTimer);
    }
  };

  // Use hint
  const useHint = () => {
    if (!selectedWord || hintsUsed >= 3) return;
    
    const wordData = puzzle.puzzleWords.find(w => 
      w.clueNumber === selectedWord.clueNumber && 
      w.direction.toLowerCase() === direction
    );
    
    if (wordData) {
      const newGrid = [...currentGrid];
      const { startRow, startCol, word } = wordData;
      const wordText = word.wordText.toUpperCase();
      const normalizedDirection = wordData.direction.toLowerCase();
      
      for (let i = 0; i < wordText.length; i++) {
        const row = normalizedDirection === 'down' ? startRow + i : startRow;
        const col = normalizedDirection === 'across' ? startCol + i : startCol;
        
        if (newGrid[row][col].letter === '') {
          newGrid[row][col] = { ...newGrid[row][col], letter: wordText[i] };
          setCurrentGrid(newGrid);
          setHintsUsed(prev => prev + 1);
          toast.success("Hint used!");
          break;
        }
      }
    }
  };

  // Reset puzzle
  const resetPuzzle = () => {
    if (puzzle) {
      initializeGrid(puzzle);
      setHintsUsed(0);
      setTimeSpent(0);
      setStartTime(Date.now());
      toast.success("Puzzle reset!");
    }
  };

  useEffect(() => {
    fetchPuzzle();
  }, [puzzleId, makeApiCall]);

  useEffect(() => {
    if (currentUser && puzzle && currentGrid.length > 0) {
      fetchProgress();
    }
  }, [currentUser, puzzle, currentGrid.length, makeApiCall]);

  if (loading || apiLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading puzzle...</div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
        <h1 className="text-2xl sm:text-4xl font-bold mb-4">Error</h1>
        <p className="text-lg sm:text-xl text-red-300">{apiError}</p>
        <button
          onClick={() => navigate("/crossword")}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 text-sm sm:text-base"
          aria-label="Back to puzzles list"
        >
          Back to Puzzles
        </button>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Puzzle not found</div>
      </div>
    );
  }

  return (
    <CrosswordErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <BackgroundEffects />
        <Toaster position="top-right" />
        
        <div className="relative z-10 pt-20 pb-8 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
                {puzzle.title}
              </h1>
              <div className="flex flex-wrap justify-center gap-4 text-white/80">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  Difficulty: {puzzle.difficulty}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time: {formatTime(timeSpent)}
                </span>
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Hints: {hintsUsed}/3
                </span>
              </div>
            </div>

            {/* Start/Continue Button */}
            {!progress && currentUser && (
              <div className="text-center mb-8">
                <button
                  onClick={startPuzzle}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300"
                  aria-label="Start puzzle"
                >
                  Start Puzzle
                </button>
              </div>
            )}

            {!currentUser && (
              <div className="text-center mb-8">
                <p className="text-white/80 mb-4">Please login to start the puzzle</p>
                <button
                  onClick={() => navigate("/login")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300"
                  aria-label="Go to login page"
                >
                  Login
                </button>
              </div>
            )}

            {progress && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <h3 className="text-white font-semibold mb-4">Controls</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowClues(!showClues)}
                        className="w-full flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                        aria-label={showClues ? 'Hide clues' : 'Show clues'}
                      >
                        <Eye className="w-4 h-4" />
                        {showClues ? 'Hide' : 'Show'} Clues
                      </button>
                      <button
                        onClick={useHint}
                        disabled={hintsUsed >= 3 || !selectedWord}
                        className="w-full flex items-center gap-2 text-white/80 hover:text-white disabled:text-white/40 transition-colors"
                        aria-label="Use hint"
                      >
                        <HelpCircle className="w-4 h-4" />
                        Use Hint ({3 - hintsUsed} left)
                      </button>
                      <button
                        onClick={resetPuzzle}
                        className="w-full flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                        aria-label="Reset puzzle"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset Puzzle
                      </button>
                    </div>
                  </div>

                  {progress.isCompleted && (
                    <div className="bg-green-500/20 backdrop-blur-md rounded-xl p-6 border border-green-400/30">
                      <div className="flex items-center gap-2 text-green-300 mb-2">
                        <Check className="w-5 h-5" />
                        <span className="font-semibold">Completed!</span>
                      </div>
                      <p className="text-white/80 text-sm">
                        Score: {progress.score || calculateScore()}
                      </p>
                      <p className="text-white/80 text-sm">
                        Time: {formatTime(progress.timeSpent || timeSpent)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2">
                  <CrosswordGrid
                    puzzle={puzzle}
                    currentGrid={currentGrid}
                    selectedCell={selectedCell}
                    selectedWord={selectedWord}
                    direction={direction}
                    onGridChange={handleGridChange}
                    onCellSelect={setSelectedCell}
                    onWordSelect={setSelectedWord}
                    onDirectionChange={setDirection}
                    readonly={progress.isCompleted}
                  />
                </div>

                {/* Clues */}
                {showClues && (
                  <div className="lg:col-span-1">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                      <h3 className="text-white font-semibold mb-4">Clues</h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        <div>
                          <h4 className="text-white/80 font-medium mb-2">Across</h4>
                          <div className="space-y-1">
                            {puzzle.puzzleWords
                              .filter(w => w.direction.toLowerCase() === 'across')
                              .sort((a, b) => a.clueNumber - b.clueNumber)
                              .map(wordData => (
                                <div
                                  key={`${wordData.clueNumber}-across`}
                                  className={`text-sm p-2 rounded cursor-pointer transition-colors ${
                                    selectedWord?.clueNumber === wordData.clueNumber && direction === 'across'
                                      ? 'bg-blue-500/30 text-white'
                                      : 'text-white/70 hover:text-white hover:bg-white/5'
                                  }`}
                                  onClick={() => {
                                    setSelectedWord(wordData);
                                    setDirection('across');
                                  }}
                                  role="button"
                                  aria-label={`Select clue ${wordData.clueNumber} across: ${wordData.clue.clueText}`}
                                >
                                  <span className="font-medium">{wordData.clueNumber}.</span> {wordData.clue.clueText}
                                </div>
                              ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-white/80 font-medium mb-2">Down</h4>
                          <div className="space-y-1">
                            {puzzle.puzzleWords
                              .filter(w => w.direction.toLowerCase() === 'down')
                              .sort((a, b) => a.clueNumber - b.clueNumber)
                              .map(wordData => (
                                <div
                                  key={`${wordData.clueNumber}-down`}
                                  className={`text-sm p-2 rounded cursor-pointer transition-colors ${
                                    selectedWord?.clueNumber === wordData.clueNumber && direction === 'down'
                                      ? 'bg-blue-500/30 text-white'
                                      : 'text-white/70 hover:text-white hover:bg-white/5'
                                  }`}
                                  onClick={() => {
                                    setSelectedWord(wordData);
                                    setDirection('down');
                                  }}
                                  role="button"
                                  aria-label={`Select clue ${wordData.clueNumber} down: ${wordData.clue.clueText}`}
                                >
                                  <span className="font-medium">{wordData.clueNumber}.</span> {wordData.clue.clueText}
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </CrosswordErrorBoundary>
  );
};

export default CrosswordPage;