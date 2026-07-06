import { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Text, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EMPLOYEES } from '../../data/employeeData';

const GROUP_COLORS = {
  'Super Admin': { bg: '#EDE9FE', text: '#7C3AED' },
  Admin: { bg: '#DBEAFE', text: '#1D4ED8' },
  Developer: { bg: '#FEF3C7', text: '#D97706' },
};
const STATUS_COLORS = {
  Active: { bg: '#DCFCE7', text: '#16A34A' },
  Inactive: { bg: '#FEE2E2', text: '#DC2626' },
};
const COL = {
  nameEmail: 200,
  group: 120,
  status: 90,
  createdOn: 115,
  createdBy: 110,
  actions: 44,
};
const ROWS_OPTIONS = [5, 10, 25];

// ── Table Row ────────────────────────────────────────────────────────
function TableRow({ item }) {
  const gc = GROUP_COLORS[item.group] || { bg: '#F3F4F6', text: '#374151' };
  const sc = STATUS_COLORS[item.status] || { bg: '#F3F4F6', text: '#374151' };

  return (
    <View style={styles.tableRow}>
      {/* Name + Email stacked */}
      <View style={[styles.cell, { width: COL.nameEmail }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.nameText} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.emailText} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
      </View>

      <View style={[styles.cell, { width: COL.group }]}>
        <View style={[styles.badge, { backgroundColor: gc.bg }]}>
          <Text style={[styles.badgeText, { color: gc.text }]}>
            {item.group}
          </Text>
        </View>
      </View>

      <View style={[styles.cell, { width: COL.status }]}>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.text }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={[styles.cell, { width: COL.createdOn }]}>
        <Text style={styles.metaText}>{item.createdOn}</Text>
      </View>

      <View style={[styles.cell, { width: COL.createdBy }]}>
        <Text style={styles.metaText}>{item.createdBy}</Text>
      </View>

      <View
        style={[styles.cell, { width: COL.actions, justifyContent: 'center' }]}
      >
        <TouchableOpacity activeOpacity={0.7}>
          <MaterialCommunityIcons
            name='dots-vertical'
            size={20}
            color='#637381'
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────
export default function Employee() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [menuVisible, setMenuVisible] = useState(false);

  const filtered = useMemo(
    () =>
      EMPLOYEES.filter(
        e =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const handleRowsChange = val => {
    setRowsPerPage(val);
    setPage(1);
    setMenuVisible(false);
  };

  const startItem = filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endItem = Math.min(page * rowsPerPage, filtered.length);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* ── Page Header: centered title + right button ── */}
        <View style={styles.pageHeader}>
          <View style={styles.headerSide} />

          <Text style={styles.pageTitle}>Employee</Text>

          <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
            <TouchableOpacity style={styles.addButton} activeOpacity={0.85}>
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

          {/* ── Horizontal scroll table ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            bounces={false}
            nestedScrollEnabled
            style={styles.tableScroll}
          >
            <View>
              {/* Header Row */}
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <View style={[styles.cell, { width: COL.nameEmail }]}>
                  <Text style={styles.colLabel}>Name</Text>
                </View>
                <View style={[styles.cell, { width: COL.group }]}>
                  <Text style={styles.colLabel}>Group</Text>
                </View>
                <View style={[styles.cell, { width: COL.status }]}>
                  <Text style={styles.colLabel}>Status</Text>
                </View>
                <View style={[styles.cell, { width: COL.createdOn }]}>
                  <Text style={styles.colLabel}>Created On</Text>
                </View>
                <View style={[styles.cell, { width: COL.createdBy }]}>
                  <Text style={styles.colLabel}>Created By</Text>
                </View>
                <View style={[styles.cell, { width: COL.actions }]} />
              </View>

              <View style={styles.divider} />

              {/* Data Rows */}
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
                  <View key={item.id}>
                    <TableRow item={item} />
                    {index < paginated.length - 1 && (
                      <View style={styles.separator} />
                    )}
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* ── Pagination ── */}
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerSide: { flex: 1 },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C252E',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C252E',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
  },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Card
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

  // Search
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

  // Table
  tableScroll: { marginHorizontal: -16 },
  tableHeaderRow: { backgroundColor: '#F9FAFB' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  cell: { paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' },
  colLabel: { fontSize: 12, fontWeight: '600', color: '#919EAB' },

  divider: { height: 1, backgroundColor: '#F0F2F5', marginVertical: 6 },
  separator: { height: 1, backgroundColor: '#F6F7F8' },

  // Avatar + name block
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

  // Badge
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Empty
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
});
