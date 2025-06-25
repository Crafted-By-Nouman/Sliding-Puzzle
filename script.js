// Game State
const gameState = {
  username: "",
  gridSize: 3,
  tiles: [],
  emptyIndex: 0,
  moves: 0,
  timer: 0,
  timerInterval: null,
  isPaused: false,
  highScores: {},
  isGameActive: false,
};

// DOM Elements
const elements = {
  screens: {
    home: document.getElementById("home-screen"),
    setup: document.getElementById("setup-screen"),
    game: document.getElementById("game-screen"),
    gameOver: document.getElementById("game-over-screen"),
  },
  modals: {
    username: document.getElementById("username-modal"),
    pause: document.getElementById("pause-modal"),
    share: document.getElementById("share-modal"),
  },
  buttons: {
    startGame: document.getElementById("start-game"),
    resetScore: document.getElementById("reset-score"),
    changeUsername: document.getElementById("change-username"),
    backToHome: document.getElementById("back-to-home"),
    difficultyBtns: document.querySelectorAll(".difficulty-btn"),
    leaveGame: document.getElementById("leave-game"),
    restartGame: document.getElementById("restart-game"),
    playAgain: document.getElementById("play-again"),
    shareResult: document.getElementById("share-result"),
    returnHome: document.getElementById("return-home"),
    saveUsername: document.getElementById("save-username"),
    resumeGame: document.getElementById("resume-game"),
    quitGame: document.getElementById("quit-game"),
    copyLink: document.getElementById("copy-link"),
    shareTwitter: document.getElementById("share-twitter"),
    shareFacebook: document.getElementById("share-facebook"),
    closeShare: document.getElementById("close-share"),
  },
  inputs: {
    username: document.getElementById("username-input"),
  },
  displays: {
    username: document.getElementById("display-username"),
    highScore: document.getElementById("high-score"),
    timer: document.getElementById("timer"),
    moves: document.getElementById("moves"),
    resultUsername: document.getElementById("result-username"),
    resultMoves: document.getElementById("result-moves"),
    resultTime: document.getElementById("result-time"),
    resultDifficulty: document.getElementById("result-difficulty"),
    pauseMoves: document.getElementById("pause-moves"),
    pauseTime: document.getElementById("pause-time"),
    resultTitle: document.getElementById("result-title"),
    highScoreBadge: document.getElementById("high-score-badge"),
  },
  containers: {
    puzzle: document.getElementById("puzzle-container"),
    confetti: document.getElementById("confetti-canvas"),
  },
};

// Initialize the game
function init() {
  loadUserData();
  setupEventListeners();
  checkFirstVisit();
}

// Load user data from localStorage
function loadUserData() {
  gameState.username =
    localStorage.getItem("slidingPuzzleUsername") || "Player";
  elements.displays.username.textContent = gameState.username;
  elements.inputs.username.value = gameState.username;

  const highScores = localStorage.getItem("slidingPuzzleHighScores");
  gameState.highScores = highScores ? JSON.parse(highScores) : {};

  updateHighScoreDisplay();
}

// Save user data to localStorage
function saveUserData() {
  localStorage.setItem("slidingPuzzleUsername", gameState.username);
  localStorage.setItem(
    "slidingPuzzleHighScores",
    JSON.stringify(gameState.highScores)
  );
}

// Update high score display
function updateHighScoreDisplay() {
  const highScore = gameState.highScores[gameState.gridSize] || {
    moves: 0,
    time: 0,
  };
  const timeStr = formatTime(highScore.time);
  elements.displays.highScore.textContent = `${highScore.moves} moves (${timeStr})`;
}

// Check if it's user's first visit
function checkFirstVisit() {
  const hasVisited = localStorage.getItem("slidingPuzzleHasVisited");
  if (!hasVisited) {
    localStorage.setItem("slidingPuzzleHasVisited", "true");
    showModal(elements.modals.username);
  }
}

