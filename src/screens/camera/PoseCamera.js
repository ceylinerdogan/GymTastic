import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import Svg, { Circle, Line } from 'react-native-svg';
import poseService from '../../services/poseService';
import socketService from '../../services/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

// Pairs of pose landmark indices to connect for skeleton lines
// Different pose detection libraries use different indices, so we'll support multiple formats
const POSE_CONNECTIONS = [
  // Basic body connections
  [11, 13], [13, 15], [12, 14], [14, 16], // arms
  [11, 12], [11, 23], [12, 24], [23, 24], // torso
  [23, 25], [25, 27], [24, 26], [26, 28], // legs
  
  // Additional face connections (optional)
  [0, 1], [1, 2], [2, 3], [3, 4], // face
  [0, 5], [5, 6], [6, 7], [7, 8], // face
];

// Function to normalize landmarks from different formats
const normalizeLandmarks = (data) => {
  console.log("Normalizing landmarks from data:", typeof data);
  
  // Debug the actual data structure
  try {
    console.log("Data structure:", JSON.stringify(data).substring(0, 200) + "...");
  } catch (e) {
    console.log("Could not stringify data:", e.message);
  }
  
  // If data is already in the right format with landmarks array
  if (data && Array.isArray(data.landmarks)) {
    console.log("Using data.landmarks array directly, length:", data.landmarks.length);
    return data.landmarks;
  }
  
  // If data is the landmarks array directly
  if (data && Array.isArray(data)) {
    console.log("Data is already a landmarks array, length:", data.length);
    return data;
  }
  
  // If data has pose key with keypoints
  if (data && data.pose && Array.isArray(data.pose.keypoints)) {
    console.log("Extracting keypoints from data.pose, length:", data.pose.keypoints.length);
    return data.pose.keypoints.map(kp => ({ 
      x: kp.x,
      y: kp.y,
      score: kp.score
    }));
  }
  
  // If data has keypoints array directly
  if (data && Array.isArray(data.keypoints)) {
    console.log("Extracting keypoints from data.keypoints, length:", data.keypoints.length);
    return data.keypoints.map(kp => ({ 
      x: kp.x,
      y: kp.y,
      score: kp.score
    }));
  }
  
  // If we have a results object with poseLandmarks
  if (data && data.results && Array.isArray(data.results.poseLandmarks)) {
    console.log("Using data.results.poseLandmarks, length:", data.results.poseLandmarks.length);
    return data.results.poseLandmarks;
  }
  
  // Try common property names
  const possibleLandmarkKeys = ['keypoints', 'landmarks', 'points', 'positions', 'coordinates'];
  for (const key of possibleLandmarkKeys) {
    if (data && Array.isArray(data[key])) {
      console.log(`Found landmarks in data.${key}, length:`, data[key].length);
      return data[key];
    }
  }
  
  console.log("Could not extract landmarks from data, using empty array");
  return [];
};

// Helper function to provide more informative error messages for common Python errors
const getErrorExplanation = (errorMsg) => {
  if (!errorMsg) return 'Unknown error';
  
  // Check for common Python errors and provide more helpful explanations
  if (errorMsg.includes("'NoneType' object has no attribute 'shape'")) {
    return 'The server could not process the image format. Try using a different camera angle or lighting conditions.';
  }
  
  if (errorMsg.includes('index') && errorMsg.includes('out of range')) {
    return 'The pose detection model could not find key body points. Please ensure your full body is visible in the frame.';
  }
  
  if (errorMsg.includes('dimension') || errorMsg.includes('shape')) {
    return 'The image format was not compatible with the detection model. Try adjusting your camera position.';
  }
  
  if (errorMsg.includes('timeout')) {
    return 'The server took too long to process the image. Try using a better lit environment.';
  }
  
  // Return the original error if no specific explanation is available
  return errorMsg;
};

