// Estado de la aplicación
let players = [];
let blueTeam = [];
let redTeam = [];

// Configuración de puntos de poder
const POWER_POINTS = {
    ranks: {
        'Hierro': 10,
        'Bronce': 20,
        'Plata': 35,
        'Oro': 55,
        'Platino': 80,
        'Esmeralda': 110,
        'Diamante': 150,
        'Maestro': 200,
        'Gran Maestro': 270,
        'Aspirante': 350
    },
    victoryPositions: [50, 40, 35, 30, 25, 20, 15, 10, 5, 0]
};

// ============= SISTEMA DE NOTIFICACIONES =============
function showNotification(title, message, type = 'info', duration = 4000) {
    const container = document.getElementById('notification-container');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'info' ? 'ℹ️' : '🎲';
    
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Mostrar notificación con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Ocultar después del tiempo especificado
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (container.contains(notification)) {
                container.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// ============= FUNCIONES DE UTILIDAD =============
function generateId() {
    return Date.now() + Math.random();
}

function getRankClass(rank) {
    return 'rank-' + rank.toLowerCase().replace(/\s+/g, '-');
}

// ============= CÁLCULO DE PUNTOS DE PODER =============
function calculateBasePowerPoints(rank) {
    return POWER_POINTS.ranks[rank] || 0;
}

function getVictoryRanking() {
    return [...players].sort((a, b) => {
        if (b.victorias !== a.victorias) {
            return b.victorias - a.victorias;
        }
        return a.id - b.id;
    });
}

function calculateVictoryPoints(player) {
    const victoryRanking = getVictoryRanking();
    const position = victoryRanking.findIndex(p => p.id === player.id);
    
    if (position >= 0 && position < POWER_POINTS.victoryPositions.length) {
        return POWER_POINTS.victoryPositions[position];
    }
    return 0;
}

function calculateTotalPowerPoints(player) {
    const basePower = calculateBasePowerPoints(player.rango);
    const victoryPower = calculateVictoryPoints(player);
    return basePower + victoryPower;
}

function getRankedPlayers() {
    const playersWithPoints = players.map(player => ({
        ...player,
        powerPoints: calculateTotalPowerPoints(player)
    }));
    return playersWithPoints.sort((a, b) => b.powerPoints - a.powerPoints);
}

// ============= MANEJO DE JUGADORES =============
function addPlayer(name, rank) {
    const player = {
        id: generateId(),
        nombre: name,
        rango: rank,
        victorias: 0
    };
    players.push(player);
    updateUI();
    
    showNotification(
        'Jugador agregado',
        `${name} (${rank}) se ha unido al torneo`,
        'success'
    );
}

function deletePlayer(id) {
    const player = players.find(p => p.id === id);
    players = players.filter(player => player.id !== id);
    updateUI();
    
    if (player) {
        showNotification(
            'Jugador eliminado',
            `${player.nombre} ha sido eliminado del torneo`,
            'info'
        );
    }
}

function editPlayerRank(id, newRank) {
    const player = players.find(player => player.id === id);
    if (player) {
        player.rango = newRank;
        updateUI();
    }
}

function makeRankEditable(playerId, element) {
    const ranks = Object.keys(POWER_POINTS.ranks);
    const player = players.find(player => player.id === playerId);
    if (!player) return;

    const select = document.createElement('select');
    select.className = 'rank-select';
    
    ranks.forEach(rank => {
        const option = document.createElement('option');
        option.value = rank;
        option.text = rank;
        option.selected = rank === player.rango;
        select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
        editPlayerRank(playerId, e.target.value);
        element.textContent = e.target.value;
        element.style.display = 'inline';
        select.remove();
    });

    select.addEventListener('blur', () => {
        element.style.display = 'inline';
        select.remove();
    });

    element.style.display = 'none';
    element.parentNode.insertBefore(select, element.nextSibling);
    select.focus();
}

// ============= FUNCIONES DE EQUIPOS =============
function addToTeam(playerId, team) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    if (team === 'blue' && blueTeam.length < 5) {
        blueTeam.push(player);
    } else if (team === 'red' && redTeam.length < 5) {
        redTeam.push(player);
    }
    updateUI();
}

function removeFromTeam(playerId, team) {
    if (team === 'blue') {
        blueTeam = blueTeam.filter(p => p.id !== playerId);
    } else if (team === 'red') {
        redTeam = redTeam.filter(p => p.id !== playerId);
    }
    updateUI();
}

function calculateTeamPower(team) {
    return team.reduce((total, player) => {
        const playerWithPower = getRankedPlayers().find(p => p.id === player.id);
        return total + (playerWithPower ? playerWithPower.powerPoints : 0);
    }, 0);
}

function declareVictory(team) {
    const winningTeam = team === 'blue' ? blueTeam : redTeam;
    const teamName = team === 'blue' ? 'Azul' : 'Rojo';
    const teamEmoji = team === 'blue' ? '🔵' : '🔴';
    
    winningTeam.forEach(player => {
        const p = players.find(p => p.id === player.id);
        if (p) p.victorias++;
    });

    const playerNames = winningTeam.map(p => p.nombre).join(', ');
    
    blueTeam = [];
    redTeam = [];
    updateUI();
    
    showNotification(
        `${teamEmoji} Victoria del Equipo ${teamName}!`,
        `Ganadores: ${playerNames}`,
        'success',
        5000
    );
}

// ============= FUNCIONES DE CONFIGURACIÓN =============
function updateRankPointsConfig() {
    const container = document.getElementById('rankPointsConfig');
    const ranks = Object.keys(POWER_POINTS.ranks);
    
    container.innerHTML = ranks.map(rank => `
        <div class="config-item">
            <label class="config-label">${rank}</label>
            <div class="input-controls">
                <button class="control-btn" onclick="adjustRankPoints('${rank}', -5)">←</button>
                <input type="number" 
                       value="${POWER_POINTS.ranks[rank]}" 
                       onchange="updateRankPoints('${rank}', this.value)"
                       min="0"
                       step="5">
                <button class="control-btn" onclick="adjustRankPoints('${rank}', 5)">→</button>
            </div>
        </div>
    `).join('');
}

function updateVictoryPointsConfig() {
    const container = document.getElementById('victoryPointsConfig');
    
    container.innerHTML = POWER_POINTS.victoryPositions.map((points, index) => `
        <div class="config-item">
            <label class="config-label">Posición ${index + 1}º</label>
            <div class="input-controls">
                <button class="control-btn" onclick="adjustVictoryPoints(${index}, -5)">←</button>
                <input type="number" 
                       value="${points}" 
                       onchange="updateVictoryPoints(${index}, this.value)"
                       min="0"
                       step="5">
                <button class="control-btn" onclick="adjustVictoryPoints(${index}, 5)">→</button>
            </div>
        </div>
    `).join('');
}

function adjustRankPoints(rank, adjustment) {
    const currentValue = POWER_POINTS.ranks[rank];
    const newValue = Math.max(0, currentValue + adjustment);
    POWER_POINTS.ranks[rank] = newValue;
    updateRankPointsConfig();
    updateUI();
}

function adjustVictoryPoints(position, adjustment) {
    const currentValue = POWER_POINTS.victoryPositions[position];
    const newValue = Math.max(0, currentValue + adjustment);
    POWER_POINTS.victoryPositions[position] = newValue;
    updateVictoryPointsConfig();
    updateUI();
}

function updateRankPoints(rank, value) {
    POWER_POINTS.ranks[rank] = parseInt(value) || 0;
    updateUI();
}

function updateVictoryPoints(position, value) {
    POWER_POINTS.victoryPositions[position] = parseInt(value) || 0;
    updateUI();
}

// ============= FUNCIONES DE PERSISTENCIA =============
function exportData() {
    const data = {
        players: players,
        config: {
            rankPoints: POWER_POINTS.ranks,
            victoryPositions: POWER_POINTS.victoryPositions
        }
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'torneo_lol.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (Array.isArray(importedData)) {
                    players = importedData;
                } else if (importedData.players) {
                    players = importedData.players || [];
                    
                    if (importedData.config) {
                        if (importedData.config.rankPoints) {
                            POWER_POINTS.ranks = importedData.config.rankPoints;
                        }
                        if (importedData.config.victoryPositions) {
                            POWER_POINTS.victoryPositions = importedData.config.victoryPositions;
                        }
                    }
                }
                
                updateUI();
            } catch (error) {
                showNotification(
                    'Error al importar',
                    'No se pudo importar el archivo: ' + error.message,
                    'info'
                );
            }
        };
        reader.readAsText(file);
    }
    event.target.value = '';
}