// Setup all event listeners
function setupEventListeners() {
  // Navigation buttons
  elements.buttons.startGame.addEventListener("click", () =>
    switchScreen("setup")
  );
  elements.buttons.backToHome.addEventListener("click", () =>
    switchScreen("home")
  );
  elements.buttons.leaveGame.addEventListener("click", () =>
    confirmLeaveGame()
  );
  elements.buttons.returnHome.addEventListener("click", () =>
    switchScreen("home")
  );
  elements.buttons.playAgain.addEventListener("click", () =>
    switchScreen("setup")
  );

  // Game control buttons
  elements.buttons.restartGame.addEventListener("click", confirmRestartGame);
  elements.buttons.pauseBtn = document.getElementById("pause-btn");
  elements.buttons.pauseBtn.addEventListener("click", togglePauseGame);

  // User management buttons
  elements.buttons.resetScore.addEventListener("click", confirmResetHighScore);
  elements.buttons.changeUsername.addEventListener("click", () =>
    showModal(elements.modals.username)
  );
  elements.buttons.saveUsername.addEventListener("click", saveUsername);

  // Difficulty selection
  elements.buttons.difficultyBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      gameState.gridSize = parseInt(btn.dataset.difficulty);
      startGame();
    });
  });

  // Pause modal buttons
  elements.buttons.resumeGame.addEventListener("click", togglePauseGame);
  elements.buttons.quitGame.addEventListener("click", () => {
    togglePauseGame();
    switchScreen("home");
  });

  // Share modal buttons
  elements.buttons.shareResult.addEventListener("click", () =>
    showModal(elements.modals.share)
  );
  elements.buttons.copyLink.addEventListener("click", copyResultLink);
  elements.buttons.shareTwitter.addEventListener("click", shareOnTwitter);
  elements.buttons.shareFacebook.addEventListener("click", shareOnFacebook);
  elements.buttons.closeShare.addEventListener("click", () =>
    hideModal(elements.modals.share)
  );

  // Window blur event (pause game when tab loses focus)
  window.addEventListener("blur", () => {
    if (gameState.isGameActive && !gameState.isPaused) {
      togglePauseGame();
    }
  });
}

// Switch between screens
function switchScreen(screenName) {
  // Hide all screens
  Object.values(elements.screens).forEach((screen) => {
    screen.classList.remove("active");
  });

  // Show the requested screen
  elements.screens[screenName].classList.add("active");

  // Additional setup for specific screens
  if (screenName === "game") {
    resizePuzzleContainer();
  } else if (screenName === "home") {
    gameState.isGameActive = false;
    clearInterval(gameState.timerInterval);
  }
}

// Show modal
function showModal(modal) {
  modal.classList.add("active");
}

// Hide modal
function hideModal(modal) {
  modal.classList.remove("active");
}

// Save username from modal
function saveUsername() {
  const username = elements.inputs.username.value.trim();
  if (username) {
    gameState.username = username;
    elements.displays.username.textContent = username;
    saveUserData();
    hideModal(elements.modals.username);
  }
}

// Confirm reset high score
function confirmResetHighScore() {
  if (confirm("Are you sure you want to reset all high scores?")) {
    gameState.highScores = {};
    saveUserData();
    updateHighScoreDisplay();
  }
}

// Confirm leave game
function confirmLeaveGame() {
  if (
    confirm(
      "Are you sure you want to leave the current game? Your progress will be lost."
    )
  ) {
    switchScreen("home");
  }
}

// Confirm restart game
function confirmRestartGame() {
  if (confirm("Are you sure you want to restart the current game?")) {
    startGame();
  }
}

// Start a new game
function startGame() {
  gameState.moves = 0;
  gameState.timer = 0;
  gameState.isPaused = false;
  gameState.isGameActive = true;

  elements.displays.moves.textContent = gameState.moves;
  elements.displays.timer.textContent = formatTime(gameState.timer);

  switchScreen("game");
  generatePuzzle();

  // Show "Get Ready" animation
  const getReady = document.createElement("div");
  getReady.className = "get-ready";
  getReady.textContent = "GET READY!";
  elements.containers.puzzle.appendChild(getReady);

  // Remove "Get Ready" after animation
  setTimeout(() => {
    getReady.remove();
    startTimer();
  }, 3000);
}

