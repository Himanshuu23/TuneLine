package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
	"tuneline-server/internal/models"
	"tuneline-server/internal/services"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in development
	},
}

type ConnectionManager struct {
	connections      map[string]*models.WebSocketConnection
	connMu           sync.RWMutex
	currentlyPlaying map[string]*models.Music
	playingMu        sync.RWMutex
}

func NewConnectionManager() *ConnectionManager {
	return &ConnectionManager{
		connections:      make(map[string]*models.WebSocketConnection),
		currentlyPlaying: make(map[string]*models.Music),
	}
}

func (cm *ConnectionManager) generateSocketID() string {
	return fmt.Sprintf("%x", time.Now().UnixNano())
}

func (cm *ConnectionManager) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	socketID := cm.generateSocketID()
	wsConn := &models.WebSocketConnection{
		Conn: conn,
		ID:   socketID,
	}

	cm.connMu.Lock()
	cm.connections[socketID] = wsConn
	cm.connMu.Unlock()

	defer func() {
		cm.connMu.Lock()
		delete(cm.connections, wsConn.ID)
		cm.connMu.Unlock()
		conn.Close()
	}()

	// Subscribe to Redis pub/sub for this room
	var pubsub *redis.PubSub
	defer func() {
		if pubsub != nil {
			pubsub.Close()
		}
	}()

	// Handle incoming messages
	go func() {
		for {
			_, messageBytes, err := conn.ReadMessage()
			if err != nil {
				break
			}

			var msg models.Message
			if err := json.Unmarshal(messageBytes, &msg); err != nil {
				continue
			}

			cm.handleMessage(wsConn, &msg, &pubsub)
		}
	}()

	// Handle Redis pub/sub messages
	for {
		if pubsub == nil && wsConn.RoomCode != "" {
			pubsub = services.RedisClient.Subscribe(services.Ctx, "tuneline:"+wsConn.RoomCode)
		}

		if pubsub != nil {
			msg, err := pubsub.ReceiveMessage(services.Ctx)
			if err != nil {
				break
			}

			var pubMsg map[string]interface{}
			if err := json.Unmarshal([]byte(msg.Payload), &pubMsg); err == nil {
				roomCode := pubMsg["roomCode"].(string)
				if roomCode == wsConn.RoomCode {
					cm.broadcastToRoom(roomCode, pubMsg)
				}
			}
		}

		time.Sleep(100 * time.Millisecond)
	}
}

