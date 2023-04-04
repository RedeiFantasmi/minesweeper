(function () {

    const container = document.getElementsByTagName('main')[0];

    const EMPTY = 0;
    const MINE = 1;

    const gridConfigs = {
        EASY: {
            name: 'easy',
            height: 8,
            width: 10,
            mines: 10,
        },
        MID: {
            name: 'mid',
            height: 14,
            width: 18,
            mines: 40,
        },
        HARD: {
            name: 'hard',
            height: 20,
            width: 24,
            mines: 99,
        }
    }

    const defaultConfig = 'EASY';

    const colors = {
        1 : '#1976d2',
        2: '#388e3c',
        3: '#d32f2f',
        4: '#7b1fa2',
        5: '#ff8f00',
        6: '#0097a7',
        flag: 'red',
        mine: 'black',
    }

    // Barre d'outils, au-dessus du démineur
    const toolBar = document.createElement('div');
    toolBar.classList.add('toolbar')

    // Sélecteur de difficulté
    const difChanger = document.createElement('select');
    difChanger.onchange = () => {
        gameController.changeDif(difChanger.value);
    }
    for (const [key, value] of Object.entries(gridConfigs)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value.name;
        option.selected = key == defaultConfig;
        difChanger.appendChild(option);
    }
    toolBar.appendChild(difChanger);

    // Compteur de mines restantes (en fonction des cases marquées)
    const mineCounter = document.createElement('span');
    mineCounter.classList.add('mine-counter');
    toolBar.appendChild(mineCounter);

    // Chronomètre
    const timeElapsed = document.createElement('span');
    timeElapsed.textContent = 0;
    timeElapsed.classList.add('time-counter');
    toolBar.appendChild(timeElapsed);

    container.appendChild(toolBar);



    const gameController = minesweeper();
    gameController.initGame();



    function minesweeper() {
        let { width, height, mines } = gridConfigs[defaultConfig];
        let time = 0;
        let timer;
        let grid = [];
        let gameRunning = true;

        return {
            initGame() {
                timer = setInterval(() => {
                    time++;
                    timeElapsed.textContent = time;
                }, 1000);

                const gridContainer = document.createElement('div');
                gridContainer.classList.add('grid');
                gridContainer.oncontextmenu = () => false;
                document.documentElement.style.setProperty('--nbColumns', width);

                mineCounter.textContent = mines;
    
                for (let i = 0; i < height; i++) {
                    const row = [];
                    for (let j = 0; j < width; j++) {
                        let cellElement = document.createElement('div');
                        cellElement.onmousedown = this.clickCallback(i, j);
                        if ((i + j) % 2 === 0) cellElement.classList.add('alternate');
                        
                        const cell = {
                            status: EMPTY,
                            marked: false,
                            unraveled: false,
                            element: cellElement,
                        };
                        
                        gridContainer.appendChild(cellElement);
                        row.push(cell);
                    }
                    grid.push(row);
                }
    
                container.appendChild(gridContainer);
                this.placeMines();
            },

            placeMines() {
                let counter = 0;
    
                while (counter < mines) {
                    const i = Math.floor(Math.random() * height);
                    const j = Math.floor(Math.random() * width);
    
                    const cell = grid[i][j];
                    if (cell.status !== MINE) {
                        cell.status = MINE;
                        counter++;
                    }
                }
            },

            clickCallback(x, y) {
                return (e) => {
                    e.preventDefault();
                    if (!gameRunning) return;

                    const target = grid[x][y];
                    if (target.unraveled) return;
                    if (e.button === 0) {
                        if (target.marked) return;
                        if (target.status === MINE) this.lostGame();
                        else {
                            target.unraveled = true;
                            this.unravel(x, y);
                        }
                    }
                    else if(e.button === 2) {
                        target.marked = !target.marked;
                        if (target.marked) {
                            target.element.textContent = '⚑';
                            target.element.style.color = colors.flag;
                            mines--;
                        } else {
                            target.element.textContent = '';
                            mines++;
                        }
    
                        mineCounter.textContent = mines;
                    };
                    
                    this.checkWin();
                    if (gameRunning === false) clearInterval(timer);
                }
            },

            unravel(x, y) {
                const currentCell = grid[x][y];
                currentCell.unraveled = true;

                let counter = 0;
                for (let i = x-1; i <= x + 1; i++) {
                    for (let j = y-1; j <= y+1; j++) {
                        if (i === x && j === y) continue;
                        if (i < 0 || i >= height || j < 0 || j >= width) continue;
                        if (grid[i][j].status === MINE) counter++;
                    }
                }

                currentCell.element.classList.add('open');

                if (counter > 0) {
                    currentCell.element.textContent = counter;
                    currentCell.element.style.color = colors[counter];
                } else {
                    for (let i = x-1; i <= x + 1; i++) {
                        for (let j = y-1; j <= y+1; j++) {
                            if (i === x && j === y) continue;
                            if (i < 0 || i >= height || j < 0 || j >= width) continue;
                            if (grid[i][j].status !== MINE && !grid[i][j].marked && !grid[i][j].unraveled) this.unravel(i, j);
                        }
                    }
                }
            },

            lostGame() {
                for (let i = 0; i < grid.length; i++) {
                    for (let j = 0; j < grid[i].length; j++) {
                        const cell = grid[i][j];
                        if (cell.status === MINE && !cell.marked) {
                            cell.element.textContent = '*';
                        } else if (cell.status !== MINE && cell.marked) {
                            cell.element.textContent = 'x';
                        }
                    }
                }

                this.endScreen(false);
            },

            checkWin() {
                let counter = 0;
                for (let i = 0; i < grid.length; i++) {
                    for (let j = 0; j < grid[i].length; j++) {
                        const cell = grid[i][j];
                        if (!(cell.status === MINE && cell.marked) && !cell.unraveled) counter++;
                    }
                }
                
                if (mines === counter) {
                    this.endScreen(true);
                }
            },

            changeDif(key) {
                ({ width, height, mines } = gridConfigs[key]);
                this.reset();
            },

            endScreen(win = false) {
                gameRunning = false;
                clearInterval(timer);

                const pb = localStorage.getItem('pb');

                if (win && (!pb || isNaN(parseInt(pb)) || time < pb)) {
                    localStorage.setItem('pb', time);
                }

                if (!win) time = '';

                const endDialog = document.createElement('dialog');
                endDialog.innerHTML = `<div><span>Run: ${time}</span><span>Pb: ${pb ?? '-'}</span></div>`

                const replayButton = document.createElement('button');
                replayButton.innerHTML = '<img src="https://www.gstatic.com/images/icons/material/system/2x/refresh_white_24dp.png">Play Again';
                replayButton.onclick = () => { endDialog.remove(); this.changeDif(difChanger.value); };
                endDialog.appendChild(replayButton);

                document.body.appendChild(endDialog);

                setTimeout(() => {
                    endDialog.showModal();
                }, 2500);
            },

            reset() {
                container.querySelector('.grid').remove();
                grid = [];
                gameRunning = true;
                time = 0;
                clearInterval(timer);
                timeElapsed.textContent = 0;
                this.initGame();
            }
        }
    }

})();
