#!/usr/bin/env node

var WebSocketServer = require('websocket').server;
var http = require('http');
var port = process.env.PORT || 8011;
var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(port, function () {
    console.log((new Date()) + ' Server is listening on port ' + port);
});
wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production 
    // applications, as it defeats all standard cross-origin protection 
    // facilities built into the protocol and the browser.  You should 
    // *always* verify the connection's origin and decide whether or not 
    // to accept it. 
    // autoAcceptConnections: false
});

const TYPE_ESP = "esp8266";
const TYPE_WEB = "webclient";
const TYPE_PI = "piclient";

function originIsAllowed(req) {
    // put logic here to detect whether the specified origin is allowed. 
    var approveList = [TYPE_ESP, TYPE_WEB, TYPE_PI];
    var protocol = req.requestedProtocols[0];
    return approveList.includes(protocol);
}
var espConn = null,
    webConn = null,
    piConn = null;

wsServer.on('request', function (request) {
    var requestType = request.requestedProtocols[0];
    if (!originIsAllowed(request)) {
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected. requestProtocol' + request.requestedProtocols[0]);
        return;
    }
    var connection = request.accept(requestType, request.origin);
    handleConnection(connection, requestType); // assign connection to list 3 kind of connection espConn, webConn, piConn via connect type
    console.log((new Date()) + requestType + ' Connection accepted.');

    connection.on('message', function (message) {
        handleMessage(connection, message, requestType);
    });

    connection.on('close', function (reasonCode, description) {
        handleClose(connection, requestType);

    });
});

function isHex(pStr) {
    return /^[0-9A-Fa-f]{7}$/.test(pStr);
}

function handleConnection(conn, type) {
    switch (type) {
        case TYPE_ESP:
            espConn = conn;
            break;
        case TYPE_WEB:
            webConn = conn;
            break;
        case TYPE_PI:
            piConn = conn;
            break;
    }
}

function handleMessage(conn, mess, type) {

    switch (type) {
        case TYPE_ESP:
            break;
        case TYPE_WEB:
            if (espConn) {
                espConn.sendUTF(mess.utf8Data);
            }
            break;
        case TYPE_PI:
            if (espConn) {
                espConn.sendUTF(mess.utf8Data);
            }
            break;
    }
    console.log('Received Message: ' + mess.utf8Data);
}

function handleClose(conn, type) {
    switch (type) {
        case TYPE_ESP:
            espConn = null;
            break;
        case TYPE_WEB:
            webConn = null;
            break;
        case TYPE_PI:
            piConn = null;
            break;
    }
    console.log((new Date()) + ' Peer ' + conn.remoteAddress + ' disconnected.');
}
