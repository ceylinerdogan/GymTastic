import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Modal,
  Animated,
  Vibration,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const { width, height } = Dimensions.get('window');

const WorkoutVideo = ({ route, navigation }) => {
  const { workout, shouldStartCamera = false } = route.params || { 
    name: 'Squat', 
    description: 'Legs and Glutes',
    videoUrl: null 
  };
  
  // Workout state
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);
  const [restTime, setRestTime] = useState(30); // seconds
  const [isResting, setIsResting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPosition, setCameraPosition] = useState('back');
  const [postureFeedback, setPostureFeedback] = useState('');
  const [postureCorrect, setPostureCorrect] = useState(true);
  const [cameraPermission, setCameraPermission] = useState(false);
  
  // Camera devices
  const devices = useCameraDevices();
  const device = cameraPosition === 'back' ? devices.back : devices.front;
  
  // Camera reference
  const cameraRef = useRef(null);
  
  // Animation values
  const bounceValue = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Workout details
  const totalSets = 3;
  const totalReps = 10;
  const caloriesPerRep = 0.5;
  
  // Timer refs
  const timerRef = useRef(null);
  const restTimerRef = useRef(null);
  
  // Auto-start camera if shouldStartCamera flag is true
  useEffect(() => {
    if (shouldStartCamera) {
      // Short delay to make sure screen is fully rendered
      const timer = setTimeout(() => {
        startPostureTracking();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [shouldStartCamera, startPostureTracking]);
  
  // Request camera permissions
  useEffect(() => {
    const getCameraPermission = async () => {
      const permission = await Camera.requestCameraPermission();
      setCameraPermission(permission === 'authorized');
    };
    
    getCameraPermission();
  }, []);
  
  // Instructions for each workout type
  const workoutInstructions = {
    'Squat': [
      'Stand with feet shoulder-width apart',
      'Keep your back straight and chest up',
      'Lower your body by bending at the knees and hips',
      'Return to starting position',
      'Keep your weight on your heels',
    ],
    'Plank': [
      'Start in a push-up position with arms straight',
      'Lower onto your forearms, keeping elbows under shoulders',
      'Keep your body in a straight line from head to heels',
      'Engage your core and glutes',
      'Hold the position for the specified time',
    ],
    'Lunge': [
      'Stand tall with feet hip-width apart',
      'Step forward with one leg',
      'Lower your body until both knees are bent at 90-degree angles',
      'Push back up to starting position',
      'Repeat with the other leg',
    ],
  };
  
  // Determine the instructions to display
  const instructions = workoutInstructions[workout.name] || workoutInstructions['Squat'];
  
  // Setup workout timer
  useEffect(() => {
    if (isWorkoutStarted && !isWorkoutPaused && !isResting) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        setCaloriesBurned(prev => Math.round((prev + 0.033) * 10) / 10);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    
    return () => clearInterval(timerRef.current);
  }, [isWorkoutStarted, isWorkoutPaused, isResting]);
  
  // Handle rest timer
  useEffect(() => {
    if (isResting && restTime > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTime(prev => prev - 1);
      }, 1000);
      
      // Vibrate when rest starts
      Vibration.vibrate(500);
    } else if (isResting && restTime === 0) {
      clearInterval(restTimerRef.current);
      setIsResting(false);
      setRestTime(30);
      
      // Move to next set or finish workout
      if (currentSet < totalSets) {
        setCurrentSet(prev => prev + 1);
        setCurrentRep(0);
        
        // Vibrate when rest is over
        Vibration.vibrate([500, 200, 500]);
      }
    } else {
      clearInterval(restTimerRef.current);
    }
    
    return () => clearInterval(restTimerRef.current);
  }, [isResting, restTime, currentSet]);
  
  // Check if workout is completed
  useEffect(() => {
    if (currentSet >= totalSets && currentRep >= totalReps && isWorkoutStarted) {
      completeWorkout();
    }
  }, [currentSet, currentRep, completeWorkout, totalSets, totalReps, isWorkoutStarted]);
  
  // Animation for rep counting
  useEffect(() => {
    if (currentRep > 0) {
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(bounceValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentRep, bounceValue]);
  
  // Start the workout
  const startWorkout = useCallback(() => {
    setIsWorkoutStarted(true);
    setShowInstructions(false);
    
    // If camera is not already active, we'll let the startPostureTracking function handle this
    if (!cameraActive) {
      setShowInstructions(false); // Just hide instructions without starting camera
    }
  }, [cameraActive]);
  
  // Pause/resume workout
  const togglePause = () => {
    setIsWorkoutPaused(!isWorkoutPaused);
  };
  
  // Count a rep
  const countRep = () => {
    if (isWorkoutStarted && !isWorkoutPaused && !isResting) {
      if (currentRep < totalReps) {
        setCurrentRep(prev => prev + 1);
      } else if (currentSet < totalSets) {
        // Start rest between sets
        setIsResting(true);
      } else {
        completeWorkout();
      }
    }
  };
  
  // End the workout early
  const endWorkoutEarly = () => {
    Alert.alert(
      "End Workout",
      "Are you sure you want to end your workout early?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "End", 
          onPress: () => navigation.goBack(),
          style: "destructive"
        }
      ]
    );
  };
  
  // Complete the workout
  const completeWorkout = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(restTimerRef.current);
    setWorkoutCompleted(true);
    setIsWorkoutStarted(false);
    setIsWorkoutPaused(false);
    
    // Celebrate completion - animated fade
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
    
    // Vibrate to indicate completion
    Vibration.vibrate([500, 200, 500, 200, 500]);
  }, [fadeAnim]);
  
  // Format time from seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Show proper form
  const toggleFormModal = () => {
    setShowForm(!showForm);
  };

  // Toggle camera type (front/back)
  const toggleCameraType = useCallback(() => {
    setCameraPosition(
      cameraPosition === 'back'
        ? 'front'
        : 'back'
    );
  }, [cameraPosition]);

  // Start camera for posture tracking
  const startPostureTracking = useCallback(() => {
    if (cameraPermission) {
      setCameraActive(true);
      startWorkout();
    } else {
      // If no camera permission, just start workout without camera
      startWorkout();
      Alert.alert(
        "Camera Permission Required",
        "To use posture tracking, please grant camera permission in your device settings.",
        [{ text: "OK" }]
      );
    }
  }, [cameraPermission, startWorkout]);

  // Analyze posture using mock AI feedback
  const analyzePosture = useCallback(() => {
    // This would be connected to ML model in a real app
    // For now, we'll simulate posture analysis with mock feedback
    const feedbackOptions = [
      { text: 'Great posture! Keep it up.', correct: true },
      { text: 'Lower your hips more for proper form.', correct: false },
      { text: 'Keep your back straight.', correct: false },
      { text: 'Perfect form!', correct: true },
      { text: 'Knees should not extend beyond toes.', correct: false },
    ];
    
    const randomFeedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
    setPostureFeedback(randomFeedback.text);
    setPostureCorrect(randomFeedback.correct);
    
    // Vibrate if posture is incorrect
    if (!randomFeedback.correct) {
      Vibration.vibrate(200);
    }
  }, []);

  // Simulated posture feedback
  useEffect(() => {
    let feedbackInterval;
    
    if (isWorkoutStarted && cameraActive && !isWorkoutPaused && !isResting) {
      // Provide random feedback every 3-5 seconds to simulate real-time posture analysis
      feedbackInterval = setInterval(() => {
        analyzePosture();
        
        // Clear the feedback after 2 seconds
        setTimeout(() => {
          setPostureFeedback('');
        }, 2000);
      }, Math.random() * 2000 + 3000);
    }
    
    return () => {
      if (feedbackInterval) clearInterval(feedbackInterval);
    };
  }, [isWorkoutStarted, cameraActive, isWorkoutPaused, isResting, analyzePosture]);

  // Show workout summary
  const WorkoutSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.congratsText}>Workout Complete!</Text>
      <View style={styles.resultContainer}>
        <View style={styles.resultItem}>
          <Text style={styles.resultValue}>{totalSets}</Text>
          <Text style={styles.resultLabel}>Sets</Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={styles.resultValue}>{totalSets * totalReps}</Text>
          <Text style={styles.resultLabel}>Total Reps</Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={styles.resultValue}>{formatTime(elapsedTime)}</Text>
          <Text style={styles.resultLabel}>Duration</Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={styles.resultValue}>{caloriesBurned}</Text>
          <Text style={styles.resultLabel}>Calories</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.completeButton}
        onPress={() => navigation.navigate('WorkoutHistory')}
      >
        <Text style={styles.completeButtonText}>View History</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Main')}
      >
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A95CF1" />
      <SafeAreaView style={styles.safeContainer}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backBtn}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{workout.name}</Text>
            <TouchableOpacity onPress={toggleFormModal}>
              <Text style={styles.formBtn}>?</Text>
            </TouchableOpacity>
          </View>
          
          {/* Main Content */}
          <Animated.View style={[
            styles.mainContent,
            { opacity: fadeAnim }
          ]}>
            {workoutCompleted ? (
              <WorkoutSummary />
            ) : (
              <>
                {/* Video/Camera Container */}
                <View style={styles.videoContainer}>
                  {cameraActive ? (
                    <>
                      {device ? (
                        <Camera
                          ref={cameraRef}
                          style={styles.camera}
                          device={device}
                          isActive={true}
                          enableZoomGesture
                          photo={true}
                          video={false}
                          audio={false}
                        />
                      ) : (
                        <View style={[styles.camera, {justifyContent: 'center', alignItems: 'center', backgroundColor: '#000'}]}>
                          <ActivityIndicator size="large" color="#A95CF1" />
                          <Text style={{color: '#fff', marginTop: 10, textAlign: 'center', paddingHorizontal: 20}}>
                            {cameraPermission ? 'Loading camera...' : 'Camera permission required for posture tracking'}
                          </Text>
                          {!cameraPermission && (
                            <TouchableOpacity 
                              style={styles.permissionButton}
                              onPress={() => Camera.requestCameraPermission()}
                            >
                              <Text style={styles.permissionButtonText}>Grant Permission</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                      
                      {/* Posture feedback overlay */}
                      {postureFeedback ? (
                        <View style={[
                          styles.postureFeedback, 
                          { backgroundColor: postureCorrect ? 'rgba(76, 217, 100, 0.7)' : 'rgba(255, 59, 48, 0.7)' }
                        ]}>
                          <Text style={styles.postureFeedbackText}>{postureFeedback}</Text>
                        </View>
                      ) : null}
                      
                      {/* Camera controls */}
                      <TouchableOpacity 
                        style={styles.cameraToggle}
                        onPress={toggleCameraType}
                      >
                        <Text style={styles.cameraToggleText}>🔄</Text>
                        <Text style={styles.cameraToggleLabel}>
                          {cameraPosition === 'back' ? 'BACK' : 'FRONT'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Image
                      source={
                        workout.name === 'Squat' 
                          ? require('../../../assets/images/squat.png')
                          : workout.name === 'Plank'
                            ? require('../../../assets/images/plank.png')
                            : require('../../../assets/images/lunge.jpg')
                      }
                      style={styles.videoPlaceholder}
                    />
                  )}
                  
                  {showInstructions ? (
                    <View style={styles.instructionsOverlay}>
                      <Text style={styles.instructionsTitle}>How to perform {workout.name}</Text>
                      {instructions.map((instruction, index) => (
                        <View key={index} style={styles.instructionItem}>
                          <Text style={styles.instructionNumber}>{index + 1}</Text>
                          <Text style={styles.instructionText}>{instruction}</Text>
                        </View>
                      ))}
                      <TouchableOpacity 
                        style={styles.startBtn}
                        onPress={startPostureTracking}
                      >
                        <Text style={styles.startBtnText}>Start with Camera Tracking</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.startBtn, styles.startBtnSecondary]}
                        onPress={startWorkout}
                      >
                        <Text style={styles.startBtnText}>Start Without Camera</Text>
                      </TouchableOpacity>
                      <Text style={styles.cameraNote}>
                        Note: You can switch between front and back camera during the workout.
                      </Text>
                    </View>
                  ) : isResting ? (
                    <View style={styles.restOverlay}>
                      <Text style={styles.restTitle}>Rest</Text>
                      <Text style={styles.restTimer}>{restTime}s</Text>
                      <Text style={styles.restMessage}>Next Set: {currentSet + 1}/{totalSets}</Text>
                    </View>
                  ) : null}
                </View>
                
                {/* Workout Controls */}
                {isWorkoutStarted && !showInstructions && (
                  <View style={styles.controlsContainer}>
                    {/* Set and Rep Counter */}
                    <View style={styles.counters}>
                      <View style={styles.counterBox}>
                        <Text style={styles.counterLabel}>SET</Text>
                        <Text style={styles.counterValue}>{currentSet}/{totalSets}</Text>
                      </View>
                      <View style={styles.counterBox}>
                        <Text style={styles.counterLabel}>REP</Text>
                        <Animated.Text 
                          style={[
                            styles.counterValue,
                            { transform: [{ scale: bounceValue }] }
                          ]}
                        >
                          {currentRep}/{totalReps}
                        </Animated.Text>
                      </View>
                    </View>
                    
                    {/* Time and Calories */}
                    <View style={styles.statsRow}>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>TIME</Text>
                        <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>CALORIES</Text>
                        <Text style={styles.statValue}>{caloriesBurned}</Text>
                      </View>
                    </View>
                    
                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                      <TouchableOpacity 
                        style={[styles.controlButton, isWorkoutPaused ? styles.resumeButton : styles.pauseButton]}
                        onPress={togglePause}
                      >
                        <Text style={styles.controlButtonText}>
                          {isWorkoutPaused ? 'Resume' : 'Pause'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.controlButton, styles.countButton]}
                        onPress={countRep}
                        disabled={isWorkoutPaused || isResting}
                      >
                        <Text style={styles.controlButtonText}>Count Rep</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.endButton}
                      onPress={endWorkoutEarly}
                    >
                      <Text style={styles.endButtonText}>End Workout</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </Animated.View>
        </ScrollView>
        
        {/* Form Modal */}
        <Modal
          visible={showForm}
          transparent={true}
          animationType="fade"
          onRequestClose={toggleFormModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Proper {workout.name} Form</Text>
              
              <Image
                source={
                  workout.name === 'Squat' 
                    ? require('../../../assets/images/squat.png')
                    : workout.name === 'Plank'
                      ? require('../../../assets/images/plank.png')
                      : require('../../../assets/images/lunge.jpg')
                }
                style={styles.formImage}
              />
              
              <ScrollView style={styles.formInstructions}>
                {instructions.map((instruction, index) => (
                  <View key={index} style={styles.formInstructionItem}>
                    <Text style={styles.formInstructionNumber}>{index + 1}.</Text>
                    <Text style={styles.formInstructionText}>{instruction}</Text>
                  </View>
                ))}
                
                <Text style={styles.tipTitle}>Pro Tips:</Text>
                <Text style={styles.tipText}>
                  • Keep proper form over speed{'\n'}
                  • Breathe out during exertion{'\n'}
                  • Focus on muscle engagement{'\n'}
                  • Control the movement
                </Text>
              </ScrollView>
              
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={toggleFormModal}
              >
                <Text style={styles.closeModalText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 20,
  },
  backBtn: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  formBtn: {
    fontSize: 24,
    color: '#fff',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
    textAlign: 'center',
    lineHeight: 28,
  },
  mainContent: {
    flex: 1,
    padding: 15,
  },
  videoContainer: {
    width: '100%',
    height: width * 0.7,
    backgroundColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cameraToggle: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cameraToggleText: {
    color: '#fff',
    fontSize: 20,
  },
  cameraToggleLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  postureFeedback: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postureFeedbackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  instructionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    justifyContent: 'center',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    backgroundColor: '#A95CF1',
    color: '#fff',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 10,
    fontWeight: 'bold',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    lineHeight: 24,
  },
  startBtn: {
    backgroundColor: '#A95CF1',
    borderRadius: 30,
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  startBtnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 10,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  restTimer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#A95CF1',
    marginBottom: 10,
  },
  restMessage: {
    fontSize: 16,
    color: '#fff',
  },
  controlsContainer: {
    flex: 1,
  },
  counters: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  counterBox: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  counterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  counterValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#A95CF1',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#A95CF1',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  controlButton: {
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    width: '45%',
  },
  pauseButton: {
    backgroundColor: '#FF9500',
  },
  resumeButton: {
    backgroundColor: '#4CD964',
  },
  countButton: {
    backgroundColor: '#A95CF1',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  endButton: {
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#FF3B30',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#A95CF1',
    marginBottom: 20,
  },
  resultContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
    width: '100%',
  },
  resultItem: {
    alignItems: 'center',
    width: '45%',
    marginBottom: 20,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  completeButton: {
    backgroundColor: '#A95CF1',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#A95CF1',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    width: '100%',
  },
  backButtonText: {
    color: '#A95CF1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  formImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 15,
    resizeMode: 'cover',
  },
  formInstructions: {
    maxHeight: 200,
    width: '100%',
    marginBottom: 15,
  },
  formInstructionItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  formInstructionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A95CF1',
    marginRight: 5,
    width: 20,
  },
  formInstructionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  tipText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  closeModalButton: {
    backgroundColor: '#A95CF1',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 15,
  },
  closeModalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionButton: {
    backgroundColor: '#A95CF1',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    width: '80%',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraNote: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default WorkoutVideo; 