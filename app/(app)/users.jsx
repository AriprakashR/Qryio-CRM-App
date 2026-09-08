import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Text, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getClientsList,
  getClientUsers,
  deleteClientUser,
} from '../../api/clientService';
import { ClientUserFormModal } from '../../components/ClientUserFormModal';
import { useUser } from '../../context/UserContext';

const GROUP_COLORS = {
  Admin: { bg: '#EDE9FE', text: '#7C3AED' },
  User: { bg: '#DBEAFE', text: '#1D4ED8' },
};
const STATUS_COLORS = {
  true: { bg: '#DCFCE7', text: '#16A34A', label: 'Active' },
  false: { bg: '#FEE2E2', text: '#DC2626', label: 'Inactive' },
};
const COL = {
  nameEmail: 220,
  group: 100,
  status: 90,
  createdOn: 115,
  createdBy: 110,
  actions: 64,
};
const ROWS_OPTIONS = [5, 10, 25];

// ── Table Row ─────────────────────────────────────────────────────────
function TableRow({ item, onAction }) {
  const groupName = item.userGroup?.userGroupName ?? '';
  const gc = GROUP_COLORS[groupName] || { bg: '#F3F4F6', text: '#374151' };
  const sc = STATUS_COLORS[item.status] || {
    bg: '#F3F4F6',
    text: '#374151',
    label: String(item.status),
  };
  const createdOn = item.createdOn
    ? new Date(item.createdOn).toLocaleDateString('en-IN')
    : '—';

  return (
    <View style={styles.tableRow}>
      <View style={[styles.cell, { width: COL.nameEmail }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.userName ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.nameText} numberOfLines={1}>
            {item.userName ?? '—'}
          </Text>
          <Text style={styles.emailText} numberOfLines={1}>
            {item.email ?? '—'}
          </Text>
        </View>
      </View>

      <View style={[styles.cell, { width: COL.group }]}>
        <View style={[styles.badge, { backgroundColor: gc.bg }]}>
          <Text style={[styles.badgeText, { color: gc.text }]}>
            {groupName || '—'}
          </Text>
        </View>
      </View>

      <View style={[styles.cell, { width: COL.status }]}>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.text }]}>{sc.label}</Text>
        </View>
      </View>

      <View style={[styles.cell, { width: COL.createdOn }]}>
        <Text style={styles.metaText}>{createdOn}</Text>
      </View>

      <View style={[styles.cell, { width: COL.createdBy }]}>
        <Text style={styles.metaText}>
          {typeof item.createdBy === 'object'
            ? (item.createdBy?.userName ?? '—')
            : (item.createdBy ?? '—')}
        </Text>
      </View>
    </View>
  );
}

