import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Text, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCompanyUsers } from '../../api/employeeService';
import { EmployeeFormModal } from '../../components/EmployeeFormModal';

const GROUP_COLORS = {
  'Super Admin': { bg: '#EDE9FE', text: '#7C3AED' },
  Admin: { bg: '#DBEAFE', text: '#1D4ED8' },
  Developer: { bg: '#FEF3C7', text: '#D97706' },
};
const STATUS_COLORS = {
  true: { bg: '#DCFCE7', text: '#16A34A', label: 'Active' },
  false: { bg: '#FEE2E2', text: '#DC2626', label: 'Inactive' },
};
const COL = {
  nameEmail: 200,
  group: 130,
  status: 90,
  createdOn: 115,
  createdBy: 110,
  actions: 44,
};
const ROWS_OPTIONS = [5, 10, 25];

// ── Table Row ─────────────────────────────────────────────────────────
function TableRow({ item, onEdit }) {
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
            {(item.userName ?? item.user ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.nameText} numberOfLines={1}>
            {item.userName ?? item.user ?? '—'}
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
            ? (item.createdBy?.userName ?? item.createdBy?.email ?? '—')
            : (item.createdBy ?? '—')}
        </Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────
export default function Employee() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);

  // ── Fetch ─────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getCompanyUsers();
      setEmployees(response.data.data ?? []);
    } catch (err) {
      setError('Failed to load employees.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // ── Derived ───────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      employees.filter(e => {
        const name = (e.userName ?? e.user ?? '').toLowerCase();
        const email = (e.email ?? '').toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || email.includes(q);
      }),
    [employees, search],
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

  const handleEdit = useCallback(emp => {
    setEditEmployee(emp);
    setModalOpen(true);
  }, []);

  const handleNew = useCallback(() => {
    setEditEmployee(null);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setEditEmployee(null);
  }, []);
  const handleModalSubmit = useCallback(async () => {
    await fetchEmployees();
  }, [fetchEmployees]);

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
          <Text style={styles.pageTitle}>Employee</Text>
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

          {/* ── Loading ── */}
          {loading && (
            <View style={styles.centreState}>
              <ActivityIndicator size='large' color='#1677FF' />
              <Text style={styles.stateText}>Loading employees...</Text>
            </View>
          )}

          {/* ── Error ── */}
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
                onPress={fetchEmployees}
                activeOpacity={0.8}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Table ── */}
          {!loading && !error && (
            <View style={styles.tableOuter}>
              {/* Scrollable data columns */}
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
                      ['nameEmail', COL.nameEmail, 'Name'],
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
                  <View style={styles.divider} />
                  {paginated.length === 0 ? (
                    <View style={styles.emptyState}>
                      <MaterialCommunityIcons
                        name='account-search-outline'
                        size={40}
                        color='#C4CDD5'
                      />
                      <Text style={styles.emptyText}>No employees found</Text>
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

              {/* Sticky action column */}
              <View>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <View style={{ width: COL.actions, paddingHorizontal: 10 }} />
                </View>
                <View style={styles.divider} />
                {paginated.map((item, index) => (
                  <View key={item.userId ?? index}>
                    <View
                      style={[
                        styles.tableRow,
                        { paddingHorizontal: 10, justifyContent: 'center' },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => handleEdit(item)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name='pencil-outline'
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

          {/* ── Pagination ── */}
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

      {/* ── Modal ── */}
      <EmployeeFormModal
        open={modalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        employee={editEmployee}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  rowsBtnText: { fontSize: 13, color: '#1C252E', fontWeight: '500' },
  menuActive: { color: '#1677FF', fontWeight: '700' },
  pageButtons: { flexDirection: 'row' },
});