func (cm *ConnectionManager) handleMessage(conn *models.WebSocketConnection, msg *models.Message, pubsub **redis.PubSub) {
	var response models.Message

	switch msg.Type {
	case "make-room":
		details := map[string]interface{}{
			"name":       msg.Name,
			"streamUrl":  msg.StreamURL,
			"profilePic": msg.ProfilePic,
			"videoUrl":   msg.VideoURL,
		}
		roomCode, _, err := services.MakeNewRoom(details)
		if err != nil {
			response = models.Message{Type: "error", Message: err.Error()}
		} else {
			conn.RoomCode = roomCode
			response = models.Message{
				Type:     "make-room",
				RoomCode: roomCode,
				Message:  "created-room",
			}
		}
		cm.sendMessage(conn, response)

	case "join-room":
		if services.JoinRoom(msg.RoomCode) {
			conn.RoomCode = msg.RoomCode
			response = models.Message{
				Type:     "join-room",
				RoomCode: msg.RoomCode,
				Message:  fmt.Sprintf("%s joined the room!", msg.Username),
			}
			cm.sendMessage(conn, response)
			cm.broadcastToRoom(msg.RoomCode, map[string]interface{}{
				"type":     "join-room",
				"roomCode": msg.RoomCode,
				"username": msg.Username,
				"message":  response.Message,
			})
		} else {
			response = models.Message{Type: "join-room", Message: "Invalid room code!"}
			cm.sendMessage(conn, response)
		}

	case "add-music":
		if msg.Music != nil {
			details, err := services.InsertMusicIntoQueue(msg.RoomCode, msg.Music)
			if err == nil {
				cm.playingMu.RLock()
				shouldUpdateVideo := cm.currentlyPlaying[msg.RoomCode] == nil
				cm.playingMu.RUnlock()

				// Publish to Redis for other instances
				message := map[string]interface{}{
					"type":     "add-music",
					"roomCode": msg.RoomCode,
					"data":     msg.Music,
				}
				messageJSON, _ := json.Marshal(message)
				services.RedisClient.Publish(services.Ctx, "tuneline:"+msg.RoomCode, messageJSON)

				username := msg.Username
				if username == "" {
					username = msg.Admin
				}

				cm.broadcastToRoom(msg.RoomCode, map[string]interface{}{
					"type":            "add-music",
					"message":         fmt.Sprintf("%s added the song %s into the queue! vote it to play", username, details["title"]),
					"music":           msg.Music,
					"details":         details,
					"shouldUpdateVideo": shouldUpdateVideo,
					"username":        username,
				})
			}
		}

	case "remove-song":
		if msg.Music != nil {
			if err := services.RemoveSong(msg.RoomCode, msg.Music); err == nil {
				// Publish to Redis for other instances
				message := map[string]interface{}{
					"type":     "delete-music",
					"roomCode": msg.RoomCode,
					"data":     msg.Music,
				}
				messageJSON, _ := json.Marshal(message)
				services.RedisClient.Publish(services.Ctx, "tuneline:"+msg.RoomCode, messageJSON)
				response = models.Message{Type: "remove-song", Message: "song removed!", Music: msg.Music}
				cm.sendMessage(conn, response)
				cm.broadcastToRoom(msg.RoomCode, map[string]interface{}{
					"type":  "delete-music",
					"music": msg.Music,
				})
			}
		}

	case "get-songs":
		songs, err := services.GetSongs(msg.RoomCode)
		if err == nil {
			response = models.Message{Type: "get-songs", Songs: songs}
			cm.sendMessage(conn, response)
		}

	case "vote-song":
		song, err := services.VoteSong(msg.RoomCode, msg.URL, msg.Admin)
		if err == nil {
			// Publish to Redis for other instances
			message := map[string]interface{}{
				"type":     "vote-updated",
				"roomCode": msg.RoomCode,
				"data":     song,
			}
			messageJSON, _ := json.Marshal(message)
			services.RedisClient.Publish(services.Ctx, "tuneline:"+msg.RoomCode, messageJSON)
			cm.broadcastToRoom(msg.RoomCode, map[string]interface{}{
				"type":  "vote-updated",
				"music": song,
			})
		}

	case "get-creators":
		creators, err := services.GetCreators()
		if err == nil {
			response = models.Message{Type: "get-creators", Creators: creators}
			cm.sendMessage(conn, response)
		}

	case "get-room-details":
		roomInfo, _ := services.GetRoomDetails(msg.RoomCode)
		creators, _ := services.GetCreators()
		var creator models.Creator
		for _, c := range creators {
			if c.Creator == roomInfo["user"] {
				creator = c
				break
			}
		}

		response = models.Message{
			Type: "room-details",
			Details: map[string]interface{}{
				"creator":       roomInfo["user"],
				"channelProfile": creator.ChannelProfile,
				"streamUrl":     roomInfo["streamUrl"],
			},
		}
		cm.sendMessage(conn, response)

	case "start-song":
		if msg.Music != nil {
			cm.playingMu.Lock()
			cm.currentlyPlaying[msg.RoomCode] = msg.Music
			cm.playingMu.Unlock()

			cm.broadcastToRoom(msg.RoomCode, map[string]interface{}{
				"type":  "song-started",
				"music": msg.Music,
			})
		}

	case "end-song":
		cm.playingMu.Lock()
		delete(cm.currentlyPlaying, msg.RoomCode)
		cm.playingMu.Unlock()

		nextSong, err := services.GetHighestPrioritySong(msg.RoomCode)
		if err == nil && nextSong != nil {
			// Remove from queue - already handled in GetHighestPrioritySong flow
			// We'll remove it here explicitly
			songs, _ := services.RedisClient.ZRange(services.Ctx, msg.RoomCode+":queue", 0, -1).Result()
			for _, songJSON := range songs {
				var song models.Music
				if err := json.Unmarshal([]byte(songJSON), &song); err == nil {
					if song.YouTubeURL == nextSong.YouTubeURL {
						services.RedisClient.ZRem(services.Ctx, msg.RoomCode+":queue", songJSON)
						break
					}
				}
			}

			cm.playingMu.Lock()
			cm.currentlyPlaying[msg.RoomCode] = nextSong
			cm.playingMu.Unlock()

			cm.broadcastToRoom(msg.RoomCode, map[string]interface{}{
				"type":  "next-song",
				"music": nextSong,
			})
		} else {
			cm.broadcastToRoom(msg.RoomCode, map[string]interface{}{
				"type": "queue-empty",
			})
		}

	case "close-room":
		services.CloseRoom(msg.RoomCode)
		cm.closeRoomConnections(msg.RoomCode)
		// Publish to Redis for other instances
		message := map[string]interface{}{
			"type":     "close-room",
			"roomCode": msg.RoomCode,
			"data":     nil,
		}
		messageJSON, _ := json.Marshal(message)
		services.RedisClient.Publish(services.Ctx, "tuneline:"+msg.RoomCode, messageJSON)
		response = models.Message{Type: "close-room", Message: "Room Closed!"}
		cm.sendMessage(conn, response)

	case "chat-message":
		cm.broadcastToRoom(msg.RoomCode, map[string]interface{}{
			"type":     "chat-message",
			"username": msg.Username,
			"message":  msg.Message,
		})
	}
}

func (cm *ConnectionManager) sendMessage(conn *models.WebSocketConnection, msg models.Message) {
	conn.Mu.Lock()
	defer conn.Mu.Unlock()
	conn.Conn.WriteJSON(msg)
}

func (cm *ConnectionManager) broadcastToRoom(roomCode string, data map[string]interface{}) {
	cm.connMu.RLock()
	defer cm.connMu.RUnlock()

	for _, conn := range cm.connections {
		if conn.RoomCode == roomCode {
			conn.Mu.Lock()
			conn.Conn.WriteJSON(data)
			conn.Mu.Unlock()
		}
	}
}

func (cm *ConnectionManager) closeRoomConnections(roomCode string) {
	cm.connMu.Lock()
	defer cm.connMu.Unlock()

	for id, conn := range cm.connections {
		if conn.RoomCode == roomCode {
			conn.Conn.Close()
			delete(cm.connections, id)
		}
	}
}
