import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Text, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getTicketsList, updateTicketStatus } from '../../api/ticketService';
import { TicketFormModal } from '../../components/TicketFormModal';
import { TicketUpdateStatusModal } from '../../components/TicketUpdateStatusModal';
import { useUser } from '../../context/UserContext';

// ── Role helpers (matching web) ───────────────────────────────────────
const canUpdate = r => r === 'COMPANY_USER';
const canCancel = r => ['COMPANY_USER', 'CLIENT_USER'].includes(r);
const canCreate = r => ['CLIENT_USER', 'CLIENT_ADMIN'].includes(r);

const isCancelDisabled = (role, status) => {
  if (role === 'COMPANY_USER') return status === 'CREATED';
  if (role === 'CLIENT_USER') return status !== 'CREATED';
  return true;
};

const isActionable = status => !['RESOLVED', 'CANCELLED'].includes(status);

// ── Constants ─────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'CREATED', label: 'Created' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_COLORS = {
  CREATED: { bg: '#DBEAFE', text: '#1D4ED8' },
  IN_PROGRESS: { bg: '#FEF3C7', text: '#D97706' },
  RESOLVED: { bg: '#DCFCE7', text: '#16A34A' },
  CANCELLED: { bg: '#FEE2E2', text: '#DC2626' },
};

const COL = {
  code: 120,
  project: 140,
  component: 130,
  title: 160,
  status: 110,
  createdOn: 105,
  actions: 44,
};
const ROWS_OPTIONS = [5, 10, 25];

function formatStatus(s) {
  return (
    s
      ?.split('_')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ') ?? '—'
  );
}

// ── Table Row ─────────────────────────────────────────────────────────
function TicketRow({ item }) {
  const sc = STATUS_COLORS[item.ticketStatus] ?? {
    bg: '#F3F4F6',
    text: '#374151',
  };
  const createdOn = item.createdOn
    ? new Date(item.createdOn).toLocaleDateString('en-IN')
    : '—';

  return (
    <View style={styles.tableRow}>
      <View style={[styles.cell, { width: COL.code }]}>
        <Text style={styles.codeText}>{item.ticketCode ?? '—'}</Text>
      </View>
      <View style={[styles.cell, { width: COL.project }]}>
        <Text style={styles.metaText} numberOfLines={1}>
          {item.assignResponseDto?.project?.projectName ?? '—'}
        </Text>
      </View>
      <View style={[styles.cell, { width: COL.component }]}>
        <Text style={styles.metaText} numberOfLines={1}>
          {item.componentName ?? '—'}
        </Text>
      </View>
      <View style={[styles.cell, { width: COL.title }]}>
        <Text style={styles.titleText} numberOfLines={2}>
          {item.title ?? '—'}
        </Text>
      </View>
      <View style={[styles.cell, { width: COL.status }]}>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.text }]}>
            {formatStatus(item.ticketStatus)}
          </Text>
        </View>
      </View>
      <View style={[styles.cell, { width: COL.createdOn }]}>
        <Text style={styles.metaText}>{createdOn}</Text>
      </View>
    </View>
  );
}

