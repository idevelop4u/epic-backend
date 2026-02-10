import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Picker,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { taskService } from '../../services/taskService';
import { useTasksStore } from '../../stores/tasksStore';

const CreateTaskSchema = Yup.object().shape({
  title: Yup.string()
    .min(5, 'Title must be at least 5 characters')
    .required('Title is required'),
  description: Yup.string()
    .min(10, 'Description must be at least 10 characters')
    .required('Description is required'),
  category: Yup.string().required('Category is required'),
  urgency: Yup.string().required('Urgency level is required'),
  reward: Yup.number().min(0, 'Reward cannot be negative'),
});

export default function CreateTaskScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const { addTask } = useTasksStore();

  const handleCreateTask = async (values) => {
    try {
      setLoading(true);
      const response = await taskService.createTask({
        title: values.title,
        description: values.description,
        category: values.category,
        urgency: values.urgency,
        reward: values.reward || 0,
        location: {
          city: values.city,
          state: values.state,
        },
      });

      addTask(response.data || response);
      Alert.alert('Success', 'Task created successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Formik
        initialValues={{
          title: '',
          description: '',
          category: 'household',
          urgency: 'normal',
          reward: '',
          city: '',
          state: '',
        }}
        validationSchema={CreateTaskSchema}
        onSubmit={handleCreateTask}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Task Title *</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.title && errors.title ? styles.inputError : null,
                ]}
                placeholder="e.g., Need help with grocery shopping"
                value={values.title}
                onChangeText={handleChange('title')}
                onBlur={handleBlur('title')}
                editable={!loading}
              />
              {touched.title && errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[
                  styles.textArea,
                  touched.description && errors.description ? styles.inputError : null,
                ]}
                placeholder="Describe the task in detail..."
                value={values.description}
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
              {touched.description && errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Category *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={values.category}
                    onValueChange={(value) => setFieldValue('category', value)}
                    enabled={!loading}
                  >
                    <Picker.Item label="Household" value="household" />
                    <Picker.Item label="Shopping" value="shopping" />
                    <Picker.Item label="Medical" value="medical" />
                    <Picker.Item label="Mobility" value="mobility" />
                    <Picker.Item label="Other" value="other" />
                  </Picker>
                </View>
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Urgency *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={values.urgency}
                    onValueChange={(value) => setFieldValue('urgency', value)}
                    enabled={!loading}
                  >
                    <Picker.Item label="Low" value="low" />
                    <Picker.Item label="Normal" value="normal" />
                    <Picker.Item label="High" value="high" />
                    <Picker.Item label="Urgent" value="urgent" />
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your city"
                  value={values.city}
                  onChangeText={handleChange('city')}
                  onBlur={handleBlur('city')}
                  editable={!loading}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your state"
                  value={values.state}
                  onChangeText={handleChange('state')}
                  onBlur={handleBlur('state')}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reward (Optional)</Text>
              <View style={styles.rewardInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.rewardInput}
                  placeholder="0"
                  value={values.reward}
                  onChangeText={handleChange('reward')}
                  onBlur={handleBlur('reward')}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
              <Text style={styles.helperText}>
                Offering a reward increases chances of getting help
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.submitButtonContent}>
                  <MaterialCommunityIcons
                    name="plus-circle"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.submitButtonText}>Post Task</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  form: {
    padding: 20,
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
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 100,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  rewardInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 8,
  },
  rewardInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 12,
    flexDirection: 'row',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
