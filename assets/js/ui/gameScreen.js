import { RATONES } from '../data/ratones.js';

const BOARD_SIZE = 50;

const gameElements = {
    menuScreen: document.getElementById('menuScreen'),
    gameScreen: document.getElementById('gameScreen'),
    playersDashboard: document.getElementById('playersDashboard'),
    board: document.getElementById('board'),
    startingArea: document.getElementById('startingArea'),
    startingAreaSlots: [
        document.getElementById('startingAreaSlot1'),
        document.getElementById('startingAreaSlot2'),
        document.getElementById('startingAreaSlot3'),
        document.getElementById('startingAreaSlot4')
    ],
    rankingModal: document.getElementById('rankingModal'),
    rankingList: document.getElementById('rankingList'),
    backToMenuBtn: document.getElementById('backToMenuBtn'),
    rollBtn: document.getElementById('rollBtn'),
    resetGameBtn: document.getElementById('resetGameBtn'),
    dice: document.getElementById('dice'),
    message: document.getElementById('message'),
    lastRoll: document.getElementById('lastRoll')
};

const matchState = {
    players: [],
    currentTurnIndex: 0,
    isRolling: false,
    awaitingAnswer: false,
    expectedTarget: null,
    rolledValue: null,
    finishedOrder: [],
    turnMessageTimeoutId: null,
    listenersBound: false
};

function clearPendingTurnMessage() {
    if (matchState.turnMessageTimeoutId) {
        clearTimeout(matchState.turnMessageTimeoutId);
        matchState.turnMessageTimeoutId = null;
    }
}

function getRatonById(ratonId) {
    return RATONES.find((raton) => raton.id === ratonId);
}

function renderDiceDots(number) {
    gameElements.dice.innerHTML = '';

    const dotPositions = {
        1: [[50, 50]],
        2: [[25, 25], [75, 75]],
        3: [[25, 25], [50, 50], [75, 75]],
        4: [[25, 25], [75, 25], [25, 75], [75, 75]],
        5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
        6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]]
    };

    dotPositions[number].forEach(([x, y]) => {
        const dot = document.createElement('div');
        dot.className = 'dice-dot';
        dot.style.left = `${x}%`;
        dot.style.top = `${y}%`;
        dot.style.transform = 'translate(-50%, -50%)';
        gameElements.dice.appendChild(dot);
    });
}

function getCurrentPlayer() {
    return matchState.players[matchState.currentTurnIndex] || null;
}

function getPlayerBadge(playerIndex) {
    return String(playerIndex + 1);
}

function createToken(player, playerIndex, variant) {
    const token = document.createElement('div');
    token.className = `player-token ${variant}`;
    token.innerHTML = getRatonById(player.ratonId).svg;

    const badge = document.createElement('span');
    badge.className = 'token-badge';
    badge.textContent = getPlayerBadge(playerIndex);
    token.appendChild(badge);

    return token;
}

function renderTokens() {
    document.querySelectorAll('.player-token').forEach((token) => token.remove());

    const stackedByCell = {};

    matchState.players.forEach((player, playerIndex) => {
        const isCurrentTurn = !player.finished && playerIndex === matchState.currentTurnIndex;

        if (player.position === 0) {
            const startToken = createToken(player, playerIndex, 'start-token');
            if (isCurrentTurn) {
                startToken.classList.add('current-turn-token');
            }
            const startSlot = gameElements.startingAreaSlots[playerIndex] || gameElements.startingArea;
            startSlot.appendChild(startToken);
            return;
        }

        const cell = document.getElementById(`cell-${player.position}`);
        if (!cell) {
            return;
        }

        const offsetIndex = stackedByCell[player.position] || 0;
        stackedByCell[player.position] = offsetIndex + 1;

        const boardToken = createToken(player, playerIndex, 'board-token');
        boardToken.style.transform = `translate(${offsetIndex * 14}px, ${offsetIndex * 8}px)`;
        boardToken.style.zIndex = String(10 + offsetIndex);
        if (isCurrentTurn) {
            boardToken.classList.add('current-turn-token');
            boardToken.style.zIndex = '50';
            boardToken.style.transform = `${boardToken.style.transform} scale(1.08)`;
        }
        cell.appendChild(boardToken);
    });
}

function updateDashboard() {
    gameElements.playersDashboard.innerHTML = '';

    matchState.players.forEach((player, index) => {
        const raton = getRatonById(player.ratonId);
        const status = document.createElement('div');
        status.className = 'player-status';

        if (!player.finished && index === matchState.currentTurnIndex) {
            status.classList.add('current-turn');
        }
        if (player.finished) {
            status.classList.add('finished');
        }

        status.innerHTML = `
            <div class="player-avatar-small">${raton.svg}</div>
            <div class="player-info-text">
                <div class="player-name-small">${player.name.toUpperCase()}</div>
                <div class="player-stats">POS: ${player.position}/50 | MOV: ${player.moves}</div>
                <div class="player-stats">🦷 ${player.goldTeeth} | ✨ ${player.shinyCoins}</div>
            </div>
        `;

        gameElements.playersDashboard.appendChild(status);
    });
}

