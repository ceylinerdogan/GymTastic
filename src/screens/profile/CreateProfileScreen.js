import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreateProfileScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [gender, setGender] = useState(null);
  const [dob, setDob] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [error, setError] = useState('');

  const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDob(selectedDate.toLocaleDateString());
  };

  const validateFields = () => {
    if (!name) {
      setError('Please enter your name.');
      return false;
    }
    if (!surname) {
      setError('Please enter your surname.');
      return false;
    }
    if (!gender) {
      setError('Please select your gender.');
      return false;
    }
    if (!dob) {
      setError('Please select your date of birth.');
      return false;
    }
    if (!weight) {
      setError('Please enter your weight.');
      return false;
    }
    if (isNaN(weight)) {
      setError('Weight must be a valid number.');
      return false;
    }
    if (!height) {
      setError('Please enter your height.');
      return false;
    }
    if (isNaN(height)) {
      setError('Height must be a valid number.');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateFields()) {
      navigation.navigate('Main', {
        name,
        surname,
        gender,
        dob,
        weight,
        height,
      });
    }
  };

  return (
    <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
      {/* Illustration */}
      <Image
        source={require('../../../assets/images/gym_icon.png')}
        style={styles.illustration}
      />

      {/* Heading */}
      <Text style={styles.title}>Let's complete your profile</Text>
      <Text style={styles.subtitle}>
        It will help us to know more about you!
      </Text>

      {/* Name Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter Your Name"
        placeholderTextColor="#B8B8B8"
        value={name}
        onChangeText={setName}
      />

      {/* Surname Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter Your Surname"
        placeholderTextColor="#B8B8B8"
        value={surname}
        onChangeText={setSurname}
      />

      {/* Gender Dropdown */}
      <Dropdown
        style={styles.input}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        data={genderOptions}
        maxHeight={200}
        labelField="label"
        valueField="value"
        placeholder="Choose Gender"
        value={gender}
        onChange={(item) => setGender(item.value)}
      />

      {/* Date Picker */}
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.input}
      >
        <Text style={dob ? styles.dateText : styles.placeholderStyle}>
          {dob || 'Select Date of Birth'}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      {/* Weight Input */}
      <View style={styles.inlineInputContainer}>
        <TextInput
          style={styles.inlineInput}
          placeholder="Your Weight"
          placeholderTextColor="#B8B8B8"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />
        <Text style={styles.unit}>KG</Text>
      </View>

      {/* Height Input */}
      <View style={styles.inlineInputContainer}>
        <TextInput
          style={styles.inlineInput}
          placeholder="Your Height"
          placeholderTextColor="#B8B8B8"
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
        />
        <Text style={styles.unit}>CM</Text>
      </View>

      {/* Error Message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Next Button */}
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <LinearGradient
          colors={['#8E44AD', '#A95CF1']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  illustration: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    justifyContent: 'center',
  },
  placeholderStyle: { color: '#B8B8B8', fontSize: 16 },
  dateText: { fontSize: 16, color: '#333' },
  inlineInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 20,
    height: 50,
  },
  inlineInput: { flex: 1, fontSize: 16 },
  unit: { fontSize: 16, color: '#A95CF1', fontWeight: 'bold' },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 10 },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    marginVertical: 10,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default CreateProfileScreen;
