import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../stores/authStore';
import { taskService } from '../../services/taskService';
import { helpRequestService } from '../../services/helpRequestService';

export default function TaskDetailScreen({ route, navigation }) {
  const { taskId } = route.params || {};
  const user = useAuthStore((state) => state.user);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    loadTaskDetails();
  }, [taskId]);

  const loadTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTask(taskId);
      setTask(response.data || response);

      // If user is the task requester, load applications
      if (user?.id === response.requester?._id || user?.id === response.requesterId) {
        const appsResponse = await helpRequestService.getTaskApplications(taskId);
        setApplications(appsResponse.data || appsResponse);
      }

      // Check if user has applied
      if (user?.role === 'volunteer') {
        const myAppsResponse = await helpRequestService.getMyApplications();
        const applied = myAppsResponse.data?.some(
          (app) => app.taskId === taskId
        );
        setHasApplied(applied || false);
      }
    } catch (error) {
      console.log('Error loading task:', error);
      Alert.alert('Error', 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToTask = async () => {
    try {
      setActionLoading(true);
      await helpRequestService.applyToTask(taskId);
      setHasApplied(true);
      Alert.alert('Success', 'Application submitted successfully!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to apply');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      setActionLoading(true);
      await helpRequestService.approveApplication(applicationId);
      Alert.alert('Success', 'Application approved!');
      loadTaskDetails();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectApplication = async (applicationId) => {
    try {
      setActionLoading(true);
      await helpRequestService.rejectApplication(applicationId);
      Alert.alert('Success', 'Application rejected');
      loadTaskDetails();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  const isRequester = user?.id === task.requester?._id || user?.id === task.requesterId;
  const isVolunteer = user?.role === 'volunteer';

  return (
    <ScrollView style={styles.container}>
      {/* Task Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{task.title}</Text>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(task.urgency) + '20' }]}>
            <Text style={[styles.urgencyBadgeText, { color: getUrgencyColor(task.urgency) }]}>
              {task.urgency?.toUpperCase() || 'NORMAL'}
            </Text>
          </View>
        </View>

        {/* Requester Info */}
        <View style={styles.requesterCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>
              {task.requester?.firstName?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.requesterInfo}>
            <Text style={styles.requesterName}>
              {task.requester?.firstName} {task.requester?.lastName}
            </Text>
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
              <Text style={styles.rating}>{task.requester?.rating || 0} rating</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Task Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About This Task</Text>
        <Text style={styles.description}>{task.description}</Text>
      </View>

      {/* Task Info Grid */}
      <View style={styles.section}>
        <View style={styles.infoGrid}>
          <InfoCard
            icon="map-marker"
            label="Location"
            value={`${task.location?.city || 'Unknown'}, ${task.location?.state || ''}`}
          />
          <InfoCard
            icon="tag-multiple"
            label="Category"
            value={task.category?.toUpperCase() || 'OTHER'}
          />
          <InfoCard
            icon="calendar"
            label="Created"
            value={new Date(task.createdAt).toLocaleDateString()}
          />
          {task.reward > 0 && (
            <InfoCard
              icon="coin"
              label="Reward"
              value={`₹${task.reward}`}
            />
          )}
        </View>
      </View>

      {/* Applications Section (for requester) */}
      {isRequester && applications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Applications ({applications.length})</Text>
          {applications.map((application) => (
            <ApplicationCard
              key={application._id}
              application={application}
              onApprove={() => handleApproveApplication(application._id)}
              onReject={() => handleRejectApplication(application._id)}
              loading={actionLoading}
            />
          ))}
        </View>
      )}

      {/* Action Buttons */}
      {!isRequester && isVolunteer && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.applyButton, hasApplied && styles.appliedButton]}
            onPress={handleApplyToTask}
            disabled={hasApplied || actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={hasApplied ? '#666' : '#fff'} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={hasApplied ? 'check-circle' : 'plus-circle'}
                  size={20}
                  color={hasApplied ? '#666' : '#fff'}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.applyButtonText, hasApplied && styles.appliedButtonText]}>
                  {hasApplied ? 'Applied' : 'Apply to Help'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('ProfileTab', {
              screen: 'Chat',
              params: { userId: task.requester?._id },
            })}
          >
            <MaterialCommunityIcons
              name="message"
              size={20}
              color="#007AFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.contactButtonText}>Contact Requester</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const InfoCard = ({ icon, label, value }) => (
  <View style={styles.infoCard}>
    <View style={styles.infoIcon}>
      <MaterialCommunityIcons name={icon} size={20} color="#007AFF" />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const ApplicationCard = ({ application, onApprove, onReject, loading }) => (
  <View style={styles.applicationCard}>
    <View style={styles.applicationHeader}>
      <View style={styles.applicantInfo}>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarSmallText}>
            {application.volunteer?.firstName?.charAt(0) || 'U'}
          </Text>
        </View>
        <View style={styles.applicantDetails}>
          <Text style={styles.applicantName}>
            {application.volunteer?.firstName} {application.volunteer?.lastName}
          </Text>
          <View style={styles.applicantRating}>
            <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
            <Text style={styles.applicantRatingText}>
              {application.volunteer?.rating || 0}
            </Text>
          </View>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
        <Text style={styles.statusBadgeText}>{application.status}</Text>
      </View>
    </View>

    {application.message && (
      <Text style={styles.applicationMessage}>{application.message}</Text>
    )}

    {application.status === 'pending' && (
      <View style={styles.applicationActions}>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={onReject}
          disabled={loading}
        >
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={onApprove}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.approveBtnText}>Approve</Text>
          )}
        </TouchableOpacity>
      </View>
    )}
  </View>
);

const getUrgencyColor = (urgency) => {
  const colors = {
    low: '#34C759',
    normal: '#007AFF',
    high: '#FF9500',
    urgent: '#FF3B30',
  };
  return colors[urgency] || '#007AFF';
};

const getStatusColor = (status) => {
  const colors = {
    pending: '#FFF3CD',
    approved: '#D4EDDA',
    rejected: '#F8D7DA',
    completed: '#D1ECF1',
  };
  return colors[status] || '#E9ECEF';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  urgencyBadgeText: {
    fontWeight: '600',
    fontSize: 12,
  },
  requesterCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  requesterInfo: {
    flex: 1,
  },
  requesterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  infoGrid: {
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    marginTop: 2,
  },
  applicationCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  applicantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSmallText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  applicantDetails: {
    flex: 1,
  },
  applicantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  applicantRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  applicantRatingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  applicationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  applicationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  approveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#34C759',
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  actionSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  applyButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedButton: {
    backgroundColor: '#F2F2F7',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appliedButtonText: {
    color: '#666',
  },
  contactButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
});
