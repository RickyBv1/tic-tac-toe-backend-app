import { Player } from "./players"

export type GameStatus =
'WAITING_PARTNER' |
'P1_TURN' |
'P2_TURN' |
'P1_VICTORY' |
'P2_VICTORY' |
'DRAW' |
'ABANDONED' |
'P1_GRAND_VICTORY' |
'P2_GRAND_VICTORY'

export interface LobbyBackend {
    public : boolean,
    players : [Player, Player],
    id : number,
    status: GameStatus,
    board: Board,
    winningLine: WinningLine | undefined
}

export type BoardPosition = 0|1|2|3|4|5|6|7|8;
export type Board = [PlayerNumber|'',PlayerNumber|'',PlayerNumber|'',PlayerNumber|'',PlayerNumber|'',PlayerNumber|'',PlayerNumber|'',PlayerNumber|'',PlayerNumber|'',];
export type PlayerNumber = 1|2;
export type WinningLine = [BoardPosition, BoardPosition, BoardPosition];