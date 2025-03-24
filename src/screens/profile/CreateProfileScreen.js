import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Dropdown } from 'react-native-element-dropdown';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { profileService } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services';

// Fitness goal options
const fitnessGoals = [
  { label: 'Lose Weight', value: 'lose_weight' },
  { label: 'Build Muscle', value: 'build_muscle' },
  { label: 'Improve Fitness', value: 'improve_fitness' },
  { label: 'Maintain Health', value: 'maintain_health' },
];

// Activity level options
const activityLevels = [
  { label: 'Sedentary (little or no exercise)', value: 'sedentary' },
  { label: 'Lightly active (light exercise 1-3 days/week)', value: 'light' },
  { label: 'Moderately active (moderate exercise 3-5 days/week)', value: 'moderate' },
  { label: 'Very active (hard exercise 6-7 days/week)', value: 'very_active' },
  { label: 'Extra active (very hard exercise & physical job)', value: 'extra_active' },
];

// Gender options
const genderOptions = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
  { label: 'Prefer not to say', value: 'Not_specified' },
];

const CreateProfileScreen = ({ navigation, route }) => {
  // Get email and userId from navigation params if available
  const { email, userId } = route.params || {};

  const [gender, setGender] = useState(null);
  const [dob, setDob] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState(null);
  const [activityLevel, setActivityLevel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpContent, setHelpContent] = useState({ title: '', content: '' });
  const [profileImage, setProfileImage] = useState(null);
  const [showImageOptions, setShowImageOptions] = useState(false);

  // Form validation states
  const [genderError, setGenderError] = useState('');
  const [dobError, setDobError] = useState('');
  const [weightError, setWeightError] = useState('');
  const [heightError, setHeightError] = useState('');
  const [goalError, setGoalError] = useState('');
  const [activityLevelError, setActivityLevelError] = useState('');

  // Clear fields when component mounts
  useEffect(() => {
    // Reset all form fields to ensure we don't show cached data
    setGender(null);
    setDob('');
    setWeight('');
    setHeight('');
    setGoal(null);
    setActivityLevel(null);
    setProfileImage(null);

    console.log('CreateProfile: Cleared all fields, using userId:', userId);
  }, [userId]);

  const validateGender = (gender) => {
    if (!gender) {
      setGenderError('Please select your gender');
      return false;
    }
    setGenderError('');
    return true;
  };

  const validateDob = (dob) => {
    // Basic date format validation (DD.MM.YYYY)
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.\d{4}$/;
    if (!dob) {
      setDobError('Date of birth is required');
      return false;
    } else if (!dateRegex.test(dob)) {
      setDobError('Please use format: DD.MM.YYYY');
      return false;
    }
    setDobError('');
    return true;
  };

  const validateWeight = (weight) => {
    if (!weight) {
      setWeightError('Weight is required');
      return false;
    } else if (isNaN(weight) || parseFloat(weight) <= 0) {
      setWeightError('Please enter a valid weight');
      return false;
    } else if (parseFloat(weight) < 30 || parseFloat(weight) > 300) {
      setWeightError('Weight should be between 30-300kg');
      return false;
    }
    setWeightError('');
    return true;
  };

  const validateHeight = (height) => {
    if (!height) {
      setHeightError('Height is required');
      return false;
    } else if (isNaN(height) || parseFloat(height) <= 0) {
      setHeightError('Please enter a valid height');
      return false;
    } else if (parseFloat(height) < 100 || parseFloat(height) > 250) {
      setHeightError('Height should be between 100-250cm');
      return false;
    }
    setHeightError('');
    return true;
  };

  const validateGoal = (goal) => {
    if (!goal) {
      setGoalError('Please select your fitness goal');
      return false;
    }
    setGoalError('');
    return true;
  };

  const validateActivityLevel = (level) => {
    if (!level) {
      setActivityLevelError('Please select your activity level');
      return false;
    }
    setActivityLevelError('');
    return true;
  };

  const calculateBMI = () => {
    if (weight && height) {
      const weightNum = parseFloat(weight);
      const heightNum = parseFloat(height) / 100; // Convert cm to m
      const bmi = weightNum / (heightNum * heightNum);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return '';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const getBMIColor = (bmi) => {
    if (!bmi) return '#ccc';
    if (bmi < 18.5) return '#64B5F6'; // Blue for underweight
    if (bmi < 25) return '#4CD964'; // Green for normal
    if (bmi < 30) return '#FFCC00'; // Yellow for overweight
    return '#FF6B6B'; // Red for obese
  };

  const calculateCalorieNeeds = () => {
    if (!weight || !height || !gender || !dob || !activityLevel) return null;

    // Extract year from DOB to calculate age
    const dobYear = parseInt(dob.split('.')[2]);
    const currentYear = new Date().getFullYear();
    const age = currentYear - dobYear;

    // Base formula for BMR (Basal Metabolic Rate)
    let bmr = 0;

    if (gender === 'Male') {
      // Male: 10W + 6.25H - 5A + 5
      bmr = 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * age + 5;
    } else {
      // Female: 10W + 6.25H - 5A - 161
      bmr = 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * age - 161;
    }

    // Apply activity multiplier
    let tdee = 0; // Total Daily Energy Expenditure
    switch (activityLevel) {
      case 'sedentary':
        tdee = bmr * 1.2;
        break;
      case 'light':
        tdee = bmr * 1.375;
        break;
      case 'moderate':
        tdee = bmr * 1.55;
        break;
      case 'very_active':
        tdee = bmr * 1.725;
        break;
      case 'extra_active':
        tdee = bmr * 1.9;
        break;
      default:
        tdee = bmr * 1.2;
    }

    return Math.round(tdee);
  };

  const showHelpModal = (title, content) => {
    setHelpContent({ title, content });
    setShowHelp(true);
  };

  const handleNext = async () => {
    // Validate all fields
    const isGenderValid = validateGender(gender);
    const isDobValid = validateDob(dob);
    const isWeightValid = validateWeight(weight);
    const isHeightValid = validateHeight(height);
    const isGoalValid = validateGoal(goal);
    const isActivityValid = validateActivityLevel(activityLevel);

    const isFormValid = isGenderValid && isDobValid &&
      isWeightValid && isHeightValid && isGoalValid && isActivityValid;

    if (isFormValid) {
      setIsLoading(true);
      dismissKeyboard();

      try {
        // Get the user data from AsyncStorage
        const userData = await AsyncStorage.getItem('user_data');
        const user = userData ? JSON.parse(userData) : null;

        if (!user) {
          throw new Error('User information not found. Please register or login again.');
        }

        // Check if user still exists in the database
        const userExists = await authService.checkUserExists(user.userID);

        if (!userExists.exists) {
          // User has been deleted from database
          await authService.clearUserFromStorage();
          setIsLoading(false);

          Alert.alert(
            'Account Error',
            'Your account no longer exists in our system. You may need to register again.',
            [
              {
                text: 'OK',
                onPress: () => navigation.replace('Login')
              }
            ]
          );
          return;
        }

        // Create profile data object using the format required by the backend
        const profileData = {
          userID: user.userID,  // This should come from registration response
          gender: gender,
          height: parseFloat(height),
          weight: parseFloat(weight),
          profilepic: profileImage || '', // Ensure empty string if no image selected
          birth_date: dob,
          fitness_goal: goal,
          activity_level: activityLevel
        };

        console.log('Sending profile data:', profileData);

        // Call API to create profile
        const response = await profileService.createProfile(profileData);

        setIsLoading(false);

        if (response.success) {
          // Update the user data with profile info
          user.hasProfile = true;
          await AsyncStorage.setItem('user_data', JSON.stringify(user));

          // Navigate to main screen after successful profile creation
          navigation.replace('Main');
        } else {
          throw new Error(response.message || 'Failed to create profile');
        }
      } catch (error) {
        setIsLoading(false);
        console.error('Profile creation error:', error);

        // Show appropriate error message
        if (error.type === 'network') {
          Alert.alert('Connection Error', 'Please check your internet connection and try again.');
        } else if (error.message && error.message.includes('account no longer exists')) {
          // User account was deleted
          Alert.alert(
            'Account Error',
            'Your account no longer exists in our system. You may need to register again.',
            [
              {
                text: 'OK',
                onPress: () => navigation.replace('Login')
              }
            ]
          );
        } else {
          Alert.alert(
            'Profile Creation Failed',
            error.message || 'Unable to create your profile. Please try again later.'
          );
        }
      }
    } else {
      // Scroll to the first error field
      Keyboard.dismiss();
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);
  const bmiColor = getBMIColor(bmi);
  const calorieNeeds = calculateCalorieNeeds();

  const handleChoosePhoto = () => {
    setShowImageOptions(true);
  };

  const takePhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
      saveToPhotos: true,
    };

    launchCamera(options, (response) => {
      setShowImageOptions(false);

      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        console.log('Camera Error: ', response.errorMessage);
        Alert.alert('Camera Error', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        setProfileImage(response.assets[0].uri);
      }
    });
  };

  const chooseFromLibrary = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
    };

    launchImageLibrary(options, (response) => {
      setShowImageOptions(false);

      if (response.didCancel) {
        console.log('User cancelled image selection');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Image Selection Error', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        setProfileImage(response.assets[0].uri);
      }
    });
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <Text style={styles.title}>Create Your Profile</Text>
              </View>

              {/* Profile Image Selection */}
              <View style={styles.profileImageContainer}>
                <TouchableOpacity style={styles.profileImageWrapper} onPress={handleChoosePhoto}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                  ) : (
                    <Image
                      source={require('../../../assets/images/emptyProfilePic.jpg')}
                      style={styles.profileImage}
                    />
                  )}
                  <View style={styles.editIconContainer}>
                    <Text style={styles.editIcon}>📷</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.addPhotoText}>Add Profile Photo</Text>
              </View>

              {/* Personal Information Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Information</Text>

                <View style={styles.inputContainer}>
                  <Dropdown
                    style={[styles.dropdown, genderError ? styles.inputError : null]}
                    placeholder="Select Gender"
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    data={genderOptions}
                    maxHeight={200}
                    labelField="label"
                    valueField="value"
                    value={gender}
                    onChange={(item) => {
                      setGender(item.value);
                      validateGender(item.value);
                    }}
                  />
                  {genderError ? <Text style={styles.errorText}>{genderError}</Text> : null}
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, dobError ? styles.inputError : null]}
                    placeholder="Date of Birth (DD.MM.YYYY)"
                    placeholderTextColor="#999"
                    value={dob}
                    onChangeText={setDob}
                    keyboardType="numeric"
                    onBlur={() => validateDob(dob)}
                  />
                  {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}
                </View>
              </View>

              {/* Body Metrics Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Body Metrics</Text>

                <View style={styles.measurementRow}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                    <TextInput
                      style={[styles.input, weightError ? styles.inputError : null]}
                      placeholder="Weight"
                      placeholderTextColor="#999"
                      value={weight}
                      onChangeText={(text) => {
                        setWeight(text);
                        if (weightError) validateWeight(text);
                      }}
                      keyboardType="numeric"
                      onBlur={() => validateWeight(weight)}
                    />
                    <Text style={styles.measurementUnit}>KG</Text>
                    {weightError ? <Text style={styles.errorText}>{weightError}</Text> : null}
                  </View>

                  <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                    <TextInput
                      style={[styles.input, heightError ? styles.inputError : null]}
                      placeholder="Height"
                      placeholderTextColor="#999"
                      value={height}
                      onChangeText={(text) => {
                        setHeight(text);
                        if (heightError) validateHeight(text);
                      }}
                      keyboardType="numeric"
                      onBlur={() => validateHeight(height)}
                    />
                    <Text style={styles.measurementUnit}>CM</Text>
                    {heightError ? <Text style={styles.errorText}>{heightError}</Text> : null}
                  </View>
                </View>

                {/* BMI Display if both height and weight are provided */}
                {bmi && (
                  <View style={styles.bmiContainer}>
                    <View style={styles.bmiHeader}>
                      <Text style={styles.bmiTitle}>Your BMI</Text>
                      <TouchableOpacity
                        onPress={() =>
                          showHelpModal(
                            'Body Mass Index (BMI)',
                            'BMI is a measure of body fat based on height and weight. A healthy BMI range is between 18.5 and 24.9.\n\n• Below 18.5: Underweight\n• 18.5-24.9: Normal weight\n• 25-29.9: Overweight\n• 30 and above: Obese'
                          )
                        }
                      >
                        <Text style={styles.bmiInfo}>ⓘ</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.bmiValueContainer}>
                      <Text style={[styles.bmiValue, { color: bmiColor }]}>{bmi}</Text>
                      <Text style={[styles.bmiCategory, { color: bmiColor }]}>{bmiCategory}</Text>
                    </View>
                    <View style={styles.bmiScaleContainer}>
                      <View style={styles.bmiScale}>
                        <View style={styles.bmiRange1} />
                        <View style={styles.bmiRange2} />
                        <View style={styles.bmiRange3} />
                        <View style={styles.bmiRange4} />
                      </View>
                      <View style={styles.bmiMarkers}>
                        <Text style={styles.bmiMarker}>18.5</Text>
                        <Text style={styles.bmiMarker}>25</Text>
                        <Text style={styles.bmiMarker}>30</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Fitness Goals Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Fitness Goals</Text>

                <View style={styles.inputContainer}>
                  <Dropdown
                    style={[styles.dropdown, goalError ? styles.inputError : null]}
                    placeholder="Select Your Goal"
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    data={fitnessGoals}
                    maxHeight={200}
                    labelField="label"
                    valueField="value"
                    value={goal}
                    onChange={(item) => {
                      setGoal(item.value);
                      validateGoal(item.value);
                    }}
                  />
                  {goalError ? <Text style={styles.errorText}>{goalError}</Text> : null}
                </View>

                <View style={styles.inputContainer}>
                  <Dropdown
                    style={[styles.dropdown, activityLevelError ? styles.inputError : null]}
                    placeholder="Select Activity Level"
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    data={activityLevels}
                    maxHeight={200}
                    labelField="label"
                    valueField="value"
                    value={activityLevel}
                    onChange={(item) => {
                      setActivityLevel(item.value);
                      validateActivityLevel(item.value);
                    }}
                  />
                  {activityLevelError ? <Text style={styles.errorText}>{activityLevelError}</Text> : null}
                </View>

                {/* Calorie Needs Display */}
                {calorieNeeds && (
                  <View style={styles.caloriesContainer}>
                    <View style={styles.caloriesHeader}>
                      <Text style={styles.caloriesTitle}>Estimated Daily Calories</Text>
                      <TouchableOpacity
                        onPress={() =>
                          showHelpModal(
                            'Daily Calorie Needs',
                            'This is an estimate of how many calories you need each day to maintain your current weight, based on your age, gender, height, weight, and activity level.\n\nTo lose weight: Consume fewer calories than this number.\nTo gain weight: Consume more calories than this number.'
                          )
                        }
                      >
                        <Text style={styles.caloriesInfo}>ⓘ</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.caloriesValue}>{calorieNeeds} kcal</Text>
                    <Text style={styles.caloriesNote}>
                      {goal === 'lose_weight'
                        ? `Target for weight loss: ${calorieNeeds - 500} kcal`
                        : goal === 'build_muscle'
                          ? `Target for muscle gain: ${calorieNeeds + 300} kcal`
                          : 'Adjust based on your specific goals'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Next Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleNext}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Create Profile</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>

        {/* Help Modal */}
        <Modal
          visible={showHelp}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowHelp(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowHelp(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{helpContent.title}</Text>
                  <Text style={styles.modalText}>{helpContent.content}</Text>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setShowHelp(false)}
                  >
                    <Text style={styles.modalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Image Selection Modal */}
        <Modal
          visible={showImageOptions}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImageOptions(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowImageOptions(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.photoOptionsContainer}>
                <Text style={styles.photoOptionsTitle}>Choose Profile Photo</Text>

                <TouchableOpacity style={styles.photoOption} onPress={takePhoto}>
                  <Text style={styles.photoOptionIcon}>📸</Text>
                  <Text style={styles.photoOptionText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.photoOption} onPress={chooseFromLibrary}>
                  <Text style={styles.photoOptionIcon}>🖼️</Text>
                  <Text style={styles.photoOptionText}>Choose from Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.photoOption, styles.photoOptionCancel]}
                  onPress={() => setShowImageOptions(false)}
                >
                  <Text style={[styles.photoOptionText, styles.photoOptionTextCancel]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    padding: 2,
  },
  editIcon: {
    fontSize: 18,
    color: '#fff',
  },
  addPhotoText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    color: '#333',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 3,
    marginLeft: 8,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 50,
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#333',
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  measurementUnit: {
    position: 'absolute',
    right: 16,
    top: 14,
    fontSize: 16,
    color: '#A95CF1',
    fontWeight: 'bold',
  },
  bmiContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
  },
  bmiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bmiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bmiInfo: {
    fontSize: 18,
    color: '#A95CF1',
  },
  bmiValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 10,
  },
  bmiCategory: {
    fontSize: 18,
    fontWeight: '500',
  },
  bmiScaleContainer: {
    marginTop: 8,
  },
  bmiScale: {
    height: 6,
    flexDirection: 'row',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bmiRange1: {
    flex: 18.5,
    backgroundColor: '#64B5F6', // Blue for underweight
  },
  bmiRange2: {
    flex: 6.5,
    backgroundColor: '#4CD964', // Green for normal
  },
  bmiRange3: {
    flex: 5,
    backgroundColor: '#FFCC00', // Yellow for overweight
  },
  bmiRange4: {
    flex: 10,
    backgroundColor: '#FF6B6B', // Red for obese
  },
  bmiMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  bmiMarker: {
    fontSize: 12,
    color: '#666',
  },
  caloriesContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 16,
  },
  caloriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  caloriesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  caloriesInfo: {
    fontSize: 18,
    color: '#A95CF1',
  },
  caloriesValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#A95CF1',
    marginBottom: 4,
  },
  caloriesNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#8E44AD',
    borderRadius: 30,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A95CF1',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#A95CF1',
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoOptionsContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  photoOptionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  photoOptionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  photoOptionText: {
    fontSize: 16,
    color: '#333',
  },
  photoOptionCancel: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  photoOptionTextCancel: {
    color: '#FF3B30',
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E1E1E1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profilePlaceholderImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export default CreateProfileScreen;
