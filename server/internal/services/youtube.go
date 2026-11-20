package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
)

func FetchVideoDetails(url string) (map[string]string, error) {
	videoID := ExtractYouTubeID(url)
	if videoID == "" {
		return nil, fmt.Errorf("invalid YouTube URL")
	}

	apiKey := os.Getenv("YOUTUBE_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("YOUTUBE_API_KEY is not set")
	}

	reqURL := fmt.Sprintf("https://www.googleapis.com/youtube/v3/videos?part=snippet&id=%s&key=%s", videoID, apiKey)
	
	resp, err := http.Get(reqURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var data struct {
		Items []struct {
			Snippet struct {
				Title        string `json:"title"`
				ChannelTitle string `json:"channelTitle"`
				Thumbnails   struct {
					High struct {
						URL string `json:"url"`
					} `json:"high"`
				} `json:"thumbnails"`
			} `json:"snippet"`
		} `json:"items"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	if len(data.Items) > 0 {
		return map[string]string{
			"title":    data.Items[0].Snippet.Title,
			"artist":   data.Items[0].Snippet.ChannelTitle,
			"thumbnail": data.Items[0].Snippet.Thumbnails.High.URL,
		}, nil
	}

	return nil, fmt.Errorf("video not found")
}

func ExtractYouTubeID(url string) string {
	patterns := []string{
		"youtube.com/watch?v=",
		"youtu.be/",
		"youtube.com/embed/",
		"youtube.com/v/",
	}

	for _, pattern := range patterns {
		idx := strings.Index(url, pattern)
		if idx != -1 {
			start := idx + len(pattern)
			end := start
			for end < len(url) && (url[end] >= 'a' && url[end] <= 'z' || url[end] >= 'A' && url[end] <= 'Z' || url[end] >= '0' && url[end] <= '9' || url[end] == '-' || url[end] == '_') {
				end++
			}
			if end-start == 11 {
				return url[start:end]
			}
		}
	}
	return ""
}