// Generate the puzzle
function generatePuzzle() {
  elements.containers.puzzle.innerHTML = "";
  elements.containers.puzzle.style.gridTemplateColumns = `repeat(${gameState.gridSize}, 1fr)`;

  const tileCount = gameState.gridSize * gameState.gridSize - 1;
  gameState.tiles = Array.from({ length: tileCount }, (_, i) => i + 1);

  // Shuffle tiles until we get a solvable puzzle
  do {
    shuffleArray(gameState.tiles);
  } while (!isSolvable(gameState.tiles, gameState.gridSize));

  // Add empty tile
  gameState.tiles.push(0);
  gameState.emptyIndex = gameState.tiles.length - 1;

  // Create puzzle tiles
  gameState.tiles.forEach((tile, index) => {
    const tileElement = document.createElement("div");
    tileElement.className = tile === 0 ? "puzzle-tile empty" : "puzzle-tile";
    tileElement.textContent = tile === 0 ? "" : tile;
    tileElement.dataset.index = index;
    tileElement.dataset.value = tile;

    // Add click event
    tileElement.addEventListener("click", () => handleTileClick(index));

    // Add animation
    tileElement.style.animation = `tileAppear ${0.5 + index * 0.05}s ease-out`;

    elements.containers.puzzle.appendChild(tileElement);
  });
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Check if puzzle is solvable
function isSolvable(tiles, gridSize) {
  let inversions = 0;
  const tileCount = tiles.length;

  for (let i = 0; i < tileCount - 1; i++) {
    for (let j = i + 1; j < tileCount; j++) {
      if (tiles[i] > tiles[j] && tiles[i] !== 0 && tiles[j] !== 0) {
        inversions++;
      }
    }
  }

  // For odd grid sizes, the number of inversions must be even
  if (gridSize % 2 === 1) {
    return inversions % 2 === 0;
  }
  // For even grid sizes, the row of the blank from bottom plus inversions must be odd
  else {
    const blankRow = Math.floor((tileCount - 1) / gridSize);
    return (blankRow + inversions) % 2 === 1;
  }
}

// Handle tile click
function handleTileClick(clickedIndex) {
  if (gameState.isPaused || !gameState.isGameActive) return;

  const clickedRow = Math.floor(clickedIndex / gameState.gridSize);
  const clickedCol = clickedIndex % gameState.gridSize;
  const emptyRow = Math.floor(gameState.emptyIndex / gameState.gridSize);
  const emptyCol = gameState.emptyIndex % gameState.gridSize;

  // Check if clicked tile is adjacent to empty space
  const isAdjacent =
    (Math.abs(clickedRow - emptyRow) === 1 && clickedCol === emptyCol) ||
    (Math.abs(clickedCol - emptyCol) === 1 && clickedRow === emptyRow);

  if (isAdjacent) {
    // Swap tiles
    swapTiles(clickedIndex, gameState.emptyIndex);
    gameState.moves++;
    elements.displays.moves.textContent = gameState.moves;

    // Check if puzzle is solved
    if (isPuzzleSolved()) {
      endGame();
    }
  }
}

// Swap two tiles
function swapTiles(index1, index2) {
  // Update game state
  [gameState.tiles[index1], gameState.tiles[index2]] = [
    gameState.tiles[index2],
    gameState.tiles[index1],
  ];
  gameState.emptyIndex = gameState.tiles[index1] === 0 ? index1 : index2;

  // Update DOM
  const tileElements = document.querySelectorAll(".puzzle-tile");
  tileElements[index1].textContent =
    gameState.tiles[index1] === 0 ? "" : gameState.tiles[index1];
  tileElements[index2].textContent =
    gameState.tiles[index2] === 0 ? "" : gameState.tiles[index2];

  // Update classes
  tileElements[index1].className =
    gameState.tiles[index1] === 0 ? "puzzle-tile empty" : "puzzle-tile";
  tileElements[index2].className =
    gameState.tiles[index2] === 0 ? "puzzle-tile empty" : "puzzle-tile";

  // Add animation
  tileElements[index1].style.animation = "tileSlide 0.3s ease-out";
  tileElements[index2].style.animation = "tileSlide 0.3s ease-out";

  // Remove animation after it completes
  setTimeout(() => {
    tileElements[index1].style.animation = "";
    tileElements[index2].style.animation = "";
  }, 300);
}

// Check if puzzle is solved
function isPuzzleSolved() {
  for (let i = 0; i < gameState.tiles.length - 1; i++) {
    if (gameState.tiles[i] !== i + 1) {
      return false;
    }
  }
  return gameState.tiles[gameState.tiles.length - 1] === 0;
}

// Start game timer
function startTimer() {
  clearInterval(gameState.timerInterval);
  gameState.timerInterval = setInterval(() => {
    if (!gameState.isPaused && gameState.isGameActive) {
      gameState.timer++;
      elements.displays.timer.textContent = formatTime(gameState.timer);
    }
  }, 1000);
}

// Format time as MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

// Toggle pause game
function togglePauseGame() {
  gameState.isPaused = !gameState.isPaused;

  if (gameState.isPaused) {
    elements.buttons.pauseBtn.textContent = "Resume";
    showModal(elements.modals.pause);
    elements.displays.pauseMoves.textContent = gameState.moves;
    elements.displays.pauseTime.textContent = formatTime(gameState.timer);
  } else {
    elements.buttons.pauseBtn.textContent = "Pause";
    hideModal(elements.modals.pause);
  }
}

// End game
function endGame() {
  gameState.isGameActive = false;
  clearInterval(gameState.timerInterval);

  // Update game over screen
  elements.displays.resultUsername.textContent = gameState.username;
  elements.displays.resultMoves.textContent = gameState.moves;
  elements.displays.resultTime.textContent = formatTime(gameState.timer);

  // Set difficulty text
  let difficultyText;
  switch (gameState.gridSize) {
    case 3:
      difficultyText = "Easy (3×3)";
      break;
    case 4:
      difficultyText = "Medium (4×4)";
      break;
    case 5:
      difficultyText = "Hard (5×5)";
      break;
    default:
      difficultyText = "Custom";
  }
  elements.displays.resultDifficulty.textContent = difficultyText;

  // Check for high score
  const currentHighScore = gameState.highScores[gameState.gridSize] || {
    moves: Infinity,
    time: Infinity,
  };
  const isNewHighScore =
    gameState.moves < currentHighScore.moves ||
    (gameState.moves === currentHighScore.moves &&
      gameState.timer < currentHighScore.time);

  if (isNewHighScore) {
    gameState.highScores[gameState.gridSize] = {
      moves: gameState.moves,
      time: gameState.timer,
    };
    saveUserData();
    elements.displays.highScoreBadge.classList.remove("hidden");

    // Set motivational message
    const messages = [
      "Puzzle Master!",
      "Incredible!",
      "That Was Legendary!",
      "You're a Genius!",
      "Flawless Victory!",
    ];
    elements.displays.resultTitle.textContent =
      messages[Math.floor(Math.random() * messages.length)];
  } else {
    elements.displays.highScoreBadge.classList.add("hidden");
    elements.displays.resultTitle.textContent = "Puzzle Solved!";
  }

  // Create confetti effect
  createConfetti();

  // Switch to game over screen
  switchScreen("gameOver");
}

// Create confetti effect
function createConfetti() {
  const canvas = document.createElement("canvas");
  canvas.id = "confetti-canvas";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "1000";
  document.body.appendChild(canvas);

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const ctx = canvas.getContext("2d");
  const particles = [];
  const colors = ["#6e45e2", "#88d3ce", "#ff7e5f", "#ffcc00", "#ffffff"];

  // Create particles
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 3 + 2,
      angle: Math.random() * Math.PI * 2,
      rotation: Math.random() * 0.2 - 0.1,
      rotationSpeed: Math.random() * 0.01 - 0.005,
    });
  }

  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

      ctx.restore();

      // Update position
      p.y += p.speed;
      p.angle += p.rotationSpeed;

      // Reset particles that fall off screen
      if (p.y > canvas.height) {
        p.y = -p.size;
        p.x = Math.random() * canvas.width;
      }
    }

    requestAnimationFrame(animate);
  }

  animate();

  // Remove canvas after animation
  setTimeout(() => {
    document.body.removeChild(canvas);
  }, 5000);
}