const PoseCamera = ({ exerciseType = 'squat', onError, navigation }) => {
  const [cameraPermission, setCameraPermission] = useState(false);
  const device = useCameraDevice('front');
  const camera = useRef(null);
  const isProcessing = useRef(false);
  const [landmarks, setLandmarks] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [sessionActive, setSessionActive] = useState(false);
  const [userId, setUserId] = useState('anonymous'); // Default to anonymous
  const [isCorrect, setIsCorrect] = useState(null);
  const [incorrectPoints, setIncorrectPoints] = useState([]);
  const [processingMethod, setProcessingMethod] = useState('socket'); // 'socket' or 'api'
  const [receivedPoseData, setReceivedPoseData] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const frameCount = useRef(0);
  const socketUnsubscribe = useRef(null);
  const pollingInterval = useRef(null);
  const [frameProcessorEnabled, setFrameProcessorEnabled] = useState(true);
  const frameProcessorErrorCount = useRef(0);

  // Frame processor - capture frame data for sending to backend
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    // Increment the counter and trigger processing on JS thread
    if (frameCount.current % 5 === 0) {
      // Store the frame data for later use (can't send directly from worklet)
      // eslint-disable-next-line no-undef
      globalThis._currentFrameData = frame;
      // eslint-disable-next-line no-undef
      globalThis._shouldProcessFrame = true;
    }
    
    frameCount.current += 1;
  }, []);
  
  // Use effect to handle frame processing on the JS thread
  useEffect(() => {
    if (!sessionActive) return;
    
    // Set up interval to check if frame should be processed
    const interval = setInterval(() => {
      // eslint-disable-next-line no-undef
      if (globalThis._shouldProcessFrame && !isProcessing.current) {
        // eslint-disable-next-line no-undef
        globalThis._shouldProcessFrame = false;
        // Process with the saved frame data
        // eslint-disable-next-line no-undef
        if (globalThis._currentFrameData) {
          // eslint-disable-next-line no-undef
          processFrameWithData(globalThis._currentFrameData);
        } else {
          console.log('[PoseCamera] No frame data available, sending signal only');
          processFrameWithSignal();
        }
      }
    }, 200); // Check every 200ms
    
    // Also add a backup polling mechanism to ensure we're constantly requesting poses
    const backupPolling = setInterval(() => {
      if (sessionActive && landmarks.length === 0) {
        console.log('[PoseCamera] No landmarks yet, trying to capture and send a frame');
        if (camera.current) {
          // Try to take a photo to get frame data
          takePicture();
        } else {
          console.log('[PoseCamera] Camera not ready, falling back to signal');
          processFrameWithSignal();
        }
      }
    }, 2000); // Try every 2 seconds
    
    return () => {
      clearInterval(interval);
      clearInterval(backupPolling);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionActive, landmarks.length]);

  // Process frame with signal only (no frame data needed)
  const processFrameWithSignal = useCallback(() => {
    if (isProcessing.current || !sessionActive) return;
    isProcessing.current = true;
    
    try {
      console.log(`[PoseCamera] Processing frame signal with method: ${processingMethod} (FALLBACK - server requires frame data)`);
      
      if (processingMethod === 'socket') {
        // Send signal only instead of frame data
        console.log(`[PoseCamera] Sending frame signal via socket for ${exerciseType} (not recommended)`);
        
        // Update the signal to include a warning that frame data is needed
        socketService.sendFrameForPoseDetection({
          exercise_type: exerciseType,
          warning: 'Server requires actual frame data, not just signals',
          timestamp: Date.now()
        }, exerciseType);
      } else {
        // For API mode, use the REST endpoint
        console.log(`[PoseCamera] Sending frame signal via REST API for ${exerciseType}`);
        // Call processRESTFrame directly instead of recursive call
        poseService.requestPoseDetectionSignal(exerciseType)
          .then(result => {
            if (result) {
              handlePoseData(result);
            }
          })
          .catch(error => {
            console.error('REST API pose detection error:', error.message || 'Unknown error');
            if (!receivedPoseData) {
              setFeedback('Having trouble getting pose data from the server. Please check your connection and try again.');
            }
          });
      }
    } catch (e) {
      console.error('[PoseCamera] Frame processing error:', e.message || 'Unknown error');
    } finally {
      // Allow another frame to be processed after a delay
      setTimeout(() => {
        isProcessing.current = false;
      }, 200);
    }
  }, [sessionActive, processingMethod, exerciseType, receivedPoseData]);

  // Take a picture and send it for processing - resized for small payload
  const takePicture = async () => {
    if (!camera.current || isProcessing.current) return;

    try {
      console.log('[PoseCamera] Taking picture for pose detection');
      isProcessing.current = true;
      setFeedback('Capturing image for pose detection...');

      // Take the photo
      const photo = await camera.current.takePhoto({
        quality: 100, // capture at full resolution then resize
        skipMetadata: true,
        flash: 'off'
      });
      console.log('[PoseCamera] Photo taken, path:', photo.path);
      setFeedback('Resizing image...');

      // Resize the image to small dimensions (e.g., 300x300)
      const resized = await ImageResizer.createResizedImage(
        photo.path,
        300,
        300,
        'JPEG',
        20 // quality for resized JPEG
      );
      console.log('[PoseCamera] Image resized:', resized.uri);
      setFeedback('Processing resized image...');

      // Read resized file as base64
      const base64data = await RNFS.readFile(resized.uri, 'base64');
      const sizeKB = Math.round(base64data.length / 1024);
      console.log(`[PoseCamera] Resized image base64 size: ${sizeKB}KB`);

      // Prepare payload
      const payload = base64data;

      setFeedback('Sending image data to server...');
      if (processingMethod === 'socket') {
        const socket = socketService.getSocket();
        if (socket && socket.connected) {
          console.log('[PoseCamera] Sending resized image via socket');
          socket.emit('detect_pose', { frame: payload });
          setFeedback(`Image sent (${sizeKB}KB). Waiting for response...`);
        } else {
          console.log('[PoseCamera] Socket not connected');
          setFeedback('Socket not connected. Please try again.');
        }
      } else {
        console.log('[PoseCamera] Sending resized image via direct API fetch');
        const apiUrl = require('../../services/apiConfig').API_URL;
        fetch(`${apiUrl}/pose/detect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frame: payload })
        })
        .then(res => res.json())
        .then(data => { handlePoseData(data); setFeedback('Received data from API'); })
        .catch(err => { console.error('[PoseCamera] API error:', err); setFeedback(`API error: ${err.message}`); });
      }
    } catch (e) {
      console.error('[PoseCamera] Error in takePicture:', e);
      setFeedback(`Error: ${e.message}`);
    } finally {
      isProcessing.current = false;
    }
  };

  // Process frame with actual frame data
  const processFrameWithData = (frameData) => {
    if (isProcessing.current || !sessionActive) return;
    isProcessing.current = true;
    
    try {
      console.log(`[PoseCamera] Processing frame data with method: ${processingMethod}`);
      
      // Convert frame to JPEG base64
      // Using a placeholder implementation since we can't convert directly
      // In a real implementation, you'd need to use a native module to convert the frame
      console.log('[PoseCamera] Converting frame to base64 (simplified implementation)');
      
      // For now, take a picture instead since direct frame conversion is complex
      takePicture();
    } catch (e) {
      console.error('[PoseCamera] Frame processing error:', e.message || 'Unknown error');
      isProcessing.current = false;
    }
  };

  // Process frame using REST API
  const processRESTFrame = useCallback(async () => {
    try {
      // Request pose detection from the API
      const result = await poseService.requestPoseDetectionSignal(exerciseType);
      
      if (result) {
        handlePoseData(result);
      }
    } catch (error) {
      console.error('REST API pose detection error:', error.message || 'Unknown error');
      
      // If we haven't received data for a while, show a message
      if (!receivedPoseData) {
        setFeedback('Having trouble getting pose data from the server. Please check your connection and try again.');
      }
    }
  }, [exerciseType, receivedPoseData]);

  // Handle pose data from either source (Socket or REST)
  const handlePoseData = (data) => {
    console.log('[PoseCamera] Received pose data:', typeof data);
    
    // Log data structure for debugging
    if (data) {
      console.log('[PoseCamera] Data keys:', Object.keys(data).join(', '));
    } else {
      console.log('[PoseCamera] Received null or undefined data');
      return;
    }
    
    // Try to extract landmarks
    const normalizedLandmarks = normalizeLandmarks(data);
    
    if (normalizedLandmarks && normalizedLandmarks.length > 0) {
      console.log(`[PoseCamera] Normalized ${normalizedLandmarks.length} landmarks from backend`);
      
      // Log the first landmark for debugging
      if (normalizedLandmarks[0]) {
        console.log('[PoseCamera] First landmark example:', JSON.stringify(normalizedLandmarks[0]));
      }
      
      setLandmarks(normalizedLandmarks);
      setReceivedPoseData(true);
      
      // Extract pose correctness data from backend
      // We use the backend's values directly without modification
      if (data.is_correct !== undefined) {
        console.log(`[PoseCamera] Pose correctness from backend: ${data.is_correct ? 'Correct' : 'Incorrect'}`);
        setIsCorrect(data.is_correct);
        
        // Use the feedback message directly from backend if available
        if (data.feedback) {
          console.log('[PoseCamera] Using feedback from backend:', data.feedback);
          setFeedback(data.feedback);
        } else {
          // Only use default messages if backend didn't provide custom feedback
          const defaultFeedback = data.is_correct ? 'Good form!' : 'Incorrect form, please adjust';
          console.log('[PoseCamera] Using default feedback:', defaultFeedback);
          setFeedback(defaultFeedback);
        }
      }
      
      // Capture which landmarks are incorrect according to the backend
      if (data.incorrect_points && Array.isArray(data.incorrect_points)) {
        console.log(`[PoseCamera] Backend identified ${data.incorrect_points.length} incorrect points:`, 
          data.incorrect_points.join(', '));
        setIncorrectPoints(data.incorrect_points);
      } else {
        // Reset incorrect points if none are specified
        console.log('[PoseCamera] No incorrect points specified by backend');
        setIncorrectPoints([]);
      }
    } else {
      console.log('[PoseCamera] No valid landmarks received from backend');
    }
  };

  useEffect(() => {
    // Get user ID from storage
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          console.log('No user ID found, using anonymous');
        }
      } catch (error) {
        console.error('Error getting userId:', error);
      }
    };
    getUserId();

    // Initialize socket connection
    if (processingMethod === 'socket') {
      const socket = socketService.initSocket();
      const unsubscribe = socketService.onPoseResult(handlePoseData);
      socketUnsubscribe.current = unsubscribe;
      setIsConnected(socketService.isSocketConnected());
      
      // Add pose error listener
      const errorUnsubscribe = socketService.setupPoseErrorListener((errorMessage) => {
        console.log(`[PoseCamera] Pose detection error from server: ${errorMessage}`);
        
        // Only update feedback if it's a new or critical error
        if (errorMessage && errorMessage !== 'No frame data provided') {
          const friendlyError = getErrorExplanation(errorMessage);
          setFeedback(`Server error: ${friendlyError}`);
        }
      });
      
      // Store both unsubscribe functions
      const originalUnsubscribe = socketUnsubscribe.current;
      socketUnsubscribe.current = () => {
        if (originalUnsubscribe) originalUnsubscribe();
        if (errorUnsubscribe) errorUnsubscribe();
      };
    }

    return () => {
      // Clean up socket listeners
      if (socketUnsubscribe.current) {
        socketUnsubscribe.current();
      }
      
      // Clear any active intervals
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
      
      // End active session
      if (sessionActive) {
        endSession();
      }
    };
  }, [processingMethod]);

  useEffect(() => {
    // Set up REST API polling mechanism as fallback if socket is not used
    if (sessionActive && processingMethod === 'api') {
      // Start polling for pose data
      pollingInterval.current = setInterval(() => {
        if (!isProcessing.current) {
          processRESTFrame();
        }
      }, 200); // Process at roughly 5 FPS
    } else if (pollingInterval.current) {
      // Clear polling interval when using socket or session is inactive
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [sessionActive, processingMethod, processRESTFrame]);

  // Start exercise session
  const startSession = async () => {
    setIsLoading(true);
    try {
      // For socket mode, initialize socket and start session
      if (processingMethod === 'socket') {
        const socket = socketService.initSocket();
        const authSuccess = await socketService.authenticateSocket();
        
        if (!authSuccess) {
          console.warn('Socket authentication failed, may have limited functionality');
          setFeedback('Warning: Authentication issue may limit some features. Try reconnecting or check your login.');
        }
        
        await socketService.startExerciseSession(exerciseType, userId);
        setIsConnected(socketService.isSocketConnected());
      }
      
      setSessionActive(true);
      setFeedback(`Started ${exerciseType} session. Please get in position.`);
      
      // Important message about backend support
      setTimeout(() => {
        if (!receivedPoseData) {
          if (processingMethod === 'socket') {
            setFeedback('Waiting for pose data from server. If you don\'t see landmarks soon, try switching to REST API mode or check your connection.');
          } else {
            setFeedback('Waiting for pose data from server. If you don\'t see landmarks soon, try switching to WebSocket mode or check your connection.');
          }
        }
      }, 5000);
    } catch (error) {
      console.error('Error starting session:', error);
      setFeedback(`Could not start session: ${error.message || 'Unknown error'}`);
      setSessionActive(false);
      onError && onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // End exercise session
  const endSession = async () => {
    setIsLoading(true);
    try {
      if (processingMethod === 'socket') {
        await socketService.endExerciseSession();
      }
      
      setSessionActive(false);
      setFeedback('Session ended.');
      setLandmarks([]);
      setIsCorrect(null);
      setIncorrectPoints([]);
      setReceivedPoseData(false);
      
      // Clear polling interval if active
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle processing method
  const toggleProcessingMethod = async () => {
    // First end current session if active
    if (sessionActive) {
      await endSession();
    }
    
    // Toggle processing method
    const newMethod = processingMethod === 'socket' ? 'api' : 'socket';
    setProcessingMethod(newMethod);
    setFeedback(`Switched to ${newMethod === 'socket' ? 'WebSocket' : 'REST API'} mode`);
    
    // Initialize socket connection if switching to socket mode
    if (newMethod === 'socket') {
      const socket = socketService.initSocket();
      const unsubscribe = socketService.onPoseResult(handlePoseData);
      if (socketUnsubscribe.current) {
        socketUnsubscribe.current();
      }
      socketUnsubscribe.current = unsubscribe;
      setIsConnected(socketService.isSocketConnected());
    }
  };

  // Test connection
  const testConnection = async () => {
    setIsLoading(true);
    setFeedback('Testing connection...');
    
    try {
      if (processingMethod === 'socket') {
        // Test WebSocket connection
        const socket = socketService.initSocket();
        await socketService.authenticateSocket();
        const isConnected = socketService.isSocketConnected();
        setIsConnected(isConnected);
        
        if (isConnected) {
          setFeedback('WebSocket connection successful! Server is reachable.');
        } else {
          setFeedback('WebSocket connection failed. Check server is running and accessible.');
        }
      } else {
        // Test REST API connection
        const result = await poseService.requestPoseDetectionSignal(exerciseType);
        
        if (result) {
          setIsConnected(true);
          setFeedback('REST API connection successful! Backend is reachable.');
          
          // If we got landmarks, process them
          if (result.landmarks || result.keypoints) {
            handlePoseData(result);
          }
        } else {
          setIsConnected(false);
          setFeedback('REST API connection successful but no data received.');
        }
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setIsConnected(false);
      setFeedback(`Connection failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new function to directly request poses for testing
  const forcePoseDetection = () => {
    console.log('[PoseCamera] Forcing pose detection request');
    setFeedback('Capturing and sending frame for pose detection...');
    
    // Simply take a picture - it's the most reliable approach
    takePicture();
  };

  // Add a new diagnostic function to check backend compatibility
  const checkBackendFormat = () => {
    console.log('[PoseCamera] Checking backend format compatibility');
    setFeedback('Checking server connection and format requirements...');
    
    try {
      const socket = socketService.getSocket();
      if (socket && socket.connected) {
        // Send a diagnostic request to the server
        socket.emit('get_info', { request_type: 'format_requirements' });
        
        // Also send a minimal test image to see if that works
        const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='; // 1x1 pixel
        
        socket.emit('detect_pose', {
          test: true,
          frame: testBase64,
          format: 'small_test_image'
        });
        
        setFeedback('Sent diagnostic requests to server. Check server logs.');
      } else {
        console.log('[PoseCamera] Socket not connected for diagnostic');
        setFeedback('Cannot check format - socket not connected');
      }
    } catch (e) {
      console.error('[PoseCamera] Error checking format:', e);
      setFeedback(`Error checking format: ${e.message}`);
    }
  };

  useEffect(() => {
    const requestPermissions = async () => {
      let hasPermission = false;

      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission Required',
              message: 'This app needs access to your camera for pose detection.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const status = await Camera.requestCameraPermission();
          hasPermission = status === 'authorized';
        }
      } catch (error) {
        console.error('Error requesting camera permission:', error);
        hasPermission = false;
      }

      setCameraPermission(hasPermission);
    };

    requestPermissions();
  }, []);

  // Show debug information
  const showDebugInfo = () => {
    const serverInfo = processingMethod === 'socket' ? 
      socketService.getServerInfo() : 
      { connected: isConnected, url: 'Using REST API' };
      
    Alert.alert(
      'Debug Information',
      `Exercise Type: ${exerciseType}\n` +
      `Processing Method: ${processingMethod.toUpperCase()}\n` +
      `Session Active: ${sessionActive ? 'Yes' : 'No'}\n` +
      `Received Pose Data: ${receivedPoseData ? 'Yes' : 'No'}\n` +
      `Landmarks Count: ${landmarks.length}\n` +
      `Connected: ${isConnected ? 'Yes' : 'No'}\n` +
      `Server URL: ${serverInfo.url}\n` +
      `Session ID: ${serverInfo.sessionId || 'None'}\n`,
      [{ text: 'OK' }]
    );
  };

  // Function to render skeleton
  const renderSkeleton = () => {
    if (!landmarks || landmarks.length === 0) {
      return null;
    }
    
    console.log(`[PoseCamera] Rendering skeleton with ${landmarks.length} landmarks`);
    console.log(`[PoseCamera] Frame size: ${frameSize.width}x${frameSize.height}`);
    
    // Check if landmarks have valid coordinates
    const validLandmarks = landmarks.filter(lm => 
      lm && lm.x !== undefined && lm.y !== undefined && 
      !isNaN(lm.x) && !isNaN(lm.y) && 
      lm.x >= 0 && lm.x <= 1 && lm.y >= 0 && lm.y <= 1);
    
    if (validLandmarks.length !== landmarks.length) {
      console.log(`[PoseCamera] Found ${landmarks.length - validLandmarks.length} invalid landmarks`);
      
      // Log an example of an invalid landmark
      const invalidLandmark = landmarks.find(lm => 
        !lm || lm.x === undefined || lm.y === undefined || 
        isNaN(lm.x) || isNaN(lm.y) || 
        lm.x < 0 || lm.x > 1 || lm.y < 0 || lm.y > 1);
      
      if (invalidLandmark) {
        console.log('[PoseCamera] Example invalid landmark:', JSON.stringify(invalidLandmark));
      }
    } else {
      console.log('[PoseCamera] All landmarks are valid for rendering');
    }
    
    return (
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {landmarks.map((lm, i) => {
          // Skip rendering if coordinates are invalid
          if (!lm || lm.x === undefined || lm.y === undefined || 
              isNaN(lm.x) || isNaN(lm.y) || 
              lm.x < 0 || lm.x > 1 || lm.y < 0 || lm.y > 1) {
            return null;
          }
          
          // Use directly from backend - isCorrect for overall pose correctness
          // and incorrectPoints for specific problematic landmarks
          const isPointIncorrect = incorrectPoints.includes(i);
          
          return (
            <Circle
              key={`lm-${i}`}
              cx={lm.x * frameSize.width}
              cy={lm.y * frameSize.height}
              r={4}
              fill={isPointIncorrect ? "yellow" : (isCorrect ? "green" : "red")}
            />
          );
        })}
        
        {POSE_CONNECTIONS.map(([i, j], idx) => {
          // Skip if landmarks don't exist
          if (!landmarks[i] || !landmarks[j]) return null;
          
          const a = landmarks[i];
          const b = landmarks[j];
          
          // Skip if coordinates are invalid
          if (!a || !b || 
              a.x === undefined || a.y === undefined || 
              b.x === undefined || b.y === undefined ||
              isNaN(a.x) || isNaN(a.y) || isNaN(b.x) || isNaN(b.y) ||
              a.x < 0 || a.x > 1 || a.y < 0 || a.y > 1 ||
              b.x < 0 || b.x > 1 || b.y < 0 || b.y > 1) {
            return null;
          }
          
          // Use directly from backend - connection is incorrect if either point is incorrect
          const isIncorrectConnection = incorrectPoints.includes(i) || incorrectPoints.includes(j);
          
          return (
            <Line
              key={`ln-${idx}`}
              x1={a.x * frameSize.width}
              y1={a.y * frameSize.height}
              x2={b.x * frameSize.width}
              y2={b.y * frameSize.height}
              stroke={isIncorrectConnection ? "yellow" : (isCorrect ? "green" : "red")}
              strokeWidth={2}
            />
          );
        })}
      </Svg>
    );
  };

  // Use effect to handle frame processing errors
  useEffect(() => {
    // Reset error count on session start/end
    if (!sessionActive) {
      frameProcessorErrorCount.current = 0;
      return;
    }
    
    // Create a global error handler to detect frame processor issues
    const originalError = console.error;
    console.error = (...args) => {
      originalError(...args);
      
      // Check if this is a frame processor error
      const errorMsg = args.join(' ');
      if (errorMsg.includes('Frame processor') && frameProcessorEnabled) {
        frameProcessorErrorCount.current += 1;
        
        // If we see too many errors, disable the frame processor
        if (frameProcessorErrorCount.current > 20) {
          console.log('Too many frame processor errors, disabling frame processor');
          setFrameProcessorEnabled(false);
          
          // Start polling as fallback
          if (!pollingInterval.current) {
            pollingInterval.current = setInterval(() => {
              if (!isProcessing.current) {
                processFrameWithSignal();
              }
            }, 200);
          }
        }
      }
    };
    
    return () => {
      console.error = originalError;
    };
  }, [sessionActive, frameProcessorEnabled]);

  // Keep this useEffect
  useEffect(() => {
    // Auto-start session when component mounts
    const autoStartSession = async () => {
      if (!sessionActive) {
        await startSession();
      }
    };
    
    autoStartSession();
    
    return () => {
      // Clean up by ending session when component unmounts
      if (sessionActive) {
        endSession();
      }
    };
  }, []);

  if (!cameraPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>Camera permission denied. Please enable camera access.</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>Camera not found or loading...</Text>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        setFrameSize({ width, height });
      }}
    >
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={sessionActive && frameProcessorEnabled ? frameProcessor : undefined}
        frameProcessorFps={6}
        photo={true}
        testID="camera-view"
      />
      
      {/* Render skeleton when we have landmarks */}
      {renderSkeleton()}
      
      {/* Pose overlay for accessibility */}
      {landmarks.length > 0 && (
        <View style={StyleSheet.absoluteFill} testID="pose-overlay" />
      )}
      
      {/* Voice feedback placeholder for accessibility */}
      <View style={{ position: 'absolute', top: -1000 }} testID="voice-feedback" />
      
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
      
      {/* Feedback box */}
      {!!feedback && (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackTitle}>Exercise: {exerciseType}</Text>
          <Text style={styles.feedbackText}>{feedback}</Text>
          <Text style={styles.modeText}>
            Mode: {processingMethod === 'socket' ? 'WebSocket' : 'REST API'}
          </Text>
          <Text style={styles.modeText}>
            Session ID: {socketService.getCurrentSessionId() || 'None'}
          </Text>
          <Text style={styles.modeText}>
            Landmarks: {landmarks.length > 0 ? `${landmarks.length} points` : 'None detected'}
          </Text>
          {isProcessing.current && (
            <Text style={styles.infoText}>
              ⟳ Sending frame data to server...
            </Text>
          )}
          {receivedPoseData && (
            <Text style={styles.successText}>
              ✓ Receiving pose data from server
            </Text>
          )}
          {isConnected && (
            <Text style={styles.successText}>
              ✓ Connected to {processingMethod === 'socket' ? 'WebSocket server' : 'REST API'}
            </Text>
          )}
          {!isConnected && (
            <Text style={styles.errorText}>
              ✗ Not connected to server
            </Text>
          )}
          {landmarks.length === 0 && sessionActive && (
            <Text style={styles.errorText}>
              ✗ No landmarks received from server
            </Text>
          )}
        </View>
      )}
      
      {/* Session control buttons */}
      <View style={styles.buttonContainer}>
        {!sessionActive ? (
          <>
            <TouchableOpacity 
              style={styles.button} 
              onPress={startSession}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Start Session</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={testConnection}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Test Connection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={toggleProcessingMethod}
            >
              <Text style={styles.buttonText}>
                {processingMethod === 'socket' ? 'Use REST API' : 'Use WebSocket'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={showDebugInfo}
            >
              <Text style={styles.buttonText}>Debug Info</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={checkBackendFormat}
            >
              <Text style={styles.buttonText}>Check Server</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.button} 
              onPress={endSession}
              disabled={isLoading}
              testID="session-end-button"
              accessibilityLabel="End session"
            >
              <Text style={styles.buttonText}>End Session</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={forcePoseDetection}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Force Detection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={takePicture}
              disabled={isLoading || isProcessing.current}
            >
              <Text style={styles.buttonText}>Send Frame</Text>
            </TouchableOpacity>
            
            {/* Camera flip button (placeholder since PoseCamera doesn't have flip functionality) */}
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => console.log('Camera flip not implemented')}
              testID="camera-flip-button"
              accessibilityLabel="Flip camera"
            >
              <Text style={styles.buttonText}>Flip Camera</Text>
            </TouchableOpacity>
          </>
        )}
        
        {/* Session timer display */}
        {sessionActive && (
          <View style={styles.timerContainer} testID="session-timer">
            <Text style={styles.timerText}>00:00</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  warningText: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
  },
  feedbackBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
  },
  feedbackTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  feedbackText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
  },
  modeText: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 5,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 12,
    marginBottom: 2,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginBottom: 2,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 10,
    width: '80%',
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  modeButton: {
    backgroundColor: '#2196F3',
  },
  debugButton: {
    backgroundColor: '#9C27B0',
  },
  testButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  infoText: {
    color: '#2196F3',
    fontSize: 12,
    marginBottom: 2,
  },
  timerContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 10,
  },
  timerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PoseCamera;