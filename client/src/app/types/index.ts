export type MessageType = {
    type: string
    message: string
    music?: SongType
    roomCode?: string
    songs?: SongType[]
    details?: DetailsType
    shouldUpdateVideo?: boolean
    action?: string
}

export type SongType = {
    votes: number,
    money: number,
    youtubeUrl: string,
    title?: string,
    artist?: string,
    thumbnail?: string,
    votedBy?: string[]
}

type DetailsType = {
    title: string
    artist: string
    thumbnail: string
}