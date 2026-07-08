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
import { createCompanyUser, updateCompanyUser } from '../api/employeeService';

const USER_GROUPS = [
  { label: 'Admin', value: 151, icon: 'shield-account' },
  { label: 'Developer', value: 159, icon: 'code-tags' },
];
const INITIAL_FORM = { userName: '', email: '', userGroupId: '', status: true };
const INITIAL_ERRORS = { userName: '', email: '', userGroupId: '' };

function validateEmail(email) {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email);
}

// ── Reusable focused input ────────────────────────────────────────────
function FormInput({
  value,
  onChangeText,
  placeholder,
  iconName,
  error,
  disabled,
  keyboardType,
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
        autoCapitalize='none'
        keyboardType={keyboardType}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// ── Inline Dropdown ───────────────────────────────────────────────────
function GroupDropdown({ value, onChange, error, disabled }) {
  const [open, setOpen] = useState(false);
  const selected = USER_GROUPS.find(g => g.value === value);

  return (
    <View>
      {/* Trigger */}
      <TouchableOpacity
        style={[
          styles.dropdown,
          open && styles.dropdownFocused,
          !!error && styles.dropdownError,
          disabled && { opacity: 0.5 },
        ]}
        onPress={() => !disabled && setOpen(v => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownLeft}>
          {selected ? (
            <>
              <MaterialCommunityIcons
                name={selected.icon}
                size={18}
                color={open ? '#1C252E' : '#637381'}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.dropdownValue}>{selected.label}</Text>
            </>
          ) : (
            <Text style={styles.dropdownPlaceholder}>User Group</Text>
          )}
        </View>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={open ? '#1C252E' : '#637381'}
        />
      </TouchableOpacity>

      {/* Inline options — expands below trigger, no popup */}
      {open && (
        <View style={styles.dropdownMenu}>
          {USER_GROUPS.map((group, index) => (
            <View key={group.value}>
              <TouchableOpacity
                style={[
                  styles.dropdownOption,
                  value === group.value && styles.dropdownOptionActive,
                ]}
                onPress={() => {
                  onChange(group.value);
                  setOpen(false);
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={group.icon}
                  size={20}
                  color={value === group.value ? '#1677FF' : '#637381'}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.dropdownOptionText,
                    value === group.value && styles.dropdownOptionTextActive,
                  ]}
                >
                  {group.label}
                </Text>
                {value === group.value && (
                  <MaterialCommunityIcons
                    name='check'
                    size={18}
                    color='#1677FF'
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </TouchableOpacity>
              {index < USER_GROUPS.length - 1 && <Divider />}
            </View>
          ))}
        </View>
      )}

      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────
export function EmployeeFormModal({ open, onClose, onSubmit, employee }) {
  const isEdit = Boolean(employee);
  const isDefaultUser = employee?.defaultUser;

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (open && isEdit) {
      setForm({
        userName: employee.userName ?? '',
        email: employee.email ?? '',
        userGroupId: employee.userGroup?.userGroupId ?? '',
        status: employee.status ?? true,
      });
      setErrors(INITIAL_ERRORS);
      setApiError('');
    }
    if (open && !isEdit) {
      setForm(INITIAL_FORM);
      setErrors(INITIAL_ERRORS);
      setApiError('');
    }
  }, [open, isEdit, employee]);

  const handleChange = useCallback((name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  }, []);

  const validate = useCallback(() => {
    const next = { ...INITIAL_ERRORS };
    let valid = true;
    if (!form.userName.trim()) {
      next.userName = 'Username is required.';
      valid = false;
    }
    if (!form.email.trim()) {
      next.email = 'Email is required.';
      valid = false;
    } else if (!validateEmail(form.email.trim().toLowerCase())) {
      next.email = 'Enter a valid email address.';
      valid = false;
    }
    if (!isDefaultUser && form.userGroupId === '') {
      next.userGroupId = 'Please select a user group.';
      valid = false;
    }
    setErrors(next);
    return valid;
  }, [form, isDefaultUser]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    const payload = isEdit
      ? {
          userId: employee.userId,
          userName: form.userName.trim(),
          email: form.email.trim(),
          ...(!isDefaultUser && {
            userGroupId: Number(form.userGroupId),
            status: form.status,
          }),
        }
      : {
          userName: form.userName.trim(),
          email: form.email.trim(),
          userGroupId: Number(form.userGroupId),
        };

    setLoading(true);
    setApiError('');
    try {
      isEdit
        ? await updateCompanyUser(payload)
        : await createCompanyUser(payload);
      onSubmit?.();
      handleClose();
    } catch (err) {
      setApiError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          `Failed to ${isEdit ? 'update' : 'create'} employee. Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  }, [form, validate, isEdit, employee, isDefaultUser, onSubmit]);

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
                name={isEdit ? 'account-edit' : 'account-plus'}
                size={22}
                color='#1677FF'
                style={{ marginRight: 8 }}
              />
              <Text style={styles.headerTitle}>
                {isEdit ? 'Edit Employee' : 'New Employee'}
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
            {isEdit && !isDefaultUser && (
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

            {/* Username */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Username</Text>
              <FormInput
                value={form.userName}
                onChangeText={text => handleChange('userName', text)}
                placeholder='e.g. john.doe'
                iconName='account-outline'
                error={errors.userName}
                disabled={loading}
              />
              {!!errors.userName && (
                <Text style={styles.fieldError}>{errors.userName}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <FormInput
                value={form.email}
                onChangeText={text => handleChange('email', text)}
                placeholder='e.g. john.doe@company.com'
                iconName='email-outline'
                error={errors.email}
                disabled={loading}
                keyboardType='email-address'
              />
              {!!errors.email && (
                <Text style={styles.fieldError}>{errors.email}</Text>
              )}
            </View>

            {/* User Group */}
            {!isDefaultUser && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>User Group</Text>
                <GroupDropdown
                  value={form.userGroupId}
                  onChange={val => handleChange('userGroupId', val)}
                  error={errors.userGroupId}
                  disabled={loading}
                />
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
                <Text style={styles.submitText}>
                  {isEdit ? 'Save Changes' : 'Create Employee'}
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1C252E' },

  // Body
  body: { flexGrow: 0 },
  bodyContent: { padding: 20, gap: 16 },

  // Alert
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

  // Status
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: -20,
    marginBottom: -32,
  },
  statusLabel: { fontSize: 13, fontWeight: '500' },

  // Fields
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#637381' },
  fieldError: { fontSize: 12, color: '#D32F2F', marginTop: 2 },

  // Input
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

  // Dropdown trigger
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DDE1E6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  dropdownFocused: { borderColor: '#1C252E', borderWidth: 1.5 },
  dropdownError: { borderColor: '#D32F2F' },
  dropdownLeft: { flexDirection: 'row', alignItems: 'center' },
  dropdownValue: { fontSize: 14, color: '#1C252E' },
  dropdownPlaceholder: { fontSize: 14, color: '#C4CDD5' },

  // Inline options list
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
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
  dropdownOptionText: { fontSize: 14, color: '#1C252E' },
  dropdownOptionTextActive: { color: '#1677FF', fontWeight: '600' },

  // Footer
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
