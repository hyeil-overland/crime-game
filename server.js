const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/public'));

let players = [];
const REQUIRED_PLAYERS = 3; // 3인 테스트용

// 역할 데이터 (스토리에 맞춰 수정 가능)
const ROLES = [
    { name: "탐정", desc: "명탐정으로서 사건을 해결해야 합니다.", secret: "당신은 피해자의 오랜 친구입니다. 정의를 위해 범인을 잡으세요!", isCulprit: false },
    { name: "용의자 A (의사)", desc: "피해자의 개인 주치의입니다.", secret: "사실 당신은 약물을 빼돌리다 피해자에게 들킨 적이 있습니다. 범인은 아니지만 의심받기 딱 좋습니다.", isCulprit: false },
    { name: "범인 (비서)", desc: "피해자의 가장 가까운 조력자입니다.", secret: "당신이 범인입니다! 어제 유언장을 수정하려는 피해자를 보고 우발적으로 범행을 저질렀습니다.", isCulprit: true }
];

io.on('connection', (socket) => {
    // [입장]
    socket.on('join', (nickname) => {
        const newPlayer = { id: socket.id, nickname: nickname, role: null };
        players.push(newPlayer);
        
        // 인원수와 명단 업데이트 알림
        io.emit('updatePlayerCount', { current: players.length, required: REQUIRED_PLAYERS });
        io.emit('updatePlayerList', players.map(p => p.nickname));
        io.emit('chatAnnounce', { system: true, text: `${nickname}님이 입장했습니다.` });
    });

    // [게임 시작 버튼 클릭]
    socket.on('startGame', () => {
        if (players.length !== REQUIRED_PLAYERS) return;

        // 역할 랜덤 배정
        let shuffledRoles = [...ROLES].sort(() => Math.random() - 0.5);
        players.forEach((player, index) => {
            player.role = shuffledRoles[index];
            io.to(player.id).emit('assignRole', player.role);
        });

        io.emit('startStory'); // 모든 플레이어에게 스토리 시작 신호
    });

    // [브리핑 종료 후 게임 진입]
    socket.on('briefingFinished', () => {
        io.emit('gameStart');
    });

    // [단서 발견 공지]
    socket.on('clueFound', (data) => {
        io.emit('chatAnnounce', { system: false, ...data });
    });

    // [퇴장]
    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        io.emit('updatePlayerCount', { current: players.length, required: REQUIRED_PLAYERS });
        io.emit('updatePlayerList', players.map(p => p.nickname));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`3인용 크라임씬 서버 가동 중...`));