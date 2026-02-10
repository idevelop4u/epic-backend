import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.emptyState}>
        <MaterialCommunityIcons
          name="bell-off"
          size={48}
          color="#999"
          style={{ marginBottom: 12 }}
        />
        <Text style={styles.emptyText}>No notifications yet</Text>
        <Text style={styles.emptySubtext}>
          You'll receive notifications when someone applies to your tasks
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
