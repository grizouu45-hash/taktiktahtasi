const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const pitchContainer = document.getElementById('pitch-container');
const bench = document.getElementById('bench');
const colorPicker = document.getElementById('colorPicker');

canvas.width = 800;
canvas.height = 500;

let currentTool = 'move';
let isDrawing = false;
let startX, startY;
let playersOnPitch = 0;

// Çizim geçmişini tutan dizi (Geri al özelliği için)
let drawingHistory = [];

// Oyuncuları Başlat
for (let i = 1; i <= 11; i++) { addPlayerToBench(i); }

function addPlayerToBench(num) {
    const playerDiv = document.createElement('div');
    playerDiv.className = 'player';
    const numberSpan = document.createElement('span');
    numberSpan.className = 'player-number';
    numberSpan.innerText = num || document.querySelectorAll('.player').length + 1;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'player-name';
    nameSpan.innerText = "Oyuncu";
    playerDiv.appendChild(numberSpan);
    playerDiv.appendChild(nameSpan);
    playerDiv.draggable = true;
    playerDiv.onmousedown = startDragging;
    playerDiv.ondblclick = function() {
        const newNum = prompt("Forma Numarası:", numberSpan.innerText);
        const newName = prompt("Oyuncu İsmi:", nameSpan.innerText);
        if (newNum !== null) numberSpan.innerText = newNum;
        if (newName !== null) nameSpan.innerText = newName;
    };
    bench.appendChild(playerDiv);
}

// Çizim Olayları
canvas.onmousedown = (e) => {
    if (currentTool === 'move') return;
    isDrawing = true;
    startX = e.offsetX;
    startY = e.offsetY;
};

canvas.onmousemove = (e) => {
    if (!isDrawing) return;
    
    // Her harekette ekranı temizle ve geçmişi tekrar çiz (Önizleme için)
    redrawCanvas();
    
    // O anki taslağı çiz
    drawShape(startX, startY, e.offsetX, e.offsetY, currentTool, colorPicker.value);
};

canvas.onmouseup = (e) => {
    if (!isDrawing) return;
    isDrawing = false;
    
    // Çizimi kalıcı hafızaya ekle
    drawingHistory.push({
        startX, startY,
        endX: e.offsetX,
        endY: e.offsetY,
        tool: currentTool,
        color: colorPicker.value
    });
    
    redrawCanvas();
};

// Şekil Çizme Fonksiyonu (Hem önizleme hem geçmiş için ortak)
function drawShape(x1, y1, x2, y2, tool, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();

    if (tool === 'line') {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    } else if (tool === 'dashed') {
        ctx.setLineDash([10, 10]);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    } else if (tool === 'arrow') {
        drawArrow(x1, y1, x2, y2);
    } else if (tool === 'circle') {
        let radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
    }

    ctx.stroke();
    ctx.setLineDash([]); // Kesikli çizgiyi sıfırla
}

function drawArrow(fromx, fromy, tox, toy) {
    let headlen = 15;
    let angle = Math.atan2(toy - fromy, tox - fromx);
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
}

// Ekranı Geçmişe Göre Yeniden Çiz
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingHistory.forEach(item => {
        drawShape(item.startX, item.startY, item.endX, item.endY, item.tool, item.color);
    });
}

// Geri Al
function undo() {
    drawingHistory.pop(); // Son elemanı sil
    redrawCanvas();
}

// Temizle
function clearCanvas() {
    drawingHistory = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ... Diğer fonksiyonlar (startDragging, applyFormation vb.) önceki kodla aynı kalacak ...

function setTool(tool) {
    currentTool = tool;
    canvas.style.pointerEvents = tool === 'move' ? 'none' : 'auto';
}

function startDragging(e) {
    if (currentTool !== 'move') return;
    activePlayer = e.target.closest('.player');
    if (!activePlayer) return;
    activePlayer.style.zIndex = 1000;
    document.onmousemove = function(e) {
        if (!activePlayer) return;
        let rect = pitchContainer.getBoundingClientRect();
        let x = e.clientX - rect.left - 17;
        let y = e.clientY - rect.top - 17;
        if(e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            if (activePlayer.parentElement.id === 'bench') {
                pitchContainer.appendChild(activePlayer);
                playersOnPitch++;
            }
            activePlayer.style.left = (x / rect.width * 100) + '%';
            activePlayer.style.top = (y / rect.height * 100) + '%';
            activePlayer.style.position = 'absolute';
        } else {
            if (activePlayer.parentElement.id !== 'bench') {
                bench.appendChild(activePlayer);
                activePlayer.style.position = 'static';
                playersOnPitch--;
            }
        }
    };
    document.onmouseup = function() { activePlayer = null; document.onmousemove = null; };
}

function updateTeamName() {
    document.getElementById('teamNameDisplay').innerText = document.getElementById('teamNameInput').value || "BENİM TAKIMIM";
}

function applyFormation() {
    const formation = document.getElementById('formationSelect').value;
    if (formation === 'custom') return;
    const players = document.querySelectorAll('.player');
    players.forEach(p => { bench.appendChild(p); p.style.position = 'static'; });
    playersOnPitch = 0;
    const coords = {
        '442': [[5,50], [20,20], [20,40], [20,60], [20,80], [50,20], [50,40], [50,60], [50,80], [80,35], [80,65]],
        '433': [[5,50], [20,20], [20,40], [20,60], [20,80], [50,30], [50,50], [50,70], [80,20], [85,50], [80,80]],
        '4231': [[5,50], [20,20], [20,40], [20,60], [20,80], [40,35], [40,65], [65,20], [65,50], [65,80], [85,50]],
        '352': [[5,50], [20,25], [20,50], [20,75], [45,15], [45,33], [45,50], [45,66], [45,85], [80,40], [80,60]]
    };
    const selectedCoords = coords[formation];
    for (let i = 0; i < 11; i++) {
        if(players[i]) {
            let p = players[i];
            pitchContainer.appendChild(p);
            p.style.position = 'absolute';
            p.style.left = selectedCoords[i][0] + '%';
            p.style.top = selectedCoords[i][1] + '%';
            playersOnPitch++;
        }
    }
}