function isKingInCheck(color) {
    // Find the king's position
    let kingRow = -1;
    let kingCol = -1;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === color + 'K') {
                kingRow = row;
                kingCol = col;
                break;
            }
        }
        if (kingRow !== -1) break;
    }

    // Check if any opponent's piece can capture the king
    const opponentColor = color === 'w' ? 'b' : 'w';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece[0] === opponentColor) {
                if (isValidMove(row, col, kingRow, kingCol)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function hasValidMoves(color) {
    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            const piece = board[fromRow][fromCol];
            if (piece && piece[0] === color) {
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        if (isValidMove(fromRow, fromCol, toRow, toCol)) {
                            // Try the move
                            const originalPiece = board[toRow][toCol];
                            board[toRow][toCol] = piece;
                            board[fromRow][fromCol] = null;
                            
                            // Check if the move gets the king out of check
                            const stillInCheck = isKingInCheck(color);
                            
                            // Undo the move
                            board[fromRow][fromCol] = piece;
                            board[toRow][toCol] = originalPiece;
                            
                            if (!stillInCheck) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}

function checkGameOver() {
    const inCheck = isKingInCheck(currentPlayer);
    const hasMoves = hasValidMoves(currentPlayer);
    
    if (inCheck && !hasMoves) {
        gameStatus = 'checkmate';
        return true;
    } else if (!inCheck && !hasMoves) {
        gameStatus = 'stalemate';
        return true;
    }
    return false;
}

function handleMove(fromRow, fromCol, toRow, toCol) {
    const targetPiece = board[toRow][toCol];
    if (targetPiece) {
        capturedPieces[targetPiece[0]].push(targetPiece);
    }
    
    const movingPiece = board[fromRow][fromCol];
    board[toRow][toCol] = movingPiece;
    board[fromRow][fromCol] = null;
    
    // Check for pawn promotion
    if (movingPiece[1] === 'P' && (toRow === 0 || toRow === 7)) {
        showPromotionModal(toRow, toCol);
    } else {
        currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
        if (checkGameOver()) {
            showGameOverModal();
        }
    }
    
    updateCapturedPieces();
}

function showGameOverModal() {
    const modal = document.getElementById('promotion-modal');
    const options = modal.querySelector('.promotion-options');
    const title = modal.querySelector('h3');
    
    title.textContent = gameStatus === 'checkmate' 
        ? `Checkmate! ${currentPlayer === 'w' ? 'Black' : 'White'} wins!`
        : 'Stalemate! The game is a draw.';
    
    options.innerHTML = '';
    const resetButton = document.createElement('button');
    resetButton.textContent = 'New Game';
    resetButton.addEventListener('click', () => {
        modal.classList.remove('show');
        board = JSON.parse(JSON.stringify(initialBoard));
        selected = null;
        currentPlayer = 'w';
        validMoves = [];
        gameStatus = 'active';
        capturedPieces = { w: [], b: [] };
        renderBoard();
    });
    options.appendChild(resetButton);
    
    modal.classList.add('show');
}

function renderBoard() {
    const boardDiv = document.getElementById('chessboard');
    boardDiv.innerHTML = '';
    
    // Update game status
    const statusDiv = document.getElementById('game-status');
    if (gameStatus === 'active') {
        statusDiv.textContent = `Current Player: ${currentPlayer === 'w' ? 'White' : 'Black'}`;
        if (isKingInCheck(currentPlayer)) {
            statusDiv.textContent += ' (In Check)';
        }
    } else {
        statusDiv.textContent = gameStatus === 'checkmate'
            ? `Checkmate! ${currentPlayer === 'w' ? 'Black' : 'White'} wins!`
            : 'Stalemate! The game is a draw.';
    }
    
    // ... rest of the renderBoard function ...
}

// ... rest of the code ... 