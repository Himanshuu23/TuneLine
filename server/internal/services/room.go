package services

import (
	"encoding/json"
	"fmt"
	"time"

	"tuneline-server/internal/models"
)

func GenerateRoomCode() string {
	return fmt.Sprintf("%06x", time.Now().UnixNano())[:6]
}

func MakeNewRoom(details map[string]interface{}) (string, *models.RoomDetails, error) {
	code := GenerateRoomCode()
	
	roomDetails := &models.RoomDetails{
		User:      getString(details, "name"),
		CreatedAt: time.Now().Unix(),
		StreamURL: getString(details, "streamUrl"),
	}

	RedisClient.HSet(Ctx, code, map[string]interface{}{
		"user":      roomDetails.User,
		"createdAt": roomDetails.CreatedAt,
		"streamUrl": roomDetails.StreamURL,
	})

	// Store creator info
	creator := models.Creator{
		Creator:        roomDetails.User,
		ChannelProfile: getString(details, "profilePic"),
	}
	creatorData, _ := json.Marshal(creator)
	RedisClient.LPush(Ctx, "tuneline:creators", creatorData)

	return code, roomDetails, nil
}

func JoinRoom(roomCode string) bool {
	exists := RedisClient.Exists(Ctx, roomCode).Val() > 0
	return exists
}

func GetRoomDetails(roomCode string) (map[string]string, error) {
	roomInfo, err := RedisClient.HGetAll(Ctx, roomCode).Result()
	if err != nil {
		return nil, err
	}
	return roomInfo, nil
}

func CloseRoom(roomCode string) error {
	// Delete Redis keys
	RedisClient.Del(Ctx, roomCode, roomCode+":queue", roomCode+":sockets")
	return nil
}

func GetCreators() ([]models.Creator, error) {
	creatorsJSON, err := RedisClient.LRange(Ctx, "tuneline:creators", 0, -1).Result()
	if err != nil {
		return nil, err
	}

	creators := make([]models.Creator, 0, len(creatorsJSON))
	for _, cJSON := range creatorsJSON {
		var creator models.Creator
		if err := json.Unmarshal([]byte(cJSON), &creator); err == nil {
			creators = append(creators, creator)
		}
	}

	return creators, nil
}

func getString(m map[string]interface{}, key string) string {
	if val, ok := m[key].(string); ok {
		return val
	}
	return ""
}
