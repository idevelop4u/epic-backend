import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../stores/authStore';
import { useTasksStore } from '../../stores/tasksStore';
import { taskService } from '../../services/taskService';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const { tasks, setTasks, loading, setLoading } = useTasksStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getAllTasks({ limit: 10 });
      setTasks(response.data || response);
    } catch (error) {
      console.log('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.firstName || 'Friend'}!
          </Text>
          <Text style={styles.subtitle}>
            {user?.role === 'elderly'
              ? 'Ready to request help?'
              : 'Ready to help someone?'}
          </Text>
        </View>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>
            {user?.firstName?.charAt(0) || 'U'}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {user?.role === 'elderly' || user?.role === 'caregiver' ? (
          <ActionButton
            icon="plus-circle"
            title="Request Help"
            color="#FF3B30"
            onPress={() => navigation.navigate('TasksTab')}
          />
        ) : (
          <ActionButton
            icon="handshake"
            title="Find Tasks"
            color="#007AFF"
            onPress={() => navigation.navigate('TasksTab')}
          />
        )}
        <ActionButton
          icon="bell"
          title="Notifications"
          color="#FF9500"
          onPress={() => navigation.navigate('NotificationsTab')}
        />
        <ActionButton
          icon="message"
          title="Messages"
          color="#34C759"
          onPress={() => navigation.navigate('ProfileTab')}
        />
        <ActionButton
          icon="account"
          title="Profile"
          color="#5856D6"
          onPress={() => navigation.navigate('ProfileTab')}
        />
      </View>

      {/* Recent Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TasksTab')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
        ) : tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={styles.emptyStateText}>No tasks available yet</Text>
          </View>
        ) : (
          tasks.slice(0, 3).map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onPress={() =>
                navigation.navigate('TaskDetail', { taskId: task._id })
              }
            />
          ))
        )}
      </View>

      {/* Stats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsContainer}>
          <StatCard title="Tasks" value={tasks.length} icon="briefcase" />
          <StatCard title="Completed" value={user?.completedTasks || 0} icon="check-circle" />
          <StatCard title="Rating" value={(user?.rating || 0).toFixed(1)} icon="star" />
        </View>
      </View>
    </ScrollView>
  );
}

const ActionButton = ({ icon, title, color, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionTitle}>{title}</Text>
  </TouchableOpacity>
);

const TaskCard = ({ task, onPress }) => (
  <TouchableOpacity style={styles.taskCard} onPress={onPress}>
    <View style={styles.taskContent}>
      <View>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.taskMeta}>
          <MaterialCommunityIcons
            name="map-marker"
            size={14}
            color="#666"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.taskMetaText}>
            {task.location?.city || 'Location not specified'}
          </Text>
        </View>
      </View>
      <View style={styles.taskStatus}>
        <Text style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
          {task.status || 'Open'}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const StatCard = ({ title, value, icon }) => (
  <View style={styles.statCard}>
    <MaterialCommunityIcons name={icon} size={24} color="#007AFF" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    marginVertical: 8,
  },
  actionButton: {
    alignItems: 'center',
    width: width / 4 - 4,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  seeAll: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  taskCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  taskContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMetaText: {
    fontSize: 12,
    color: '#666',
  },
  taskStatus: {
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
