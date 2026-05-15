const SIZE = 8;
const EMPTY = null;
const BLACK = "black";
const WHITE = "white";
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

const boardEl = document.querySelector("#board");
const messageEl = document.querySelector("#message");
const toastEl = document.querySelector("#toast");
const turnLabelEl = document.querySelector("#turn-label");
const turnOrbEl = document.querySelector("#turn-orb");
const blackScoreEl = document.querySelector("#score-black");
const whiteScoreEl = document.querySelector("#score-white");
const blackCardEl = document.querySelector("#score-black-card");
const whiteCardEl = document.querySelector("#score-white-card");
const hintButton = document.querySelector("#hint-toggle");
const undoButton = document.querySelector("#undo");
const newGameButton = document.querySelector("#new-game");

let board = createInitialBoard();
let currentPlayer = BLACK;
let history = [];
let hintsEnabled = true;
let gameOver = false;

function createInitialBoard() {
  const nextBoard = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  nextBoard[3][3] = WHITE;
  nextBoard[3][4] = BLACK;
  nextBoard[4][3] = BLACK;
  nextBoard[4][4] = WHITE;
  return nextBoard;
}

function opponent(player) {
  return player === BLACK ? WHITE : BLACK;
}

function isInside(row, col) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function getFlips(row, col, player, sourceBoard = board) {
  if (sourceBoard[row][col] !== EMPTY) return [];

  const rival = opponent(player);
  const flips = [];

  for (const [dr, dc] of DIRECTIONS) {
    const line = [];
    let r = row + dr;
    let c = col + dc;

    while (isInside(r, c) && sourceBoard[r][c] === rival) {
      line.push([r, c]);
      r += dr;
      c += dc;
    }

    if (line.length > 0 && isInside(r, c) && sourceBoard[r][c] === player) {
      flips.push(...line);
    }
  }

  return flips;
}

function getValidMoves(player, sourceBoard = board) {
  const moves = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const flips = getFlips(row, col, player, sourceBoard);
      if (flips.length) moves.push({ row, col, flips });
    }
  }
  return moves;
}

function countDiscs(sourceBoard = board) {
  return sourceBoard.flat().reduce(
    (score, cell) => {
      if (cell === BLACK) score.black += 1;
      if (cell === WHITE) score.white += 1;
      return score;
    },
    { black: 0, white: 0 },
  );
}

function playerName(player) {
  return player === BLACK ? "Black" : "White";
}

function render(animatedFlips = []) {
  const validMoves = getValidMoves(currentPlayer);
  const validKeys = new Set(validMoves.map((move) => `${move.row}-${move.col}`));
  const flipKeys = new Set(animatedFlips.map(([row, col]) => `${row}-${col}`));

  boardEl.innerHTML = "";
  board.forEach((rowCells, row) => {
    rowCells.forEach((cell, col) => {
      const cellButton = document.createElement("button");
      cellButton.className = "cell";
      cellButton.type = "button";
      cellButton.setAttribute("role", "gridcell");
      cellButton.dataset.row = row;
      cellButton.dataset.col = col;
      cellButton.setAttribute("aria-label", `${row + 1}行 ${col + 1}列${cell ? ` ${playerName(cell)}` : " 空き"}`);

      if (hintsEnabled && validKeys.has(`${row}-${col}`) && !gameOver) {
        cellButton.classList.add("valid");
      }

      if (cell) {
        const disc = document.createElement("span");
        disc.className = `disc ${cell}`;
        if (flipKeys.has(`${row}-${col}`)) disc.classList.add("flip");
        cellButton.append(disc);
      }

      cellButton.addEventListener("click", () => playMove(row, col));
      boardEl.append(cellButton);
    });
  });

  updateStatus();
}

function updateStatus() {
  const score = countDiscs();
  blackScoreEl.textContent = score.black;
  whiteScoreEl.textContent = score.white;
  turnLabelEl.textContent = playerName(currentPlayer);
  turnOrbEl.className = `turn-orb ${currentPlayer}`;
  blackCardEl.classList.toggle("active", currentPlayer === BLACK && !gameOver);
  whiteCardEl.classList.toggle("active", currentPlayer === WHITE && !gameOver);
  undoButton.disabled = history.length === 0;

  if (gameOver) {
    const result = score.black === score.white
      ? "引き分けです。"
      : `${score.black > score.white ? "Black" : "White"} の勝利！`;
    messageEl.textContent = `対局終了。Black ${score.black} - White ${score.white}。${result}`;
    return;
  }

  const moves = getValidMoves(currentPlayer);
  messageEl.textContent = `${playerName(currentPlayer)} の番です。${moves.length}手の候補があります。`;
}

function playMove(row, col) {
  if (gameOver) return;
  const flips = getFlips(row, col, currentPlayer);
  if (!flips.length) {
    showToast("そこには置けません");
    return;
  }

  history.push({ board: board.map((line) => [...line]), currentPlayer });
  board[row][col] = currentPlayer;
  flips.forEach(([flipRow, flipCol]) => {
    board[flipRow][flipCol] = currentPlayer;
  });

  currentPlayer = opponent(currentPlayer);
  const nextMoves = getValidMoves(currentPlayer);
  const otherMoves = getValidMoves(opponent(currentPlayer));

  if (!nextMoves.length && otherMoves.length) {
    showToast(`${playerName(currentPlayer)} はパス`);
    currentPlayer = opponent(currentPlayer);
  } else if (!nextMoves.length && !otherMoves.length) {
    gameOver = true;
  }

  if (navigator.vibrate) navigator.vibrate([12, 24, 12]);
  render(flips);
}

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toastEl.classList.remove("show"), 1400);
}

function resetGame() {
  board = createInitialBoard();
  currentPlayer = BLACK;
  history = [];
  gameOver = false;
  render();
  showToast("新しい対局を開始しました");
}

hintButton.addEventListener("click", () => {
  hintsEnabled = !hintsEnabled;
  hintButton.textContent = `ヒント ${hintsEnabled ? "ON" : "OFF"}`;
  hintButton.setAttribute("aria-pressed", String(hintsEnabled));
  render();
});

undoButton.addEventListener("click", () => {
  const previous = history.pop();
  if (!previous) return;
  board = previous.board;
  currentPlayer = previous.currentPlayer;
  gameOver = false;
  render();
  showToast("1手戻しました");
});

newGameButton.addEventListener("click", resetGame);
render();
