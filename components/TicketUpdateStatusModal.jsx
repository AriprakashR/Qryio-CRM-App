import { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { updateTicketStatus } from '../api/ticketService';

// Valid transitions per current status
const NEXT_STATUSES = {
  CREATED: [
    {
      value: 'IN_PROGRESS',
      label: 'In Progress',
      icon: 'progress-clock',
      color: '#D97706',
    },
  ],
  IN_PROGRESS: [
    {
      value: 'RESOLVED',
      label: 'Resolved',
      icon: 'check-circle-outline',
      color: '#16A34A',
    },
  ],
};

const STATUS_COLORS = {
  CREATED: { bg: '#DBEAFE', text: '#1D4ED8' },
  IN_PROGRESS: { bg: '#FEF3C7', text: '#D97706' },
  RESOLVED: { bg: '#DCFCE7', text: '#16A34A' },
  CANCELLED: { bg: '#FEE2E2', text: '#DC2626' },
};

function formatStatus(s) {
  return (
    s
      ?.split('_')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ') ?? '—'
  );
}

export function TicketUpdateStatusModal({ open, onClose, onSubmit, ticket }) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [remarksFocused, setRemarksFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const options = NEXT_STATUSES[ticket?.ticketStatus] ?? [];

  useEffect(() => {
    if (open) {
      setSelectedStatus(options[0]?.value ?? '');
      setRemarks('');
      setRemarksError('');
      setApiError('');
    }
  }, [open, ticket]);

  const handleSubmit = useCallback(async () => {
    if (!remarks.trim()) {
      setRemarksError('Remarks are required.');
      return;
    }
    setLoading(true);
    setApiError('');
    try {
      await updateTicketStatus({
        ticketId: ticket.ticketId,
        ticketStatus: selectedStatus,
        remarks: remarks.trim(),
      });
      onSubmit?.();
      onClose?.();
    } catch (err) {
      setApiError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          'Failed to update status. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [ticket, selectedStatus, remarks, onSubmit, onClose]);

  const handleClose = useCallback(() => {
    if (loading) return;
    setRemarks('');
    setRemarksError('');
    setApiError('');
    onClose?.();
  }, [loading, onClose]);

  const currentSc = STATUS_COLORS[ticket?.ticketStatus] ?? {
    bg: '#F3F4F6',
    text: '#374151',
  };

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
                name='ticket-confirmation-outline'
                size={22}
                color='#1677FF'
                style={{ marginRight: 8 }}
              />
              <Text style={styles.headerTitle}>Update Status</Text>
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

          <View style={styles.body}>
            {/* Ticket info */}
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketCode}>{ticket?.ticketCode ?? '—'}</Text>
              <View
                style={[styles.statusBadge, { backgroundColor: currentSc.bg }]}
              >
                <Text
                  style={[styles.statusBadgeText, { color: currentSc.text }]}
                >
                  {formatStatus(ticket?.ticketStatus)}
                </Text>
              </View>
            </View>

            {ticket?.title && (
              <Text style={styles.ticketTitle} numberOfLines={2}>
                {ticket.title}
              </Text>
            )}

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

            {/* New status selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>New Status</Text>
              <View style={styles.statusOptions}>
                {options.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.statusOption,
                      selectedStatus === opt.value && styles.statusOptionActive,
                    ]}
                    onPress={() => setSelectedStatus(opt.value)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon}
                      size={20}
                      color={
                        selectedStatus === opt.value ? opt.color : '#919EAB'
                      }
                    />
                    <Text
                      style={[
                        styles.statusOptionText,
                        selectedStatus === opt.value && {
                          color: opt.color,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {selectedStatus === opt.value && (
                      <MaterialCommunityIcons
                        name='check'
                        size={16}
                        color={opt.color}
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Remarks */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Remarks <Text style={{ color: '#D32F2F' }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  styles.inputWrapperMulti,
                  remarksFocused && styles.inputWrapperFocused,
                  !!remarksError && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  placeholder='Add remarks about the status update...'
                  placeholderTextColor='#C4CDD5'
                  value={remarks}
                  onChangeText={text => {
                    setRemarks(text);
                    setRemarksError('');
                  }}
                  multiline
                  numberOfLines={3}
                  textAlignVertical='top'
                  editable={!loading}
                  onFocus={() => setRemarksFocused(true)}
                  onBlur={() => setRemarksFocused(false)}
                />
              </View>
              {!!remarksError && (
                <Text style={styles.fieldError}>{remarksError}</Text>
              )}
            </View>
          </View>

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
              disabled={loading || !selectedStatus}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text style={styles.submitText}>Update Status</Text>
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

  body: { padding: 20, gap: 16 },

  ticketInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ticketCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C252E',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  ticketTitle: {
    fontSize: 13,
    color: '#637381',
    lineHeight: 18,
    marginTop: -8,
  },

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

  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#637381' },
  fieldError: { fontSize: 12, color: '#D32F2F', marginTop: 2 },

  statusOptions: { gap: 8 },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    backgroundColor: '#FAFAFA',
  },
  statusOptionActive: {
    borderColor: '#1C252E',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
  },
  statusOptionText: { fontSize: 14, color: '#637381' },

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
  input: { flex: 1, fontSize: 14, color: '#1C252E', padding: 0 },
  inputMulti: { minHeight: 80 },

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
