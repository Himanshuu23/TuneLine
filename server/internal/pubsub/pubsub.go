package pubsub

import (
	"encoding/json"

	"tuneline-server/internal/services"
)

func PublishMessage(roomCode string, eventType string, data interface{}) {
	message := map[string]interface{}{
		"type":     eventType,
		"roomCode": roomCode,
		"data":     data,
	}
	messageJSON, _ := json.Marshal(message)
	services.RedisClient.Publish(services.Ctx, "tuneline:"+roomCode, messageJSON)
}
