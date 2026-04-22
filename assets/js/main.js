import { setupPlayerSelection } from './ui/playerSelection.js';
import { openGameScreen, setupGameScreen } from './ui/gameScreen.js';

document.body.dataset.appReady = 'true';

function startGame(players) {
    if (!players.length) {
        return;
    }

    openGameScreen(players);
}

setupPlayerSelection(startGame);
setupGameScreen();
