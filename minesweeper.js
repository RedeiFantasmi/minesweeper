(function () {

    const gameController = minesweeper();
    gameController.initGame();

    function minesweeper(wrapper = document.body) {
        if (!(wrapper instanceof HTMLElement)) wrapper = document.body;

        const container = document.createElement('div');
        container.style.cssText = 'width: 100%; max-width: 680px;';

        // Square states
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

        // Default config
        let currentConfig = gridConfigs.EASY;

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

        // Toolbar containing difficulty dropdown, mine counter and timer
        const toolBar = document.createElement('div');
        toolBar.classList.add('toolbar')

        // Difficulty dropdown
        const difChanger = document.createElement('select');
        for (const [key, value] of Object.entries(gridConfigs)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value.name;
            option.selected = key == currentConfig.name.toUpperCase();
            difChanger.appendChild(option);
        }
        toolBar.appendChild(difChanger);

        // Mine counter (based on marked mines)
        const mineCounter = document.createElement('span');
        mineCounter.classList.add('mine-counter');
        toolBar.appendChild(mineCounter);

        // Timer
        const timeElapsed = document.createElement('span');
        timeElapsed.textContent = 0;
        timeElapsed.classList.add('time-counter');
        toolBar.appendChild(timeElapsed);
        

        container.appendChild(toolBar);
        wrapper.appendChild(container);

        let { width, height, mines } = currentConfig;
        let time = 0;
        let timer;
        let grid = [];
        let gameRunning = true;

        return {
            /**
             * Initialization of the grid
             */
            initGame() {
                // Start timer
                timer = setInterval(() => {
                    time++;
                    timeElapsed.textContent = time;
                }, 1000);

                // Handle timer reset
                timeElapsed.onclick = () => {
                    this.reset();
                }

                // Handle difficulty change
                difChanger.onchange = () => {
                    this.changeDif(difChanger.value);
                }

                // Grid
                const gridContainer = document.createElement('div');
                gridContainer.classList.add('grid');
                gridContainer.oncontextmenu = () => false; // disable default right click menu
                document.documentElement.style.setProperty('--nbColumns', width);

                mineCounter.textContent = mines;
    
                // Grid filling
                for (let i = 0; i < height; i++) {
                    const row = [];
                    for (let j = 0; j < width; j++) {
                        // Square HTMLElement
                        let cellElement = document.createElement('div');
                        cellElement.onmousedown = this.clickCallback(i, j);
                        if ((i + j) % 2 === 0) cellElement.classList.add('alternate');
                        
                        // Square object
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

            /**
             * Randomly places the mines on the grid (number based on choosen config)
             */
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

            /**
             * Click handle
             * @param {Integer} x - X position of the clicked square
             * @param {Integer} y - Y position of the clicked square
             * @returns void
             */
            clickCallback(x, y) {
                return (e) => {
                    e.preventDefault();
                    // If game not running, do nothing
                    if (!gameRunning) return;

                    const target = grid[x][y];
                    // If clicked square already revealed, do nothing
                    if (target.unraveled) return;
                    // Handle left click
                    if (e.button === 0) {
                        // If tarked marked, do nothing
                        if (target.marked) return;
                        // If mine on clicked square, user has lost
                        if (target.status === MINE) this.lostGame();
                        // If normal square, reveal it
                        else {
                            target.unraveled = true;
                            this.unravel(x, y);
                        }
                    }
                    // Handle right click
                    else if(e.button === 2) {
                        // If marked unmark, if unmarked mark
                        target.marked = !target.marked;
                        // If square is now marked, a red flag appears on it and mine counter decreases
                        if (target.marked) {
                            target.element.textContent = '⚑';
                            target.element.style.color = colors.flag;
                            mines--;
                        // If square now unmarked, returns back to initial state and mine counter is increased
                        } else {
                            target.element.textContent = '';
                            target.element.style.color = '';
                            mines++;
                        }
    
                        mineCounter.textContent = mines;
                    };
                    
                    this.checkWin();
                    if (gameRunning === false) clearInterval(timer);
                }
            },

            /**
             * Open a square
             * @param {Integer} x - X position of the square to open
             * @param {Integer} y - Y position of the square to open
             */
            unravel(x, y) {
                const currentCell = grid[x][y];
                currentCell.unraveled = true;

                // Counts the number of mines around the square
                let counter = 0;
                for (let i = x-1; i <= x + 1; i++) {
                    for (let j = y-1; j <= y+1; j++) {
                        if (i === x && j === y) continue;
                        if (i < 0 || i >= height || j < 0 || j >= width) continue;
                        if (grid[i][j].status === MINE) counter++;
                    }
                }

                currentCell.element.classList.add('open');

                // If at least one adjacent mine, square is revealed and the number of surrounding mines is written on it
                if (counter > 0) {
                    currentCell.element.textContent = counter;
                    currentCell.element.style.color = colors[counter];
                // Else, surrounding squares are opened too
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

            /**
             * If user has lost, reveals the position of all unmarked mines and shows if marks were misplaced
             */
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

            /**
             * Checks if number of closed squares equals number of mines. If true user has won.
             */
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

            /**
             * Changes difficulty and resets game
             * @param {String} key - Difficulty index
             */
            changeDif(key) {
                currentConfig = gridConfigs[key];
                this.reset();
            },

            /**
             * Shows the endscreen with Personal Best time and Run time
             * @param {boolean} win - Has user won ?
             */
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

            /**
             * Used to restart a game
             */
            reset() {
                ({ width, height, mines } = currentConfig);
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
