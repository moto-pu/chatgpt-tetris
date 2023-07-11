const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const highScore = localStorage.getItem('highScore');
highScoreElement.innerText = `ハイスコア: ${highScore}`;

const TETROMINOS = {
    'I': {
        shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
        color: 'cyan'
    },
    'O': {
        shape: [[1, 1], [1, 1]],
        color: 'yellow'
    },
    'T': {
        shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
        color: 'purple'
    },
    'J': {
        shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
        color: 'blue'
    },
    'L': {
        shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
        color: 'orange'
    },
    'S': {
        shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
        color: 'green'
    },
    'Z': {
        shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
        color: 'red'
    }
};

let gameBoard = Array.from({length: 20}, () => Array(10).fill(0));
let currentBlock = null;
let score = 0;

function createBlock() {
    const tetrominos = 'IOTJLSZ';
    const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
    const block = TETROMINOS[randTetromino];

    return {
        x: 5,
        y: 0,
        shape: block.shape,
        color: block.color
    };
}

function drawBlock(block) {
    block.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = block.color;
                context.fillRect((block.x + x) * 30, (block.y + y) * 30, 30, 30);
            }
        });
    });
}

function drawGame() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    gameBoard.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = value;
                context.fillRect(x * 30, y * 30, 30, 30);
            }
        });
    });
    if (currentBlock) {
        drawBlock(currentBlock);
    }
}

function validMove(block, offsetX, offsetY, newBlock) {
    for (let y = 0; y < block.shape.length; y++) {
        for (let x = 0; x < block.shape[y].length; x++) {
            if (newBlock[y][x] !== 0) {
                let newX = block.x + x + offsetX;
                let newY = block.y + y + offsetY;

                if (newX < 0 || newX >= 10 || newY >= 20) {
                    return false;
                }

                if (newY < 0) {
                    continue;
                }

                if (gameBoard[newY][newX] !== 0) {
                    return false;
                }
            }
        }
    }
    return true;
}

function moveBlock(direction) {
    if (validMove(currentBlock, direction, 0, currentBlock.shape)) {
        currentBlock.x += direction;
    }
}

function dropBlock() {
    if (validMove(currentBlock, 0, 1, currentBlock.shape)) {
        currentBlock.y++;
    } else {
        freezeBlock();
        currentBlock = null;
    }
}

function rotateBlock(block) {
    let newBlock = JSON.parse(JSON.stringify(block));
    for (let y = 0; y < newBlock.shape.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [newBlock.shape[x][y], newBlock.shape[y][x]] = [newBlock.shape[y][x], newBlock.shape[x][y]];
        }
    }
    newBlock.shape.forEach(row => row.reverse());
    return newBlock;
}

function freezeBlock() {
    for (let y = 0; y < currentBlock.shape.length; y++) {
        for (let x = 0; x < currentBlock.shape[y].length; x++) {
            if (currentBlock.shape[y][x] !== 0) {
                if (currentBlock.y + y < 0) {
                    // ゲームオーバー
                    alert('Game Over');
                    gameBoard = Array.from({length: 20}, () => Array(10).fill(0));
                    currentBlock = null;
                    score = 0;
                    updateScore();
                    return;
                }
                gameBoard[currentBlock.y + y][currentBlock.x + x] = currentBlock.color;
            }
        }
    }
    for (let y = 0; y < gameBoard.length; y++) {
        if (gameBoard[y].every(value => value !== 0)) {
            score += 10;
            updateScore();
            gameBoard.splice(y, 1);
            gameBoard.unshift(Array(10).fill(0));
        }
    }
}


function updateScore() {
    scoreElement.innerText = score;
}

function updateHighScore() {
    const highScore = localStorage.getItem('highScore');
    if (highScore === null || score > highScore) {
        localStorage.setItem('highScore', score);
    }
}

let lastTime = 0;
let timeFromLastDrop = 0;
const dropInterval = 1000; // ブロックが自動で落下するまでの時間（ミリ秒）

function resetGame() {
    gameBoard = Array.from({length: 20}, () => Array(10).fill(0));
    score = 0;
    updateScore();
    currentBlock = null;
}

function startGame() {
    resetGame();
    gameLoop();
}

function gameLoop(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    timeFromLastDrop += deltaTime;

    if (!currentBlock) {
        currentBlock = createBlock();
        if (!validMove(currentBlock, 0, 0, currentBlock.shape)) {
            // ゲームオーバー
            updateHighScore();
            alert('Game Over. High Score: ' + localStorage.getItem('highScore'));
            startGame();
            return;
        }
    } else if (timeFromLastDrop > dropInterval) {
        timeFromLastDrop = 0;
        if (validMove(currentBlock, 0, 1, currentBlock.shape)) {
            currentBlock.y++;
        } else {
            freezeBlock();
            currentBlock = null;
        }
    }

    drawGame();
    requestAnimationFrame(gameLoop);
}

startGame();


function keyDownEvent(e) {
    if (currentBlock) {
        if (e.keyCode === 37) { // 左矢印キー
            moveBlock(-1);
        } else if (e.keyCode === 39) { // 右矢印キー
            moveBlock(1);
        } else if (e.keyCode === 40) { // 下矢印キー
            dropBlock();
        } else if (e.keyCode === 38) { // 上矢印キー
            let newBlock = rotateBlock(currentBlock);
            if (validMove(currentBlock, 0, 0, newBlock.shape)) {
                currentBlock.shape = newBlock.shape;
            }
        } else if (e.keyCode === 32) { // スペースキー
            while (validMove(currentBlock, 0, 1, currentBlock.shape)) {
                currentBlock.y++;
            }
            freezeBlock();
            currentBlock = null;
        }
    }
}

window.addEventListener('keydown', keyDownEvent);