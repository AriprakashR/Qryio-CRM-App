import { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import {
  createTicket,
  getUserProjects,
  getUserProjectsComponents,
} from '../api/ticketService';

const INITIAL_FORM = {
  title: '',
  description: '',
  projectId: '',
  componentId: '',
};
const INITIAL_ERRORS = {
  title: '',
  description: '',
  projectId: '',
  componentId: '',
};
const MAX_FILE_MB = 1;
const MAX_TOTAL_MB = 5;

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['xls', 'xlsx'].includes(ext)) return 'microsoft-excel';
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image-outline';
  return 'file-outline';
}

// ── Focused Input ────────────────────────────────────────────────────
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

// ── Inline Dropdown ──────────────────────────────────────────────────
function Dropdown({
  value,
  onChange,
  items,
  placeholder,
  iconName,
  error,
  disabled,
  loading: isLoading,
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find(i => i.value === value);

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.inputWrapper,
          open && styles.inputWrapperFocused,
          !!error && styles.inputWrapperError,
          disabled && { opacity: 0.5 },
        ]}
        onPress={() => !disabled && !isLoading && setOpen(v => !v)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={18}
          color={open ? '#1C252E' : '#919EAB'}
          style={styles.inputIcon}
        />
        {isLoading ? (
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ActivityIndicator size='small' color='#919EAB' />
            <Text style={{ fontSize: 14, color: '#919EAB' }}>Loading...</Text>
          </View>
        ) : (
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              color: selected ? '#1C252E' : '#C4CDD5',
            }}
          >
            {selected?.label ?? placeholder}
          </Text>
        )}
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={open ? '#1C252E' : '#919EAB'}
        />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownMenu}>
          {items.length === 0 ? (
            <View style={styles.dropdownEmpty}>
              <Text style={styles.dropdownEmptyText}>
                {disabled ? 'Select a project first' : 'No options available'}
              </Text>
            </View>
          ) : (
            items.map((item, index) => (
              <View key={item.value}>
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    value === item.value && styles.dropdownOptionActive,
                  ]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={iconName}
                    size={18}
                    color={value === item.value ? '#1677FF' : '#637381'}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      value === item.value && styles.dropdownOptionActive2,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {value === item.value && (
                    <MaterialCommunityIcons
                      name='check'
                      size={16}
                      color='#1677FF'
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </TouchableOpacity>
                {index < items.length - 1 && <Divider />}
              </View>
            ))
          )}
        </View>
      )}

      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────