// ── Action Sheet ──────────────────────────────────────────────────────
function ActionSheet({ visible, onClose, onEdit, onDelete }) {
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

          <TouchableOpacity
            style={styles.sheetOption}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <View style={styles.sheetIconWrap}>
              <MaterialCommunityIcons
                name='pencil-outline'
                size={20}
                color='#1677FF'
              />
            </View>
            <Text style={styles.sheetOptionText}>Edit User</Text>
            <MaterialCommunityIcons
              name='chevron-right'
              size={20}
              color='#C4CDD5'
            />
          </TouchableOpacity>

          <Divider />

          <TouchableOpacity
            style={styles.sheetOption}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <View
              style={[styles.sheetIconWrap, { backgroundColor: '#FEE2E2' }]}
            >
              <MaterialCommunityIcons
                name='delete-outline'
                size={20}
                color='#D32F2F'
              />
            </View>
            <Text style={[styles.sheetOptionText, { color: '#D32F2F' }]}>
              Delete User
            </Text>
            <MaterialCommunityIcons
              name='chevron-right'
              size={20}
              color='#C4CDD5'
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sheetOption, styles.sheetCancel]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Confirm Delete Dialog ─────────────────────────────────────────────
function DeleteDialog({ visible, userName, onCancel, onConfirm, loading }) {
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
              name='delete-outline'
              size={32}
              color='#D32F2F'
            />
          </View>
          <Text style={styles.dialogTitle}>Delete User?</Text>
          <Text style={styles.dialogBody}>
            Are you sure you want to delete{' '}
            <Text style={{ fontWeight: '700', color: '#1C252E' }}>
              {userName}
            </Text>
            ? This action cannot be undone.
          </Text>
          <View style={styles.dialogActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteBtn, loading && { opacity: 0.7 }]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text style={styles.deleteText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────
export default function Users() {
  const router = useRouter();
  const { clientId } = useLocalSearchParams();
  const { isClientAdmin } = useUser();
  // Drilled in from the Clients list (Company Admin) vs. reached via the
  // drawer's own "Users" link (Client Admin) — same as web's clientId param.
  const showBreadcrumb = !!clientId;

  const [client, setClient] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [menuVisible, setMenuVisible] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [actionSheet, setActionSheet] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const clientsRes = await getClientsList();
      const allClients = clientsRes.data.data ?? [];
      const targetClient = clientId
        ? allClients.find(c => String(c.clientId) === String(clientId))
        : allClients[0];
      setClient(targetClient ?? null);

      if (targetClient) {
        const usersRes = await getClientUsers({
          clientId: targetClient.clientId,
        });
        setUsers(usersRes.data.data ?? []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setError('Failed to load users.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived ───────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      users.filter(u => {
        const name = (u.userName ?? '').toLowerCase();
        const email = (u.email ?? '').toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || email.includes(q);
      }),
    [users, search],
  );

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

  // ── Action handlers ───────────────────────────────────────────────
  const handleAction = useCallback(item => {
    setActiveUser(item);
    setActionSheet(true);
  }, []);

  const handleEditFromSheet = useCallback(() => {
    setActionSheet(false);
    setEditUser(activeUser);
    setFormOpen(true);
  }, [activeUser]);

  const handleDeleteFromSheet = useCallback(() => {
    setActionSheet(false);
    setDeleteDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!activeUser) return;
    setDeleteLoading(true);
    try {
      await deleteClientUser({ userId: activeUser.userId });
      setDeleteDialog(false);
      setActiveUser(null);
      await fetchData();
    } catch (err) {
      setDeleteDialog(false);
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  }, [activeUser, fetchData]);

  const handleNew = useCallback(() => {
    setEditUser(null);
    setFormOpen(true);
  }, []);
  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditUser(null);
  }, []);
  const handleFormSubmit = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* ── Breadcrumb (Company Admin drilling into a client) ── */}
        {showBreadcrumb && (
          <View style={styles.breadcrumb}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name='arrow-left'
                size={18}
                color='#1C252E'
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/clients')}
              activeOpacity={0.7}
            >
              <Text style={styles.breadcrumbLink}>Clients</Text>
            </TouchableOpacity>
            <MaterialCommunityIcons
              name='chevron-right'
              size={16}
              color='#919EAB'
            />
            <Text style={styles.breadcrumbMid} numberOfLines={1}>
              {client?.clientName ?? '—'}
            </Text>
            <MaterialCommunityIcons
              name='chevron-right'
              size={16}
              color='#919EAB'
            />
            <Text style={styles.breadcrumbCurrent}>Users</Text>
          </View>
        )}

        {/* ── Header ── */}
        <View style={styles.pageHeader}>
          <View style={styles.headerSide} />
          <Text style={styles.pageTitle}>Users</Text>
          <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleNew}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name='plus' size={20} color='#fff' />
            </TouchableOpacity>
          </View>
        </View>

        {client && (
          <Text style={styles.subtitle}>
            {client.clientName}
            {'  ·  '}
            <Text style={styles.subtitleCode}>{client.clientCode}</Text>
            {'  ·  '}
            {users.length} user{users.length !== 1 ? 's' : ''}
          </Text>
        )}

        {/* ── Card ── */}
        <View style={styles.card}>
          {/* Search */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name='magnify' size={20} color='#919EAB' />
            <TextInput
              style={styles.searchInput}
              placeholder='Search...'
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
              <Text style={styles.stateText}>Loading users...</Text>
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
                onPress={fetchData}
                activeOpacity={0.8}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Table */}
          {!loading && !error && (
            <View style={styles.tableOuter}>
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
                      ['nameEmail', COL.nameEmail, 'Username'],
                      ['group', COL.group, 'Group'],
                      ['status', COL.status, 'Status'],
                      ['createdOn', COL.createdOn, 'Created On'],
                      ['createdBy', COL.createdBy, 'Created By'],
                    ].map(([key, w, label]) => (
                      <View key={key} style={[styles.cell, { width: w }]}>
                        <Text style={styles.colLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>

                  {paginated.length === 0 ? (
                    <View style={styles.emptyState}>
                      <MaterialCommunityIcons
                        name='account-search-outline'
                        size={40}
                        color='#C4CDD5'
                      />
                      <Text style={styles.emptyText}>
                        {search ? 'No users found' : 'No users yet'}
                      </Text>
                    </View>
                  ) : (
                    paginated.map((item, index) => (
                      <View key={item.userId ?? index}>
                        <TableRow item={item} />
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
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <View style={[styles.cell, { width: COL.actions }]}>
                    <Text style={styles.colLabel}>Action</Text>
                  </View>
                </View>
                {paginated.map((item, index) => (
                  <View key={item.userId ?? index}>
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
                          size={20}
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
      <ActionSheet
        visible={actionSheet}
        onClose={() => setActionSheet(false)}
        onEdit={handleEditFromSheet}
        onDelete={handleDeleteFromSheet}
      />

      <DeleteDialog
        visible={deleteDialog}
        userName={activeUser?.userName ?? ''}
        onCancel={() => setDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />

      <ClientUserFormModal
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        client={client}
        user={editUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDE1E6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  breadcrumbLink: { fontSize: 13, color: '#637381' },
  breadcrumbMid: { fontSize: 13, color: '#637381', maxWidth: 140 },
  breadcrumbCurrent: { fontSize: 13, fontWeight: '600', color: '#1C252E' },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
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
  subtitle: {
    fontSize: 13,
    color: '#637381',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitleCode: {
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#1C252E',
  },

  card: {
    backgroundColor: '#FFFFFF',
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
  tableOuter: { flexDirection: 'row', marginHorizontal: -16 },
  tableHeaderRow: {
    backgroundColor: '#F4F6F8',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E5EA',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 56,
  },
  cell: { paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' },
  colLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  divider: { height: 1, backgroundColor: '#F0F2F5', marginVertical: 6 },
  separator: { height: 1, backgroundColor: '#F6F7F8' },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  avatarText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  nameBlock: { flex: 1 },
  nameText: { fontSize: 13, fontWeight: '600', color: '#1C252E' },
  emailText: { fontSize: 11, color: '#637381', marginTop: 2 },
  metaText: { fontSize: 12, color: '#637381' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 60,
  },
  emptyText: { color: '#919EAB', marginTop: 8, fontSize: 14 },

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
    backgroundColor: '#EBF3FF',
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

  // Delete dialog
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
    marginBottom: 10,
  },
  dialogBody: {
    fontSize: 14,
    color: '#637381',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  dialogActions: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DDE1E6',
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#1C252E' },
  deleteBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
