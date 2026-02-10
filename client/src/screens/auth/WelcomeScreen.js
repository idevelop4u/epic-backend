import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';

const { height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const [loading, setLoading] = React.useState(false);
  const { setToken, setUser } = useAuthStore();

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      const response = await authService.guestLogin();
      if (response.token) {
        setToken(response.token);
        setUser(response.user);
      }
    } catch (error) {
      console.log('Guest login error:', error);
      alert('Failed to login as guest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>♥</Text>
        </View>
        <Text style={styles.title}>Community Helper</Text>
        <Text style={styles.subtitle}>
          Connecting volunteers with those who need help
        </Text>
      </View>

      <View style={styles.featuresSection}>
        <FeatureItem icon="👴" title="For Elderly" description="Request help easily" />
        <FeatureItem icon="🙋" title="For Volunteers" description="Help your community" />
        <FeatureItem icon="⭐" title="Earn Badges" description="Get recognized for your kindness" />
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={handleGuestLogin}
          disabled={loading}
        >
          <Text style={styles.guestButtonText}>
            {loading ? 'Loading...' : 'Continue as Guest'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const FeatureItem = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  headerSection: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    flex: 0.35,
    paddingHorizontal: 20,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  buttonSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  guestButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
});