// ── Action Sheet ──────────────────────────────────────────────────────
function TicketActionSheet({
  visible,
  onClose,
  ticket,
  resolvedRole,
  onView,
  onUpdate,
  onCancel,
}) {
  const actionable = isActionable(ticket?.ticketStatus ?? '');
  const cancelDisabled = isCancelDisabled(resolvedRole, ticket?.ticketStatus);

  const options = [
    {
      key: 'view',
      label: 'View Ticket',
      icon: 'eye-outline',
      iconBg: '#EBF3FF',
      iconColor: '#1677FF',
      onPress: onView,
    },
    canUpdate(resolvedRole) &&
      actionable && {
        key: 'update',
        label: 'Update Status',
        icon: 'pencil-outline',
        iconBg: '#F3E8FF',
        iconColor: '#7C3AED',
        onPress: onUpdate,
      },
    canCancel(resolvedRole) &&
      !cancelDisabled && {
        key: 'cancel',
        label: 'Cancel Ticket',
        icon: 'close-circle-outline',
        iconBg: '#FEE2E2',
        iconColor: '#D32F2F',
        onPress: onCancel,
        danger: true,
      },
  ].filter(Boolean);

  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.sheetOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {ticket && (
            <>
              <View style={styles.sheetTicketInfo}>
                <Text style={styles.sheetTicketCode}>{ticket.ticketCode}</Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        STATUS_COLORS[ticket.ticketStatus]?.bg ?? '#F3F4F6',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
                          STATUS_COLORS[ticket.ticketStatus]?.text ?? '#374151',
                      },
                    ]}
                  >
                    {formatStatus(ticket.ticketStatus)}
                  </Text>
                </View>
              </View>
              {ticket.title && (
                <Text style={styles.sheetTicketTitle} numberOfLines={1}>
                  {ticket.title}
                </Text>
              )}
              <Divider style={{ marginBottom: 4 }} />
            </>
          )}

          {options.map((opt, index) => (
            <View key={opt.key}>
              <TouchableOpacity
                style={styles.sheetOption}
                onPress={opt.onPress}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.sheetIconWrap,
                    { backgroundColor: opt.iconBg },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={opt.icon}
                    size={20}
                    color={opt.iconColor}
                  />
                </View>
                <Text
                  style={[
                    styles.sheetOptionText,
                    opt.danger && { color: '#D32F2F' },
                  ]}
                >
                  {opt.label}
                </Text>
                <MaterialCommunityIcons
                  name='chevron-right'
                  size={20}
                  color='#C4CDD5'
                />
              </TouchableOpacity>
              {index < options.length - 1 && <Divider />}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.sheetOption, styles.sheetCancel]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.sheetCancelText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Cancel Confirm Dialog (with remarks) ──────────────────────────────
function CancelDialog({ visible, ticket, onCancel, onConfirm, loading }) {
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (visible) {
      setRemarks('');
      setError('');
    }
  }, [visible]);

  const handleConfirm = () => {
    if (!remarks.trim()) {
      setError('Remarks are required.');
      return;
    }
    onConfirm(remarks.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.dialogOverlay}>
        <View style={styles.dialog}>
          <View style={styles.dialogIcon}>
            <MaterialCommunityIcons
              name='close-circle-outline'
              size={32}
              color='#D32F2F'
            />
          </View>

          <Text style={styles.dialogTitle}>Cancel Ticket?</Text>
          <Text style={styles.dialogBody}>
            Are you sure you want to cancel{' '}
            <Text style={{ fontWeight: '700', color: '#1C252E' }}>
              {ticket?.ticketCode}
            </Text>
            ?
          </Text>

          {/* Remarks */}
          <View
            style={[
              styles.remarksWrapper,
              focused && styles.remarksFocused,
              !!error && styles.remarksError,
            ]}
          >
            <TextInput
              style={styles.remarksInput}
              placeholder='Add remarks (required)...'
              placeholderTextColor='#C4CDD5'
              value={remarks}
              onChangeText={t => {
                setRemarks(t);
                setError('');
              }}
              multiline
              numberOfLines={3}
              textAlignVertical='top'
              editable={!loading}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </View>
          {!!error && <Text style={styles.remarksFieldError}>{error}</Text>}

          <View style={styles.dialogActions}>
            <TouchableOpacity
              style={styles.keepBtn}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.keepText}>Keep</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelTicketBtn, loading && { opacity: 0.7 }]}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text style={styles.cancelTicketText}>Cancel Ticket</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────
