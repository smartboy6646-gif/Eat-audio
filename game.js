// Call Break Game Logic
class CallBreakGame {
    constructor() {
        this.gameState = {
            phase: 'waiting', // waiting, bidding, playing, scoring
            players: {},
            currentPlayer: null,
            dealer: null,
            trumpSuit: 'S', // Spades are always trump
            currentTrick: [],
            trickWinner: null,
            round: 1,
            scores: {},
            bids: {},
            tricksWon: {},
            playerOrder: [],
            playerPosition: 0, // 0-3 position of current player
            gameStarted: false
        };
        
        this.playerId = null;
        this.playerName = 'Player';
        this.roomId = null;
        this.cards = [];
        this.soundEnabled = true;
        this.firebaseInitialized = false;
        
        this.cardValues = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 
            '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        
        this.suitSymbols = {
            'S': '♠', // Spades
            'H': '♥', // Hearts
            'D': '♦', // Diamonds
            'C': '♣'  // Clubs
        };
        
        this.suitClasses = {
            'S': 'spade',
            'H': 'heart',
            'D': 'diamond',
            'C': 'club'
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.generateDeck();
        this.initializeFirebase();
    }
    
    bindEvents() {
        // Start screen events
        document.getElementById('playerName').addEventListener('input', (e) => {
            this.playerName = e.target.value || 'Player';
        });
        
        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.createRoom();
        });
        
        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            document.getElementById('roomCodeSection').classList.remove('hidden');
        });
        
        document.getElementById('joinWithCodeBtn').addEventListener('click', () => {
            const roomCode = document.getElementById('roomCode').value.toUpperCase();
            if (roomCode.length === 6) {
                this.joinRoom(roomCode);
            } else {
                this.showMessage('Please enter a valid 6-character room code');
            }
        });
        
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('leaveRoomBtn').addEventListener('click', () => {
            this.leaveRoom();
        });
        
        document.getElementById('copyCodeBtn').addEventListener('click', () => {
            this.copyRoomCode();
        });
        
        // Game controls
        document.getElementById('sortCardsBtn').addEventListener('click', () => {
            this.sortCards();
        });
        
        document.getElementById('soundToggleBtn').addEventListener('click', () => {
            this.toggleSound();
        });
        
        document.getElementById('gameMenuBtn').addEventListener('click', () => {
            this.showGameMenu();
        });
        
        document.getElementById('bidSlider').addEventListener('input', (e) => {
            document.getElementById('bidValue').textContent = e.target.value;
        });
        
        document.querySelectorAll('.bid-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bid = parseInt(e.target.dataset.bid);
                document.getElementById('bidSlider').value = bid;
                document.getElementById('bidValue').textContent = bid;
            });
        });
        
        document.getElementById('submitBidBtn').addEventListener('click', () => {
            this.submitBid();
        });
        
        // Menu events
        document.getElementById('closeMenuBtn').addEventListener('click', () => {
            this.hideGameMenu();
        });
        
        document.getElementById('restartGameBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('leaveGameBtn').addEventListener('click', () => {
            this.leaveGame();
        });
        
        document.getElementById('rulesBtn').addEventListener('click', () => {
            this.showRules();
        });
        
        document.getElementById('soundToggleMenu').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            document.getElementById('soundToggleBtn').innerHTML = 
                this.soundEnabled ? '<i class="fas fa-volume-up"></i> Sound' : '<i class="fas fa-volume-mute"></i> Sound';
        });
        
        // Rules modal
        document.getElementById('closeRulesBtn').addEventListener('click', () => {
            document.getElementById('rulesModal').classList.add('hidden');
        });
        
        // Score screen events
        document.getElementById('nextRoundBtn').addEventListener('click', () => {
            this.nextRound();
        });
        
        document.getElementById('backToLobbyBtn').addEventListener('click', () => {
            this.leaveGame();
        });
        
        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.newGame();
        });
        
        // Click outside modals to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }
    
    initializeFirebase() {
        // Firebase initialization is in firebase.js
        // This method will be called from firebase.js when ready
        this.firebaseInitialized = true;
        console.log('Game initialized, waiting for Firebase setup...');
    }
    
    generateDeck() {
        this.cards = [];
        const suits = ['S', 'H', 'D', 'C'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        suits.forEach(suit => {
            values.forEach(value => {
                this.cards.push({
                    suit: suit,
                    value: value,
                    code: value + suit,
                    points: this.cardValues[value]
                });
            });
        });
    }
    
    shuffleDeck() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    createRoom() {
        if (!this.firebaseInitialized) {
            this.showMessage('Firebase not initialized. Please check configuration.');
            return;
        }
        
        this.playerName = document.getElementById('playerName').value || 'Player';
        
        // Generate room code (6 characters)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let roomCode = '';
        for (let i = 0; i < 6; i++) {
            roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        this.roomId = roomCode;
        this.playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Create room in Firebase
        const roomData = {
            code: roomCode,
            created: Date.now(),
            status: 'waiting',
            players: {
                [this.playerId]: {
                    id: this.playerId,
                    name: this.playerName,
                    ready: true,
                    position: 0
                }
            },
            gameState: {
                phase: 'waiting',
                round: 1,
                dealer: 0
            }
        };
        
        // Save to Firebase
        window.firebaseDB.ref('rooms/' + roomCode).set(roomData)
            .then(() => {
                this.showScreen('waitingScreen');
                document.getElementById('displayRoomCode').textContent = roomCode;
                document.getElementById('gameRoomCode').textContent = roomCode;
                this.updateWaitingRoom([this.playerName, '', '', '']);
                this.listenToRoomUpdates();
            })
            .catch(error => {
                console.error('Error creating room:', error);
                this.showMessage('Failed to create room. Please try again.');
            });
    }
    
    joinRoom(roomCode) {
        if (!this.firebaseInitialized) {
            this.showMessage('Firebase not initialized. Please check configuration.');
            return;
        }
        
        this.playerName = document.getElementById('playerName').value || 'Player';
        this.playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.roomId = roomCode;
        
        // Check if room exists
        window.firebaseDB.ref('rooms/' + roomCode).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    const room = snapshot.val();
                    
                    // Check if room is full
                    const playerCount = room.players ? Object.keys(room.players).length : 0;
                    if (playerCount >= 4) {
                        this.showMessage('Room is full (4/4 players)');
                        return;
                    }
                    
                    // Find available position
                    const positions = [0, 1, 2, 3];
                    const takenPositions = [];
                    
                    if (room.players) {
                        Object.values(room.players).forEach(player => {
                            takenPositions.push(player.position);
                        });
                    }
                    
                    const availablePositions = positions.filter(p => !takenPositions.includes(p));
                    const playerPosition = availablePositions[0];
                    
                    // Add player to room
                    const playerData = {
                        id: this.playerId,
                        name: this.playerName,
                        ready: false,
                        position: playerPosition
                    };
                    
                    window.firebaseDB.ref('rooms/' + roomCode + '/players/' + this.playerId).set(playerData)
                        .then(() => {
                            this.showScreen('waitingScreen');
                            document.getElementById('displayRoomCode').textContent = roomCode;
                            document.getElementById('gameRoomCode').textContent = roomCode;
                            this.listenToRoomUpdates();
                        })
                        .catch(error => {
                            console.error('Error joining room:', error);
                            this.showMessage('Failed to join room. Please try again.');
                        });
                } else {
                    this.showMessage('Room not found. Please check the code.');
                }
            })
            .catch(error => {
                console.error('Error checking room:', error);
                this.showMessage('Error connecting to server.');
            });
    }
    
    listenToRoomUpdates() {
        window.firebaseDB.ref('rooms/' + this.roomId).on('value', snapshot => {
            if (snapshot.exists()) {
                const room = snapshot.val();
                
                // Update player list in waiting room
                if (room.players) {
                    const playerNames = ['', '', '', ''];
                    const playerIds = ['', '', '', ''];
                    
                    Object.values(room.players).forEach(player => {
                        playerNames[player.position] = player.name;
                        playerIds[player.position] = player.id;
                    });
                    
                    this.updateWaitingRoom(playerNames);
                    
                    // Show/hide start button for room creator
                    const isCreator = playerIds[0] === this.playerId;
                    const allReady = Object.values(room.players).every(p => p.ready);
                    const playerCount = Object.keys(room.players).length;
                    
                    document.getElementById('startGameBtn').classList.toggle('hidden', !(isCreator && playerCount === 4 && allReady));
                    
                    // Update player count
                    document.getElementById('playerCount').textContent = playerCount;
                }
                
                // Update game state if game has started
                if (room.gameState && room.gameState.phase !== 'waiting') {
                    this.gameState = room.gameState;
                    this.updateGameUI();
                    
                    if (room.gameState.phase === 'playing' || room.gameState.phase === 'bidding') {
                        this.showScreen('gameScreen');
                    } else if (room.gameState.phase === 'scoring') {
                        this.showScoreScreen();
                    }
                }
            }
        });
    }
    
    updateWaitingRoom(playerNames) {
        for (let i = 0; i < 4; i++) {
            const playerElement = document.getElementById(`waitingPlayer${i + 1}`);
            const nameElement = playerElement.querySelector('.player-name');
            const statusElement = playerElement.querySelector('.player-status');
            
            if (playerNames[i]) {
                nameElement.textContent = playerNames[i];
                playerElement.classList.add('active');
                
                // Check if this is the current player
                if (playerNames[i] === this.playerName) {
                    statusElement.textContent = 'YOU';
                    statusElement.className = 'player-status ready';
                } else {
                    // In a real implementation, we'd check actual ready status
                    statusElement.textContent = 'READY';
                    statusElement.className = 'player-status ready';
                }
            } else {
                nameElement.textContent = 'Waiting...';
                playerElement.classList.remove('active');
                statusElement.textContent = 'IDLE';
                statusElement.className = 'player-status idle';
            }
        }
    }
    
    copyRoomCode() {
        const roomCode = document.getElementById('displayRoomCode').textContent;
        navigator.clipboard.writeText(roomCode)
            .then(() => {
                const btn = document.getElementById('copyCodeBtn');
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    }
    
    leaveRoom() {
        if (this.roomId && this.playerId) {
            // Remove player from room
            window.firebaseDB.ref('rooms/' + this.roomId + '/players/' + this.playerId).remove()
                .then(() => {
                    // If room becomes empty, delete it
                    window.firebaseDB.ref('rooms/' + this.roomId + '/players').once('value')
                        .then(snapshot => {
                            if (!snapshot.exists() || Object.keys(snapshot.val()).length === 0) {
                                window.firebaseDB.ref('rooms/' + this.roomId).remove();
                            }
                        });
                    
                    this.roomId = null;
                    this.playerId = null;
                    this.showScreen('startScreen');
                })
                .catch(error => {
                    console.error('Error leaving room:', error);
                });
        } else {
            this.showScreen('startScreen');
        }
    }
    
    startGame() {
        // Initialize game state
        this.shuffleDeck();
        
        // Deal cards to each player (13 cards each)
        const players = {};
        const playerPositions = {};
        
        // Get player info from Firebase
        window.firebaseDB.ref('rooms/' + this.roomId + '/players').once('value')
            .then(snapshot => {
                const playersData = snapshot.val();
                
                Object.values(playersData).forEach((player, index) => {
                    players[player.id] = {
                        name: player.name,
                        position: player.position,
                        cards: [],
                        bid: 0,
                        tricksWon: 0,
                        score: 0
                    };
                    
                    playerPositions[player.position] = player.id;
                });
                
                // Deal cards
                for (let i = 0; i < 52; i++) {
                    const playerId = playerPositions[i % 4];
                    players[playerId].cards.push(this.cards[i]);
                }
                
                // Initialize game state
                const gameState = {
                    phase: 'bidding',
                    players: players,
                    currentPlayer: playerPositions[0], // First player starts bidding
                    dealer: playerPositions[0],
                    trumpSuit: 'S',
                    currentTrick: [],
                    trickWinner: null,
                    round: 1,
                    scores: {},
                    bids: {},
                    tricksWon: {},
                    playerOrder: Object.values(playerPositions),
                    playerPosition: 0,
                    gameStarted: true
                };
                
                // Update Firebase
                return window.firebaseDB.ref('rooms/' + this.roomId + '/gameState').set(gameState);
            })
            .then(() => {
                console.log('Game started successfully');
            })
            .catch(error => {
                console.error('Error starting game:', error);
            });
    }
    
    updateGameUI() {
        const gameState = this.gameState;
        const playerId = this.playerId;
        
        // Update phase indicator
        document.getElementById('gamePhase').textContent = 
            gameState.phase === 'bidding' ? 'BIDDING PHASE' : 
            gameState.phase === 'playing' ? 'PLAYING PHASE' : 'GAME OVER';
        
        // Update current player name
        if (gameState.currentPlayer === playerId) {
            document.getElementById('currentPlayerName').textContent = 'Your Turn';
        } else if (gameState.players[gameState.currentPlayer]) {
            document.getElementById('currentPlayerName').textContent = gameState.players[gameState.currentPlayer].name;
        }
        
        // Update player info
        if (gameState.players[playerId]) {
            const player = gameState.players[playerId];
            document.getElementById('playerInfoName').textContent = 'You';
            document.getElementById('playerBid').textContent = player.bid || '-';
            document.getElementById('playerTricks').textContent = player.tricksWon || 0;
            document.getElementById('playerCardCount').textContent = player.cards ? player.cards.length : 13;
            
            // Show/hide bidding controls
            if (gameState.phase === 'bidding' && gameState.currentPlayer === playerId) {
                document.getElementById('biddingControls').classList.remove('hidden');
            } else {
                document.getElementById('biddingControls').classList.add('hidden');
            }
            
            // Render player cards
            this.renderPlayerCards(player.cards || []);
        }
        
        // Update opponents
        this.updateOpponents();
        
        // Update current trick
        this.updateTrickDisplay();
    }
    
    updateOpponents() {
        const gameState = this.gameState;
        const playerId = this.playerId;
        
        if (!gameState.players[playerId]) return;
        
        const playerPosition = gameState.players[playerId].position;
        
        // Map positions to opponents
        const opponentPositions = [
            (playerPosition + 1) % 4, // Top
            (playerPosition + 2) % 4, // Right
            (playerPosition + 3) % 4  // Left
        ];
        
        // Find opponent IDs
        const opponents = {};
        Object.entries(gameState.players).forEach(([id, player]) => {
            if (id !== playerId) {
                opponents[player.position] = { id, ...player };
            }
        });
        
        // Update top opponent
        const topOpponent = opponents[opponentPositions[0]];
        if (topOpponent) {
            document.getElementById('opponentTop').querySelector('.opponent-name').textContent = topOpponent.name;
            document.getElementById('opponentTop').querySelector('.opponent-cards span').textContent = topOpponent.cards ? topOpponent.cards.length : 13;
            document.getElementById('opponentTop').querySelector('.bid-display span').textContent = topOpponent.bid || '-';
            document.getElementById('opponentTop').querySelector('.tricks-display span').textContent = topOpponent.tricksWon || 0;
        }
        
        // Update right opponent
        const rightOpponent = opponents[opponentPositions[1]];
        if (rightOpponent) {
            document.getElementById('opponentRight').querySelector('.opponent-name').textContent = rightOpponent.name;
            document.getElementById('opponentRight').querySelector('.opponent-cards span').textContent = rightOpponent.cards ? rightOpponent.cards.length : 13;
            document.getElementById('opponentRight').querySelector('.bid-display span').textContent = rightOpponent.bid || '-';
            document.getElementById('opponentRight').querySelector('.tricks-display span').textContent = rightOpponent.tricksWon || 0;
        }
        
        // Update left opponent
        const leftOpponent = opponents[opponentPositions[2]];
        if (leftOpponent) {
            document.getElementById('opponentLeft').querySelector('.opponent-name').textContent = leftOpponent.name;
            document.getElementById('opponentLeft').querySelector('.opponent-cards span').textContent = leftOpponent.cards ? leftOpponent.cards.length : 13;
            document.getElementById('opponentLeft').querySelector('.bid-display span').textContent = leftOpponent.bid || '-';
            document.getElementById('opponentLeft').querySelector('.tricks-display span').textContent = leftOpponent.tricksWon || 0;
        }
    }
    
    renderPlayerCards(cards) {
        const container = document.getElementById('playerCards');
        container.innerHTML = '';
        
        cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = `card ${this.suitClasses[card.suit]} dealt`;
            cardElement.dataset.index = index;
            cardElement.dataset.card = card.code;
            
            // Determine if card is playable
            const isPlayable = this.isCardPlayable(card);
            if (isPlayable) {
                cardElement.classList.add('playable');
            }
            
            cardElement.innerHTML = `
                <div class="card-corner top-left">${card.value}</div>
                <div class="card-suit">${this.suitSymbols[card.suit]}</div>
                <div class="card-corner bottom-right">${card.value}</div>
            `;
            
            cardElement.addEventListener('click', () => {
                if (isPlayable) {
                    this.playCard(card);
                }
            });
            
            container.appendChild(cardElement);
        });
    }
    
    isCardPlayable(card) {
        const gameState = this.gameState;
        const playerId = this.playerId;
        
        if (gameState.phase !== 'playing' || gameState.currentPlayer !== playerId) {
            return false;
        }
        
        // If no cards have been played in this trick, any card is playable
        if (gameState.currentTrick.length === 0) {
            return true;
        }
        
        // Get the suit of the first card played in this trick
        const firstCardSuit = gameState.currentTrick[0].card.suit;
        
        // Check if player has any cards of the same suit
        const playerCards = gameState.players[playerId].cards || [];
        const hasSameSuit = playerCards.some(c => c.suit === firstCardSuit);
        
        // If player has cards of the same suit, they must play one
        if (hasSameSuit) {
            return card.suit === firstCardSuit;
        }
        
        // If player doesn't have cards of the same suit, any card is playable
        return true;
    }
    
    updateTrickDisplay() {
        const container = document.getElementById('trickCards');
        container.innerHTML = '';
        
        if (this.gameState.currentTrick && this.gameState.currentTrick.length > 0) {
            this.gameState.currentTrick.forEach(trickCard => {
                const cardElement = document.createElement('div');
                cardElement.className = `card ${this.suitClasses[trickCard.card.suit]} small`;
                cardElement.innerHTML = `
                    <div class="card-corner top-left">${trickCard.card.value}</div>
                    <div class="card-suit">${this.suitSymbols[trickCard.card.suit]}</div>
                    <div class="card-corner bottom-right">${trickCard.card.value}</div>
                `;
                container.appendChild(cardElement);
            });
        } else {
            container.innerHTML = '<div class="empty-trick">No cards played yet</div>';
        }
    }
    
    submitBid() {
        const bidValue = parseInt(document.getElementById('bidValue').textContent);
        
        if (this.gameState.phase !== 'bidding' || this.gameState.currentPlayer !== this.playerId) {
            return;
        }
        
        // Update local game state
        this.gameState.players[this.playerId].bid = bidValue;
        this.gameState.bids[this.playerId] = bidValue;
        
        // Move to next player
        const currentIndex = this.gameState.playerOrder.indexOf(this.playerId);
        const nextIndex = (currentIndex + 1) % 4;
        this.gameState.currentPlayer = this.gameState.playerOrder[nextIndex];
        
        // Check if all players have bid
        const allBidsIn = Object.keys(this.gameState.bids).length === 4;
        
        if (allBidsIn) {
            // Check if total bids equal 13 (not allowed)
            const totalBids = Object.values(this.gameState.bids).reduce((sum, bid) => sum + bid, 0);
            
            if (totalBids === 13) {
                // Reset bids and start over
                this.gameState.bids = {};
                this.gameState.currentPlayer = this.gameState.playerOrder[0];
                
                // Show error message
                this.showMessage('Total bids cannot equal 13. Please bid again.', true);
            } else {
                // Move to playing phase
                this.gameState.phase = 'playing';
                this.gameState.currentPlayer = this.gameState.playerOrder[0]; // First player leads
            }
        }
        
        // Update Firebase
        this.updateGameState();
    }
    
    playCard(card) {
        if (this.gameState.phase !== 'playing' || this.gameState.currentPlayer !== this.playerId) {
            return;
        }
        
        // Play card sound
        this.playCardSound();
        
        // Find card index in player's hand
        const playerCards = this.gameState.players[this.playerId].cards;
        const cardIndex = playerCards.findIndex(c => c.code === card.code);
        
        if (cardIndex === -1) return;
        
        // Remove card from player's hand
        const playedCard = playerCards.splice(cardIndex, 1)[0];
        
        // Add to current trick
        this.gameState.currentTrick.push({
            playerId: this.playerId,
            card: playedCard
        });
        
        // Move to next player
        const currentIndex = this.gameState.playerOrder.indexOf(this.playerId);
        const nextIndex = (currentIndex + 1) % 4;
        this.gameState.currentPlayer = this.gameState.playerOrder[nextIndex];
        
        // Check if trick is complete (4 cards played)
        if (this.gameState.currentTrick.length === 4) {
            // Determine trick winner
            setTimeout(() => {
                this.determineTrickWinner();
            }, 1000);
        }
        
        // Update Firebase
        this.updateGameState();
    }
    
    determineTrickWinner() {
        const trick = this.gameState.currentTrick;
        if (trick.length !== 4) return;
        
        // Get the suit of the first card
        const ledSuit = trick[0].card.suit;
        
        // Find the highest card of the led suit, or the highest spade if any
        let winningCard = trick[0];
        let highestValue = this.cardValues[trick[0].card.value];
        let hasSpade = trick[0].card.suit === 'S';
        
        for (let i = 1; i < trick.length; i++) {
            const card = trick[i];
            const cardValue = this.cardValues[card.card.value];
            const isSpade = card.card.suit === 'S';
            
            // Spades trump everything
            if (isSpade && !hasSpade) {
                winningCard = card;
                highestValue = cardValue;
                hasSpade = true;
            } 
            // If we already have a spade and this is also a spade, compare values
            else if (isSpade && hasSpade && cardValue > highestValue) {
                winningCard = card;
                highestValue = cardValue;
            }
            // If no spades yet and this card matches the led suit, compare values
            else if (!hasSpade && card.card.suit === ledSuit && cardValue > highestValue) {
                winningCard = card;
                highestValue = cardValue;
            }
        }
        
        // Update tricks won
        this.gameState.players[winningCard.playerId].tricksWon = 
            (this.gameState.players[winningCard.playerId].tricksWon || 0) + 1;
        
        // Set trick winner and clear current trick
        this.gameState.trickWinner = winningCard.playerId;
        this.gameState.currentPlayer = winningCard.playerId; // Winner leads next trick
        this.gameState.currentTrick = [];
        
        // Check if round is complete (all 13 tricks played)
        const totalCardsPlayed = Object.values(this.gameState.players).reduce(
            (total, player) => total + (player.cards ? 13 - player.cards.length : 0), 0
        );
        
        if (totalCardsPlayed === 52) {
            // Round complete, calculate scores
            this.calculateScores();
            this.gameState.phase = 'scoring';
        }
        
        // Update Firebase
        this.updateGameState();
        
        // Show trick winner message
        const winnerName = this.gameState.players[winningCard.playerId].name;
        this.showMessage(`${winnerName} wins the trick!`, true);
    }
    
    calculateScores() {
        Object.values(this.gameState.players).forEach(player => {
            const bid = player.bid || 0;
            const tricksWon = player.tricksWon || 0;
            
            let score = 0;
            
            if (tricksWon === bid) {
                // Made exact bid: +10 points + bid amount
                score = 10 + bid;
            } else if (tricksWon > bid) {
                // Overtricks: +1 point per overtrick
                score = bid + (tricksWon - bid);
            } else {
                // Undertricks: -1 point per undertrick
                score = -(bid - tricksWon);
            }
            
            // Update player score
            player.score = (player.score || 0) + score;
        });
    }
    
    updateGameState() {
        if (this.roomId) {
            window.firebaseDB.ref('rooms/' + this.roomId + '/gameState').set(this.gameState)
                .catch(error => {
                    console.error('Error updating game state:', error);
                });
        }
    }
    
    showScoreScreen() {
        const gameState = this.gameState;
        
        // Update round number
        document.getElementById('roundNumber').textContent = gameState.round;
        
        // Create score display
        const scoreContainer = document.getElementById('playersScore');
        scoreContainer.innerHTML = '';
        
        const scoreDetails = document.getElementById('scoreDetails');
        scoreDetails.innerHTML = '';
        
        // Sort players by score (descending)
        const sortedPlayers = Object.values(gameState.players).sort((a, b) => (b.score || 0) - (a.score || 0));
        
        sortedPlayers.forEach((player, index) => {
            // Create score card
            const scoreCard = document.createElement('div');
            scoreCard.className = `player-score-card ${index === 0 ? 'winner' : ''}`;
            
            scoreCard.innerHTML = `
                <div class="player-score-header">
                    <div class="player-score-rank">${index + 1}</div>
                    <div class="player-score-name">${player.name}</div>
                </div>
                <div class="player-score-total">${player.score || 0}</div>
            `;
            
            scoreContainer.appendChild(scoreCard);
            
            // Add to score details table
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.name}</td>
                <td>${player.bid || 0}</td>
                <td>${player.tricksWon || 0}</td>
                <td>${player.score - (player.previousScore || 0) || 0}</td>
                <td>${player.score || 0}</td>
            `;
            
            scoreDetails.appendChild(row);
        });
        
        this.showScreen('scoreScreen');
    }
    
    nextRound() {
        // Increment round number
        this.gameState.round++;
        
        // Reset round-specific state
        this.gameState.phase = 'bidding';
        this.gameState.currentTrick = [];
        this.gameState.trickWinner = null;
        this.gameState.bids = {};
        
        // Save previous scores
        Object.values(this.gameState.players).forEach(player => {
            player.previousScore = player.score || 0;
            player.bid = 0;
            player.tricksWon = 0;
        });
        
        // Shuffle and deal new cards
        this.shuffleDeck();
        
        const playerPositions = {};
        Object.entries(this.gameState.players).forEach(([id, player]) => {
            playerPositions[player.position] = id;
            player.cards = [];
        });
        
        // Deal cards
        for (let i = 0; i < 52; i++) {
            const playerId = playerPositions[i % 4];
            this.gameState.players[playerId].cards.push(this.cards[i]);
        }
        
        // Rotate dealer
        const currentDealerIndex = this.gameState.playerOrder.indexOf(this.gameState.dealer);
        const nextDealerIndex = (currentDealerIndex + 1) % 4;
        this.gameState.dealer = this.gameState.playerOrder[nextDealerIndex];
        
        // First player after dealer starts bidding
        const firstBidderIndex = (nextDealerIndex + 1) % 4;
        this.gameState.currentPlayer = this.gameState.playerOrder[firstBidderIndex];
        
        // Update Firebase
        this.updateGameState();
        
        // Show game screen
        this.showScreen('gameScreen');
    }
    
    newGame() {
        // Reset game completely
        this.leaveGame();
        this.createRoom();
    }
    
    leaveGame() {
        this.leaveRoom();
    }
    
    restartGame() {
        if (confirm('Are you sure you want to restart the game? All players will need to rejoin.')) {
            // Delete the room and create a new one
            if (this.roomId) {
                window.firebaseDB.ref('rooms/' + this.roomId).remove();
            }
            this.createRoom();
        }
    }
    
    showGameMenu() {
        document.getElementById('gameMenuModal').classList.remove('hidden');
    }
    
    hideGameMenu() {
        document.getElementById('gameMenuModal').classList.add('hidden');
    }
    
    showRules() {
        document.getElementById('gameMenuModal').classList.add('hidden');
        document.getElementById('rulesModal').classList.remove('hidden');
    }
    
    sortCards() {
        const player = this.gameState.players[this.playerId];
        if (!player || !player.cards) return;
        
        // Sort by suit (S, H, D, C) then by value (high to low)
        player.cards.sort((a, b) => {
            const suitOrder = { 'S': 0, 'H': 1, 'D': 2, 'C': 3 };
            const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
            
            if (suitDiff !== 0) return suitDiff;
            
            return this.cardValues[b.value] - this.cardValues[a.value];
        });
        
        this.renderPlayerCards(player.cards);
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        document.getElementById('soundToggleBtn').innerHTML = 
            this.soundEnabled ? '<i class="fas fa-volume-up"></i> Sound' : '<i class="fas fa-volume-mute"></i> Sound';
        document.getElementById('soundToggleMenu').checked = this.soundEnabled;
    }
    
    playCardSound() {
        if (this.soundEnabled) {
            const audio = document.getElementById('cardSound');
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        });
        
        // Show requested screen
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            screen.classList.remove('hidden');
        }
    }
    
    showMessage(text, isTemporary = false) {
        const messageElement = document.getElementById('gameMessage');
        const messageText = document.getElementById('messageText');
        
        messageText.textContent = text;
        messageElement.classList.remove('hidden');
        
        if (isTemporary) {
            setTimeout(() => {
                messageElement.classList.add('hidden');
            }, 3000);
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new CallBreakGame();
});