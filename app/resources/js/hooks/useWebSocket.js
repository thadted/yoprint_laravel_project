import { useEffect, useState, useRef } from 'react';

const useWebSocket = (onMessageReceived) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const reconnectTimeoutRef = useRef(null);
    const onMessageReceivedRef = useRef(onMessageReceived);

    // Update the ref when the callback changes
    useEffect(() => {
        onMessageReceivedRef.current = onMessageReceived;
    }, [onMessageReceived]);

    useEffect(() => {
        const wsUrl = `ws://localhost:8080/app/${import.meta.env.VITE_REVERB_APP_KEY}`;
        
        const connect = () => {
            const webSocket = new WebSocket(wsUrl);

            webSocket.onopen = () => {
                console.log('WebSocket connected successfully');
                setConnected(true);
                setError(null);
                
                // Subscribe to file upload events
                const subscribeMessage = {
                    event: 'pusher:subscribe',
                    data: {
                        channel: 'file-uploads'
                    }
                };
                webSocket.send(JSON.stringify(subscribeMessage));
                console.log('Subscribed to file-uploads channel');
            };

            webSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    // Handle Pusher protocol messages
                    if (data.event === 'pusher:connection_established') {
                        console.log('Pusher connection established');
                        return;
                    }
                    
                    if (data.event === 'pusher:subscription_succeeded') {
                        console.log('Successfully subscribed to channel:', data.channel);
                        return;
                    }
                    
                    // Handle our custom events
                    if (data.event && data.data) {
                        // Call the callback with the entire message
                        if (onMessageReceivedRef.current) {
                            onMessageReceivedRef.current(data);
                        } else {
                            console.error('onMessageReceivedRef.current is null!');
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse WebSocket message:', e, event.data);
                }
            };

            webSocket.onclose = (event) => {
                console.log('WebSocket disconnected:', {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean
                });
                setConnected(false);
                
                // Attempt to reconnect after 3 seconds if not a clean close
                if (!event.wasClean) {
                    console.log('Attempting to reconnect in 3 seconds...');
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, 3000);
                }
            };

            webSocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError(error);
                setConnected(false);
            };

            setSocket(webSocket);
        };

        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    }, []);

    return { socket, connected, error };
};

export default useWebSocket;