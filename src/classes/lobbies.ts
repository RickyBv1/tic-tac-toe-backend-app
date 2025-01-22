import { CreateLobbyArgs } from "../interfaces/createLobby";
import { EMPTY_PLAYER, Player } from "../interfaces/players";
import { Board, BoardPosition, GameStatus, LobbyBackend, PlayerNumber, WinningLine } from "../interfaces/lobby";

export class Lobby {
    public: boolean;
    players: [Player,Player] = [{...EMPTY_PLAYER},{...EMPTY_PLAYER}];
    id?: number;
    initialPlayer: 0|1 = 0;
    board:Board = ['','','','','','','','','',]
    winningLine?: WinningLine;

    status: GameStatus = 'WAITING_PARTNER';

    constructor(args:CreateLobbyArgs){
        this.public = args.public;
    }

    addPlayer(namePlayer: string){
        const playerIndex = !this.players[0].name ? 0 : 1;
        this.players[playerIndex].name = namePlayer;
        this.players[playerIndex].lifePoints = 3;
        if (this.players[1].name){
            this.status = this.initialPlayer === 0 ? 'P1_TURN' : 'P2_TURN';
        }
        this.communicateLobby()
    }

    getLobby():LobbyBackend{
        return {
            public : this.public,
            players : this.players,
            id : this.id!,
            status: this.status,
            board: this.board,
            winningLine: this.winningLine
        }
    }
    /**Communicate the actual state of the lobby tho all the members */
    communicateLobby(){
        global.io.to('lobby-' + this.id).emit('lobby', this.getLobby())
    }

    playerAbandoned(){
        //Change the state of the lobby to abandoned
        this.status = 'ABANDONED';
        this.communicateLobby();
    }

    play(playerNumber:PlayerNumber, position:BoardPosition){
        if((playerNumber !== 1 && this.status === 'P1_TURN') ||
            (playerNumber !== 2 && this.status === 'P2_TURN')) return;
        this.board[position] = playerNumber;
        this.winningLine = undefined;

        //Change the turn
        this.status = this.status === 'P1_TURN' ? 'P2_TURN' : 'P1_TURN'

        //Victory or draw verification
        const end = this.verifyVictory();
        if(end === 'DRAW') this.status = 'DRAW';
        else if (typeof end === 'object'){
            const affectedPlayerIndex = playerNumber === 1 ? 1 : 0;
            this.players[affectedPlayerIndex].lifePoints--;
            if(this.players[affectedPlayerIndex].lifePoints === 0){
                this.status = playerNumber === 1 ? 'P1_GRAND_VICTORY' : 'P2_GRAND_VICTORY';
                this.winningLine = end;
            } else {
                this.status = playerNumber === 1 ? 'P1_VICTORY' : 'P2_VICTORY';
                this.winningLine = end;
            }

        }
        //Communicate the lobby
        this.communicateLobby();
    }

    verifyVictory():WinningLine | 'DRAW' | undefined{
        //verify horizontal lines
        for (let i = 0; i < 9; i+=3){
            if (this.board[i] !== '' &&  this.board[i] === this.board[i+1] && this.board[i] === this.board[i+2]){
                return [i as BoardPosition, i+1 as BoardPosition, i+2 as BoardPosition];
            }
        }
        
        //verify vertical lines
        for (let i = 0; i < 3; i++){
            if (this.board[i] !== '' && this.board[i] === this.board[i+3] && this.board[i] === this.board[i+6]){
                return [i as BoardPosition, i+3 as BoardPosition, i+6 as BoardPosition];
            }
        }
        
        //verify diagonal lines
        if(this.board[0] !== '' && this.board[0] === this.board[4] && this.board[0] === this.board[8]){
            return [0, 4, 8];
        }
        if(this.board[2] !== '' && this.board[2] === this.board[4] && this.board[2] === this.board[6]){
            return [2, 4, 6];
        }

        //verify for a draw
        if(!this.board.includes('')) return 'DRAW';

        return undefined;

    }

    nextGame(){
        this.emptyBoard();
        this.switchInitialPlayer();
        this.winningLine = undefined;
        this.status = this.initialPlayer === 0 ? 'P1_TURN' : 'P2_TURN';
        if(this.players[0].lifePoints === 0 || this.players[1].lifePoints === 0){
            this.players[0].lifePoints = 3;
            this.players[1].lifePoints = 3;
        }

        this.communicateLobby();
    }
    emptyBoard(){
        this.board = ['','','','','','','','','',];
    }

    switchInitialPlayer(){
        this.initialPlayer = this.initialPlayer === 0 ? 1 : 0;
    }

}