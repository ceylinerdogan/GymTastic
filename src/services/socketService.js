import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from './apiConfig';

let socket;
let currentSessionId;
let isConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;

// Initialize socket connection
export const initSocket = () => {
  if (!socket) {
    try {
      console.log('Initializing socket connection to:', SOCKET_URL);
      
      // Enhanced socket configuration for better connection stability
      // and compatibility with different server implementations
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],  // Try websocket first, fallback to polling
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,           // Force a new connection to avoid cached issues
        upgrade: true,
        // Additional options for stability with different server implementations
        path: '/socket.io',       // Default Socket.io path
        autoConnect: true,
        rejectUnauthorized: false // Allow self-signed certificates
      });
      
      socket.io.on("reconnect_attempt", (attempt) => {
        console.log(`[Socket] Reconnection attempt ${attempt}`);
        // On later reconnection attempts, try with polling as fallback
        if (attempt > 2) {
          socket.io.opts.transports = ['polling', 'websocket'];
        }
      });
      
      socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        isConnected = true;
        connectionAttempts = 0;
        
        // Re-authenticate on reconnection
        AsyncStorage.getItem('authToken')
          .then(token => {
            if (token) {
              // Extract token if it's in Bearer format
              const actualToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
              console.log('[Socket] Re-authenticating after reconnection');
              socket.emit('join', { token: actualToken });
            }
          })
          .catch(err => console.error('[Socket] Error re-authenticating:', err));
        
        // Set up global event listeners for debugging
        socket.onAny((event, ...args) => {
          console.log(`[Socket] Received event: ${event}`);
          try {
            if (args && args.length > 0 && args[0]) {
              console.log(`[Socket] Event data:`, JSON.stringify(args[0]).substring(0, 200));
            } else {
              console.log('[Socket] Event with no data');
            }
          } catch (e) {
            console.log(`[Socket] Event data (non-stringifiable):`, typeof args[0]);
          }
        });
      });
      
      socket.on('disconnect', (reason) => {
        console.log(`Disconnected from WebSocket server. Reason: ${reason}`);
        isConnected = false;
        
        // For certain disconnect reasons, try to manually reconnect
        if (reason === 'io server disconnect' || reason === 'ping timeout') {
          console.log('[Socket] Server forced disconnect, attempting manual reconnection');
          setTimeout(() => {
            socket.connect();
          }, 1000); // Add delay before reconnection attempt
        }
      });
      
      socket.on('error', (error) => {
        console.error('Socket connection error:', error);
        isConnected = false;
      });
      
      socket.on('connect_error', (error) => {
        console.error('Socket connect_error:', error.message || 'Unknown error');
        isConnected = false;
        connectionAttempts++;
        
        if (connectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
          console.log('Max reconnection attempts reached, stopping reconnection');
          socket.disconnect();
          
          // Reset socket instance to allow for future connection attempts
          socket = null;
        } else if (connectionAttempts > 2) {
          // After a few failed attempts, try different connection strategy
          console.log('Trying alternative connection strategy');
          socket.io.opts.transports = ['polling', 'websocket'];
        }
      });
    } catch (err) {
      console.error('Socket initialization error:', err.message || 'Unknown error');
      isConnected = false;
      socket = null;
    }
  }
  return socket;
};

// Authenticate socket connection with token
export const authenticateSocket = async () => {
  if (!socket) {
    initSocket();
  }
  
  try {
    // Get the authentication token
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      console.warn('No auth token found for socket authentication');
      return false;
    }
    
    // Extract token if it's in Bearer format
    const actualToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    
    console.log('Authenticating socket with token');
    
    // Join a room for authenticated users with the token
    socket.emit('join', { token: actualToken });
    
    // Set up listener for join response
    return new Promise((resolve) => {
      socket.once('join_result', (result) => {
        if (result && result.success) {
          console.log('Socket authenticated successfully');
          isConnected = true;
          resolve(true);
        } else {
          const message = result && result.message ? result.message : 'Unknown reason';
          console.warn('Socket authentication failed:', message);
          resolve(false);
        }
      });
      
      socket.once('room_joined', (data) => {
        console.log('Joined room:', data);
        isConnected = true;
        resolve(true);
      });
      
      // Set a timeout in case the server doesn't respond
      setTimeout(() => {
        console.log('Socket authentication timeout, assuming success');
        resolve(true);
      }, 5000);
    });
  } catch (error) {
    console.error('Socket authentication error:', error.message || 'Unknown error');
    return false;
  }
};

