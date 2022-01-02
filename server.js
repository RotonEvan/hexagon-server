const Node = require('./Objects/Node')

const HTTPS_PORT = process.env.PORT || 8443; //default port for https is 443
const HTTP_PORT = 8001; //default port for http is 80

const fs = require('fs');
const http = require('http');
const https = require('https');

const WebSocket = require('ws');
const { sign } = require('crypto');


// TLS is required
const serverConfig = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
};

const handleRequest = function(request, response) {
    // console.log("request received : " + request);

    //TO-DO
    if (request.url === '/client.js') {
        response.writeHead(200, { 'Content-Type': 'application/javascript' });
        response.end(fs.readFileSync('client/client.js'));
    } else {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(fs.readFileSync('client/index.html'));
    }
}

// setting up server

const httpsServer = http.createServer(serverConfig, handleRequest);
httpsServer.listen(HTTPS_PORT);

// setting up socket server
const wss = new WebSocket.Server({ server: httpsServer });

// signalling logic

// map of clients
let clients = {}
let client_ids = []

wss.on('connection', ws => {
    // ws -> websocket of the connected peer
    ws.isAlive = true;

    // maintain isAlive status of ws
    // ws.on('pong', beat(ws));

    // on message from a client
    ws.on('message', async msg => {

        let signal = JSON.parse(msg);
        console.log(signal);
        let from = signal.from;
        let to = signal.to;
        let context = signal.context;
        let data = JSON.parse(signal.data);


        // message for server
        if (to == 'server') {
            // onboarding message - context 'HELLO'
            if (context == 'JOIN') {
                // onboard client and respond with peers list
                // data contains the client-generated ID
                // console.log(data);
                let client = new Node(data.id, 0, [], 5, ws);
                clients[data.id] = client;
                client_ids.push(data.id);

                // find peers list
                peer_list = [];
                client_ids = shuffleArray(client_ids);
                if (client_ids.length >= 5) {
                    peer_list = client_ids.slice(0, 5);
                } else {
                    peer_list = client_ids;
                }

                //send peers list
                sendMessage('server', data.id, 'PEER_LIST', JSON.stringify({ 'peer_list': peer_list }), ws);
            } else if (context == 'SUCCESS_ACK') {
                let peer1 = data.peer1;
                let peer2 = data.peer2;
                clients[peer1].addPeer(clients[peer2]);
                clients[peer2].addPeer(clients[peer1]);
            }
        } else {
            console.log(`sending ${from} to ${to}`);
            sendMessage(from, to, context, signal.data, clients[to].getWebsocket());
        }
    })


})

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {

        // Generate random number
        var j = Math.floor(Math.random() * (i + 1));

        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }

    return array;
}

function sendMessage(from, to, context, data, ws) {
    ws.send(JSON.stringify({ 'from': from, 'to': to, 'context': context, 'data': data }));
}

function beat(ws) {
    ws.isAlive = true;
}

setInterval(() => {
    if (clients) {
        for (const [id, node] of Object.entries(clients)) {
            let ws = node.getWebsocket();
            // console.log(ws.readyState);
            if (ws.readyState != WebSocket.OPEN) {
                console.log(`Removing ${id}`);
                let node_peers = node.getPeersList();
                node_peers.forEach(peer => {
                    peer.removePeer(node);
                });
                delete clients[id];
                client_ids.splice(client_ids.indexOf(id), 1);
                console.log(clients[id]);
                console.log(`${id} removed`);
            }
            // ws.ping(['ping']);
        }
    }
}, 3000);