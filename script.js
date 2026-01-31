// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreValue = document.getElementById('scoreValue');
const livesValue = document.getElementById('livesValue');
const levelValue = document.getElementById('levelValue');
const finalScore = document.getElementById('finalScore');
const rapidFireIndicator = document.getElementById('rapidFireIndicator');
const multiShotIndicator = document.getElementById('multiShotIndicator');

// Game state
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    gameRunning: false,
    paused: false,
    keys: {},
    particles: [],
    explosions: []
};

// Player properties
let player = {
    x: 100,
    y: canvas.height - 120, // Fixed: Adjusted to ensure player is visible
    width: 40,
    height: 60,
    speed: 5,
    color: '#00FF00',
    isMovingLeft: false,
    isMovingRight: false,
    isMovingUp: false,
    isMovingDown: false,
    facingRight: true,
    health: 100
};

// Power-ups
let powerUps = {
    rapidFire: { active: false, timer: 0, duration: 300 }, // 5 seconds at 60fps
    multiShot: { active: false, timer: 0, duration: 300 }
};

// Bullets array
let bullets = [];
const bulletSpeed = 10;
let bulletCooldown = 15; // Base cooldown
let bulletTimer = 0;

// Enemies array
let enemies = [];
let enemySpawnRate = 90; // Frames between enemy spawns
let enemySpawnTimer = 0;

// Collectibles
let collectibles = [];

// Background elements
let backgroundElements = [];

// Initialize background
function initBackground() {
    for (let i = 0; i < 50; i++) {
        backgroundElements.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3,
            speed: 0.2 + Math.random() * 0.8,
            alpha: 0.3 + Math.random() * 0.7
        });
    }
}

// Draw player character with enhanced visuals
function drawPlayer() {
    // Draw player body with gradient
    const gradient = ctx.createLinearGradient(
        player.x, 
        player.y, 
        player.x, 
        player.y + player.height
    );
    gradient.addColorStop(0, player.facingRight ? '#00FF00' : '#00CC00');
    gradient.addColorStop(1, player.facingRight ? '#00AA00' : '#008800');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw player head (ensuring it stays within bounds)
    const headY = Math.max(0, player.y - 15); // Ensure head doesn't go above canvas
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(player.x + 10, headY, 20, 15);
    
    // Draw player gun
    ctx.fillStyle = '#AAAAAA';
    if (player.facingRight) {
        ctx.fillRect(player.x + player.width - 5, player.y + 20, 15, 8);
    } else {
        ctx.fillRect(player.x - 10, player.y + 20, 15, 8);
    }
    
    // Draw health bar
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(player.x, Math.max(5, player.y - 25), player.width, 5);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(player.x, Math.max(5, player.y - 25), (player.width * player.health) / 100, 5);
}

// Draw a bullet with enhanced visual
function drawBullet(bullet) {
    // Create gradient for bullet
    const gradient = ctx.createRadialGradient(
        bullet.x, bullet.y, 0,
        bullet.x, bullet.y, 5
    );
    gradient.addColorStop(0, '#FFFF00');
    gradient.addColorStop(1, '#FF8800');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Add trail effect
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(bullet.x - (bullet.dx > 0 ? 3 : -3), bullet.y, 2, 0, Math.PI * 2);
    ctx.fill();
}

// Draw an enemy with enhanced visuals
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
    ctx.fillRect(enemy.x + 5, Math.max(0, enemy.y - 10), 15, 10);
    
    // Enemy eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(enemy.x + 8, Math.max(0, enemy.y - 8), 3, 3);
    ctx.fillRect(enemy.x + 15, Math.max(0, enemy.y - 8), 3, 3);
    
    // Health bar for stronger enemies
    if (enemy.maxHealth && enemy.maxHealth > 30) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(enemy.x, Math.max(5, enemy.y - 15), enemy.width, 4);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(enemy.x, Math.max(5, enemy.y - 15), (enemy.width * enemy.health) / enemy.maxHealth, 4);
    }
}