// Start a new exercise session
export const startExerciseSession = async (exerciseType, userId) => {
  if (!socket) {
    initSocket();
  }
  
  if (!isConnected) {
    try {
      await new Promise((resolve) => {
        socket.once('connect', () => resolve());
        setTimeout(resolve, 3000); // Timeout after 3 seconds
      });
    } catch (error) {
      console.error('Connection timeout when starting session');
    }
  }
  
  console.log('Starting exercise session for:', exerciseType, userId);
  
  return new Promise((resolve, reject) => {
    // Emit the start_exercise_session event
    socket.emit('start_exercise_session', {
      exercise_type: exerciseType,
      user_id: userId || 'anonymous'
    });
    
    // Set up listener for session start response
    socket.once('session_started', (data) => {
      currentSessionId = data.session_id || `local_session_${Date.now()}`;
      console.log('Session started with ID:', currentSessionId);
      resolve(currentSessionId);
    });
    
    // Set a timeout in case the server doesn't respond
    setTimeout(() => {
      // Generate a local session ID since the backend isn't providing one
      currentSessionId = `local_session_${Date.now()}`;
      console.log('Created local session ID (no server response):', currentSessionId);
      resolve(currentSessionId);
    }, 3000);
  });
};

// End an exercise session
export const endExerciseSession = () => {
  if (!socket || !currentSessionId) {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    // Emit the end_exercise_session event
    socket.emit('end_exercise_session', { session_id: currentSessionId });
    
    // Set up listener for session end response
    socket.once('session_ended', () => {
      console.log('Session ended:', currentSessionId);
      currentSessionId = null;
      resolve();
    });
    
    // Set a timeout in case the server doesn't respond
    setTimeout(() => {
      console.log('Ended session (no server response):', currentSessionId);
      currentSessionId = null;
      resolve();
    }, 3000);
  });
};

