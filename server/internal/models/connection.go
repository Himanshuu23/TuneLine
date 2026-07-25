package models

import (
	"sync"

	"github.com/gorilla/websocket"
)

type WebSocketConnection struct {
	Conn     *websocket.Conn
	ID       string
	RoomCode string
	Mu       sync.Mutex
}
