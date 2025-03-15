export type MessageType = {
    type: string
    message: string
    music?: SongType
    roomCode?: string
    songs?: SongType[]
    details?: DetailsType
}

export type SongType = {
    votes: number,
    money: number,
    youtubeUrl: string
}

type DetailsType = {
    title: string
    artist: string
    thumbnail: string
}