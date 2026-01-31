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

// Bullets array
let bullets = [];
const bulletSpeed = 10;
let bulletCooldown = 15; // Frames between shots
let bulletTimer = 0;

// Enemies array
let enemies = [];
let enemySpawnRate = 90; // Frames between enemy spawns
let enemySpawnTimer = 0;

// Initialize when page loads
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Get UI elements
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOver');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    const scoreValue = document.getElementById('scoreValue');
    const livesValue = document.getElementById('livesValue');
    const levelValue = document.getElementById('levelValue');
    const finalScore = document.getElementById('finalScore');
    
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

// Draw player function
function drawPlayer() {
    // Draw player body with gradient
    const gradient = ctx.createLinearGradient(
        player.x, 
        player.y, 
        player.x, 
        player.y + player.height
    );
    gradient.addColorStop(0, '#00FF00');
    gradient.addColorStop(1, '#00AA00');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw player head
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.fillRect(player.x + 10, player.y - 15, 20, 15);
    
    // Draw player gun
    ctx.fillStyle = '#AAAAAA';
    ctx.fillRect(player.x + player.width - 5, player.y + 20, 15, 8);
    
    // Draw health bar
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(player.x, player.y - 25, player.width, 5);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(player.x, player.y - 25, (player.width * player.health) / 100, 5);
}

// Draw a bullet
function drawBullet(bullet) {
    ctx.fillStyle = '#FFFF00'; // Yellow
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
}

// Draw an enemy
function drawEnemy(enemy) {
    // Enemy body with gradient
    const gradient = ctx.createLinearGradient(
        enemy.x, 
        enemy.y, 
        enemy.x, 
        enemy.y + enemy.height
    );
    gradient.addColorStop(0, '#FF4444');
    gradient.addColorStop(1, '#AA0000');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Enemy head
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(enemy.x + 5, enemy.y - 10, 15, 10);
    
    // Enemy eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(enemy.x + 8, enemy.y - 8, 3, 3);
    ctx.fillRect(enemy.x + 15, enemy.y - 8, 3, 3);
}

// Update player
function updatePlayer() {
    if (gameState.keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (gameState.keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (gameState.keys['ArrowUp'] && player.y > 50) { // Leave room for head
        player.y -= player.speed;
    }
    if (gameState.keys['ArrowDown'] && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
}

// Update bullets
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Move bullet to the right
        bullet.x += bulletSpeed;
        
        // Remove bullets that go off-screen
        if (bullet.x > canvas.width) {
            bullets.splice(i, 1);
            continue;
        }
        
        // Check for collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (
                bullet.x > enemy.x &&
                bullet.x < enemy.x + enemy.width &&
                bullet.y > enemy.y &&
                bullet.y < enemy.y + enemy.height
            ) {
                // Enemy destroyed
                gameState.score += 100;
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                break;
            }
        }
    }
}

// Update enemies
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Move enemy towards player
        if (enemy.x > player.x) {
            enemy.x -= enemy.speed;
        } else {
            enemy.x += enemy.speed;
        }
        
        // Move vertically too
        enemy.y += enemy.vy;
        
        // Reverse vertical direction if hitting top/bottom
        if (enemy.y <= 0 || enemy.y >= canvas.height - enemy.height) {
            enemy.vy *= -1;
        }
        
        // Check collision with player
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            // Collision with player
            player.health -= 20;
            enemies.splice(i, 1);
            
            if (player.health <= 0) {
                gameState.lives--;
                player.health = 100;
                
                if (gameState.lives <= 0) {
                    gameOver();
                }
            }
        }
        
        // Remove enemies that go off-screen
        if (enemy.x < -50 || enemy.x > canvas.width + 50) {
            enemies.splice(i, 1);
        }
    }
}

// Spawn a new enemy
function spawnEnemy() {
    const side = Math.random() > 0.5 ? 'left' : 'right';
    let x;
    
    if (side === 'left') {
        x = -30;
    } else {
        x = canvas.width;
    }
    
    // Random Y position
    const y = Math.random() * (canvas.height - 100) + 50;
    
    enemies.push({
        x: x,
        y: y,
        width: 30,
        height: 30,
        speed: 1 + Math.random() * 2,
        vy: (Math.random() - 0.5) * 2 // Vertical movement
    });
}

// Shoot a bullet
function shoot() {
    if (bulletTimer <= 0) {
        bullets.push({
            x: player.x + player.width,
            y: player.y + player.height / 2
        });
        bulletTimer = bulletCooldown;
    }
}

// Update score display
function updateScore() {
    const scoreValue = document.getElementById('scoreValue');
    if (scoreValue) scoreValue.textContent = gameState.score;
}

// Update lives display
function updateLives() {
    const livesValue = document.getElementById('livesValue');
    if (livesValue) livesValue.textContent = gameState.lives;
}

// Update level display
function updateLevel() {
    const levelValue = document.getElementById('levelValue');
    if (levelValue) levelValue.textContent = gameState.level;
}

// Game over
function gameOver() {
    gameState.gameRunning = false;
    const finalScore = document.getElementById('finalScore');
    if (finalScore) finalScore.textContent = gameState.score;
    document.getElementById('gameOver').style.display = 'flex';
}

// Reset game
function resetGame() {
    player.x = 100;
    player.y = 400;
    player.health = 100;
    
    bullets = [];
    enemies = [];
    
    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.gameRunning = true;
    
    enemySpawnRate = 90;
    
    updateScore();
    updateLives();
    updateLevel();
    
    document.getElementById('gameOver').style.display = 'none';
    gameLoop();
}

// Handle keyboard input
document.addEventListener('keydown', function(e) {
    gameState.keys[e.key] = true;
    
    if (e.key === ' ' && gameState.gameRunning) {
        shoot();
        e.preventDefault(); // Prevent spacebar from scrolling
    }
    
    if (e.key === 'p' || e.key === 'P') {
        gameState.paused = !gameState.paused;
        e.preventDefault();
    }
});

document.addEventListener('keyup', function(e) {
    gameState.keys[e.key] = false;
});

// Main game loop
function gameLoop() {
    if (!gameState.gameRunning) return;
    if (gameState.paused) {
        // Draw pause indicator
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Clear canvas
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update game objects
    updatePlayer();
    updateBullets();
    updateEnemies();
    
    // Handle shooting cooldown
    if (bulletTimer > 0) {
        bulletTimer--;
    }
    
    // Handle enemy spawning
    if (enemySpawnTimer <= 0 && enemies.length < 10) { // Limit number of enemies
        spawnEnemy();
        enemySpawnTimer = enemySpawnRate;
    } else {
        enemySpawnTimer--;
    }
    
    // Draw game objects
    drawPlayer();
    
    bullets.forEach(drawBullet);
    enemies.forEach(drawEnemy);
    
    // Update UI
    updateScore();
    updateLives();
    updateLevel();
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
}