function allPlayersFinished() {
    return matchState.players.length > 0 && matchState.players.every((player) => player.finished);
}

function setMessage(text, type = 'info') {
    gameElements.message.className = `message ${type}`;
    gameElements.message.textContent = text;
}

function showRankingModal() {
    gameElements.rankingList.innerHTML = '';

    const sorted = [...matchState.finishedOrder];
    matchState.players
        .filter((player) => !player.finished)
        .sort((a, b) => b.position - a.position)
        .forEach((player) => sorted.push(player));

    sorted.forEach((player, rankIndex) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
            <div class="ranking-position">${rankIndex + 1}</div>
            <div class="player-avatar-small">${getRatonById(player.ratonId).svg}</div>
            <div class="player-info-text">
                <div class="player-name-small">${player.name.toUpperCase()}</div>
                <div class="player-stats">MOV: ${player.moves} | POS FINAL: ${player.position}/50</div>
                <div class="player-stats">🦷 ${player.goldTeeth} | ✨ ${player.shinyCoins}</div>
            </div>
        `;
        gameElements.rankingList.appendChild(item);
    });

    gameElements.rankingModal.style.display = 'flex';
}

function advanceTurn() {
    if (allPlayersFinished()) {
        gameElements.rollBtn.disabled = true;
        showRankingModal();
        return;
    }

    let nextIndex = matchState.currentTurnIndex;
    do {
        nextIndex = (nextIndex + 1) % matchState.players.length;
    } while (matchState.players[nextIndex].finished);

    matchState.currentTurnIndex = nextIndex;
}

function handleLandingMessage(player) {
    if (player.position === BOARD_SIZE) {
        setMessage(`🏁 ${player.name.toUpperCase()} LLEGO A LA META.`, 'win');
        return;
    }

    if (player.position % 10 === 0 && player.position > 0) {
        setMessage(`🦷 ${player.name.toUpperCase()} ENCONTRO UN DIENTE DE ORO EN LA CASILLA ${player.position}.`, 'info');
        return;
    }

    if (player.position % 5 === 0 && player.position > 0) {
        setMessage(`✨ ${player.name.toUpperCase()} CONSIGUIO MONEDAS BRILLANTES EN LA CASILLA ${player.position}.`, 'info');
        return;
    }

    setMessage(`✔️ ${player.name.toUpperCase()} AVANZO A LA CASILLA ${player.position}.`, 'win');
}

function completeEducationalMove() {
    const player = getCurrentPlayer();
    if (!player) {
        return;
    }

    const target = matchState.expectedTarget;
    player.position = target;
    player.moves += 1;

    if (target % 10 === 0 && target > 0) {
        player.goldTeeth += 1;
    } else if (target % 5 === 0 && target > 0) {
        player.shinyCoins += 1;
    }

    if (target === BOARD_SIZE && !player.finished) {
        player.finished = true;
        matchState.finishedOrder.push(player);
    }

    matchState.awaitingAnswer = false;
    matchState.expectedTarget = null;
    gameElements.rollBtn.disabled = false;

    handleLandingMessage(player);
    renderTokens();
    updateDashboard();

    if (!allPlayersFinished()) {
        advanceTurn();
        const next = getCurrentPlayer();
        if (next) {
            clearPendingTurnMessage();
            matchState.turnMessageTimeoutId = setTimeout(() => {
                setMessage(`🎯 TURNO DE ${next.name.toUpperCase()}. LANZA EL DADO Y TOCA LA CASILLA CORRECTA.`, 'info');
                renderTokens();
                updateDashboard();
                matchState.turnMessageTimeoutId = null;
            }, 900);
        }
    } else {
        showRankingModal();
    }
}

function handleCellSelection(cellNumber, cellElement) {
    if (!matchState.awaitingAnswer || !getCurrentPlayer()) {
        return;
    }

    if (cellNumber === matchState.expectedTarget) {
        cellElement.classList.add('selected-correct');
        setTimeout(() => {
            cellElement.classList.remove('selected-correct');
            completeEducationalMove();
        }, 450);
        return;
    }

    cellElement.classList.add('selected-wrong');
    setTimeout(() => {
        cellElement.classList.remove('selected-wrong');
    }, 450);
}

function createBoard() {
    gameElements.board.innerHTML = '';

    for (let row = 0; row < 5; row += 1) {
        for (let col = 0; col < 10; col += 1) {
            let cellNumber;
            if (row % 2 === 0) {
                cellNumber = row * 10 + col + 1;
            } else {
                cellNumber = row * 10 + (9 - col) + 1;
            }

            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${cellNumber}`;
            cell.style.gridRow = String(row + 1);
            cell.style.gridColumn = String(col + 1);

            if (cellNumber === 1) {
                cell.classList.add('start');
                cell.innerHTML = "<span class='cell-emoji'>🚪</span><span class='cell-label'>1</span>";
            } else if (cellNumber === BOARD_SIZE) {
                cell.classList.add('finish');
                cell.innerHTML = `<span class='cell-emoji'>🏆</span><span class='cell-label bold'>${BOARD_SIZE}</span>`;
            } else if (cellNumber % 10 === 0) {
                cell.classList.add('special');
                cell.innerHTML = `<span class='cell-emoji'>🦷</span><span class='cell-label bold'>${cellNumber}</span>`;
            } else if (cellNumber % 5 === 0) {
                cell.classList.add('special');
                cell.innerHTML = `<span class='cell-emoji'>✨</span><span class='cell-label bold'>${cellNumber}</span>`;
            } else {
                cell.innerHTML = `<span class='cell-label'>${cellNumber}</span>`;
            }

            cell.addEventListener('click', () => handleCellSelection(cellNumber, cell));
            gameElements.board.appendChild(cell);
        }
    }
}

