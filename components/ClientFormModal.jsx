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
import { createClients, updateClients } from '../api/clientService';

const INITIAL_FORM = { clientName: '', clientCode: '', status: true };
const INITIAL_ERRORS = { clientName: '', clientCode: '' };

// ── Reusable focused input (locked standard) ──────────────────────────
function FormInput({
  value,
  onChangeText,
  placeholder,
  iconName,
  error,
  disabled,
  keyboardType,
  autoCapitalize,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.inputWrapper,
        focused && styles.inputWrapperFocused,
        !!error && styles.inputWrapperError,
      ]}
    >
      <MaterialCommunityIcons
        name={iconName}
        size={18}
        color={focused ? '#1C252E' : '#919EAB'}
        style={styles.inputIcon}
      />
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        placeholder={placeholder}
        placeholderTextColor='#C4CDD5'
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize ?? 'none'}
        keyboardType={keyboardType}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────
export function ClientFormModal({ open, onClose, onSubmit, client }) {
  const isEdit = Boolean(client);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (open && isEdit) {
      setForm({
        clientName: client.clientName ?? '',
        clientCode: client.clientCode ?? '',
        status: client.status ?? true,
      });
      setErrors(INITIAL_ERRORS);
      setApiError('');
    }
    if (open && !isEdit) {
      setForm(INITIAL_FORM);
      setErrors(INITIAL_ERRORS);
      setApiError('');
    }
  }, [open, isEdit, client]);

  const handleChange = useCallback((name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  }, []);

  const validate = useCallback(() => {
    const next = { ...INITIAL_ERRORS };
    let valid = true;

    if (!form.clientName.trim()) {
      next.clientName = 'Client name is required.';
      valid = false;
    }
    if (!form.clientCode.trim()) {
      next.clientCode = 'Client code is required.';
      valid = false;
    } else if (!/^[A-Za-z0-9_-]+$/.test(form.clientCode.trim())) {
      next.clientCode = 'Only letters, numbers, - and _ allowed.';
      valid = false;
    }

    setErrors(next);
    return valid;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    const payload = isEdit
      ? {
          clientId: client.clientId,
          clientName: form.clientName.trim(),
          clientCode: form.clientCode.trim().toUpperCase(),
          status: form.status,
        }
      : {
          clientName: form.clientName.trim(),
          clientCode: form.clientCode.trim().toUpperCase(),
        };

    setLoading(true);
    setApiError('');
    try {
      isEdit ? await updateClients(payload) : await createClients(payload);
      onSubmit?.();
      handleClose();
    } catch (err) {
      setApiError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          `Failed to ${isEdit ? 'update' : 'create'} client. Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  }, [form, validate, isEdit, client, onSubmit]);

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
                name={isEdit ? 'office-building-cog' : 'office-building-plus'}
                size={22}
                color='#1677FF'
                style={{ marginRight: 8 }}
              />
              <Text style={styles.headerTitle}>
                {isEdit ? 'Edit Client' : 'New Client'}
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

            {/* Client Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Client Name</Text>
              <FormInput
                value={form.clientName}
                onChangeText={text => handleChange('clientName', text)}
                placeholder='e.g. Acme Corporation'
                iconName='office-building-outline'
                error={errors.clientName}
                disabled={loading}
                autoCapitalize='words'
              />
              {!!errors.clientName && (
                <Text style={styles.fieldError}>{errors.clientName}</Text>
              )}
            </View>

            {/* Client Code */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Client Code</Text>
              <FormInput
                value={form.clientCode}
                onChangeText={text =>
                  handleChange('clientCode', text.toUpperCase())
                }
                placeholder='e.g. ACM-001'
                iconName='tag-outline'
                error={errors.clientCode}
                disabled={loading}
                autoCapitalize='characters'
              />
              {!!errors.clientCode ? (
                <Text style={styles.fieldError}>{errors.clientCode}</Text>
              ) : (
                <Text style={styles.fieldHint}>
                  Letters, numbers, - and _ only
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
                  {isEdit ? 'Save Changes' : 'Create Client'}
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
    maxHeight: '90%',
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
  inputWrapperFocused: { borderColor: '#1C252E', borderWidth: 1.5 },
  inputWrapperError: { borderColor: '#D32F2F' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: '#1C252E', padding: 0 },
  inputDisabled: { opacity: 0.5 },

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