// ============= FUNCIONES DE ACTUALIZACIÓN UI =============
function updatePlayersList() {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';

    getRankedPlayers().forEach(player => {
        const rankClass = getRankClass(player.rango);
        const li = document.createElement('li');
        li.className = 'player-item';
        li.innerHTML = `
            <div class="player-info">
                <span>${player.nombre}</span>
                <span class="rank-display ${rankClass}" onclick="makeRankEditable(${player.id}, this)">${player.rango}</span>
                <span>Victorias: ${player.victorias}</span>
            </div>
            <div class="player-actions">
                <button class="btn btn-delete" onclick="deletePlayer(${player.id})">
                    Eliminar
                </button>
            </div>
        `;
        playersList.appendChild(li);
    });
}

function updateRankingList() {
    const rankingList = document.getElementById('rankingList');
    const rankedPlayers = [...players]
        .sort((a, b) => b.victorias - a.victorias)
        .map(player => ({
            ...player,
            powerPoints: calculateTotalPowerPoints(player)
        }));
    
    let html = `
        <table class="ranking-table">
            <thead>
                <tr>
                    <th>Posición</th>
                    <th>Jugador</th>
                    <th>Rango</th>
                    <th>Victorias</th>
                    <th>Poder Base</th>
                    <th>Poder Victorias</th>
                    <th>Puntos de Poder</th>
                </tr>
            </thead>
            <tbody>
    `;

    rankedPlayers.forEach((player, index) => {
        const basePower = calculateBasePowerPoints(player.rango);
        const victoryPower = calculateVictoryPoints(player);
        const totalPower = basePower + victoryPower;
        const rankClass = getRankClass(player.rango);

        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${player.nombre}</td>
                <td><span class="rank-display ${rankClass}">${player.rango}</span></td>
                <td>${player.victorias}</td>
                <td>${basePower}</td>
                <td>${victoryPower}</td>
                <td class="power-points">${totalPower}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    rankingList.innerHTML = html;
}

function updateTeamsList() {
    const blueTeamList = document.getElementById('blueTeamList');
    blueTeamList.innerHTML = blueTeam.map(player => {
        const playerWithPower = getRankedPlayers().find(p => p.id === player.id);
        const rankClass = getRankClass(player.rango);
        return `
            <li class="team-player">
                <div class="team-player-info">
                    <span>${player.nombre}</span>
                    <span class="rank-display ${rankClass}">${player.rango}</span>
                    <span class="power-points">${playerWithPower ? playerWithPower.powerPoints : 0} pts</span>
                </div>
                <button class="btn btn-delete" onclick="removeFromTeam(${player.id}, 'blue')">Quitar</button>
            </li>
        `;
    }).join('');
    
    const redTeamList = document.getElementById('redTeamList');
    redTeamList.innerHTML = redTeam.map(player => {
        const playerWithPower = getRankedPlayers().find(p => p.id === player.id);
        const rankClass = getRankClass(player.rango);
        return `
            <li class="team-player">
                <div class="team-player-info">
                    <span>${player.nombre}</span>
                    <span class="rank-display ${rankClass}">${player.rango}</span>
                    <span class="power-points">${playerWithPower ? playerWithPower.powerPoints : 0} pts</span>
                </div>
                <button class="btn btn-delete" onclick="removeFromTeam(${player.id}, 'red')">Quitar</button>
            </li>
        `;
    }).join('');

    document.getElementById('bluePower').textContent = `${calculateTeamPower(blueTeam)} puntos`;
    document.getElementById('redPower').textContent = `${calculateTeamPower(redTeam)} puntos`;

    document.getElementById('blueVictoryBtn').disabled = blueTeam.length === 0;
    document.getElementById('redVictoryBtn').disabled = redTeam.length === 0;

    const playerSelectionList = document.getElementById('playerSelectionList');
    const assignedPlayers = [...blueTeam, ...redTeam].map(p => p.id);
    
    playerSelectionList.innerHTML = getRankedPlayers()
        .filter(player => !assignedPlayers.includes(player.id))
        .map(player => {
            const rankClass = getRankClass(player.rango);
            return `
                <tr>
                    <td>${player.nombre}</td>
                    <td><span class="rank-display ${rankClass}">${player.rango}</span></td>
                    <td class="power-points">${player.powerPoints}</td>
                    <td>
                        <button class="btn btn-add-blue" onclick="addToTeam(${player.id}, 'blue')"
                            ${blueTeam.length >= 5 ? 'disabled' : ''}>
                            Añadir al Azul
                        </button>
                        <button class="btn btn-add-red" onclick="addToTeam(${player.id}, 'red')"
                            ${redTeam.length >= 5 ? 'disabled' : ''}>
                            Añadir al Rojo
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
}

function updateUI() {
    updatePlayersList();
    updateRankingList();
    updateTeamsList();
    updateRankPointsConfig();
    updateVictoryPointsConfig();
    updateAutoTeamButton();
}

function updateAutoTeamButton() {
    const autoTeamBtn = document.getElementById('autoTeamBtn');
    if (autoTeamBtn) {
        if (players.length < 2) {
            autoTeamBtn.disabled = true;
            autoTeamBtn.textContent = '🎲 Necesitas al menos 2 jugadores';
        } else {
            autoTeamBtn.disabled = false;
            autoTeamBtn.textContent = '🎲 Armar Equipos Automáticamente';
        }
    }
}

// ============= SISTEMA DE PESTAÑAS =============
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// ============= ARMADO AUTOMÁTICO DE EQUIPOS =============
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function calculateTeamPower(team) {
    return team.reduce((total, player) => {
        const playerData = getRankedPlayers().find(p => p.id === player.id);
        return total + (playerData ? playerData.powerPoints : 0);
    }, 0);
}

function generateBalancedTeams() {
    if (players.length < 2) {
        showNotification(
            'Equipos insuficientes',
            'Necesitas al menos 2 jugadores para armar equipos.',
            'info'
        );
        return;
    }

    // Limpiar equipos existentes
    blueTeam = [];
    redTeam = [];

    // Obtener jugadores ordenados por poder
    const rankedPlayers = getRankedPlayers();
    
    // Si hay menos de 10 jugadores, usar todos
    const availablePlayers = rankedPlayers.slice(0, 10);
    
    // Algoritmo de balanceo por diferencias de poder
    let bestBlueTeam = [];
    let bestRedTeam = [];
    let smallestDifference = Infinity;
    
    // Intentar múltiples combinaciones aleatorias para encontrar la más balanceada
    for (let attempt = 0; attempt < 1000; attempt++) {
        const shuffledPlayers = shuffleArray(availablePlayers);
        const tempBlueTeam = [];
        const tempRedTeam = [];
        
        // Distribuir jugadores alternadamente pero con lógica de balanceo
        shuffledPlayers.forEach((player, index) => {
            const bluePower = calculateTeamPower(tempBlueTeam);
            const redPower = calculateTeamPower(tempRedTeam);
            
            // Si un equipo tiene menos jugadores, agregar ahí
            if (tempBlueTeam.length < tempRedTeam.length) {
                tempBlueTeam.push(player);
            } else if (tempRedTeam.length < tempBlueTeam.length) {
                tempRedTeam.push(player);
            } else {
                // Si tienen igual cantidad, agregar al equipo con menos poder
                if (bluePower <= redPower) {
                    tempBlueTeam.push(player);
                } else {
                    tempRedTeam.push(player);
                }
            }
            
            // Limitar a 5 jugadores por equipo
            if (tempBlueTeam.length >= 5 && tempRedTeam.length >= 5) {
                return;
            }
        });
        
        const bluePower = calculateTeamPower(tempBlueTeam);
        const redPower = calculateTeamPower(tempRedTeam);
        const difference = Math.abs(bluePower - redPower);
        
        if (difference < smallestDifference) {
            smallestDifference = difference;
            bestBlueTeam = [...tempBlueTeam];
            bestRedTeam = [...tempRedTeam];
        }
        
        // Si encontramos una diferencia muy pequeña, no seguir buscando
        if (difference <= 10) break;
    }
    
    blueTeam = bestBlueTeam;
    redTeam = bestRedTeam;
    
    updateUI();
    
    // Mostrar información del balanceo
    const bluePower = calculateTeamPower(blueTeam);
    const redPower = calculateTeamPower(redTeam);
    const difference = Math.abs(bluePower - redPower);
    
    setTimeout(() => {
        showNotification(
            '🎲 Equipos generados automáticamente',
            `🔵 Equipo Azul: ${bluePower} puntos\n🔴 Equipo Rojo: ${redPower} puntos\n📊 Diferencia: ${difference} puntos`,
            'success',
            6000
        );
    }, 500);
}

function clearTeams() {
    blueTeam = [];
    redTeam = [];
    updateUI();
    
    showNotification(
        'Equipos limpiados',
        'Ambos equipos han sido vaciados',
        'info'
    );
}

// ============= INICIALIZACIÓN =============
document.addEventListener('DOMContentLoaded', function() {
    updateRankPointsConfig();
    updateVictoryPointsConfig();
    
    document.getElementById('playerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('playerName');
        const rankInput = document.getElementById('playerRank');

        if (nameInput.value && rankInput.value) {
            addPlayer(nameInput.value, rankInput.value);
            nameInput.value = '';
            rankInput.value = '';
        }
    });
});
