document.addEventListener('DOMContentLoaded', () => {
    const gridElement = document.getElementById('sudoku-grid');
    const difficultySelect = document.getElementById('difficulty-select');
    const newGameBtn = document.getElementById('btn-new-game');
    const checkBtn = document.getElementById('btn-check');
    const solveBtn = document.getElementById('btn-solve'); // Debug/Give up
    const eraseBtn = document.getElementById('btn-erase');
    const numBtns = document.querySelectorAll('.num-btn');
    const timerElement = document.getElementById('timer');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('btn-modal-close');

    let solution = [];
    let initialBoard = [];
    let currentBoard = [];
    let selectedCell = null;
    let timerInterval;
    let secondsElapsed = 0;
    let isGameActive = false;

    // --- Game Logic ---

    function startGame() {
        const difficulty = difficultySelect.value;
        generateBoard(difficulty);
        renderGrid();
        resetTimer();
        startTimer();
        isGameActive = true;
        modalOverlay.classList.add('hidden');
    }

    function generateBoard(difficulty) {
        // 1. Create a full valid 9x9 grid
        solution = Array.from({ length: 9 }, () => Array(9).fill(0));
        fillDiagonal();
        solveSudoku(solution);

        // 2. Remove numbers to create the puzzle
        initialBoard = JSON.parse(JSON.stringify(solution));

        let attempts = 5; // Default for easy
        if (difficulty === 'easy') attempts = 30;
        if (difficulty === 'medium') attempts = 45;
        if (difficulty === 'hard') attempts = 55;

        removeDigits(attempts);

        // Copy to current board state
        currentBoard = JSON.parse(JSON.stringify(initialBoard));
    }

    function fillDiagonal() {
        for (let i = 0; i < 9; i = i + 3) {
            fillBox(i, i);
        }
    }

    function fillBox(row, col) {
        let num;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                do {
                    num = Math.floor(Math.random() * 9) + 1;
                } while (!isSafeInBox(row, col, num));
                solution[row + i][col + j] = num;
            }
        }
    }

    function isSafeInBox(rowStart, colStart, num) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (solution[rowStart + i][colStart + j] === num) {
                    return false;
                }
            }
        }
        return true;
    }

    function isSafe(board, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }
        // Check col
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }
        // Check box
        let startRow = row - row % 3;
        let startCol = col - col % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] === num) return false;
            }
        }
        return true;
    }

    function solveSudoku(board) {
        let row = -1;
        let col = -1;
        let isEmpty = true;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) {
                    row = i;
                    col = j;
                    isEmpty = false;
                    break;
                }
            }
            if (!isEmpty) break;
        }

        if (isEmpty) return true;

        for (let num = 1; num <= 9; num++) {
            if (isSafe(board, row, col, num)) {
                board[row][col] = num;
                if (solveSudoku(board)) return true;
                board[row][col] = 0;
            }
        }
        return false;
    }

    function removeDigits(count) {
        while (count > 0) {
            let cellId = Math.floor(Math.random() * 81);
            let i = Math.floor(cellId / 9);
            let j = cellId % 9;
            if (initialBoard[i][j] !== 0) {
                initialBoard[i][j] = 0;
                count--;
            }
        }
    }

    // --- UI Rendering ---

    function renderGrid() {
        gridElement.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;

                // Add thick borders for 3x3 grids
                if ((j + 1) % 3 === 0 && j < 8) cell.classList.add('border-right-thick');
                if ((i + 1) % 3 === 0 && i < 8) cell.classList.add('border-bottom-thick');

                if (initialBoard[i][j] !== 0) {
                    cell.textContent = initialBoard[i][j];
                    cell.classList.add('fixed');
                } else {
                    cell.classList.add('user-input');
                }

                cell.addEventListener('click', () => selectCell(cell));
                gridElement.appendChild(cell);
            }
        }
    }

    function selectCell(cell) {
        if (!isGameActive) return;

        // Deselect previous
        if (selectedCell) {
            selectedCell.classList.remove('selected');
        }

        // Clear highlights
        document.querySelectorAll('.cell').forEach(c => {
            c.classList.remove('related', 'highlight-num');
        });

        selectedCell = cell;
        selectedCell.classList.add('selected');

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const val = currentBoard[row][col];

        // Highlight related (row, col, box)
        highlightRelated(row, col);

        // Highlight same numbers
        if (val !== 0) {
            highlightSameNumber(val);
        }
    }

    function highlightRelated(row, col) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);

            const isRow = r === row;
            const isCol = c === col;
            const isBox = Math.floor(r / 3) === Math.floor(row / 3) &&
                Math.floor(c / 3) === Math.floor(col / 3);

            if (isRow || isCol || isBox) {
                cell.classList.add('related');
            }
        });
    }

    function highlightSameNumber(num) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            if (currentBoard[r][c] === num) {
                cell.classList.add('highlight-num');
            }
        });
    }

    function updateCell(num) {
        if (!selectedCell || !isGameActive) return;

        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);

        // Cannot edit fixed cells
        if (initialBoard[row][col] !== 0) return;

        currentBoard[row][col] = num;
        selectedCell.textContent = num === 0 ? '' : num;

        // Clear error class if it was there
        selectedCell.classList.remove('error');

        // Re-highlight to show the new number matches
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('highlight-num'));
        if (num !== 0) highlightSameNumber(num);

        checkWinCondition();
    }

    // --- Input Handling ---

    document.addEventListener('keydown', (e) => {
        if (!isGameActive) return;

        const key = e.key;
        if (key >= '1' && key <= '9') {
            updateCell(parseInt(key));
        } else if (key === 'Backspace' || key === 'Delete') {
            updateCell(0);
        } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            moveSelection(key);
        }
    });

    function moveSelection(key) {
        if (!selectedCell) {
            // Select first editable cell if none selected
            const first = document.querySelector('.cell');
            if (first) selectCell(first);
            return;
        }

        let row = parseInt(selectedCell.dataset.row);
        let col = parseInt(selectedCell.dataset.col);

        if (key === 'ArrowUp') row = Math.max(0, row - 1);
        if (key === 'ArrowDown') row = Math.min(8, row + 1);
        if (key === 'ArrowLeft') col = Math.max(0, col - 1);
        if (key === 'ArrowRight') col = Math.min(8, col + 1);

        const nextCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (nextCell) selectCell(nextCell);
    }

    numBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const num = parseInt(btn.dataset.num);
            updateCell(num);
        });
    });

    eraseBtn.addEventListener('click', () => updateCell(0));

    // --- Controls ---

    newGameBtn.addEventListener('click', startGame);

    checkBtn.addEventListener('click', () => {
        if (!isGameActive) return;

        let hasErrors = false;
        const cells = document.querySelectorAll('.cell');

        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            const val = currentBoard[r][c];

            if (val !== 0 && val !== solution[r][c]) {
                cell.classList.add('error');
                hasErrors = true;
            } else {
                cell.classList.remove('error');
            }
        });

        if (!hasErrors) {
            // Maybe show a subtle success toast? For now just console or nothing
        }
    });

    solveBtn.addEventListener('click', () => {
        if (!confirm('Are you sure you want to give up?')) return;

        currentBoard = JSON.parse(JSON.stringify(solution));
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            cell.textContent = solution[r][c];
            cell.classList.remove('error');
        });
        stopTimer();
        isGameActive = false;
    });

    modalCloseBtn.addEventListener('click', startGame);

    // --- Timer ---

    function startTimer() {
        stopTimer();
        timerInterval = setInterval(() => {
            secondsElapsed++;
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function resetTimer() {
        stopTimer();
        secondsElapsed = 0;
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
        const secs = (secondsElapsed % 60).toString().padStart(2, '0');
        timerElement.textContent = `${mins}:${secs}`;
    }

    function checkWinCondition() {
        // Check if board is full
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (currentBoard[i][j] === 0) return;
            }
        }

        // Check if correct
        let isCorrect = true;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (currentBoard[i][j] !== solution[i][j]) {
                    isCorrect = false;
                    break;
                }
            }
        }

        if (isCorrect) {
            stopTimer();
            isGameActive = false;
            showGameOver();
        }
    }

    function showGameOver() {
        modalTitle.textContent = 'Puzzle Solved!';
        modalMessage.textContent = `You solved the ${difficultySelect.value} puzzle in ${timerElement.textContent}!`;
        modalOverlay.classList.remove('hidden');
    }

    // Start initial game
    startGame();
});
