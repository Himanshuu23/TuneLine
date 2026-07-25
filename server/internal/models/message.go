package models

type Message struct {
	Type            string      `json:"type"`
	RoomCode        string      `json:"roomCode,omitempty"`
	Username        string      `json:"username,omitempty"`
	Admin           string      `json:"admin,omitempty"`
	Music           *Music      `json:"music,omitempty"`
	Details         interface{} `json:"details,omitempty"`
	URL             string      `json:"url,omitempty"`
	Message         string      `json:"message,omitempty"`
	StreamURL       string      `json:"streamUrl,omitempty"`
	ProfilePic      string      `json:"profilePic,omitempty"`
	Name            string      `json:"name,omitempty"`
	VideoURL        string      `json:"videoUrl,omitempty"`
	ShouldUpdateVideo bool      `json:"shouldUpdateVideo,omitempty"`
	Songs           []*Music    `json:"songs,omitempty"`
	Creators        []Creator   `json:"response,omitempty"`
}
