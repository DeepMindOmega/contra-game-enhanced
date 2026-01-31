// Basic game variables
let canvas, ctx;
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    gameRunning: false,
    paused: false,
    keys: {}
};

// Player properties
let player = {
    x: 100,
    y: 400, // Fixed position for testing
    width: 40,
    height: 60,
    speed: 5,
    health: 100
};

// Enemies array
let enemies = [];

// Initialize when page loads
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Get UI elements
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOver');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    
    // Button event listeners
    startButton.addEventListener('click', function() {
        startScreen.style.display = 'none';
        gameState.gameRunning = true;
        gameLoop();
    });
    
    restartButton.addEventListener('click', function() {
        gameOverScreen.style.display = 'none';
        resetGame();
    });
    
    // Show start screen initially
    startScreen.style.display = 'flex';
};

// Simple draw player function
function drawPlayer() {
    // Draw player body
    ctx.fillStyle = '#00FF00'; // Green
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw player head
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.fillRect(player.x + 10, player.y - 15, 20, 15);
}

// Simple update player
function updatePlayer() {
    if (gameState.keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (gameState.keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (gameState.keys['ArrowUp'] && player.y > 0) {
        player.y -= player.speed;
    }
    if (gameState.keys['ArrowDown'] && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
}

// Simple game loop
function gameLoop() {
    if (!gameState.gameRunning) return;
    
    // Clear canvas
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw player
    updatePlayer();
    drawPlayer();
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

// Handle keyboard input
document.addEventListener('keydown', function(e) {
    gameState.keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault(); // Prevent spacebar from scrolling
    }
});

document.addEventListener('keyup', function(e) {
    gameState.keys[e.key] = false;
});

// Reset game function
function resetGame() {
    player.x = 100;
    player.y = 400;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.gameRunning = true;
    gameLoop();
}