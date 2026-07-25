package models

type RoomDetails struct {
	User      string `json:"user"`
	CreatedAt int64  `json:"createdAt"`
	StreamURL string `json:"streamUrl"`
}

type Creator struct {
	Creator        string `json:"creator"`
	ChannelProfile string `json:"channelProfile"`
}

type Connection struct {
	Conn     interface{} `json:"-"` // websocket.Conn, avoiding circular import
	ID       string      `json:"id"`
	RoomCode string      `json:"roomCode"`
}
