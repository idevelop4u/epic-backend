import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { helpRequestService } from '../../services/helpRequestService';

export default function MyApplicationsScreen({ navigation }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await helpRequestService.getMyApplications();
      setApplications(response.data || response);
    } catch (error) {
      console.log('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  };

  const handleCancelApplication = async (applicationId) => {
    try {
      await helpRequestService.cancelApplication(applicationId);
      setApplications(applications.filter((app) => app._id !== applicationId));
    } catch (error) {
      console.log('Error canceling application:', error);
    }
  };

  const getFilteredApplications = () => {
    if (filter === 'all') return applications;
    return applications.filter((app) => app.status === filter);
  };

  const filteredApplications = getFilteredApplications();

  const filterButtons = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Completed', value: 'completed' },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {filterButtons.map((btn) => (
          <TouchableOpacity
            key={btn.value}
            style={[
              styles.filterButton,
              filter === btn.value && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(btn.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === btn.value && styles.filterButtonTextActive,
              ]}
            >
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No applications yet</Text>
          <Text style={styles.emptySubtext}>
            Browse available tasks and apply to help someone
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredApplications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ApplicationItem
              application={item}
              onCancel={() => handleCancelApplication(item._id)}
              onPress={() =>
                navigation.navigate('TaskDetailFromApp', {
                  taskId: item.taskId || item.task?._id,
                })
              }
            />
          )}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const ApplicationItem = ({ application, onCancel, onPress }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#FFF3CD', text: '#8B6914', icon: 'clock-outline' },
      approved: { bg: '#D4EDDA', text: '#155724', icon: 'check-circle' },
      rejected: { bg: '#F8D7DA', text: '#721C24', icon: 'close-circle' },
      completed: { bg: '#D1ECF1', text: '#0C5460', icon: 'check-all' },
    };
    return colors[status] || colors.pending;
  };

  const statusInfo = getStatusColor(application.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleSection}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {application.task?.title || 'Task'}
          </Text>
          <View style={styles.dateContainer}>
            <MaterialCommunityIcons
              name="calendar"
              size={14}
              color="#666"
            />
            <Text style={styles.dateText}>
              {new Date(application.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <MaterialCommunityIcons
            name={statusInfo.icon}
            size={16}
            color={statusInfo.text}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>
            {application.status}
          </Text>
        </View>
      </View>

      {/* Task Details */}
      <View style={styles.taskDetails}>
        <DetailItem
          icon="map-marker"
          label="Location"
          value={`${application.task?.location?.city || 'Unknown'}`}
        />
        <DetailItem
          icon="tag"
          label="Category"
          value={application.task?.category?.toUpperCase() || 'OTHER'}
        />
        {application.task?.reward > 0 && (
          <DetailItem
            icon="coin"
            label="Reward"
            value={`₹${application.task?.reward}`}
          />
        )}
      </View>

      {/* Actions */}
      {application.status === 'pending' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel Application</Text>
        </TouchableOpacity>
      )}

      {application.status === 'approved' && (
        <View style={styles.approvedActions}>
          <TouchableOpacity style={styles.contactButton}>
            <MaterialCommunityIcons
              name="message"
              size={16}
              color="#007AFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.contactButtonText}>Contact Requester</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.trackButton}>
            <MaterialCommunityIcons
              name="map-check"
              size={16}
              color="#34C759"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.trackButtonText}>Start Task</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <View style={styles.detailItem}>
    <MaterialCommunityIcons name={icon} size={14} color="#007AFF" />
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  filterScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskDetails: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailContent: {
    marginLeft: 8,
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#000',
    fontWeight: '600',
    marginTop: 1,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 14,
  },
  approvedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 12,
  },
  trackButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
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
    paddingHorizontal: 32,
  },
});
