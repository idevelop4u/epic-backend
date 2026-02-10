import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../stores/authStore';
import { userService } from '../../services/userService';

export default function ProfileScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuthStore();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile();
      setProfile(response.data || response);
    } catch (error) {
      console.log('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await userService.logout?.();
          } catch (error) {
            console.log('Logout API error:', error);
          }
          await logout();
        },
        style: 'destructive',
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {profile?.firstName?.charAt(0) || 'U'}
          </Text>
        </View>

        <Text style={styles.name}>
          {profile?.firstName} {profile?.lastName}
        </Text>
        <Text style={styles.email}>{profile?.email}</Text>

        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={16}
            color="#007AFF"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsContainer}>
          <StatBox
            icon="briefcase"
            label="Tasks"
            value={profile?.tasksCompleted || 0}
          />
          <StatBox
            icon="star"
            label="Rating"
            value={(profile?.rating || 0).toFixed(1)}
          />
          <StatBox
            icon="award"
            label="Badges"
            value={profile?.badges?.length || 0}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <MenuItem
          icon="message"
          title="Messages"
          subtitle="Chat with volunteers"
          onPress={() => navigation.navigate('Chat')}
        />
        <MenuItem
          icon="star"
          title="Reviews"
          subtitle="See what others say"
          onPress={() => {}}
        />
        <MenuItem
          icon="history"
          title="History"
          subtitle="Your task history"
          onPress={() => {}}
        />
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <MenuItem
          icon="cog"
          title="Settings"
          subtitle="Preferences and privacy"
          onPress={() => {}}
        />
        <MenuItem
          icon="bell"
          title="Notifications"
          subtitle="Manage alerts"
          onPress={() => {}}
        />
        <MenuItem
          icon="lock"
          title="Security"
          subtitle="Password and security"
          onPress={() => {}}
        />
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.dangerMenuItem}
          onPress={handleLogout}
        >
          <View style={styles.dangerMenuLeft}>
            <MaterialCommunityIcons
              name="logout"
              size={24}
              color="#FF3B30"
            />
            <Text style={styles.dangerMenuTitle}>Logout</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const StatBox = ({ icon, label, value }) => (
  <View style={styles.statBox}>
    <MaterialCommunityIcons name={icon} size={24} color="#007AFF" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuItem = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color="#007AFF"
        style={{ marginRight: 12 }}
      />
      <View>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <MaterialCommunityIcons
      name="chevron-right"
      size={24}
      color="#999"
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dangerMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  dangerMenuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dangerMenuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 12,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  appVersion: {
    fontSize: 12,
    color: '#999',
  },
});
