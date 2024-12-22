import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';

const ProfileScreen = ({ route }) => {
  const { name = 'N/A', surname = 'N/A', gender = 'N/A', dob = 'N/A', weight = 'N/A', height = 'N/A' } = route.params || {};

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editSurname, setEditSurname] = useState(surname);
  const [editGender, setEditGender] = useState(gender);
  const [editDob, setEditDob] = useState(dob);
  const [editWeight, setEditWeight] = useState(weight.toString());
  const [editHeight, setEditHeight] = useState(height.toString());

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  const handleSave = () => {
    if (!editName || !editSurname || !editGender || !editDob || !editWeight || !editHeight) {
      Alert.alert('Error', 'All fields must be filled.');
      return;
    }
    setIsEditing(false);
    Alert.alert('Profile Updated', 'Your changes have been saved.');
  };

  const handleDateChange = (event, selectedDate) => {
    setIsEditing(false);
    if (selectedDate) {
      setEditDob(selectedDate.toLocaleDateString());
    }
    setDatePickerVisibility(false);
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/profile_pic.jpg')}
        style={styles.profileImage}
      />
      <Text style={styles.name}>
        {editName} {editSurname}
      </Text>

      {/* Editable Fields */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>Gender:</Text>
        {isEditing ? (
          <Dropdown
            style={styles.dropdown}
            data={genderOptions}
            labelField="label"
            valueField="value"
            placeholder="Select Gender"
            value={editGender}
            onChange={(item) => setEditGender(item.value)}
          />
        ) : (
          <Text style={styles.infoValue}>{editGender || 'N/A'}</Text>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>Date of Birth:</Text>
        {isEditing ? (
          <>
            <TouchableOpacity onPress={() => setDatePickerVisibility(true)} style={styles.dateButton}>
              <Text style={styles.dateButtonText}>{editDob || 'Select Date'}</Text>
            </TouchableOpacity>
            {isDatePickerVisible && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </>
        ) : (
          <Text style={styles.infoValue}>{editDob || 'N/A'}</Text>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>Weight:</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={editWeight}
            onChangeText={setEditWeight}
          />
        ) : (
          <Text style={styles.infoValue}>{editWeight || 'N/A'} kg</Text>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>Height:</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={editHeight}
            onChangeText={setEditHeight}
          />
        ) : (
          <Text style={styles.infoValue}>{editHeight || 'N/A'} cm</Text>
        )}
      </View>

      {/* Edit / Save Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
      >
        <Text style={styles.editButtonText}>
          {isEditing ? 'Save' : 'Edit Profile'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%',
    marginVertical: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#A95CF1',
    textAlign: 'right',
  },
  dropdown: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#A95CF1',
    textAlign: 'right',
  },
  dateButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#A95CF1',
  },
  editButton: {
    marginTop: 20,
    backgroundColor: '#A95CF1',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
