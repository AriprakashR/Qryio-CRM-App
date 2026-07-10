import { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { createProjects, updateProjects } from '../api/projectService';

const INITIAL_FORM = {
  projectName: '',
  description: '',
  endDate: '',
  status: true,
};
const INITIAL_ERRORS = { projectName: '', description: '', endDate: '' };

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// ── Reusable focused input (locked standard) ──────────────────────────
function FormInput({
  value,
  onChangeText,
  placeholder,
  iconName,
  error,
  disabled,
  multiline,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.inputWrapper,
        multiline && styles.inputWrapperMulti,
        focused && styles.inputWrapperFocused,
        !!error && styles.inputWrapperError,
      ]}
    >
      <MaterialCommunityIcons
        name={iconName}
        size={18}
        color={focused ? '#1C252E' : '#919EAB'}
        style={[styles.inputIcon, multiline && { marginTop: 2 }]}
      />
      <TextInput
        style={[
          styles.input,
          disabled && styles.inputDisabled,
          multiline && styles.inputMulti,
        ]}
        placeholder={placeholder}
        placeholderTextColor='#C4CDD5'
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// ── Date Picker Field ─────────────────────────────────────────────────
function DatePickerField({ value, onChange, error, disabled }) {
  const [focused, setFocused] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  const today = new Date();
  const parsedDate = value ? new Date(value) : today;
  const displayDate = value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const openPicker = () => {
    if (disabled) return;
    setFocused(true);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parsedDate,
        mode: 'date',
        minimumDate: today,
        // ✅ New API — replaces deprecated onChange
        onValueChange: date => {
          setFocused(false);
          if (date) onChange(date.toISOString().split('T')[0]);
        },
        onDismiss: () => {
          setFocused(false);
        },
        onNeutralButtonPress: () => {
          setFocused(false);
        },
      });
    } else {
      setShowIOS(true);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          !!error && styles.inputWrapperError,
          disabled && { opacity: 0.5 },
        ]}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name='calendar-outline'
          size={18}
          color={focused ? '#1C252E' : '#919EAB'}
          style={styles.inputIcon}
        />
        <Text
          style={{
            flex: 1,
            fontSize: 14,
            color: displayDate ? '#1C252E' : '#C4CDD5',
          }}
        >
          {displayDate || 'Select end date'}
        </Text>
        <MaterialCommunityIcons name='chevron-down' size={18} color='#919EAB' />
      </TouchableOpacity>

      {/* iOS bottom sheet picker */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showIOS}
          transparent
          animationType='slide'
          statusBarTranslucent
          onRequestClose={() => {
            setShowIOS(false);
            setFocused(false);
          }}
        >
          <View style={styles.dateOverlay}>
            <View style={styles.dateModal}>
              <View style={styles.dateHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setShowIOS(false);
                    setFocused(false);
                  }}
                >
                  <Text style={styles.dateCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.dateTitle}>Select End Date</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowIOS(false);
                    setFocused(false);
                  }}
                >
                  <Text style={styles.dateDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={parsedDate}
                mode='date'
                display='spinner'
                minimumDate={today}
                // ✅ New API — replaces deprecated onChange
                onValueChange={date => {
                  if (date) onChange(date.toISOString().split('T')[0]);
                }}
                onDismiss={() => {
                  setShowIOS(false);
                  setFocused(false);
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────
export function ProjectFormModal({ open, onClose, onSubmit, project }) {
  const isEdit = Boolean(project);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (open && isEdit) {
      setForm({
        projectName: project.projectName ?? '',
        description: project.description ?? '',
        endDate: project.endDate ?? '',
        status: project.status ?? true,
      });
      setErrors(INITIAL_ERRORS);
      setApiError('');
    }
    if (open && !isEdit) {
      setForm(INITIAL_FORM);
      setErrors(INITIAL_ERRORS);
      setApiError('');
    }
  }, [open, isEdit, project]);

  const handleChange = useCallback((name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  }, []);

  const validate = useCallback(() => {
    const next = { ...INITIAL_ERRORS };
    let valid = true;

    if (!form.projectName.trim()) {
      next.projectName = 'Project name is required.';
      valid = false;
    }
    if (!form.description.trim()) {
      next.description = 'Description is required.';
      valid = false;
    }
    if (!form.endDate) {
      next.endDate = 'End date is required.';
      valid = false;
    } else if (form.endDate < getTodayString()) {
      next.endDate = 'End date cannot be in the past.';
      valid = false;
    }

    setErrors(next);
    return valid;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    const payload = isEdit
      ? {
          projectId: project.projectId,
          projectName: form.projectName.trim(),
          description: form.description.trim(),
          endDate: form.endDate,
          status: form.status,
        }
      : {
          projectName: form.projectName.trim(),
          description: form.description.trim(),
          endDate: form.endDate,
        };

    setLoading(true);
    setApiError('');
    try {
      isEdit ? await updateProjects(payload) : await createProjects(payload);
      onSubmit?.();
      handleClose();
    } catch (err) {
      setApiError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          `Failed to ${isEdit ? 'update' : 'create'} project. Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  }, [form, validate, isEdit, project, onSubmit]);

  const handleClose = useCallback(() => {
    if (loading) return;
    setForm(INITIAL_FORM);
    setErrors(INITIAL_ERRORS);
    setApiError('');
    onClose?.();
  }, [loading, onClose]);

  return (
    <Modal
      visible={open}
      transparent
      animationType='slide'
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons
                name={isEdit ? 'folder-edit-outline' : 'folder-plus-outline'}
                size={22}
                color='#1677FF'
                style={{ marginRight: 8 }}
              />
              <Text style={styles.headerTitle}>
                {isEdit ? 'Edit Project' : 'New Project'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              disabled={loading}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name='close' size={22} color='#637381' />
            </TouchableOpacity>
          </View>

          <Divider />

          {/* Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
          >
            {/* API error */}
            {!!apiError && (
              <View style={styles.alertBox}>
                <MaterialCommunityIcons
                  name='alert-circle-outline'
                  size={16}
                  color='#D32F2F'
                />
                <Text style={styles.alertText}>{apiError}</Text>
                <TouchableOpacity onPress={() => setApiError('')}>
                  <MaterialCommunityIcons
                    name='close'
                    size={16}
                    color='#D32F2F'
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Status toggle — edit only */}
            {isEdit && (
              <View style={styles.statusRow}>
                <Text
                  style={[
                    styles.statusLabel,
                    { color: form.status ? '#2E7D32' : '#919EAB' },
                  ]}
                >
                  {form.status ? 'Active' : 'Inactive'}
                </Text>
                <Switch
                  value={form.status}
                  onValueChange={val => handleChange('status', val)}
                  disabled={loading}
                  trackColor={{ false: '#E5E8EB', true: '#A5D6A7' }}
                  thumbColor={form.status ? '#2E7D32' : '#919EAB'}
                />
              </View>
            )}

            {/* Project Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Project Name</Text>
              <FormInput
                value={form.projectName}
                onChangeText={text => handleChange('projectName', text)}
                placeholder='e.g. Alpha Dashboard'
                iconName='folder-outline'
                error={errors.projectName}
                disabled={loading}
              />
              {!!errors.projectName && (
                <Text style={styles.fieldError}>{errors.projectName}</Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Description</Text>
              <FormInput
                value={form.description}
                onChangeText={text => handleChange('description', text)}
                placeholder='Briefly describe the purpose of this project...'
                iconName='text-box-outline'
                error={errors.description}
                disabled={loading}
                multiline
              />
              {!!errors.description && (
                <Text style={styles.fieldError}>{errors.description}</Text>
              )}
            </View>

            {/* End Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>End Date</Text>
              <DatePickerField
                value={form.endDate}
                onChange={val => handleChange('endDate', val)}
                error={errors.endDate}
                disabled={loading}
              />
              {!!errors.endDate ? (
                <Text style={styles.fieldError}>{errors.endDate}</Text>
              ) : (
                <Text style={styles.fieldHint}>
                  Project deadline — must be a future date
                </Text>
              )}
            </View>
          </ScrollView>

          <Divider />

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text style={styles.submitText}>
                  {isEdit ? 'Save Changes' : 'Create Project'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '92%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1C252E' },

  body: { flexGrow: 0 },
  bodyContent: { padding: 20, gap: 16 },

  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  alertText: { flex: 1, fontSize: 13, color: '#D32F2F', lineHeight: 18 },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: -20,
    marginBottom: -32,
  },
  statusLabel: { fontSize: 13, fontWeight: '500' },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#637381' },
  fieldError: { fontSize: 12, color: '#D32F2F', marginTop: 2 },
  fieldHint: { fontSize: 11, color: '#919EAB', marginTop: 2 },

  // Input — locked standard
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDE1E6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  inputWrapperMulti: { alignItems: 'flex-start', paddingVertical: 12 },
  inputWrapperFocused: { borderColor: '#1C252E', borderWidth: 1.5 },
  inputWrapperError: { borderColor: '#D32F2F' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: '#1C252E', padding: 0 },
  inputMulti: { minHeight: 90 },
  inputDisabled: { opacity: 0.5 },

  // iOS Date Picker
  dateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dateModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 28,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dateTitle: { fontSize: 15, fontWeight: '600', color: '#1C252E' },
  dateCancelText: { fontSize: 15, color: '#637381' },
  dateDoneText: { fontSize: 15, color: '#1677FF', fontWeight: '600' },

  footer: { flexDirection: 'row', padding: 16, gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DDE1E6',
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#1C252E' },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#1C252E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});