function rollDice() {
    if (matchState.isRolling || matchState.awaitingAnswer || allPlayersFinished()) {
        return;
    }

    const player = getCurrentPlayer();
    if (!player || player.finished) {
        return;
    }

    matchState.isRolling = true;
    gameElements.rollBtn.disabled = true;
    gameElements.dice.classList.add('rolling');

    let rollCount = 0;
    const rollInterval = setInterval(() => {
        const randomNumber = Math.floor(Math.random() * 6) + 1;
        renderDiceDots(randomNumber);
        rollCount += 1;

        if (rollCount < 10) {
            return;
        }

        clearInterval(rollInterval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        renderDiceDots(finalRoll);

        setTimeout(() => {
            gameElements.dice.classList.remove('rolling');
            matchState.isRolling = false;
            matchState.awaitingAnswer = true;
            matchState.rolledValue = finalRoll;
            matchState.expectedTarget = Math.min(player.position + finalRoll, BOARD_SIZE);

            gameElements.lastRoll.textContent = String(finalRoll);
            setMessage(`¿A QUE CASILLA DEBE AVANZAR ${player.name.toUpperCase()}? TOCA LA CASILLA CORRECTA.`, 'info');
        }, 250);
    }, 80);
}

function initializeMatch(players) {
    clearPendingTurnMessage();

    matchState.players = players.map((player) => ({
        name: player.name,
        ratonId: player.ratonId,
        position: 0,
        moves: 0,
        goldTeeth: 0,
        shinyCoins: 0,
        finished: false
    }));

    matchState.currentTurnIndex = 0;
    matchState.isRolling = false;
    matchState.awaitingAnswer = false;
    matchState.expectedTarget = null;
    matchState.rolledValue = null;
    matchState.finishedOrder = [];

    gameElements.lastRoll.textContent = '-';
    gameElements.rollBtn.disabled = false;
    gameElements.rankingModal.style.display = 'none';
}

function resetCurrentMatch() {
    if (!matchState.players.length) {
        return;
    }

    const selectedPlayers = matchState.players.map((player) => ({
        name: player.name,
        ratonId: player.ratonId
    }));

    initializeMatch(selectedPlayers);
    createBoard();
    renderTokens();
    updateDashboard();
    renderDiceDots(1);

    const current = getCurrentPlayer();
    if (current) {
        setMessage(`🎯 TURNO DE ${current.name.toUpperCase()}. LANZA EL DADO Y TOCA LA CASILLA CORRECTA.`, 'info');
    }
}

function confirmResetCurrentMatch() {
    if (!matchState.players.length) {
        return;
    }

    const shouldReset = window.confirm('¿Seguro que quieres reiniciar la partida actual?');
    if (!shouldReset) {
        return;
    }

    resetCurrentMatch();
}

function backToMenu() {
    clearPendingTurnMessage();

    gameElements.rankingModal.style.display = 'none';
    gameElements.gameScreen.style.display = 'none';
    gameElements.menuScreen.style.display = 'block';
}

export function openGameScreen(players) {
    if (!players || !players.length) {
        return;
    }

    initializeMatch(players);
    createBoard();
    renderTokens();
    updateDashboard();
    renderDiceDots(1);

    gameElements.menuScreen.style.display = 'none';
    gameElements.gameScreen.style.display = 'block';

    const current = getCurrentPlayer();
    if (current) {
        setMessage(`🎯 TURNO DE ${current.name.toUpperCase()}. LANZA EL DADO Y TOCA LA CASILLA CORRECTA.`, 'info');
    }
}

export function setupGameScreen() {
    if (matchState.listenersBound) {
        return;
    }

    gameElements.rollBtn.addEventListener('click', rollDice);
    gameElements.dice.addEventListener('click', rollDice);
    gameElements.resetGameBtn.addEventListener('click', confirmResetCurrentMatch);
    gameElements.backToMenuBtn.addEventListener('click', backToMenu);

    matchState.listenersBound = true;
}