export default function Tickets() {
  const { resolvedRole } = useUser();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [menuVisible, setMenuVisible] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [actionSheet, setActionSheet] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [updateModal, setUpdateModal] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getTicketsList({});
      const raw = res.data?.data?.data;
      setTickets(Array.isArray(raw) ? raw : []);
    } catch (err) {
      setError('Failed to load tickets.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ── Derived ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = Array.isArray(tickets) ? tickets : [];
    if (activeStatus !== 'ALL') {
      list = list.filter(t => t.ticketStatus === activeStatus);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        t =>
          (t.ticketCode ?? '').toLowerCase().includes(q) ||
          (t.title ?? '').toLowerCase().includes(q) ||
          (t.componentName ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [tickets, activeStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );
  const startItem = filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endItem = Math.min(page * rowsPerPage, filtered.length);

  const handleRowsChange = val => {
    setRowsPerPage(val);
    setPage(1);
    setMenuVisible(false);
  };

  // ── Status tab counts ─────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts = { ALL: tickets.length };
    tickets.forEach(t => {
      counts[t.ticketStatus] = (counts[t.ticketStatus] ?? 0) + 1;
    });
    return counts;
  }, [tickets]);

  // ── Action handlers ───────────────────────────────────────────────
  const handleAction = useCallback(item => {
    setActiveTicket(item);
    setActionSheet(true);
  }, []);

  const handleView = useCallback(() => {
    setActionSheet(false);
    // TODO: router.push(`/tickets/${activeTicket.ticketId}`);
  }, [activeTicket]);

  const handleUpdateFromSheet = useCallback(() => {
    setActionSheet(false);
    setUpdateModal(true);
  }, []);

  const handleCancelFromSheet = useCallback(() => {
    setActionSheet(false);
    setCancelDialog(true);
  }, []);

  const handleConfirmCancel = useCallback(
    async remarks => {
      if (!activeTicket) return;
      setCancelLoading(true);
      try {
        await updateTicketStatus({
          ticketId: activeTicket.ticketId,
          ticketStatus: 'CANCELLED',
          remarks,
        });
        setCancelDialog(false);
        setActiveTicket(null);
        await fetchTickets();
      } catch (err) {
        console.error(err);
      } finally {
        setCancelLoading(false);
      }
    },
    [activeTicket, fetchTickets],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* ── Header ── */}
        <View style={styles.pageHeader}>
          <View style={styles.headerSide} />
          <Text style={styles.pageTitle}>Tickets</Text>
          <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
            {canCreate(resolvedRole) && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setFormOpen(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name='plus' size={20} color='#fff' />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Status Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          {STATUS_TABS.map(tab => {
            const isActive = activeStatus === tab.key;
            const count = statusCounts[tab.key] ?? 0;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => {
                  setActiveStatus(tab.key);
                  setPage(1);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[styles.tabBadge, isActive && styles.tabBadgeActive]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        isActive && styles.tabBadgeTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Card ── */}
        <View style={styles.card}>
          {/* Search */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name='magnify' size={20} color='#919EAB' />
            <TextInput
              style={styles.searchInput}
              placeholder='Search by code, title or component...'
              placeholderTextColor='#919EAB'
              value={search}
              onChangeText={text => {
                setSearch(text);
                setPage(1);
              }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialCommunityIcons
                  name='close-circle'
                  size={18}
                  color='#919EAB'
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.centreState}>
              <ActivityIndicator size='large' color='#1677FF' />
              <Text style={styles.stateText}>Loading tickets...</Text>
            </View>
          )}

          {/* Error */}
          {!loading && !!error && (
            <View style={styles.centreState}>
              <MaterialCommunityIcons
                name='alert-circle-outline'
                size={36}
                color='#D32F2F'
              />
              <Text style={[styles.stateText, { color: '#D32F2F' }]}>
                {error}
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={fetchTickets}
                activeOpacity={0.8}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Table Container with Sticky Side Column */}
          {!loading && !error && (
            <View style={styles.tableOuter}>
              {/* Scrollable Data Columns */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                bounces={false}
                nestedScrollEnabled
                style={{ flex: 1 }}
              >
                <View>
                  <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    {[
                      ['code', COL.code, 'Code'],
                      ['project', COL.project, 'Project'],
                      ['component', COL.component, 'Component'],
                      ['title', COL.title, 'Title'],
                      ['status', COL.status, 'Status'],
                      ['createdOn', COL.createdOn, 'Created On'],
                    ].map(([key, w, label]) => (
                      <View key={key} style={[styles.cell, { width: w }]}>
                        <Text style={styles.colLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.divider} />

                  {paginated.length === 0 ? (
                    <View style={styles.emptyState}>
                      <MaterialCommunityIcons
                        name='ticket-outline'
                        size={40}
                        color='#C4CDD5'
                      />
                      <Text style={styles.emptyText}>No tickets found</Text>
                    </View>
                  ) : (
                    paginated.map((item, index) => (
                      <View key={item.ticketId ?? index}>
                        <TicketRow item={item} />
                        {index < paginated.length - 1 && (
                          <View style={styles.separator} />
                        )}
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>

              {/* Sticky Action Column */}
              <View>
                {/* Blank Header Cell */}
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <View style={{ width: COL.actions, paddingHorizontal: 10 }} />
                </View>
                <View style={styles.divider} />

                {/* Sticky Action Rows */}
                {paginated.map((item, index) => (
                  <View key={item.ticketId ?? index}>
                    <View
                      style={[
                        styles.tableRow,
                        { paddingHorizontal: 10, justifyContent: 'center' },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => handleAction(item)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name='dots-vertical'
                          size={17}
                          color='#637381'
                        />
                      </TouchableOpacity>
                    </View>
                    {index < paginated.length - 1 && (
                      <View style={styles.separator} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Pagination */}
          {!loading && !error && (
            <>
              <View style={styles.divider} />
              <View style={styles.pagination}>
                <Text style={styles.paginationLabel}>Rows per page:</Text>
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                    <TouchableOpacity
                      style={styles.rowsBtn}
                      onPress={() => setMenuVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.rowsBtnText}>{rowsPerPage}</Text>
                      <MaterialCommunityIcons
                        name={menuVisible ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color='#1C252E'
                      />
                    </TouchableOpacity>
                  }
                >
                  {ROWS_OPTIONS.map(opt => (
                    <Menu.Item
                      key={opt}
                      onPress={() => handleRowsChange(opt)}
                      title={String(opt)}
                      titleStyle={
                        rowsPerPage === opt ? styles.menuActive : undefined
                      }
                    />
                  ))}
                </Menu>
                <Text style={styles.paginationLabel}>
                  {startItem}–{endItem} of {filtered.length}
                </Text>
                <View style={styles.pageButtons}>
                  <TouchableOpacity
                    onPress={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name='chevron-left'
                      size={24}
                      color={page === 1 ? '#C4CDD5' : '#1C252E'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name='chevron-right'
                      size={24}
                      color={page === totalPages ? '#C4CDD5' : '#1C252E'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Modals ── */}
      <TicketActionSheet
        visible={actionSheet}
        onClose={() => setActionSheet(false)}
        ticket={activeTicket}
        resolvedRole={resolvedRole}
        onView={handleView}
        onUpdate={handleUpdateFromSheet}
        onCancel={handleCancelFromSheet}
      />

      <TicketUpdateStatusModal
        open={updateModal}
        onClose={() => {
          setUpdateModal(false);
          setActiveTicket(null);
        }}
        onSubmit={fetchTickets}
        ticket={activeTicket}
      />

      <CancelDialog
        visible={cancelDialog}
        ticket={activeTicket}
        onCancel={() => setCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        loading={cancelLoading}
      />

      <TicketFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={fetchTickets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Header — locked standard
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerSide: { flex: 1 },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C252E',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C252E',
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  // Status tabs
  tabsScroll: { marginHorizontal: -16, marginBottom: 12 },
  tabsContent: { paddingHorizontal: 16, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F4F6F8',
    gap: 6,
  },
  tabActive: { backgroundColor: '#1C252E' },
  tabText: { fontSize: 13, color: '#637381', fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  tabBadge: {
    backgroundColor: '#DDE1E6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabBadgeText: { fontSize: 11, color: '#637381', fontWeight: '600' },
  tabBadgeTextActive: { color: '#FFF' },

  // Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1C252E', padding: 0 },

  centreState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  stateText: { fontSize: 14, color: '#637381', textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1677FF',
  },
  retryText: { color: '#1677FF', fontSize: 13, fontWeight: '600' },

  // Table Structure
  tableOuter: { flexDirection: 'row', marginHorizontal: -16 },
  tableHeaderRow: { backgroundColor: '#F9FAFB' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 56,
  },
  cell: { paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' },
  colLabel: { fontSize: 12, fontWeight: '600', color: '#919EAB' },
  divider: { height: 1, backgroundColor: '#F0F2F5', marginVertical: 6 },
  separator: { height: 1, backgroundColor: '#F6F7F8' },

  codeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C252E',
    fontFamily: Platform?.OS === 'ios' ? 'Courier' : 'monospace',
  },
  titleText: { fontSize: 12, color: '#1C252E', lineHeight: 17 },
  metaText: { fontSize: 12, color: '#637381' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 60,
  },
  emptyText: { color: '#919EAB', marginTop: 8, fontSize: 14 },

  // Pagination
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
    paddingBottom: 4,
  },
  paginationLabel: { fontSize: 12, color: '#637381' },
  rowsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  rowsBtnText: { fontSize: 13, color: '#1C252E', fontWeight: '500' },
  menuActive: { color: '#1677FF', fontWeight: '700' },
  pageButtons: { flexDirection: 'row' },

  // Action sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDE1E6',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetTicketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 10,
  },
  sheetTicketCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C252E',
    fontFamily: Platform?.OS === 'ios' ? 'Courier' : 'monospace',
  },
  sheetTicketTitle: {
    fontSize: 12,
    color: '#637381',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  sheetIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1C252E',
  },
  sheetCancel: { marginTop: 8, justifyContent: 'center' },
  sheetCancelText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#637381',
    textAlign: 'center',
  },

  // Cancel dialog
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  dialogIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C252E',
    marginBottom: 8,
  },
  dialogBody: {
    fontSize: 14,
    color: '#637381',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  remarksWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#DDE1E6',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FAFAFA',
    marginBottom: 4,
  },
  remarksFocused: { borderColor: '#1C252E', borderWidth: 1.5 },
  remarksError: { borderColor: '#D32F2F' },
  remarksInput: {
    fontSize: 14,
    color: '#1C252E',
    minHeight: 72,
    textAlignVertical: 'top',
    padding: 0,
  },
  remarksFieldError: {
    fontSize: 12,
    color: '#D32F2F',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  dialogActions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  keepBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DDE1E6',
    alignItems: 'center',
  },
  keepText: { fontSize: 14, fontWeight: '600', color: '#1C252E' },
  cancelTicketBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelTicketText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
