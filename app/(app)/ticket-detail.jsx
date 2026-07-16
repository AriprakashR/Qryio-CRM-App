import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { viewTicket } from '../../api/ticketService';

// ── Constants ─────────────────────────────────────────────────────────
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

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name) {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image-outline';
  if (['xls', 'xlsx'].includes(ext)) return 'microsoft-excel';
  return 'file-outline';
}

// ── Info Row ──────────────────────────────────────────────────────────
function InfoRow({ icon, label, children }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color='#919EAB'
        style={styles.infoIcon}
      />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

// ── Section Card ──────────────────────────────────────────────────────
function SectionCard({ icon, iconBg, iconColor, title, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Divider />
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

// ── Attachment Row ────────────────────────────────────────────────────
function AttachmentChip({ file }) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    if (!file.fileBytes || busy) return;
    setBusy(true);
    try {
      const path = `${FileSystem.documentDirectory}${file.fileName}`;
      await FileSystem.writeAsStringAsync(path, file.fileBytes, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: file.fileType });
      }
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.attachChip}
      onPress={handleDownload}
      disabled={busy}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name={getFileIcon(file.fileName)}
        size={20}
        color='#1677FF'
        style={{ flexShrink: 0 }}
      />
      <View style={styles.attachInfo}>
        <Text style={styles.attachName} numberOfLines={1}>
          {file.fileName}
        </Text>
        <Text style={styles.attachSize}>{formatSize(file.fileSize)}</Text>
      </View>
      {busy ? (
        <ActivityIndicator size='small' color='#1677FF' />
      ) : (
        <MaterialCommunityIcons
          name='download-outline'
          size={18}
          color='#637381'
        />
      )}
    </TouchableOpacity>
  );
}

