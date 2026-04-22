import { RATONES, RATON_COLORS } from '../data/ratones.js';
import { state } from '../state/appState.js';

const MAX_PLAYERS = 4;

const elements = {
    playersRow: document.getElementById('playersRow'),
    startBtn: document.getElementById('startBtn'),
    modalBg: document.getElementById('modalBg'),
    playerNameInput: document.getElementById('playerNameInput'),
    modalError: document.getElementById('modalError'),
    ratonList: document.getElementById('ratonList'),
    addPlayerBtn: document.getElementById('addPlayerBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn')
};

function renderRatones() {
    elements.ratonList.innerHTML = '';

    RATONES.forEach((raton) => {
        const isTaken = state.players.some((player) => player.ratonId === raton.id);
        const option = document.createElement('button');
        option.type = 'button';
        option.className = `raton-option${state.selectedRatonId === raton.id ? ' selected' : ''}${isTaken ? ' disabled' : ''}`;
        option.innerHTML = raton.svg;
        option.title = raton.label;

        if (!isTaken) {
            option.addEventListener('click', () => {
                state.selectedRatonId = raton.id;
                renderRatones();
            });
        }

        elements.ratonList.appendChild(option);
    });
}

function removePlayer(index) {
    state.players.splice(index, 1);
    renderPlayers();
}

function createFilledSlot(player, index) {
    const slotWrapper = document.createElement('div');
    slotWrapper.style.display = 'flex';
    slotWrapper.style.flexDirection = 'column';
    slotWrapper.style.alignItems = 'center';
    slotWrapper.style.justifyContent = 'center';
    slotWrapper.style.width = '120px';

    const slot = document.createElement('div');
    slot.className = 'player-slot filled';
    slot.style.background = RATON_COLORS[player.ratonId] || '#E6F3FF';

    const avatar = document.createElement('div');
    avatar.className = 'player-avatar';
    avatar.innerHTML = RATONES.find((raton) => raton.id === player.ratonId).svg;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.type = 'button';
    removeBtn.title = 'Quitar jugador';
    removeBtn.textContent = '-';
    removeBtn.addEventListener('click', () => removePlayer(index));

    slot.appendChild(avatar);
    slot.appendChild(removeBtn);

    const name = document.createElement('div');
    name.className = 'player-name';
    name.textContent = player.name.toUpperCase();

    slotWrapper.appendChild(slot);
    slotWrapper.appendChild(name);

    return slotWrapper;
}

function createEmptySlot() {
    const slotWrapper = document.createElement('div');
    slotWrapper.style.display = 'flex';
    slotWrapper.style.flexDirection = 'column';
    slotWrapper.style.alignItems = 'center';
    slotWrapper.style.justifyContent = 'center';
    slotWrapper.style.width = '120px';

    const slot = document.createElement('div');
    slot.className = 'player-slot';

    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn';
    addBtn.type = 'button';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', openAddPlayerModal);

    slot.appendChild(addBtn);
    slotWrapper.appendChild(slot);

    return slotWrapper;
}

export function renderPlayers() {
    elements.playersRow.innerHTML = '';

    for (let index = 0; index < MAX_PLAYERS; index += 1) {
        const player = state.players[index];
        const slot = player ? createFilledSlot(player, index) : createEmptySlot();
        elements.playersRow.appendChild(slot);
    }

    elements.startBtn.disabled = state.players.length < 1;
}

export function openAddPlayerModal() {
    if (state.players.length >= MAX_PLAYERS) {
        return;
    }

    state.selectedRatonId = null;
    state.editingIndex = null;
    elements.playerNameInput.value = '';
    elements.modalError.textContent = '';
    renderRatones();
    elements.modalBg.style.display = 'flex';
    elements.playerNameInput.focus();
}

export function closeAddPlayerModal() {
    elements.modalBg.style.display = 'none';
}

function validatePlayerForm() {
    const name = elements.playerNameInput.value.trim();

    if (state.players.length >= MAX_PLAYERS) {
        return 'Ya llegaste al maximo de jugadores';
    }

    if (!name) {
        return 'Elige un nombre';
    }

    if (name.length < 2) {
        return 'Usa al menos 2 caracteres';
    }

    const repeatedName = state.players.some((player) => player.name.toLowerCase() === name.toLowerCase());
    if (repeatedName) {
        return 'Ese nombre ya esta en uso';
    }

    if (!state.selectedRatonId) {
        return 'Elige un raton';
    }

    return '';
}

function addPlayerFromModal() {
    const validationError = validatePlayerForm();
    if (validationError) {
        elements.modalError.textContent = validationError;
        return;
    }

    state.players.push({
        name: elements.playerNameInput.value.trim(),
        ratonId: state.selectedRatonId
    });

    closeAddPlayerModal();
    renderPlayers();
}

export function setupPlayerSelection(onStartGame) {
    elements.addPlayerBtn.addEventListener('click', addPlayerFromModal);
    elements.cancelModalBtn.addEventListener('click', closeAddPlayerModal);

    elements.playerNameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            addPlayerFromModal();
        }

        if (event.key === 'Escape') {
            closeAddPlayerModal();
        }
    });

    elements.modalBg.addEventListener('click', (event) => {
        if (event.target === elements.modalBg) {
            closeAddPlayerModal();
        }
    });

    elements.startBtn.addEventListener('click', () => {
        onStartGame(state.players);
    });

    renderPlayers();
}