// Copy result link to clipboard
function copyResultLink() {
  const text = `${gameState.username} solved a ${gameState.gridSize}x${
    gameState.gridSize
  } sliding puzzle in ${gameState.moves} moves and ${formatTime(
    gameState.timer
  )}!`;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert("Result copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
    });
}

// Share on Twitter
function shareOnTwitter() {
  const text = `${gameState.username} solved a ${gameState.gridSize}x${
    gameState.gridSize
  } sliding puzzle in ${gameState.moves} moves and ${formatTime(
    gameState.timer
  )}!`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text
  )}`;
  window.open(url, "_blank");
}

// Share on Facebook
function shareOnFacebook() {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    window.location.href
  )}`;
  window.open(url, "_blank");
}

// Resize puzzle container to maintain square aspect ratio
function resizePuzzleContainer() {
  const container = elements.containers.puzzle;
  const width = container.offsetWidth;
  container.style.height = `${width}px`;
}

// Initialize the game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  init();

  // Handle window resize
  window.addEventListener("resize", () => {
    if (elements.screens.game.classList.contains("active")) {
      resizePuzzleContainer();
    }
  });
});

// Add CSS animations dynamically
const style = document.createElement("style");
style.textContent = `
    @keyframes tileAppear {
        0% { transform: scale(0) rotate(180deg); opacity: 0; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    
    @keyframes tileSlide {
        0% { transform: scale(1); }
        50% { transform: scale(0.9); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);
