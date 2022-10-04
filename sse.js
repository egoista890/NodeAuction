// Web Push 구현

const SSE = require('sse');

module.exports = (server) => {
    const sse = new SSE(server);
    //클라이언트가 웹 푸시에 연결하면
    sse.on('connection', (client) => {
        //주기적인 작업 - 1초 마다 현재 시간을 문자열로 전송
        setInterval(() => {
            client.send(Date.now().toString());
        }, 1000);
    })
}