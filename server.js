const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    socket.on('join', (nickname) => {
        console.log(`${nickname}님이 접속했습니다.`);
        socket.emit('welcome', `${nickname}님, 저택에 오신 것을 환영합니다.`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서버가 포트 ${PORT}에서 실행 중...`));