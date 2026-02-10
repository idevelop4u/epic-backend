import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { authService } from '../../services/authService';

export default function VerifyOTPScreen({ navigation, route }) {
  const { phoneNumber } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.verifyPhoneOTP(phoneNumber, otp);
      
      if (response.token) {
        // Navigate to success screen or login
        Alert.alert('Success', 'Phone number verified successfully');
        navigation.navigate('Login');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);
      await authService.sendPhoneOTP(phoneNumber);
      setResendTimer(60);
      Alert.alert('Success', 'OTP sent to your phone');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Verify Phone Number</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to {phoneNumber}
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Enter OTP</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="000000"
            value={otp}
            onChangeText={setOtp}
            editable={!loading}
            keyboardType="numeric"
            maxLength={6}
          />
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={resendTimer > 0 || resendLoading}
          >
            <Text
              style={[
                styles.resendLink,
                (resendTimer > 0 || resendLoading) && styles.resendLinkDisabled,
              ]}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    backgroundColor: '#F9F9F9',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  resendText: {
    color: '#666',
    fontSize: 14,
  },
  resendLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: '#999',
  },
});