// Draw collectible item
function drawCollectible(collectible) {
    switch(collectible.type) {
        case 'health':
            ctx.fillStyle = '#FF0000';
            break;
        case 'rapidFire':
            ctx.fillStyle = '#00FFFF';
            break;
        case 'multiShot':
            ctx.fillStyle = '#FF00FF';
            break;
        default:
            ctx.fillStyle = '#FFFF00';
    }
    
    ctx.beginPath();
    ctx.arc(collectible.x, collectible.y, collectible.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(collectible.x - 2, collectible.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
}

// Draw explosion effect
function drawExplosion(explosion) {
    const radius = explosion.radius * (explosion.maxRadius / 100);
    
    const gradient = ctx.createRadialGradient(
        explosion.x, explosion.y, 0,
        explosion.x, explosion.y, radius
    );
    gradient.addColorStop(0, `rgba(255, 255, 200, ${explosion.alpha})`);
    gradient.addColorStop(0.7, `rgba(255, 100, 0, ${explosion.alpha * 0.7})`);
    gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
    ctx.fill();
}

// Draw background elements
function drawBackground() {
    // Draw stars
    backgroundElements.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Create particle effect
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push({
            x: x,
            y: y,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 6,
            speedY: (Math.random() - 0.5) * 6,
            color: color,
            life: 30 + Math.random() * 30
        });
    }
}

// Create explosion effect
function createExplosion(x, y) {
    gameState.explosions.push({
        x: x,
        y: y,
        radius: 5,
        maxRadius: 30,
        alpha: 1,
        shrinkSpeed: 0.02
    });
}

// Update particles
function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;
        
        if (p.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

// Update explosions
function updateExplosions() {
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
        const exp = gameState.explosions[i];
        exp.radius += 1;
        exp.alpha -= exp.shrinkSpeed;
        
        if (exp.alpha <= 0 || exp.radius > exp.maxRadius) {
            gameState.explosions.splice(i, 1);
        }
    }
}

// Update player position based on input
function updatePlayer() {
    if (gameState.keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
        player.isMovingLeft = true;
        player.facingRight = false;
    } else {
        player.isMovingLeft = false;
    }
    
    if (gameState.keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
        player.isMovingRight = true;
        player.facingRight = true;
    } else {
        player.isMovingRight = false;
    }
    
    if (gameState.keys['ArrowUp'] && player.y > 50) { // Changed from 0 to 50 to account for head
        player.y -= player.speed;
        player.isMovingUp = true;
    } else {
        player.isMovingUp = false;
    }
    
    if (gameState.keys['ArrowDown'] && player.y < canvas.height - player.height) {
        player.y += player.speed;
        player.isMovingDown = true;
    } else {
        player.isMovingDown = false;
    }
}

// Update bullets
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Move bullet based on player facing direction
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
        
        // Remove bullets that go off-screen
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
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
                // Damage enemy
                enemy.health -= 30;
                
                // Create hit effect
                createParticles(bullet.x, bullet.y, '#FFFF00', 5);
                
                // Remove bullet
                bullets.splice(i, 1);
                
                if (enemy.health <= 0) {
                    // Enemy destroyed
                    gameState.score += enemy.points || 100;
                    createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                    enemies.splice(j, 1);
                    
                    // Chance to drop power-up
                    if (Math.random() < 0.3) {
                        spawnCollectible(enemy.x, enemy.y);
                    }
                }
                break;
            }
        }
    }
}

// Update enemies
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Move enemy towards player or in pattern
        if (enemy.pattern === 'chase') {
            if (enemy.x > player.x) {
                enemy.x -= enemy.speed;
            } else {
                enemy.x += enemy.speed;
            }
            
            if (enemy.y > player.y) {
                enemy.y -= enemy.speed * 0.5;
            } else {
                enemy.y += enemy.speed * 0.5;
            }
        } else if (enemy.pattern === 'patrol') {
            enemy.x += enemy.direction * enemy.speed;
            
            // Reverse direction at edges
            if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
                enemy.direction *= -1;
            }
        } else {
            // Default movement (left to right or right to left)
            enemy.x += enemy.direction * enemy.speed;
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
            createParticles(enemy.x, enemy.y, '#FF0000', 10);
            
            if (player.health <= 0) {
                // Player loses a life
                gameState.lives--;
                player.health = 100;
                updateLives();
                
                if (gameState.lives <= 0) {
                    gameOver();
                } else {
                    // Reset player position
                    player.x = 100;
                    player.y = canvas.height - 120; // Fixed: Reset to correct position
                }
            }
            
            // Remove enemy after collision
            enemies.splice(i, 1);
            createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
        }
        
        // Remove enemies that go off-screen
        if (enemy.x < -50 || enemy.x > canvas.width + 50 || 
            enemy.y > canvas.height + 50 || enemy.y < -50) {
            enemies.splice(i, 1);
        }
    }
}

