export interface CreateLobbyArgs {
    public: boolean,
    namePlayer: string
}

export interface JoinLobbyArgs {
    id: number,
    namePlayer: string
}