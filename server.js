const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/public'));

let players = [];
// 💡 나중에 이 숫자만 6으로 바꾸면 됩니다!
const REQUIRED_PLAYERS = 2; 

// 💡 나중에 이 배열에 역할만 추가하면 됩니다!
const ROLES = [
    { name: "탐정", desc: "사건의 진상을 밝혀야 합니다. 모든 단서를 조합해 범인을 찾으세요." },
    { name: "범인", desc: "당신이 범인입니다! 단서를 조작하거나 거짓말로 용의 선상에서 벗어나세요." }
];

io.on('connection', (socket) => {
    // [입장]
    socket.on('join', (nickname) => {
        if (players.length >= REQUIRED_PLAYERS + 2) return; // 여유 인원 외 차단
        players.push({ id: socket.id, nickname: nickname, role: null });
        
        io.emit('updatePlayerList', players.map(p => p.nickname));
        io.emit('updatePlayerCount', { current: players.length, required: REQUIRED_PLAYERS });
        io.emit('chatAnnounce', { system: true, text: `${nickname}님이 대기실에 입장했습니다.` });
    });

    // [게임 시작]
    socket.on('startGame', () => {
        if (players.length !== REQUIRED_PLAYERS) return;

        // 역할 랜덤 셔플
        let shuffledRoles = [...ROLES].sort(() => Math.random() - 0.5);
        players.forEach((player, index) => {
            player.role = shuffledRoles[index];
            io.to(player.id).emit('assignRole', player.role);
        });

        io.emit('gameStart');
    });

    // [단서 발견]
    socket.on('clueFound', (data) => {
        // 누가 어떤 단서를 찾았는지 모두에게 알림
        io.emit('chatAnnounce', { 
            system: false, 
            playerName: data.playerName, 
            clue: data.clue, 
            image: data.image 
        });
    });

    // [게임 종료]
    socket.on('endGame', () => {
        players.forEach(p => p.role = null); // 역할 초기화
        io.emit('returnToLobby');
    });

    // [퇴장]
    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        io.emit('updatePlayerList', players.map(p => p.nickname));
        io.emit('updatePlayerCount', { current: players.length, required: REQUIRED_PLAYERS });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서ber 가동 중... (필요 인원: ${REQUIRED_PLAYERS})`));