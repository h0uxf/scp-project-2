import React, { useState, useEffect } from "react";
import { Save, X, Plus, Trash2, Edit3 } from "lucide-react";

const PuzzleBuilder = ({ 
  puzzle, 
  words = [], 
  clues = [], 
  onSave, 
  onClose 
}) => {
  const [gridSize] = useState(puzzle?.gridSize || 15);
  const [grid, setGrid] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordClueForm, setWordClueForm] = useState({
    wordId: '',
    clueId: '',
    startRow: 0,
    startCol: 0,
    direction: 'across',
    clueNumber: 1
  });
  const [puzzleWords, setPuzzleWords] = useState([]);

  // Initialize grid
  useEffect(() => {
    const newGrid = Array(gridSize).fill(null).map(() => 
      Array(gridSize).fill({ isBlack: false, clueNumber: null, letters: [] })
    );
    setGrid(newGrid);
  }, [gridSize]);

  // Load existing puzzle data when editing
  useEffect(() => {
    if (puzzle && puzzle.puzzleWords && puzzle.puzzleWords.length > 0) {
      // Initialize grid with existing words
      const newGrid = Array(gridSize).fill(null).map(() => 
        Array(gridSize).fill({ isBlack: false, clueNumber: null, letters: [] })
      );

      const existingPuzzleWords = [];

      puzzle.puzzleWords.forEach(puzzleWord => {
        const { startRow, startCol, direction, clueNumber, word, clue } = puzzleWord;
        const wordText = word.wordText.toUpperCase();

        // Place word on grid
        for (let i = 0; i < wordText.length; i++) {
          const row = direction === 'DOWN' ? startRow + i : startRow;
          const col = direction === 'ACROSS' ? startCol + i : startCol;
          
          newGrid[row][col] = {
            isBlack: false,
            clueNumber: i === 0 ? clueNumber : newGrid[row][col].clueNumber,
            letters: [...(newGrid[row][col].letters || []), {
              letter: wordText[i],
              wordId: word.wordId,
              direction
            }]
          };
        }

        // Add to puzzle words list
        existingPuzzleWords.push({
          ...puzzleWord,
          word,
          clue
        });
      });

      setGrid(newGrid);
      setPuzzleWords(existingPuzzleWords);
    }
  }, [puzzle, gridSize]);

  // Handle cell click
  const handleCellClick = (row, col) => {
    if (selectedWord) {
      // Only allow placement if word is selected
      setWordClueForm(prev => ({
        ...prev,
        startRow: row,
        startCol: col
      }));
    }
    // If no word is selected, clicking does nothing
  };

  // Check if a word can be placed at the given position
  const canPlaceWord = (word, startRow, startCol, direction) => {
    if (!word || startRow < 0 || startCol < 0) return false;
    
    const wordText = word.wordText.toUpperCase();
    const endRow = direction === 'down' ? startRow + wordText.length - 1 : startRow;
    const endCol = direction === 'across' ? startCol + wordText.length - 1 : startCol;
    
    // Check if word fits in grid
    if (endRow >= gridSize || endCol >= gridSize) {
      return false;
    }

    // Check for collisions
    for (let i = 0; i < wordText.length; i++) {
      const row = direction === 'down' ? startRow + i : startRow;
      const col = direction === 'across' ? startCol + i : startCol;
      const cell = grid[row][col];
      
      // If cell is black, word can't be placed
      if (cell.isBlack) {
        return false;
      }
      
      // If cell has letters, check for collision
      if (cell.letters && cell.letters.length > 0) {
        const existingLetter = cell.letters[0].letter;
        if (existingLetter !== wordText[i]) {
          return false; // Letters don't match
        }
      }
    }
    
    return true;
  };

  // Get word placement preview
  const getWordPreview = () => {
    if (!selectedWord || wordClueForm.startRow < 0 || wordClueForm.startCol < 0) {
      return [];
    }
    
    const wordText = selectedWord.wordText.toUpperCase();
    const { startRow, startCol, direction } = wordClueForm;
    const preview = [];
    
    for (let i = 0; i < wordText.length; i++) {
      const row = direction === 'down' ? startRow + i : startRow;
      const col = direction === 'across' ? startCol + i : startCol;
      
      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        preview.push({ row, col, letter: wordText[i] });
      }
    }
    
    return preview;
  };

  // Add word to puzzle
  const addWordToGrid = () => {
    if (!wordClueForm.wordId || !wordClueForm.clueId) {
      alert('Please select both a word and a clue!');
      return;
    }

    const word = words.find(w => w.wordId === parseInt(wordClueForm.wordId));
    const clue = clues.find(c => c.clueId === parseInt(wordClueForm.clueId));
    
    if (!word || !clue) {
      alert('Selected word or clue not found!');
      return;
    }

    const { startRow, startCol, direction, clueNumber } = wordClueForm;
    
    // Validate placement
    if (!canPlaceWord(word, startRow, startCol, direction)) {
      alert('Cannot place word here! Check for collisions or grid boundaries.');
      return;
    }

    const wordText = word.wordText.toUpperCase();

    // Update grid
    const newGrid = [...grid];
    for (let i = 0; i < wordText.length; i++) {
      const row = direction === 'down' ? startRow + i : startRow;
      const col = direction === 'across' ? startCol + i : startCol;
      
      newGrid[row][col] = {
        isBlack: false,
        clueNumber: i === 0 ? clueNumber : newGrid[row][col].clueNumber,
        letters: [...(newGrid[row][col].letters || []), {
          letter: wordText[i],
          wordId: word.wordId,
          direction
        }]
      };
    }
    
    setGrid(newGrid);

    // Add to puzzle words
    const newPuzzleWord = {
      ...wordClueForm,
      word,
      clue,
      wordId: word.wordId,
      clueId: clue.clueId,
      startRow,
      startCol,
      direction,
      clueNumber: parseInt(clueNumber)
    };

    setPuzzleWords([...puzzleWords, newPuzzleWord]);

    // Reset form
    setWordClueForm({
      wordId: '',
      clueId: '',
      startRow: 0,
      startCol: 0,
      direction: 'across',
      clueNumber: Math.max(...puzzleWords.map(pw => pw.clueNumber), 0) + 1
    });
    setSelectedWord(null);
  };

  // Remove word from puzzle
  const removeWordFromPuzzle = (indexToRemove) => {
    const removedWord = puzzleWords[indexToRemove];
    const newPuzzleWords = puzzleWords.filter((_, index) => index !== indexToRemove);
    setPuzzleWords(newPuzzleWords);

    // Update grid - remove letters for this word
    const newGrid = [...grid];
    const wordText = removedWord.word.wordText.toUpperCase();
    
    for (let i = 0; i < wordText.length; i++) {
      const row = removedWord.direction === 'down' ? removedWord.startRow + i : removedWord.startRow;
      const col = removedWord.direction === 'across' ? removedWord.startCol + i : removedWord.startCol;
      
      const cell = newGrid[row][col];
      const filteredLetters = cell.letters.filter(l => 
        !(l.wordId === removedWord.wordId && l.direction === removedWord.direction)
      );
      
      newGrid[row][col] = {
        ...cell,
        letters: filteredLetters,
        isBlack: filteredLetters.length === 0,
        clueNumber: filteredLetters.length === 0 ? null : cell.clueNumber
      };
    }
    
    setGrid(newGrid);
  };

  // Save puzzle
  const handleSave = () => {
    const puzzleData = {
      gridSize,
      puzzleWords: puzzleWords.map(pw => ({
        wordId: pw.wordId,
        clueId: pw.clueId,
        startRow: pw.startRow,
        startCol: pw.startCol,
        direction: pw.direction,
        clueNumber: pw.clueNumber
      }))
    };
    
    onSave(puzzleData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white">
            {puzzle ? 'Edit' : 'Create'} Puzzle
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Grid */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">Puzzle Grid</h3>
              <div className="bg-white/5 p-4 rounded-lg">
                <div 
                  className="grid gap-1 mx-auto"
                  style={{ 
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    maxWidth: '500px',
                    aspectRatio: '1'
                  }}
                >
                  {grid.map((row, rowIndex) => {
                    const wordPreview = getWordPreview();
                    return row.map((cell, colIndex) => {
                      const isStartPosition = selectedWord && 
                        wordClueForm.startRow === rowIndex && 
                        wordClueForm.startCol === colIndex;
                      
                      const isPreviewCell = wordPreview.find(p => p.row === rowIndex && p.col === colIndex);
                      const canPlace = selectedWord ? canPlaceWord(
                        selectedWord, 
                        wordClueForm.startRow, 
                        wordClueForm.startCol, 
                        wordClueForm.direction
                      ) : false;
                      
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`
                            relative aspect-square border border-gray-400 cursor-pointer
                            text-center font-bold text-xs transition-all duration-200
                            ${cell.isBlack 
                              ? 'bg-black' 
                              : isStartPosition
                                ? canPlace 
                                  ? 'bg-green-500 text-white'
                                  : 'bg-red-500 text-white'
                                : isPreviewCell
                                  ? canPlace
                                    ? 'bg-green-200 text-black'
                                    : 'bg-red-200 text-black'
                                  : 'bg-white text-black hover:bg-blue-100'
                            }
                          `}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                          style={{ minHeight: '25px', minWidth: '25px' }}
                        >
                          {!cell.isBlack && cell.clueNumber && (
                            <div className="absolute top-0 left-0 text-xs font-bold leading-none p-0.5">
                              {cell.clueNumber}
                            </div>
                          )}
                          {!cell.isBlack && (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-sm font-bold">
                                {isPreviewCell && !cell.letters.length 
                                  ? isPreviewCell.letter
                                  : cell.letters.length > 0 
                                    ? cell.letters[0]?.letter || '?'
                                    : ''
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {/* Add Word/Clue */}
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Add Word & Clue</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-white/80 text-sm mb-1">Word</label>
                    <select
                      value={wordClueForm.wordId}
                      onChange={(e) => {
                        setWordClueForm({ ...wordClueForm, wordId: e.target.value });
                        setSelectedWord(words.find(w => w.wordId === parseInt(e.target.value)));
                      }}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    >
                      <option value="" className="bg-gray-800 text-white">Select Word</option>
                      {words.map(word => (
                        <option key={word.wordId} value={word.wordId} className="bg-gray-800 text-white">
                          {word.wordText} ({word.wordLength} letters)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-1">Clue</label>
                    <select
                      value={wordClueForm.clueId}
                      onChange={(e) => setWordClueForm({ ...wordClueForm, clueId: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    >
                      <option value="" className="bg-gray-800 text-white">Select Clue</option>
                      {clues.map(clue => (
                        <option key={clue.clueId} value={clue.clueId} className="bg-gray-800 text-white">
                          {clue.clueText}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-white/80 text-sm mb-1">Direction</label>
                      <select
                        value={wordClueForm.direction}
                        onChange={(e) => setWordClueForm({ ...wordClueForm, direction: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                      >
                        <option value="across" className="bg-gray-800 text-white">Across</option>
                        <option value="down" className="bg-gray-800 text-white">Down</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm mb-1">Clue #</label>
                      <input
                        type="number"
                        value={wordClueForm.clueNumber}
                        onChange={(e) => setWordClueForm({ ...wordClueForm, clueNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="text-sm text-white/60">
                    Position: Row {wordClueForm.startRow + 1}, Col {wordClueForm.startCol + 1}
                    <br />
                    {selectedWord && `Click grid to place "${selectedWord.wordText}"`}
                  </div>

                  <button
                    onClick={addWordToGrid}
                    disabled={!wordClueForm.wordId || !wordClueForm.clueId}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold text-sm"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Add to Grid
                  </button>
                </div>
              </div>

              {/* Current Words */}
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Current Words ({puzzleWords.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {puzzleWords.map((pw, index) => (
                    <div key={index} className="bg-white/5 p-3 rounded border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium text-sm">
                          {pw.clueNumber}. {pw.word.wordText}
                        </span>
                        <button
                          onClick={() => removeWordFromPuzzle(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-white/60 text-xs">
                        {pw.direction} • {pw.clue.clueText}
                      </div>
                      <div className="text-white/40 text-xs">
                        Position: {pw.startRow + 1},{pw.startCol + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-white/20">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={puzzleWords.length === 0}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Puzzle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleBuilder;
