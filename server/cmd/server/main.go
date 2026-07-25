package main

import (
	"log"
	"net/http"
	"os"

	"tuneline-server/internal/handlers"
	"tuneline-server/internal/services"
)

func main() {
	// Initialize Redis connection
	services.InitRedis()

	// Create connection manager
	cm := handlers.NewConnectionManager()

	// Setup routes
	http.HandleFunc("/ws", cm.HandleWebSocket)

	port := os.Getenv("PORT")
	if port == "" {
		port = "11011"
	}

	log.Printf("WebSocket server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