// Send a frame for pose detection
export const sendFrameForPoseDetection = (frameData, exerciseType) => {
  if (!socket) {
    console.warn('Cannot send frame: socket not connected');
    return;
  }
  
  try {
    // Check if frameData is already an object with frame data
    if (typeof frameData === 'object' && frameData.frame) {
      console.log('[Socket] Sending structured frame data for pose detection');
      
      // Send the object directly - it already has all required fields
      const payload = {
        ...frameData,
        session_id: currentSessionId
      };
      
      socket.emit('detect_pose', payload);
      return;
    }
    
    // Check if we have actual frame data (base64 string)
    if (typeof frameData === 'string' && frameData.length > 100) {
      console.log('[Socket] Sending actual frame data for pose detection');
      
      // Send the frame data in the format expected by the backend
      socket.emit('detect_pose', {
        frame: frameData,
        format: 'jpeg',  // Explicitly specify format for Python compatibility
        exercise_type: exerciseType,
        session_id: currentSessionId,
        timestamp: Date.now()
      });
      
      return;
    }
    
    // If frameData is a signal object
    if (typeof frameData === 'object' && frameData.warning) {
      console.log('[Socket] Sending warning signal (backend requires frame data)');
      socket.emit('detect_pose', {
        ...frameData,
        session_id: currentSessionId
      });
      return;
    }
    
    // If it's just the legacy signal string ('motion_detected')
    if (frameData === 'motion_detected') {
      console.log('[Socket] WARNING: Backend requires frame data, not just signals');
      
      // Try a simpler format as a last resort
      socket.emit('detect_pose', { 
        exercise_type: exerciseType,
        session_id: currentSessionId,
        timestamp: Date.now(),
        note: 'Mobile app cannot provide frame data - please use backend camera'
      });
    } else {
      // Last fallback - send whatever we have
      console.log('[Socket] Sending generic data for pose detection');
      socket.emit('detect_pose', {
        data: frameData,
        exercise_type: exerciseType,
        session_id: currentSessionId,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('[Socket] Error sending frame:', error.message || 'Unknown error');
  }
};

// After initSocket() function, add a specific listener for pose detection errors
export const setupPoseErrorListener = (callback) => {
  if (!socket) {
    initSocket();
  }
  
  // Listen for specific errors related to pose detection
  socket.on('pose_detection_error', (data) => {
    console.log('[Socket] Pose detection error:', data.message || 'Unknown error');
    
    if (typeof callback === 'function') {
      callback(data.message || 'Unknown pose detection error');
    }
  });
  
  return () => {
    socket.off('pose_detection_error');
  };
};

// Register pose result handler
export const onPoseResult = (callback) => {
  if (!socket) {
    initSocket();
  }
  
  // Remove any existing listeners to avoid duplicates
  socket.off('pose_result');
  socket.off('pose_detection_result');
  socket.off('landmarks');
  socket.off('pose_landmarks');
  
  // Listen for the primary event name
  socket.on('pose_result', (data) => {
    console.log('[Socket] Received pose_result data', typeof data);
    handlePoseData(data, callback);
  });
  
  // Listen for alternative event names that the backend might use
  socket.on('pose_detection_result', (data) => {
    console.log('[Socket] Received pose_detection_result data', typeof data);
    handlePoseData(data, callback);
  });
  
  socket.on('landmarks', (data) => {
    console.log('[Socket] Received landmarks data', typeof data);
    handlePoseData(data, callback);
  });
  
  socket.on('pose_landmarks', (data) => {
    console.log('[Socket] Received pose_landmarks data', typeof data);
    handlePoseData(data, callback);
  });
  
  // Listen for the pose_feedback event (another possible event name)
  socket.on('pose_feedback', (data) => {
    console.log('[Socket] Received pose_feedback data', typeof data);
    handlePoseData(data, callback);
  });
  
  // Return function to unregister all handlers
  return () => {
    socket.off('pose_result');
    socket.off('pose_detection_result');
    socket.off('landmarks');
    socket.off('pose_landmarks');
    socket.off('pose_feedback');
  };
};

// Helper function to process pose data
const handlePoseData = (data, callback) => {
  try {
    // If data is a string, try to parse it as JSON
    if (typeof data === 'string') {
      try {
        console.log('[Socket] Parsing string data:', data.substring(0, 200) + '...');
        data = JSON.parse(data);
      } catch (e) {
        console.log('[Socket] Could not parse string data:', e.message);
      }
    }
    
    // Check for valid data structure
    if (!data) {
      console.warn('[Socket] Received empty pose result data');
      return;
    }
    
    // Log the keys in the data object for debugging
    console.log('[Socket] Data keys:', Object.keys(data).join(', '));
    
    // If we have landmarks or keypoints, log their count for debugging
    if (data.landmarks && Array.isArray(data.landmarks)) {
      console.log(`[Socket] Received ${data.landmarks.length} landmarks`);
      console.log('[Socket] First landmark sample:', JSON.stringify(data.landmarks[0]));
    } else if (data.keypoints && Array.isArray(data.keypoints)) {
      console.log(`[Socket] Received ${data.keypoints.length} keypoints`);
      console.log('[Socket] First keypoint sample:', JSON.stringify(data.keypoints[0]));
    } else if (data.pose && data.pose.keypoints && Array.isArray(data.pose.keypoints)) {
      console.log(`[Socket] Received ${data.pose.keypoints.length} pose keypoints`);
      console.log('[Socket] First pose keypoint sample:', JSON.stringify(data.pose.keypoints[0]));
    } else {
      console.warn('[Socket] No landmarks found in response. Data structure:', JSON.stringify(data).substring(0, 200) + '...');
    }
    
    // Pass to callback
    callback(data);
  } catch (error) {
    console.error('[Socket] Error processing pose result:', error.message || 'Unknown error');
  }
};

// Check connection status
export const isSocketConnected = () => {
  return isConnected && socket?.connected;
};

// Get current session ID
export const getCurrentSessionId = () => {
  return currentSessionId;
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentSessionId = null;
    isConnected = false;
  }
};

// Get server info for debugging
export const getServerInfo = () => {
  if (!socket) {
    initSocket();
  }
  
  console.log('[Socket] Requesting server info');
  
  socket.emit('get_info', { timestamp: Date.now() });
  
  // Return the current socket state that we have
  return {
    connected: socket?.connected,
    url: socket?.io?.uri,
    id: socket?.id,
    transport: socket?.io?.engine?.transport?.name,
    sessionId: currentSessionId
  };
};

export default {
  initSocket,
  authenticateSocket,
  startExerciseSession,
  endExerciseSession,
  sendFrameForPoseDetection,
  onPoseResult,
  setupPoseErrorListener,
  disconnectSocket,
  getSocket: () => socket,
  getCurrentSessionId,
  getServerInfo,
  isSocketConnected
}; 