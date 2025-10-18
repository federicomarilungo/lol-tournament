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
        'Esmeralda': 110
    },
    victoryPositions: [50, 40, 35, 30, 25, 20, 15, 10, 5, 0]
};

// ============= FUNCIONES DE UTILIDAD =============
function generateId() {
    return Date.now() + Math.random();
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
}

function deletePlayer(id) {
    players = players.filter(player => player.id !== id);
    updateUI();
}

function editPlayerRank(id, newRank) {
    const player = players.find(player => player.id === id);
    if (player) {
        player.rango = newRank;
        updateUI();
    }
}

function makeRankEditable(playerId, element) {
    const ranks = ['Hierro', 'Bronce', 'Plata', 'Oro', 'Platino', 'Esmeralda'];
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
    
    winningTeam.forEach(player => {
        const p = players.find(p => p.id === player.id);
        if (p) p.victorias++;
    });

    blueTeam = [];
    redTeam = [];
    updateUI();
}

// ============= FUNCIONES DE CONFIGURACIÓN =============
function updateRankPointsConfig() {
    const container = document.getElementById('rankPointsConfig');
    const ranks = Object.keys(POWER_POINTS.ranks);
    
    container.innerHTML = ranks.map(rank => `
        <div class="config-item">
            <label>${rank}</label>
            <input type="number" 
                   value="${POWER_POINTS.ranks[rank]}" 
                   onchange="updateRankPoints('${rank}', this.value)"
                   min="0">
        </div>
    `).join('');
}

function updateVictoryPointsConfig() {
    const container = document.getElementById('victoryPointsConfig');
    
    container.innerHTML = POWER_POINTS.victoryPositions.map((points, index) => `
        <div class="config-item">
            <label>Posición ${index + 1}º</label>
            <input type="number" 
                   value="${points}" 
                   onchange="updateVictoryPoints(${index}, this.value)"
                   min="0">
        </div>
    `).join('');
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
                alert('Error al importar el archivo: ' + error.message);
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
        const rankClass = 'rank-' + player.rango.toLowerCase();
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
        const rankClass = 'rank-' + player.rango.toLowerCase();

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
        const rankClass = 'rank-' + player.rango.toLowerCase();
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
        const rankClass = 'rank-' + player.rango.toLowerCase();
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
            const rankClass = 'rank-' + player.rango.toLowerCase();
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

// ============= INICIALIZACIÓN =============
document.addEventListener('DOMContentLoaded', () => {
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
