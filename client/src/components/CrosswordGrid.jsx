import React, { useState, useEffect, useRef } from "react";

const CrosswordGrid = ({
  puzzle,
  currentGrid,
  selectedCell,
  selectedWord,
  direction,
  onGridChange,
  onCellSelect,
  onWordSelect,
  onDirectionChange,
  readonly = false
}) => {
  const gridRef = useRef(null);
  const [focusedCell, setFocusedCell] = useState(null);

  // Handle cell click
  const handleCellClick = (row, col) => {
    if (currentGrid[row][col].isBlack || readonly) return;

    // If clicking the same cell, toggle direction
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      const newDirection = direction === 'across' ? 'down' : 'across';
      onDirectionChange(newDirection);
      
      // Find word at this position in the new direction
      const wordInDirection = findWordAtPosition(row, col, newDirection);
      if (wordInDirection) {
        onWordSelect(wordInDirection);
      }
    } else {
      // Select new cell
      onCellSelect({ row, col });
      setFocusedCell({ row, col });
      
      // Find word at this position in current direction
      const wordInDirection = findWordAtPosition(row, col, direction);
      if (wordInDirection) {
        onWordSelect(wordInDirection);
      } else {
        // Try the other direction
        const otherDirection = direction === 'across' ? 'down' : 'across';
        const wordInOtherDirection = findWordAtPosition(row, col, otherDirection);
        if (wordInOtherDirection) {
          onWordSelect(wordInOtherDirection);
          onDirectionChange(otherDirection);
        }
      }
    }
  };

  // Find word at a specific position and direction
  const findWordAtPosition = (row, col, dir) => {
    return puzzle.puzzleWords.find(wordData => {
      const { startRow, startCol, direction: wordDir, word } = wordData;
      // Handle both uppercase and lowercase direction values
      const normalizedWordDir = wordDir.toLowerCase();
      const normalizedDir = dir.toLowerCase();
      if (normalizedWordDir !== normalizedDir) return false;
      
      if (normalizedDir === 'across') {
        return row === startRow && col >= startCol && col < startCol + word.wordLength;
      } else {
        return col === startCol && row >= startRow && row < startRow + word.wordLength;
      }
    });
  };

  // Handle keyboard input
  const handleKeyDown = (e) => {
    if (!selectedCell || readonly) return;

    const { row, col } = selectedCell;
    
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      const newGrid = [...currentGrid];
      newGrid[row][col] = { ...newGrid[row][col], letter: '' };
      onGridChange(newGrid);
      
      // Move to previous cell
      if (e.key === 'Backspace') {
        moveToPreviousCell();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveSelection(-1, 0);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveSelection(1, 0);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveSelection(0, -1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveSelection(0, 1);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onDirectionChange(direction === 'across' ? 'down' : 'across');
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      const letter = e.key.toUpperCase();
      const newGrid = [...currentGrid];
      newGrid[row][col] = { ...newGrid[row][col], letter };
      onGridChange(newGrid);
      
      // Move to next cell in current word
      moveToNextCell();
    }
  };

  // Move selection
  const moveSelection = (deltaRow, deltaCol) => {
    if (!selectedCell) return;
    
    const newRow = Math.max(0, Math.min(puzzle.gridSize - 1, selectedCell.row + deltaRow));
    const newCol = Math.max(0, Math.min(puzzle.gridSize - 1, selectedCell.col + deltaCol));
    
    if (!currentGrid[newRow][newCol].isBlack) {
      handleCellClick(newRow, newCol);
    }
  };

  // Move to next cell in current word
  const moveToNextCell = () => {
    if (!selectedWord || !selectedCell) return;
    
    const { startRow, startCol, word } = selectedWord;
    const currentPos = direction === 'across' 
      ? selectedCell.col - startCol 
      : selectedCell.row - startRow;
    
    if (currentPos < word.wordLength - 1) {
      const nextRow = direction === 'across' ? selectedCell.row : selectedCell.row + 1;
      const nextCol = direction === 'across' ? selectedCell.col + 1 : selectedCell.col;
      
      if (nextRow < puzzle.gridSize && nextCol < puzzle.gridSize && 
          !currentGrid[nextRow][nextCol].isBlack) {
        handleCellClick(nextRow, nextCol);
      }
    }
  };

  // Move to previous cell in current word
  const moveToPreviousCell = () => {
    if (!selectedWord || !selectedCell) return;
    
    const { startRow, startCol } = selectedWord;
    const currentPos = direction === 'across' 
      ? selectedCell.col - startCol 
      : selectedCell.row - startRow;
    
    if (currentPos > 0) {
      const prevRow = direction === 'across' ? selectedCell.row : selectedCell.row - 1;
      const prevCol = direction === 'across' ? selectedCell.col - 1 : selectedCell.col;
      
      if (prevRow >= 0 && prevCol >= 0 && 
          !currentGrid[prevRow][prevCol].isBlack) {
        handleCellClick(prevRow, prevCol);
      }
    }
  };

  // Get highlighted cells for current word
  const getHighlightedCells = () => {
    if (!selectedWord) return new Set();
    
    const highlighted = new Set();
    const { startRow, startCol, direction: wordDir, word } = selectedWord;
    const normalizedDir = wordDir.toLowerCase();
    
    for (let i = 0; i < word.wordLength; i++) {
      const row = normalizedDir === 'down' ? startRow + i : startRow;
      const col = normalizedDir === 'across' ? startCol + i : startCol;
      highlighted.add(`${row}-${col}`);
    }
    
    return highlighted;
  };

  // Add keyboard event listener
  useEffect(() => {
    const handleKeyEvent = (e) => handleKeyDown(e);
    document.addEventListener('keydown', handleKeyEvent);
    return () => document.removeEventListener('keydown', handleKeyEvent);
  }, [selectedCell, selectedWord, direction, currentGrid, readonly]);

  if (!currentGrid.length) {
    return (
      <div className="flex items-center justify-center h-96 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
        <div className="text-white">Loading grid...</div>
      </div>
    );
  }

  const highlightedCells = getHighlightedCells();

  return (
    <div className="flex flex-col items-center">
      <div 
        ref={gridRef}
        className="inline-block bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
        tabIndex={0}
      >
        <div 
          className="grid gap-1"
          style={{ 
            gridTemplateColumns: `repeat(${puzzle.gridSize}, 1fr)`,
            maxWidth: '500px',
            aspectRatio: '1'
          }}
        >
          {currentGrid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const cellKey = `${rowIndex}-${colIndex}`;
              const isSelected = selectedCell && 
                selectedCell.row === rowIndex && selectedCell.col === colIndex;
              const isHighlighted = highlightedCells.has(cellKey);
              const hasClueNumber = cell.clueNumber !== null && cell.clueNumber !== undefined;
              
              return (
                <div
                  key={cellKey}
                  className={`
                    relative aspect-square border border-gray-400 cursor-pointer
                    transition-all duration-200 text-center font-bold text-sm
                    ${cell.isBlack 
                      ? 'bg-black' 
                      : isSelected 
                        ? 'bg-blue-500 text-white' 
                        : isHighlighted 
                          ? 'bg-blue-300/50 text-white' 
                          : 'bg-white text-black hover:bg-blue-100'
                    }
                    ${readonly ? 'cursor-default' : 'cursor-pointer'}
                  `}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  style={{
                    minHeight: '30px',
                    minWidth: '30px'
                  }}
                >
                  {!cell.isBlack && (
                    <>
                      {hasClueNumber && (
                        <div className="absolute top-0 left-0 text-xs font-bold leading-none p-0.5 text-black">
                          {cell.clueNumber}
                        </div>
                      )}
                      <div className="flex items-center justify-center h-full">
                        <span className="text-lg font-bold">
                          {cell.letter}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {selectedWord && (
        <div className="mt-4 text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <p className="text-white font-medium">
              {selectedWord.clueNumber} {direction === 'across' ? 'Across' : 'Down'}
            </p>
            <p className="text-white/80 text-sm mt-1">
              {selectedWord.clue.clueText}
            </p>
            <p className="text-white/60 text-xs mt-1">
              {selectedWord.word.wordLength} letters
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-center text-white/60 text-sm">
        <p>Click a cell to select • Arrow keys to move • Tab to change direction</p>
        <p>Type letters to fill • Backspace to delete</p>
      </div>
    </div>
  );
};

export default CrosswordGrid;
