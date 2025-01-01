export type MessageType = {
    type: string
    message: string
    song?: SongType
    roomCode?: string
    songs?: SongType[]
}

export type SongType = {
    votes: number,
    money: number,
    url: string
}