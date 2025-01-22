import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Lobby } from './classes/lobbies';
import { CreateLobbyArgs, JoinLobbyArgs} from './interfaces/createLobby';
import { Socket } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server,{cors:{origin:'*'}});
global.io = io;

server.listen(3000, () => {
    console.log('Server running on port 3000');
})

let lobbies:Lobby[] = [];
let idNextLobby = 0;

io.on('connection',(socket)=> {
    //console.log('New connection');

    socket.on('findLobby',(callback) => findPublicLobby(callback));
    socket.on('createLobby',(args,callback) => createLobby(socket,callback,args));
    socket.on('joinLobby',(args,callback) => joinLobby(socket, callback, args));
    socket.on('disconnecting', () => {
        if(socket.rooms.size < 2 ) return;
        const lobbyPlayer = lobbies.find(lobby => lobby.id == parseInt([...socket.rooms][1].substring(6)))
        if (!lobbyPlayer) return;
        lobbyPlayer?.playerAbandoned();
        socket.conn.close();
        lobbies = lobbies.filter(lobby => lobby.id !== lobbyPlayer.id);
        //console.log('The lobby is closed', lobbyPlayer.id, ', now the lobbies are', lobbies);
    })

    socket.on('play', (args)=> {
        //console.log('looking to register a movement', args, findLobby(args.lobbyId))
        findLobby(args.lobbyId)?.play(args.player, args.position)
    })

    socket.on('nextGame', (args)=> {
        //console.log('Starting a new game', args, findLobby(args.lobbyId))
        findLobby(args.lobbyId)?.nextGame();
    })
})

/**Look for an available lobby, if it finds one it will return the id of the lobby otherwise return false*/
function findPublicLobby(callback: Function) {
    //console.log('Looking for a public lobby');
    const availableLobby = lobbies.find(lobby => {
        if (!lobby.public) return false;
        if (lobby.players[0].name && lobby.players[1].name) return false;
        return true;
    })
    callback (availableLobby ? availableLobby.id : null);
}

function createLobby(socket:Socket, callback:Function, args:CreateLobbyArgs) {
    const newLobby = new Lobby(args);
    newLobby.id = idNextLobby;
    idNextLobby++;
    lobbies.push(newLobby);
    joinLobby(socket,callback, {
        id: newLobby.id,
        namePlayer: args.namePlayer
    })
}

/**Add a player to a lobby*/
function joinLobby(socket:Socket, callback: Function, args: JoinLobbyArgs) {
    if (!lobbies.length) return callback ({success: false, message: 'No lobbies available'});
    const lobbyIndex = lobbies.findIndex(lobby => lobby.id === args.id);
    if (lobbyIndex === -1) return callback ({success: false, message: 'The lobby with the ID:' + args.id + ' does not exist'});
    if (lobbies[lobbyIndex].players[0].name && lobbies[lobbyIndex].players[1].name) return callback ({success: false, message: 'The lobby is full'});
    lobbies[lobbyIndex].addPlayer(args.namePlayer);
    socket.join('lobby-' + lobbies[lobbyIndex].id);
    return callback ({success: true, message: 'You have joined the lobby ' + lobbies[lobbyIndex].id, lobby: lobbies[lobbyIndex].getLobby()});

}

function findLobby(id:number){
    return lobbies.find(lobby => lobby.id === id)
}