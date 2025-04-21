import React, { useState, useEffect } from 'react';
import {
  Keyboard,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const API_URL = 'https://nagamedserver.onrender.com/api';

const CreateAppointment = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [clinicOpen, setClinicOpen] = useState(false);
  const [doctorOpen, setDoctorOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [reason, setReason] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [appointmentTime, setAppointmentTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/clinic`);
      if (!response.ok) throw new Error('Failed to fetch clinics');
      const data = await response.json();
      setClinics(data.map(clinic => ({ label: clinic.clinic_name, value: clinic._id })));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async (clinicId) => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/clinic/${clinicId}/doctor`);
      if (!response.ok) throw new Error('Failed to fetch doctors');
      const data = await response.json();
      setDoctors(data.map(doctor => ({ label: doctor.doctor_name, value: doctor._id })));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setAppointmentDate(selectedDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setAppointmentTime(selectedTime);
    }
  };

  const handleBookAppointment = async () => {
    if (!name || !selectedClinic || !selectedDoctor || !reason) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    // Combine date and time
    const appointmentDateTime = new Date(
      appointmentDate.getFullYear(),
      appointmentDate.getMonth(),
      appointmentDate.getDate(),
      appointmentTime.getHours(),
      appointmentTime.getMinutes()
    );

    // Get current date and time
    const now = new Date();
    // Set time to 00:00:00 for date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Set appointment date to 00:00:00 for comparison
    const selectedDate = new Date(
      appointmentDate.getFullYear(),
      appointmentDate.getMonth(),
      appointmentDate.getDate()
    );

    if (selectedDate < today) {
      setErrorMessage('Appointment date cannot be in the past');
      return;
    }

    const appointmentData = {
      name,
      clinic_id: selectedClinic,
      doctor_id: selectedDoctor,
      reason,
      appointment_date_time: appointmentDateTime,
    };

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });

      const responseData = await response.json();

      if (!response.ok) throw new Error(responseData.message || 'Failed to book appointment');

      resetForm();
      navigation.navigate('AppointmentSuccess');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSelectedClinic(null);
    setSelectedDoctor(null);
    setReason('');
    setAppointmentDate(new Date());
    setAppointmentTime(new Date());
    setErrorMessage('');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Book an Appointment</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput style={styles.input} placeholder="Enter your name" value={name} onChangeText={setName} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Appointment Date</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.input}>{appointmentDate.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={appointmentDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Appointment Time</Text>
          <TouchableOpacity onPress={() => setShowTimePicker(true)}>
            <Text style={styles.input}>
              {appointmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={appointmentTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>

        <View style={[styles.inputContainer, { zIndex: clinicOpen ? 300 : 1 }]}>
          <Text style={styles.label}>Select a Clinic</Text>
          <DropDownPicker
            open={clinicOpen}
            value={selectedClinic}
            items={clinics}
            setOpen={setClinicOpen}
            setValue={setSelectedClinic}
            onChangeValue={fetchDoctors}
            placeholder="Choose a Clinic"
          />
        </View>

        <View style={[styles.inputContainer, { zIndex: doctorOpen ? 200 : 1 }]}>
          <Text style={styles.label}>Select a Doctor</Text>
          <DropDownPicker
            open={doctorOpen}
            value={selectedDoctor}
            items={doctors}
            setOpen={setDoctorOpen}
            setValue={setSelectedDoctor}
            placeholder="Choose a Doctor"
            disabled={!selectedClinic}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Reason for Consultation</Text>
          <TextInput style={styles.input} placeholder="Enter reason" value={reason} onChangeText={setReason} multiline />
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <TouchableOpacity style={styles.submitButton} onPress={handleBookAppointment}>
            <Text style={styles.buttonText}>Confirm Appointment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default CreateAppointment;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  inputContainer: { marginBottom: 10 },
  label: { fontSize: 16, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  errorText: { color: 'red', marginBottom: 10 },
  submitButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16 },
  dateTimePicker: {
    height: 120,
    marginTop: -10,
  },
});
