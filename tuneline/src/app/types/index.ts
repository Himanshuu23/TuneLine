export type MessageType = {
    type: string
    message: string
    music?: SongType
    roomCode?: string
    songs?: SongType[]
}

export type SongType = {
    votes: number,
    money: number,
    youtubeUrl: string
}