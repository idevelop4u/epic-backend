import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function VolunteerDetailScreen() {
  return (
    <View style={styles.container}>
      <Text>Volunteer Details Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