// Update collectibles
function updateCollectibles() {
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const collectible = collectibles[i];
        
        // Move collectible downward
        collectible.y += collectible.speed;
        
        // Check collision with player
        const distance = Math.sqrt(
            Math.pow(player.x + player.width/2 - collectible.x, 2) +
            Math.pow(player.y + player.height/2 - collectible.y, 2)
        );
        
        if (distance < player.width/2 + collectible.size) {
            // Collect the item
            applyPowerUp(collectible.type);
            collectibles.splice(i, 1);
        } else if (collectible.y > canvas.height) {
            // Remove if off screen
            collectibles.splice(i, 1);
        }
    }
}

// Update background elements
function updateBackground() {
    backgroundElements.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

// Spawn a new enemy
function spawnEnemy() {
    const side = Math.random() > 0.5 ? 'left' : 'right';
    let x, direction;
    
    if (side === 'left') {
        x = -30;
        direction = 1;
    } else {
        x = canvas.width + 30;
        direction = -1;
    }
    
    // Random Y position - ensuring it's within canvas bounds
    const y = Math.random() * (canvas.height - 200) + 50;
    
    // Determine enemy type based on level
    let enemyType;
    if (gameState.level > 3 && Math.random() < 0.3) {
        enemyType = 'strong'; // Stronger enemy with more health
    } else if (gameState.level > 2 && Math.random() < 0.4) {
        enemyType = 'patrol'; // Patrol enemy
    } else {
        enemyType = 'normal';
    }
    
    const baseSpeed = 1 + (gameState.level * 0.2);
    
    let enemy;
    if (enemyType === 'strong') {
        enemy = {
            x: x,
            y: y,
            width: 40,
            height: 40,
            speed: baseSpeed * 0.7, // Slower but stronger
            direction: direction,
            health: 60,
            maxHealth: 60,
            points: 200,
            pattern: 'chase'
        };
    } else if (enemyType === 'patrol') {
        enemy = {
            x: x,
            y: y,
            width: 30,
            height: 30,
            speed: baseSpeed,
            direction: direction,
            health: 30,
            maxHealth: 30,
            points: 150,
            pattern: 'patrol'
        };
    } else {
        enemy = {
            x: x,
            y: y,
            width: 25,
            height: 25,
            speed: baseSpeed,
            direction: direction,
            health: 30,
            maxHealth: 30,
            points: 100,
            pattern: 'normal'
        };
    }
    
    enemies.push(enemy);
}

// Spawn a collectible item
function spawnCollectible(x, y) {
    const types = ['health', 'rapidFire', 'multiShot'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    collectibles.push({
        x: x,
        y: y,
        size: 8,
        speed: 2,
        type: type
    });
}

// Apply power-up effect
function applyPowerUp(type) {
    switch(type) {
        case 'health':
            player.health = Math.min(100, player.health + 30);
            break;
        case 'rapidFire':
            powerUps.rapidFire.active = true;
            powerUps.rapidFire.timer = powerUps.rapidFire.duration;
            rapidFireIndicator.classList.add('active');
            break;
        case 'multiShot':
            powerUps.multiShot.active = true;
            powerUps.multiShot.timer = powerUps.multiShot.duration;
            multiShotIndicator.classList.add('active');
            break;
    }
    
    createParticles(player.x + player.width/2, player.y + player.height/2, '#00FF00', 15);
}

// Shoot a bullet
function shoot() {
    if (bulletTimer <= 0) {
        // Adjust cooldown based on power-ups
        let currentCooldown = powerUps.rapidFire.active ? bulletCooldown / 2 : bulletCooldown;
        
        // Single shot or multi-shot based on power-up
        if (powerUps.multiShot.active) {
            // Shoot 3 bullets in spread pattern
            bullets.push({
                x: player.facingRight ? player.x + player.width : player.x,
                y: player.y + player.height / 2,
                dx: player.facingRight ? bulletSpeed : -bulletSpeed,
                dy: -3,
                type: 'spread'
            });
            bullets.push({
                x: player.facingRight ? player.x + player.width : player.x,
                y: player.y + player.height / 2,
                dx: player.facingRight ? bulletSpeed : -bulletSpeed,
                dy: 0,
                type: 'straight'
            });
            bullets.push({
                x: player.facingRight ? player.x + player.width : player.x,
                y: player.y + player.height / 2,
                dx: player.facingRight ? bulletSpeed : -bulletSpeed,
                dy: 3,
                type: 'spread'
            });
        } else {
            // Single bullet
            bullets.push({
                x: player.facingRight ? player.x + player.width : player.x,
                y: player.y + player.height / 2,
                dx: player.facingRight ? bulletSpeed : -bulletSpeed,
                dy: 0,
                type: 'normal'
            });
        }
        
        bulletTimer = currentCooldown;
    }
}

// Update power-ups timers
function updatePowerUps() {
    if (powerUps.rapidFire.active) {
        powerUps.rapidFire.timer--;
        if (powerUps.rapidFire.timer <= 0) {
            powerUps.rapidFire.active = false;
            rapidFireIndicator.classList.remove('active');
        }
    }
    
    if (powerUps.multiShot.active) {
        powerUps.multiShot.timer--;
        if (powerUps.multiShot.timer <= 0) {
            powerUps.multiShot.active = false;
            multiShotIndicator.classList.remove('active');
        }
    }
}

// Update score display
function updateScore() {
    scoreValue.textContent = gameState.score;
}

// Update lives display
function updateLives() {
    livesValue.textContent = gameState.lives;
}

// Update level display
function updateLevel() {
    levelValue.textContent = gameState.level;
}

// Game over
function gameOver() {
    gameState.gameRunning = false;
    finalScore.textContent = gameState.score;
    gameOverScreen.classList.remove('hidden');
}

// Next level
function nextLevel() {
    gameState.level++;
    updateLevel();
    
    // Increase difficulty
    enemySpawnRate = Math.max(30, enemySpawnRate - 5);
    
    // Reset player position
    player.x = 100;
    player.y = canvas.height - 120; // Fixed: Reset to correct position
    
    // Heal player partially
    player.health = Math.min(100, player.health + 30);
}

// Reset game
function resetGame() {
    player.x = 100;
    player.y = canvas.height - 120; // Fixed: Set to correct initial position
    player.health = 100;
    
    bullets = [];
    enemies = [];
    collectibles = [];
    gameState.particles = [];
    gameState.explosions = [];
    
    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.gameRunning = true;
    gameState.paused = false;
    
    enemySpawnRate = 90;
    
    updateScore();
    updateLives();
    updateLevel();
    
    gameOverScreen.classList.add('hidden');
}

// Handle keyboard input
document.addEventListener('keydown', function(e) {
    gameState.keys[e.key] = true;
    
    if (e.key === ' ' && gameState.gameRunning && !gameState.paused) {
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

// Button event listeners
startButton.addEventListener('click', function() {
    startScreen.classList.add('hidden');
    resetGame();
});

restartButton.addEventListener('click', function() {
    gameOverScreen.classList.add('hidden');
    resetGame();
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
    
    // Clear canvas with semi-transparent overlay for trail effect
    ctx.fillStyle = 'rgba(15, 52, 96, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Update game objects
    updatePlayer();
    updateBullets();
    updateEnemies();
    updateCollectibles();
    updateParticles();
    updateExplosions();
    updatePowerUps();
    updateBackground();
    
    // Handle shooting cooldown
    if (bulletTimer > 0) {
        bulletTimer--;
    }
    
    // Handle enemy spawning
    if (enemySpawnTimer <= 0 && enemies.length < 15 + gameState.level) { // Increase max enemies with level
        spawnEnemy();
        enemySpawnTimer = enemySpawnRate;
    } else {
        enemySpawnTimer--;
    }
    
    // Check if level is complete (arbitrary condition)
    if (gameState.score >= gameState.level * 1000) {
        nextLevel();
    }
    
    // Draw game objects
    drawPlayer();
    
    bullets.forEach(drawBullet);
    enemies.forEach(drawEnemy);
    collectibles.forEach(drawCollectible);
    gameState.particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 60;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });
    gameState.explosions.forEach(drawExplosion);
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

// Initialize the game when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initBackground();
    updateScore();
    updateLives();
    updateLevel();
    
    // Show start screen initially
    startScreen.classList.remove('hidden');
});