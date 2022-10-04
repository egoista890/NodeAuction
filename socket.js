//WebSocket 구현

const SocketIO = require('socket.io');

module.exports = (server, app) => {
    //웹 소켓을 위한 객체 생성
    const io = SocketIO(server, {path:'/socket.io'});
    //웹 소켓의 이름을 설정
    app.set('io', io);

    io.on('connection', (socket) => {
        const req = socket.request;
        const {headers:{referer}} = req;
        //referer를 / 단위로 분할해서 가장 마지막 내용을 roomId에 저장
        const roomId = 
            referer.split('/')[referer.split('/').length - 1];
        socket.join(roomId);
        socket.on('disconnect', () => {
            socket.leave(roomId);
        })
    })
}