// ── Person Header (Client / Employee) ─────────────────────────────────
function PersonHeader({ initial, name, avatarBg, sub, subStyle }) {
  return (
    <View style={styles.personHeader}>
      <View style={[styles.bigAvatar, { backgroundColor: avatarBg }]}>
        <Text style={styles.bigAvatarText}>
          {(initial ?? '?').toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.personName}>{name ?? '—'}</Text>
        {sub && <View style={subStyle}>{sub}</View>}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────
export default function TicketDetail() {
  const { ticketId } = useLocalSearchParams();
  const router = useRouter();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    setError('');
    try {
      const res = await viewTicket({ ticketId: Number(ticketId) });
      setTicket(res.data.data);
    } catch (e) {
      setError('Failed to load ticket details.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centreState}>
        <ActivityIndicator size='large' color='#1677FF' />
        <Text style={styles.stateText}>Loading ticket...</Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────
  if (error || !ticket) {
    return (
      <View style={styles.centreState}>
        <MaterialCommunityIcons
          name='alert-circle-outline'
          size={40}
          color='#D32F2F'
        />
        <Text style={[styles.stateText, { color: '#D32F2F' }]}>
          {error || 'Ticket not found.'}
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={fetchTicket}
          activeOpacity={0.8}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const client = ticket.assignResponseDto?.client;
  const projectLead = ticket.assignResponseDto?.projectLead;
  const project = ticket.assignResponseDto?.project;
  const attachments = ticket.attachments ?? [];
  const sc = STATUS_COLORS[ticket.ticketStatus] ?? {
    bg: '#F3F4F6',
    text: '#374151',
  };

  const closedLabel = ['RESOLVED', 'CANCELLED'].includes(ticket.ticketStatus)
    ? 'Closed On'
    : 'Modified On';
  const closedOn =
    ticket.ticketStatus === 'CREATED' || !ticket.assignResponseDto?.modifiedOn
      ? '—'
      : formatDate(ticket.assignResponseDto.modifiedOn);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Breadcrumb ── */}
        <View style={styles.breadcrumb}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name='arrow-left'
              size={20}
              color='#1C252E'
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/tickets')}
            activeOpacity={0.7}
          >
            <Text style={styles.breadcrumbLink}>Tickets</Text>
          </TouchableOpacity>
          <MaterialCommunityIcons
            name='chevron-right'
            size={16}
            color='#919EAB'
          />
          <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
            {ticket.ticketCode}
          </Text>
        </View>

        {/* ── Page title + status ── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{ticket.ticketCode}</Text>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusBadgeText, { color: sc.text }]}>
              {formatStatus(ticket.ticketStatus)}
            </Text>
          </View>
        </View>

        {/* ── Ticket Details ── */}
        <SectionCard
          icon='ticket-outline'
          iconBg='#EBF3FF'
          iconColor='#1677FF'
          title='Ticket Details'
        >
          <InfoRow icon='tag-outline' label='Ticket Code'>
            <Text style={[styles.infoValue, styles.monoValue]}>
              {ticket.ticketCode}
            </Text>
          </InfoRow>
          <Divider style={styles.infoDivider} />

          <InfoRow icon='folder-outline' label='Project'>
            <Text style={styles.infoValue}>{project?.projectName ?? '—'}</Text>
          </InfoRow>
          <Divider style={styles.infoDivider} />

          <InfoRow icon='puzzle-outline' label='Component'>
            <Text style={styles.infoValue}>{ticket.componentName ?? '—'}</Text>
          </InfoRow>
          <Divider style={styles.infoDivider} />

          <InfoRow icon='format-title' label='Title'>
            <Text style={styles.infoValue}>{ticket.title ?? '—'}</Text>
          </InfoRow>
          <Divider style={styles.infoDivider} />

          <InfoRow icon='text-box-outline' label='Description'>
            <Text style={[styles.infoValue, { lineHeight: 20 }]}>
              {ticket.description ?? '—'}
            </Text>
          </InfoRow>
          <Divider style={styles.infoDivider} />

          <InfoRow icon='comment-text-outline' label='Remarks'>
            <Text style={styles.infoValue}>{ticket.remarks ?? '—'}</Text>
          </InfoRow>
          <Divider style={styles.infoDivider} />

          <InfoRow icon='calendar-outline' label='Created On'>
            <Text style={styles.infoValue}>
              {formatDate(ticket.assignResponseDto?.createdOn)}
            </Text>
          </InfoRow>
          <Divider style={styles.infoDivider} />

          <InfoRow icon='calendar-check-outline' label={closedLabel}>
            <Text style={styles.infoValue}>{closedOn}</Text>
          </InfoRow>
          <Divider style={styles.infoDivider} />

          <InfoRow icon='shield-check-outline' label='Status'>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: sc.bg, marginTop: 4 },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: sc.text }]}>
                {formatStatus(ticket.ticketStatus)}
              </Text>
            </View>
          </InfoRow>
          <Divider style={styles.infoDivider} />

          {/* Attachments */}
          <InfoRow icon='paperclip' label='Attachments'>
            {attachments.length > 0 ? (
              <View style={styles.attachList}>
                {attachments.map(file => (
                  <AttachmentChip key={file.attachmentId} file={file} />
                ))}
              </View>
            ) : (
              <View style={styles.noAttach}>
                <MaterialCommunityIcons
                  name='paperclip'
                  size={24}
                  color='#C4CDD5'
                />
                <Text style={styles.noAttachText}>No attachments</Text>
              </View>
            )}
          </InfoRow>
        </SectionCard>

        {/* ── Client Details ── */}
        <SectionCard
          icon='office-building-outline'
          iconBg='#FEE2E2'
          iconColor='#D32F2F'
          title='Client Details'
        >
          {client ? (
            <>
              <PersonHeader
                initial={client.clientName?.charAt(0)}
                name={client.clientName}
                avatarBg='#D32F2F'
                sub={
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeText}>{client.clientCode}</Text>
                  </View>
                }
              />
              <Divider style={styles.infoDivider} />
              <InfoRow icon='calendar-outline' label='Client Since'>
                <Text style={styles.infoValue}>
                  {formatDate(client.createdOn)}
                </Text>
              </InfoRow>
              <Divider style={styles.infoDivider} />
              <InfoRow icon='account-outline' label='Created By'>
                <Text style={styles.infoValue}>
                  {client.createdBy?.userName ?? '—'}
                </Text>
              </InfoRow>
            </>
          ) : (
            <View style={styles.noAttach}>
              <MaterialCommunityIcons
                name='office-building-outline'
                size={28}
                color='#C4CDD5'
              />
              <Text style={styles.noAttachText}>No client info</Text>
            </View>
          )}
        </SectionCard>

        {/* ── Assigned Employee ── */}
        <SectionCard
          icon='account-check-outline'
          iconBg='#DCFCE7'
          iconColor='#16A34A'
          title='Assigned Employee'
        >
          {projectLead ? (
            <>
              <PersonHeader
                initial={projectLead.userName?.charAt(0)}
                name={projectLead.userName}
                avatarBg='#1677FF'
                sub={
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {projectLead.userGroup?.userGroupName ?? '—'}
                    </Text>
                  </View>
                }
              />
              <Divider style={styles.infoDivider} />
              <InfoRow icon='email-outline' label='Email'>
                <Text style={styles.infoValue}>{projectLead.email ?? '—'}</Text>
              </InfoRow>
              <Divider style={styles.infoDivider} />
              <InfoRow icon='calendar-outline' label='Joined'>
                <Text style={styles.infoValue}>
                  {formatDate(projectLead.createdOn)}
                </Text>
              </InfoRow>
              <Divider style={styles.infoDivider} />
              <InfoRow icon='account-outline' label='Created By'>
                <Text style={styles.infoValue}>
                  {projectLead.createdBy?.userName ?? '—'}
                </Text>
              </InfoRow>
            </>
          ) : (
            <View style={styles.noAttach}>
              <MaterialCommunityIcons
                name='account-outline'
                size={28}
                color='#C4CDD5'
              />
              <Text style={styles.noAttachText}>No employee assigned yet</Text>
            </View>
          )}
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Loading / error
  centreState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  stateText: { fontSize: 14, color: '#637381', textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1677FF',
  },
  retryText: { color: '#1677FF', fontSize: 13, fontWeight: '600' },

  // Breadcrumb
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDE1E6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  breadcrumbLink: { fontSize: 13, color: '#637381' },
  breadcrumbCurrent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C252E',
    flex: 1,
  },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C252E',
    flex: 1,
    fontFamily: 'monospace',
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1C252E' },
  cardBody: { padding: 16, paddingTop: 8 },

  // Info row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 12,
  },
  infoIcon: { marginTop: 2, flexShrink: 0 },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    color: '#919EAB',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: { fontSize: 14, color: '#1C252E', fontWeight: '500' },
  monoValue: { fontFamily: 'monospace', fontWeight: '700' },
  infoDivider: { marginVertical: 0 },

  // Attachments
  attachList: { gap: 8, marginTop: 6 },
  attachChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F4F6F8',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  attachInfo: { flex: 1 },
  attachName: { fontSize: 13, fontWeight: '500', color: '#1C252E' },
  attachSize: { fontSize: 11, color: '#919EAB', marginTop: 2 },
  noAttach: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  noAttachText: { fontSize: 13, color: '#919EAB' },

  // Person header (client / employee)
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  bigAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bigAvatarText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C252E',
    marginBottom: 4,
  },

  // Client code badge
  codeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    fontFamily: 'monospace',
  },

  // Employee role badge
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: { fontSize: 12, color: '#637381', fontWeight: '500' },
});