export function TicketFormModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [projects, setProjects] = useState([]);
  const [components, setComponents] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [fileError, setFileError] = useState('');

  // Fetch projects on open
  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      setProjectsLoading(true);
      try {
        const res = await getUserProjects();
        const data = res.data.data ?? [];
        setProjects(
          data.map(p => ({ value: p.projectId, label: p.projectName })),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setProjectsLoading(false);
      }
    };
    fetch();
  }, [open]);

  // Fetch components when project changes
  useEffect(() => {
    if (!form.projectId) {
      setComponents([]);
      return;
    }
    const fetch = async () => {
      setComponentsLoading(true);
      try {
        const res = await getUserProjectsComponents({
          projectId: Number(form.projectId),
        });
        const data = res.data.data ?? [];
        setComponents(
          data.map(c => ({ value: c.componentId, label: c.componentName })),
        );
      } catch (e) {
        setComponents([]);
      } finally {
        setComponentsLoading(false);
      }
    };
    fetch();
  }, [form.projectId]);

  const handleChange = useCallback((name, value) => {
    setForm(prev => {
      if (name === 'projectId')
        return { ...prev, projectId: value, componentId: '' };
      return { ...prev, [name]: value };
    });
    setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  }, []);

  // ── File picking ───────────────────────────────────────────────────
  const handlePickFiles = useCallback(async () => {
    setFileError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ACCEPTED_TYPES,
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const incoming = result.assets ?? [];

      const oversized = incoming.filter(
        f => (f.size ?? 0) > MAX_FILE_MB * 1024 * 1024,
      );
      if (oversized.length) {
        setFileError(`Each file must be under ${MAX_FILE_MB} MB.`);
        return;
      }

      setAttachments(prev => {
        const existing = new Set(prev.map(f => `${f.name}-${f.size}`));
        const unique = incoming.filter(
          f => !existing.has(`${f.name}-${f.size}`),
        );
        const merged = [...prev, ...unique];
        const total = merged.reduce((s, f) => s + (f.size ?? 0), 0);
        if (total > MAX_TOTAL_MB * 1024 * 1024) {
          setFileError(`Total attachments must be under ${MAX_TOTAL_MB} MB.`);
          return prev;
        }
        return merged;
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleRemoveFile = useCallback(index => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setFileError('');
  }, []);

  // ── Validation ─────────────────────────────────────────────────────
  const validate = useCallback(() => {
    const next = { ...INITIAL_ERRORS };
    let valid = true;
    if (!form.title.trim()) {
      next.title = 'Title is required.';
      valid = false;
    }
    if (!form.description.trim()) {
      next.description = 'Description is required.';
      valid = false;
    }
    if (!form.projectId) {
      next.projectId = 'Please select a project.';
      valid = false;
    }
    if (!form.componentId) {
      next.componentId = 'Please select a component.';
      valid = false;
    }
    setErrors(next);
    return valid;
  }, [form]);

  const handleClose = useCallback(() => {
    if (loading) return;
    setForm(INITIAL_FORM);
    setErrors(INITIAL_ERRORS);
    setAttachments([]);
    setFileError('');
    setApiError('');
    setComponents([]);
    onClose?.();
  }, [loading, onClose]);

  // ── Submit ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      projectId: Number(form.projectId),
      componentId: Number(form.componentId),
    };

    const formData = new FormData();
    // Send JSON data as string — backend parses it
    formData.append('data', JSON.stringify(data));

    attachments.forEach(file => {
      formData.append('attachments', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        type: file.mimeType ?? 'application/octet-stream',
        name: file.name,
      });
    });

    setLoading(true);
    setApiError('');
    try {
      await createTicket(formData);
      onSubmit?.();
      handleClose();
    } catch (err) {
      setApiError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          'Failed to create ticket. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [form, attachments, validate, onSubmit, handleClose]);

  const selectedProject = projects.find(p => p.value === form.projectId);
  const selectedComponent = components.find(c => c.value === form.componentId);

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
                name='ticket-outline'
                size={22}
                color='#1677FF'
                style={{ marginRight: 8 }}
              />
              <Text style={styles.headerTitle}>New Ticket</Text>
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

            {/* Project */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Project</Text>
              <Dropdown
                value={form.projectId}
                onChange={val => handleChange('projectId', val)}
                items={projects}
                placeholder='Select a project'
                iconName='folder-outline'
                error={errors.projectId}
                disabled={loading}
                loading={projectsLoading}
              />
            </View>

            {/* Component */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Component
                {!form.projectId && (
                  <Text style={styles.fieldHint}>
                    {' '}
                    — select a project first
                  </Text>
                )}
              </Text>
              <Dropdown
                value={form.componentId}
                onChange={val => handleChange('componentId', val)}
                items={components}
                placeholder='Select a component'
                iconName='puzzle-outline'
                error={errors.componentId}
                disabled={!form.projectId || loading}
                loading={componentsLoading}
              />
            </View>

            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Title</Text>
              <FormInput
                value={form.title}
                onChangeText={text => handleChange('title', text)}
                placeholder='e.g. Login page throws 500 on submit'
                iconName='text-short'
                error={errors.title}
                disabled={loading}
              />
              {!!errors.title && (
                <Text style={styles.fieldError}>{errors.title}</Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Description</Text>
              <FormInput
                value={form.description}
                onChangeText={text => handleChange('description', text)}
                placeholder='Describe the issue in detail...'
                iconName='text-box-outline'
                error={errors.description}
                disabled={loading}
                multiline
              />
              {!!errors.description && (
                <Text style={styles.fieldError}>{errors.description}</Text>
              )}
            </View>

            {/* Attachments */}
            <View style={styles.fieldGroup}>
              <View style={styles.attachHeader}>
                <Text style={styles.fieldLabel}>Attachments</Text>
                <Text style={styles.attachHint}>
                  Optional · max {MAX_FILE_MB}MB each · {MAX_TOTAL_MB}MB total
                </Text>
              </View>

              {/* Drop zone / Tap to pick */}
              <TouchableOpacity
                style={[
                  styles.dropZone,
                  !!fileError && { borderColor: '#D32F2F' },
                ]}
                onPress={handlePickFiles}
                disabled={loading}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name='upload-outline'
                  size={28}
                  color='#C4CDD5'
                />
                <Text style={styles.dropZoneText}>Tap to browse files</Text>
                <Text style={styles.dropZoneHint}>JPG · PNG · XLS · XLSX</Text>
              </TouchableOpacity>

              {!!fileError && (
                <Text style={styles.fieldError}>{fileError}</Text>
              )}

              {/* Attached file list */}
              {attachments.length > 0 && (
                <View style={styles.fileList}>
                  {attachments.map((file, index) => (
                    <View key={`${file.name}-${index}`} style={styles.fileItem}>
                      <MaterialCommunityIcons
                        name={getFileIcon(file.name)}
                        size={20}
                        color='#1677FF'
                        style={{ flexShrink: 0 }}
                      />
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {file.name}
                        </Text>
                        <Text style={styles.fileSize}>
                          {formatFileSize(file.size ?? 0)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveFile(index)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name='close-circle'
                          size={18}
                          color='#C4CDD5'
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Summary trail */}
            {selectedProject && selectedComponent && (
              <View style={styles.summaryTrail}>
                <MaterialCommunityIcons
                  name='map-marker-path'
                  size={14}
                  color='#637381'
                />
                <Text style={styles.summaryText}>
                  {selectedProject.label}
                  {' → '}
                  {selectedComponent.label}
                </Text>
              </View>
            )}
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
                <Text style={styles.submitText}>Create Ticket</Text>
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
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '93%',
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

  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#637381' },
  fieldHint: { fontSize: 11, color: '#919EAB', fontWeight: '400' },
  fieldError: { fontSize: 12, color: '#D32F2F', marginTop: 2 },

  // Locked standard input
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
  inputWrapperMulti: { alignItems: 'flex-start' },
  inputWrapperFocused: { borderColor: '#1C252E', borderWidth: 1.5 },
  inputWrapperError: { borderColor: '#D32F2F' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: '#1C252E', padding: 0 },
  inputMulti: { minHeight: 90 },
  inputDisabled: { opacity: 0.5 },

  // Dropdown
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 8,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropdownOptionActive: { backgroundColor: '#F0F7FF' },
  dropdownOptionText: { fontSize: 14, color: '#1C252E', flex: 1 },
  dropdownOptionActive2: { color: '#1677FF', fontWeight: '600' },
  dropdownEmpty: { padding: 16, alignItems: 'center' },
  dropdownEmptyText: { fontSize: 13, color: '#919EAB' },

  // Attachments
  attachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attachHint: { fontSize: 11, color: '#919EAB' },
  dropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#DDE1E6',
    borderRadius: 10,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAFAFA',
  },
  dropZoneText: { fontSize: 14, color: '#637381', fontWeight: '500' },
  dropZoneHint: { fontSize: 11, color: '#C4CDD5' },

  fileList: { gap: 8, marginTop: 4 },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F4F6F8',
    borderRadius: 8,
    padding: 10,
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 13, fontWeight: '500', color: '#1C252E' },
  fileSize: { fontSize: 11, color: '#919EAB', marginTop: 2 },

  summaryTrail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4F6F8',
    borderRadius: 8,
    padding: 12,
  },
  summaryText: { fontSize: 12, color: '#637381', flex: 1 },

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
  submitText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
