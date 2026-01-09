const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/public'));

// 접속자 명단을 저장할 배열
let players = [];

io.on('connection', (socket) => {
    console.log('새로운 연결 발생');

    // 플레이어가 닉네임을 입력하고 입장했을 때
    socket.on('join', (nickname) => {
        // 플레이어 정보 저장 (아이디와 닉네임)
        const newPlayer = { id: socket.id, nickname: nickname };
        players.push(newPlayer);

        console.log(`${nickname} 입장`);

        // 모든 클라이언트에게 업데이트된 접속자 명단 전송
        io.emit('updatePlayerList', players.map(p => p.nickname));
        
        // 시스템 메시지로 입장 알림
        io.emit('chatAnnounce', { system: true, text: `${nickname}님이 저택에 들어왔습니다.` });
    });

    // 단서 발견 통보
    socket.on('clueFound', (data) => {
        io.emit('chatAnnounce', { system: false, ...data });
    });

    // 연결이 끊겼을 때 (창을 닫았을 때)
    socket.on('disconnect', () => {
        const index = players.findIndex(p => p.id === socket.id);
        if (index !== -1) {
            const leftPlayer = players[index];
            players.splice(index, 1);
            console.log(`${leftPlayer.nickname} 퇴장`);

            // 명단 갱신 및 퇴장 알림
            io.emit('updatePlayerList', players.map(p => p.nickname));
            io.emit('chatAnnounce', { system: true, text: `${leftPlayer.nickname}님이 저택을 떠났습니다.` });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서버 가동 중... 포트: ${PORT}`));