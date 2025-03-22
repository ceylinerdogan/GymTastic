import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  PermissionsAndroid
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { Dropdown } from 'react-native-element-dropdown';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { authService } from '../../services/api';

// Request camera permission on Android
const requestCameraPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'GymTastic needs access to your camera to take profile pictures.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Camera permission granted');
        return true;
      } else {
        console.log('Camera permission denied');
        return false;
      }
    } catch (err) {
      console.warn('Error requesting camera permission:', err);
      return false;
    }
  }
  return true; // On iOS we don't need to request permission this way
};

const EditProfileScreen = ({ navigation, route }) => {
  const {
    name = '',
    surname = '',
    gender = '',
    dob = '',
    weight = '',
    height = '',
    goal = '',
    activityLevel = '',
    profileImageUri = null
  } = route.params || {};

  const [profileName, setProfileName] = useState(name);
  const [profileSurname, setProfileSurname] = useState(surname);
  const [profileGender, setProfileGender] = useState(gender);
  const [profileDob, setProfileDob] = useState(dob);
  const [profileWeight, setProfileWeight] = useState(weight.toString());
  const [profileHeight, setProfileHeight] = useState(height.toString());
  const [profileGoal, setProfileGoal] = useState(goal);
  const [profileActivityLevel, setProfileActivityLevel] = useState(activityLevel);
  const [profileImage, setProfileImage] = useState(profileImageUri);
  const [isLoading, setIsLoading] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Log initial props to help debug
  useEffect(() => {
    console.log('EditProfile - Initial profileImageUri:', profileImageUri);
    console.log('EditProfile - Initial state profileImage:', profileImage);
  }, [profileImageUri, profileImage]);

  // Form validation states
  const [nameError, setNameError] = useState('');
  const [surnameError, setSurnameError] = useState('');
  const [weightError, setWeightError] = useState('');
  const [heightError, setHeightError] = useState('');

  // Gender options
  const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
    { label: 'Prefer not to say', value: 'Not_specified' },
  ];

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

  const validateName = (name) => {
    if (!name.trim()) {
      setNameError('First name is required');
      return false;
    }
    setNameError('');
    return true;
  };

  const validateSurname = (surname) => {
    if (!surname.trim()) {
      setSurnameError('Last name is required');
      return false;
    }
    setSurnameError('');
    return true;
  };

  const validateWeight = (weight) => {
    if (!weight) {
      setWeightError('Weight is required');
      return false;
    } else if (isNaN(weight) || parseFloat(weight) <= 0) {
      setWeightError('Please enter a valid weight');
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
    }
    setHeightError('');
    return true;
  };

  const handleChoosePhoto = () => {
    setShowImageOptions(true);
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission in your device settings to take a profile picture.',
        [{ text: 'OK' }]
      );
      setShowImageOptions(false);
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
      saveToPhotos: true,
    };

    try {
      const result = await launchCamera(options);
      setShowImageOptions(false);
      
      if (result.didCancel) {
        console.log('User cancelled camera');
      } else if (result.errorCode) {
        console.log('Camera Error: ', result.errorMessage);
        Alert.alert('Camera Error', result.errorMessage);
      } else if (result.assets && result.assets.length > 0) {
        console.log('Image selected:', result.assets[0].uri);
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      setShowImageOptions(false);
      console.log('Error launching camera:', error);
      Alert.alert('Camera Error', 'Failed to launch camera. Please check app permissions.');
    }
  };

  const chooseFromLibrary = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
    };

    try {
      const result = await launchImageLibrary(options);
      setShowImageOptions(false);
      
      if (result.didCancel) {
        console.log('User cancelled image selection');
      } else if (result.errorCode) {
        console.log('ImagePicker Error: ', result.errorMessage);
        Alert.alert('Image Selection Error', result.errorMessage);
      } else if (result.assets && result.assets.length > 0) {
        console.log('Image selected:', result.assets[0].uri);
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      setShowImageOptions(false);
      console.log('Error launching image library:', error);
      Alert.alert('Image Selection Error', 'Failed to open image gallery. Please check app permissions.');
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Format date as DD.MM.YYYY
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      setProfileDob(`${day}.${month}.${year}`);
    }
  };

  const handleSaveProfile = async () => {
    // Validate required fields
    const isNameValid = validateName(profileName);
    const isSurnameValid = validateSurname(profileSurname);
    const isWeightValid = validateWeight(profileWeight);
    const isHeightValid = validateHeight(profileHeight);

    if (isNameValid && isSurnameValid && isWeightValid && isHeightValid) {
      setIsLoading(true);
      
      try {
        // Get current user ID
        const userId = await AsyncStorage.getItem('current_user_id');
        
        if (!userId) {
          throw new Error('User ID not found');
        }
        
        console.log('About to update profile for user:', userId);
        console.log('Profile image to save:', profileImage);
        
        // Create profile update data
        const profileData = {
          userId,
          firstName: profileName,
          lastName: profileSurname,
          gender: profileGender,
          dateOfBirth: profileDob,
          weight: parseFloat(profileWeight),
          height: parseFloat(profileHeight),
          fitnessGoal: profileGoal,
          activityLevel: profileActivityLevel,
          profileImageUri: profileImage, // Always include the image, whether changed or not
        };
        
        // Update profile using authService
        const response = await authService.updateProfile(profileData);
        
        if (response.success) {
          console.log('Profile updated successfully', response.profile);
          Alert.alert(
            'Profile Updated',
            'Your profile has been successfully updated!',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Use goBack instead of navigate to return to previous screen with params
                  navigation.goBack();
                }
              }
            ]
          );
        } else {
          throw new Error('Failed to update profile');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        Alert.alert(
          'Update Failed',
          error.message || 'Failed to update profile. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
          </View>

          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <TouchableOpacity style={styles.profileImageWrapper} onPress={handleChoosePhoto}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <Image 
                  source={require('../../../assets/images/profile_pic.jpg')} 
                  style={styles.profileImage}
                />
              )}
              <View style={styles.editIconContainer}>
                <Text style={styles.editIconText}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </View>

          {/* Form Sections */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                value={profileName}
                onChangeText={setProfileName}
                placeholder="Enter your first name"
                placeholderTextColor="#999"
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={[styles.input, surnameError ? styles.inputError : null]}
                value={profileSurname}
                onChangeText={setProfileSurname}
                placeholder="Enter your last name"
                placeholderTextColor="#999"
              />
              {surnameError ? <Text style={styles.errorText}>{surnameError}</Text> : null}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Gender</Text>
              <Dropdown
                style={styles.dropdown}
                data={genderOptions}
                labelField="label"
                valueField="value"
                placeholder="Select gender"
                value={profileGender}
                onChange={(item) => setProfileGender(item.value)}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {profileDob || 'Select date of birth'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={profileDob ? new Date(profileDob.split('.').reverse().join('-')) : new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Body Metrics</Text>
            
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={[styles.input, weightError ? styles.inputError : null]}
                  value={profileWeight}
                  onChangeText={setProfileWeight}
                  placeholder="Weight"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                {weightError ? <Text style={styles.errorText}>{weightError}</Text> : null}
              </View>
              
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={[styles.input, heightError ? styles.inputError : null]}
                  value={profileHeight}
                  onChangeText={setProfileHeight}
                  placeholder="Height"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                {heightError ? <Text style={styles.errorText}>{heightError}</Text> : null}
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Fitness Goals</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Fitness Goal</Text>
              <Dropdown
                style={styles.dropdown}
                data={fitnessGoals}
                labelField="label"
                valueField="value"
                placeholder="Select fitness goal"
                value={profileGoal}
                onChange={(item) => setProfileGoal(item.value)}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Activity Level</Text>
              <Dropdown
                style={styles.dropdown}
                data={activityLevels}
                labelField="label"
                valueField="value"
                placeholder="Select activity level"
                value={profileActivityLevel}
                onChange={(item) => setProfileActivityLevel(item.value)}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSaveProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Image Selection Modal */}
      <Modal
        visible={showImageOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.photoOptionsContainer}>
            <Text style={styles.photoOptionsTitle}>Change Profile Photo</Text>
            
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
              <Text style={styles.photoOptionTextCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconText: {
    fontSize: 18,
    color: '#fff',
  },
  changePhotoText: {
    marginTop: 8,
    color: '#fff',
    fontSize: 16,
  },
  formSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    height: 50,
  },
  dateInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  saveButton: {
    backgroundColor: '#8E44AD',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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
    justifyContent: 'center',
  },
  photoOptionTextCancel: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default EditProfileScreen; 