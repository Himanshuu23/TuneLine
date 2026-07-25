package services

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"tuneline-server/internal/models"
)

func InsertMusicIntoQueue(roomCode string, music *models.Music) (map[string]string, error) {
	details, err := FetchVideoDetails(music.YouTubeURL)
	if err != nil {
		return nil, err
	}

	music.Title = details["title"]
	music.Artist = details["artist"]
	music.Thumbnail = details["thumbnail"]
	if music.VotedBy == nil {
		music.VotedBy = []string{}
	}
	music.AddedAt = time.Now().Unix()

	// Priority: money * 1e6 + votes
	score := music.Money*1e6 + float64(music.Votes)
	
	musicJSON, _ := json.Marshal(music)
	RedisClient.ZAdd(Ctx, roomCode+":queue", redis.Z{
		Score:  score,
		Member: musicJSON,
	})

	return details, nil
}

func GetSongs(roomCode string) ([]*models.Music, error) {
	songs, err := RedisClient.ZRevRange(Ctx, roomCode+":queue", 0, -1).Result()
	if err != nil {
		return nil, err
	}

	result := make([]*models.Music, 0, len(songs))
	for _, songJSON := range songs {
		var music models.Music
		if err := json.Unmarshal([]byte(songJSON), &music); err == nil {
			result = append(result, &music)
		}
	}

	return result, nil
}

func RemoveSong(roomCode string, music *models.Music) error {
	songs, err := RedisClient.ZRange(Ctx, roomCode+":queue", 0, -1).Result()
	if err != nil {
		return err
	}

	for _, songJSON := range songs {
		var song models.Music
		if err := json.Unmarshal([]byte(songJSON), &song); err == nil {
			if song.YouTubeURL == music.YouTubeURL {
				RedisClient.ZRem(Ctx, roomCode+":queue", songJSON)
				return nil
			}
		}
	}

	return fmt.Errorf("song not found")
}

func VoteSong(roomCode string, url string, username string) (*models.Music, error) {
	songs, err := RedisClient.ZRange(Ctx, roomCode+":queue", 0, -1).Result()
	if err != nil {
		return nil, err
	}

	for _, songJSON := range songs {
		var song models.Music
		if err := json.Unmarshal([]byte(songJSON), &song); err != nil {
			continue
		}

		if song.YouTubeURL == url {
			// Remove old entry
			RedisClient.ZRem(Ctx, roomCode+":queue", songJSON)

			// Check if user already voted
			hasVoted := false
			for i, voter := range song.VotedBy {
				if voter == username {
					hasVoted = true
					song.VotedBy = append(song.VotedBy[:i], song.VotedBy[i+1:]...)
					song.Votes--
					break
				}
			}

			if !hasVoted {
				if song.VotedBy == nil {
					song.VotedBy = []string{}
				}
				song.VotedBy = append(song.VotedBy, username)
				song.Votes++
			}

			if song.Votes < 0 {
				song.Votes = 0
			}

			// Re-add with new score
			score := song.Money*1e6 + float64(song.Votes)
			newSongJSON, _ := json.Marshal(song)
			RedisClient.ZAdd(Ctx, roomCode+":queue", redis.Z{
				Score:  score,
				Member: newSongJSON,
			})

			return &song, nil
		}
	}

	return nil, fmt.Errorf("song not found")
}

func GetHighestPrioritySong(roomCode string) (*models.Music, error) {
	songs, err := RedisClient.ZRevRange(Ctx, roomCode+":queue", 0, 0).Result()
	if err != nil || len(songs) == 0 {
		return nil, fmt.Errorf("no songs in queue")
	}

	var music models.Music
	if err := json.Unmarshal([]byte(songs[0]), &music); err != nil {
		return nil, err
	}

	return &music, nil
}
