import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../stores/authStore';
import { useTasksStore } from '../../stores/tasksStore';
import { taskService } from '../../services/taskService';

export default function TasksScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const { tasks, setTasks, loading, setLoading } = useTasksStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, filterCategory]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getAllTasks();
      setTasks(response.data || response);
    } catch (error) {
      console.log('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let result = tasks;

    // Filter by search query
    if (searchQuery.trim()) {
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter((task) => task.category === filterCategory);
    }

    setFilteredTasks(result);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'shopping', label: 'Shopping' },
    { id: 'medical', label: 'Medical' },
    { id: 'household', label: 'Household' },
    { id: 'mobility', label: 'Mobility' },
    { id: 'other', label: 'Other' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {user?.role === 'elderly' ? 'Request Help' : 'Available Tasks'}
        </Text>
        {user?.role === 'elderly' && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateTask')}
          >
            <MaterialCommunityIcons
              name="plus"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              filterCategory === category.id && styles.categoryChipActive,
            ]}
            onPress={() => setFilterCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                filterCategory === category.id && styles.categoryChipTextActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tasks List */}
      <ScrollView
        style={styles.tasksList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateText}>No tasks found</Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onPress={() =>
                navigation.navigate('TaskDetailFromList', { taskId: task._id })
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const TaskItem = ({ task, onPress }) => (
  <TouchableOpacity style={styles.taskItem} onPress={onPress}>
    <View style={styles.taskHeader}>
      <Text style={styles.taskTitle} numberOfLines={2}>
        {task.title}
      </Text>
      <View style={styles.statusBadge}>
        <Text style={styles.statusBadgeText}>{task.status || 'Open'}</Text>
      </View>
    </View>

    <Text style={styles.taskDescription} numberOfLines={2}>
      {task.description}
    </Text>

    <View style={styles.taskFooter}>
      <View style={styles.taskMetaItem}>
        <MaterialCommunityIcons
          name="map-marker"
          size={16}
          color="#666"
        />
        <Text style={styles.taskMetaText}>
          {task.location?.city || 'Unknown'}
        </Text>
      </View>

      <View style={styles.taskMetaItem}>
        <MaterialCommunityIcons
          name="clock-outline"
          size={16}
          color="#666"
        />
        <Text style={styles.taskMetaText}>
          {task.urgency || 'Normal'}
        </Text>
      </View>

      {task.reward && (
        <View style={styles.rewardBadge}>
          <Text style={styles.rewardText}>₹{task.reward}</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
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
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  createButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  categoryScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  categoryContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
  },
  categoryChipText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 13,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  rewardBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rewardText: {
    fontSize: 12,
    color: '#8B6914',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
});
