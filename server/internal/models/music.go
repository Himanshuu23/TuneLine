package models

type Music struct {
	YouTubeURL string   `json:"youtubeUrl"`
	Money      float64  `json:"money"`
	Votes      int      `json:"votes"`
	Title      string   `json:"title,omitempty"`
	Artist     string   `json:"artist,omitempty"`
	Thumbnail  string   `json:"thumbnail,omitempty"`
	VotedBy    []string `json:"votedBy,omitempty"`
	AddedAt    int64    `json:"addedAt,omitempty"`
}
