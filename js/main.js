const pieceIcons = {
    'wK': 'assets/icons/wK.svg',
    'wQ': 'assets/icons/wQ.svg',
    'wR': 'assets/icons/wR.svg',
    'wB': 'assets/icons/wB.svg',
    'wN': 'assets/icons/wN.svg',
    'wP': 'assets/icons/wP.svg',
    'bK': 'assets/icons/bK.svg',
    'bQ': 'assets/icons/bQ.svg',
    'bR': 'assets/icons/bR.svg',
    'bB': 'assets/icons/bB.svg',
    'bN': 'assets/icons/bN.svg',
    'bP': 'assets/icons/bP.svg',
};

// Initial board setup (FEN-like)
const initialBoard = [
    ['bR','bN','bB','bQ','bK','bB','bN','bR'],
    ['bP','bP','bP','bP','bP','bP','bP','bP'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['wP','wP','wP','wP','wP','wP','wP','wP'],
    ['wR','wN','wB','wQ','wK','wB','wN','wR'],
];

let board = JSON.parse(JSON.stringify(initialBoard));
let selected = null;
let currentPlayer = 'w';
let gameStatus = 'active'; // active, check, checkmate, stalemate
let validMoves = [];
let capturedPieces = { w: [], b: [] };
let draggedPiece = null;

function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    if (!piece) return false;
    
    // Basic validation
    if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;
    const targetPiece = board[toRow][toCol];
    if (targetPiece && targetPiece[0] === piece[0]) return false;

    // Piece-specific validation
    switch (piece[1]) {
        case 'P': // Pawn
            const direction = piece[0] === 'w' ? -1 : 1;
            const startRow = piece[0] === 'w' ? 6 : 1;
            
            // Forward move
            if (fromCol === toCol && !targetPiece) {
                if (toRow === fromRow + direction) return true;
                if (fromRow === startRow && toRow === fromRow + 2 * direction && !board[fromRow + direction][fromCol]) return true;
            }
            
            // Capture
            if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction && targetPiece) return true;
            return false;

        case 'R': // Rook
            if (fromRow !== toRow && fromCol !== toCol) return false;
            return !isPathBlocked(fromRow, fromCol, toRow, toCol);

        case 'N': // Knight
            const rowDiff = Math.abs(toRow - fromRow);
            const colDiff = Math.abs(toCol - fromCol);
            return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);

        case 'B': // Bishop
            if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
            return !isPathBlocked(fromRow, fromCol, toRow, toCol);

        case 'Q': // Queen
            if (fromRow !== toRow && fromCol !== toCol && 
                Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
            return !isPathBlocked(fromRow, fromCol, toRow, toCol);

        case 'K': // King
            return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1;
    }
    return false;
}

function isPathBlocked(fromRow, fromCol, toRow, toCol) {
    const rowStep = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
    const colStep = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow || currentCol !== toCol) {
        if (board[currentRow][currentCol]) return true;
        currentRow += rowStep;
        currentCol += colStep;
    }
    return false;
}

function getValidMoves(row, col) {
    const moves = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (isValidMove(row, col, i, j)) {
                moves.push({row: i, col: j});
            }
        }
    }
    return moves;
}

function updateCapturedPieces() {
    const whiteContainer = document.getElementById('captured-white');
    const blackContainer = document.getElementById('captured-black');
    
    whiteContainer.innerHTML = '';
    blackContainer.innerHTML = '';
    
    capturedPieces.w.forEach(piece => {
        const img = document.createElement('img');
        img.src = pieceIcons[piece];
        whiteContainer.appendChild(img);
    });
    
    capturedPieces.b.forEach(piece => {
        const img = document.createElement('img');
        img.src = pieceIcons[piece];
        blackContainer.appendChild(img);
    });
}

function showPromotionModal(row, col) {
    const modal = document.getElementById('promotion-modal');
    const options = modal.querySelector('.promotion-options');
    options.innerHTML = '';
    
    const pieces = ['Q', 'R', 'B', 'N'];
    pieces.forEach(piece => {
        const img = document.createElement('img');
        img.src = pieceIcons[currentPlayer + piece];
        img.addEventListener('click', () => {
            board[row][col] = currentPlayer + piece;
            modal.classList.remove('show');
            renderBoard();
        });
        options.appendChild(img);
    });
    
    modal.classList.add('show');
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
    }
    
    updateCapturedPieces();
}

function renderBoard() {
    const boardDiv = document.getElementById('chessboard');
    boardDiv.innerHTML = '';
    
    // Update game status
    const statusDiv = document.getElementById('game-status');
    statusDiv.textContent = `Current Player: ${currentPlayer === 'w' ? 'White' : 'Black'}`;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;
            
            if (selected && selected.row === row && selected.col === col) {
                square.classList.add('selected');
            }
            
            if (selected && validMoves.some(move => move.row === row && move.col === col)) {
                square.classList.add('valid-move');
            }
            
            const piece = board[row][col];
            if (piece) {
                const img = document.createElement('img');
                img.src = pieceIcons[piece];
                img.classList.add('piece');
                img.draggable = true;
                
                // Drag and drop event listeners
                img.addEventListener('dragstart', (e) => {
                    if (piece[0] === currentPlayer) {
                        draggedPiece = { row, col };
                        img.classList.add('dragging');
                        e.dataTransfer.setData('text/plain', ''); // Required for Firefox
                    } else {
                        e.preventDefault();
                    }
                });
                
                img.addEventListener('dragend', () => {
                    img.classList.remove('dragging');
                    draggedPiece = null;
                });
                
                square.appendChild(img);
            }
            
            // Square drop event listeners
            square.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedPiece && isValidMove(draggedPiece.row, draggedPiece.col, row, col)) {
                    square.classList.add('valid-move');
                }
            });
            
            square.addEventListener('dragleave', () => {
                square.classList.remove('valid-move');
            });
            
            square.addEventListener('drop', (e) => {
                e.preventDefault();
                square.classList.remove('valid-move');
                
                if (draggedPiece && isValidMove(draggedPiece.row, draggedPiece.col, row, col)) {
                    handleMove(draggedPiece.row, draggedPiece.col, row, col);
                    renderBoard();
                }
            });
            
            boardDiv.appendChild(square);
        }
    }
}

function onSquareClick(e) {
    const row = parseInt(this.dataset.row);
    const col = parseInt(this.dataset.col);
    const piece = board[row][col];
    
    // If a piece is already selected
    if (selected) {
        // Check if clicking on the same piece (deselect)
        if (selected.row === row && selected.col === col) {
            selected = null;
            validMoves = [];
            renderBoard();
            return;
        }
        
        // Check if the move is valid
        if (validMoves.some(move => move.row === row && move.col === col)) {
            // Make the move
            board[row][col] = board[selected.row][selected.col];
            board[selected.row][selected.col] = null;
            currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
        }
        selected = null;
        validMoves = [];
        renderBoard();
    } else if (piece && piece[0] === currentPlayer) {
        // Select a new piece
        selected = { row, col };
        validMoves = getValidMoves(row, col);
        renderBoard();
    }
}

// Add reset button
const resetButton = document.createElement('button');
resetButton.textContent = 'Reset Game';
resetButton.addEventListener('click', () => {
    board = JSON.parse(JSON.stringify(initialBoard));
    selected = null;
    currentPlayer = 'w';
    validMoves = [];
    gameStatus = 'active';
    capturedPieces = { w: [], b: [] };
    renderBoard();
});
document.body.appendChild(resetButton);

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    renderBoard();
});