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
import { getProjects, deleteProjects } from '../../api/projectService';
import { ProjectFormModal } from '../../components/ProjectFormModal';
import { useUser } from '../../context/UserContext';

// ── Role permission helpers (matching web) ────────────────────────────
const canUpdate = r =>
  ['SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPANY_USER', 'CLIENT_ADMIN'].includes(r);
const canViewComponents = r =>
  ['SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPANY_USER'].includes(r);
const canViewAssignedClients = r =>
  ['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(r);
const canViewAssignedUsers = r => r === 'CLIENT_ADMIN';
const canDelete = r =>
  ['SUPER_ADMIN', 'COMPANY_ADMIN', 'CLIENT_ADMIN'].includes(r);

// ── End date color ────────────────────────────────────────────────────
function getEndDateColor(dateStr) {
  if (!dateStr) return '#637381';
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return '#D32F2F';
  if (diff <= 30) return '#ED6C02';
  return '#2E7D32';
}

const STATUS_COLORS = {
  true: { bg: '#DCFCE7', text: '#16A34A', label: 'Active' },
  false: { bg: '#FEE2E2', text: '#DC2626', label: 'Inactive' },
};
const COL = {
  name: 180,
  desc: 180,
  status: 90,
  endDate: 130,
  createdBy: 110,
  actions: 44,
};
const ROWS_OPTIONS = [5, 10, 25];

// ── Table Row ─────────────────────────────────────────────────────────
function ProjectRow({ item }) {
  const sc = STATUS_COLORS[item.status] ?? {
    bg: '#F3F4F6',
    text: '#374151',
    label: '—',
  };
  const endColor = getEndDateColor(item.endDate);
  const createdBy =
    typeof item.createdBy === 'object'
      ? (item.createdBy?.userName ?? '—')
      : (item.createdBy ?? '—');
  const endDisplay = item.endDate
    ? new Date(item.endDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <View style={styles.tableRow}>
      {/* Project Name */}
      <View style={[styles.cell, { width: COL.name }]}>
        <View style={styles.projectIcon}>
          <MaterialCommunityIcons name='folder' size={18} color='#1677FF' />
        </View>
        <Text style={styles.nameText} numberOfLines={1}>
          {item.projectName ?? '—'}
        </Text>
      </View>

      {/* Description */}
      <View style={[styles.cell, { width: COL.desc }]}>
        <Text style={styles.descText} numberOfLines={2}>
          {item.description ?? '—'}
        </Text>
      </View>

      {/* Status */}
      <View style={[styles.cell, { width: COL.status }]}>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.text }]}>{sc.label}</Text>
        </View>
      </View>

      {/* End Date */}
      <View style={[styles.cell, { width: COL.endDate }]}>
        <MaterialCommunityIcons
          name='calendar'
          size={13}
          color={endColor}
          style={{ marginRight: 4 }}
        />
        <Text style={[styles.metaText, { color: endColor, fontWeight: '600' }]}>
          {endDisplay}
        </Text>
      </View>

      {/* Created By */}
      <View style={[styles.cell, { width: COL.createdBy }]}>
        <Text style={styles.metaText}>{createdBy}</Text>
      </View>
    </View>
  );
}

// ── Action Sheet ──────────────────────────────────────────────────────
function ActionSheet({
  visible,
  onClose,
  resolvedRole,
  onEdit,
  onDelete,
  onComponents,
  onAssignedClients,
  onAssignedUsers,
}) {
  const options = [
    canUpdate(resolvedRole) && {
      key: 'edit',
      label: 'Edit Project',
      icon: 'pencil-outline',
      iconBg: '#EBF3FF',
      iconColor: '#1677FF',
      onPress: onEdit,
    },
    canViewComponents(resolvedRole) && {
      key: 'components',
      label: 'Components',
      icon: 'puzzle-outline',
      iconBg: '#F3E8FF',
      iconColor: '#7C3AED',
      onPress: onComponents,
    },
    canViewAssignedClients(resolvedRole) && {
      key: 'clients',
      label: 'Assigned Clients',
      icon: 'account-group-outline',
      iconBg: '#DBEAFE',
      iconColor: '#1D4ED8',
      onPress: onAssignedClients,
    },
    canViewAssignedUsers(resolvedRole) && {
      key: 'users',
      label: 'Assigned Users',
      icon: 'account-multiple-outline',
      iconBg: '#DBEAFE',
      iconColor: '#1D4ED8',
      onPress: onAssignedUsers,
    },
    canDelete(resolvedRole) && {
      key: 'delete',
      label: 'Delete Project',
      icon: 'delete-outline',
      iconBg: '#FEE2E2',
      iconColor: '#D32F2F',
      onPress: onDelete,
      danger: true,
    },
  ].filter(Boolean);

  if (!options.length) return null;

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
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Delete Dialog ─────────────────────────────────────────────────────
function DeleteDialog({ visible, projectName, onCancel, onConfirm, loading }) {
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
          <Text style={styles.dialogTitle}>Delete Project?</Text>
          <Text style={styles.dialogBody}>
            Are you sure you want to delete{' '}
            <Text style={{ fontWeight: '700', color: '#1C252E' }}>
              {projectName}
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
export default function Projects() {
  const { resolvedRole } = useUser();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [menuVisible, setMenuVisible] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [actionSheet, setActionSheet] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getProjects();
      setProjects(res.data.data ?? []);
    } catch (err) {
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filtered = useMemo(
    () =>
      projects.filter(p => {
        const q = search.toLowerCase();
        return (
          (p.projectName ?? '').toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q)
        );
      }),
    [projects, search],
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

  const handleAction = useCallback(item => {
    setActiveProject(item);
    setActionSheet(true);
  }, []);

  const handleEditFromSheet = useCallback(() => {
    setActionSheet(false);
    setEditProject(activeProject);
    setFormOpen(true);
  }, [activeProject]);

  const handleDeleteFromSheet = useCallback(() => {
    setActionSheet(false);
    setDeleteDialog(true);
  }, []);

  const handleComponents = useCallback(() => {
    setActionSheet(false);
    // TODO: router.push(`/projects/${activeProject.projectId}/components`);
  }, [activeProject]);

  const handleAssignedClients = useCallback(() => {
    setActionSheet(false);
    // TODO: router.push(`/projects/${activeProject.projectId}/clients`);
  }, [activeProject]);

  const handleAssignedUsers = useCallback(() => {
    setActionSheet(false);
    // TODO: router.push(`/projects/${activeProject.projectId}/assigned-users`);
  }, [activeProject]);

  const handleConfirmDelete = useCallback(async () => {
    if (!activeProject) return;
    setDeleteLoading(true);
    try {
      await deleteProjects({
        projectId: activeProject.projectId,
        projectName: activeProject.projectName,
        status: activeProject.status === false,
      });
      setDeleteDialog(false);
      setActiveProject(null);
      await fetchProjects();
    } catch (err) {
      setDeleteDialog(false);
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  }, [activeProject, fetchProjects]);

  const handleNew = useCallback(() => {
    setEditProject(null);
    setFormOpen(true);
  }, []);
  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditProject(null);
  }, []);
  const handleFormSubmit = useCallback(async () => {
    await fetchProjects();
  }, [fetchProjects]);

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
          <Text style={styles.pageTitle}>Projects</Text>
          <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
            {canUpdate(resolvedRole) && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleNew}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name='plus' size={20} color='#fff' />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          {/* Search */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name='magnify' size={20} color='#919EAB' />
            <TextInput
              style={styles.searchInput}
              placeholder='Search by name or description...'
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
              <Text style={styles.stateText}>Loading projects...</Text>
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
                onPress={fetchProjects}
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
                      ['name', COL.name, 'Project Name'],
                      ['desc', COL.desc, 'Description'],
                      ['status', COL.status, 'Status'],
                      ['endDate', COL.endDate, 'End Date'],
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
                        name='folder-outline'
                        size={40}
                        color='#C4CDD5'
                      />
                      <Text style={styles.emptyText}>No projects found</Text>
                    </View>
                  ) : (
                    paginated.map((item, index) => (
                      <View key={item.projectId ?? index}>
                        <ProjectRow item={item} />
                        {index < paginated.length - 1 && (
                          <View style={styles.separator} />
                        )}
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>

              {/* Sticky Action Column */}
              <View style={styles.stickyActionCol}>
                {/* Blank Header Cell */}
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <View style={{ width: COL.actions, paddingHorizontal: 10 }} />
                </View>
                <View style={styles.divider} />

                {/* Sticky Action Rows */}
                {paginated.map((item, index) => {
                  const hasActions =
                    canUpdate(resolvedRole) ||
                    canDelete(resolvedRole) ||
                    canViewComponents(resolvedRole) ||
                    canViewAssignedClients(resolvedRole) ||
                    canViewAssignedUsers(resolvedRole);

                  return (
                    <View key={item.projectId ?? index}>
                      <View
                        style={[
                          styles.tableRow,
                          { paddingHorizontal: 10, justifyContent: 'center' },
                        ]}
                      >
                        {hasActions ? (
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
                        ) : (
                          <View style={{ width: 20 }} />
                        )}
                      </View>
                      {index < paginated.length - 1 && (
                        <View style={styles.separator} />
                      )}
                    </View>
                  );
                })}
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

      <ActionSheet
        visible={actionSheet}
        onClose={() => setActionSheet(false)}
        resolvedRole={resolvedRole}
        onEdit={handleEditFromSheet}
        onDelete={handleDeleteFromSheet}
        onComponents={handleComponents}
        onAssignedClients={handleAssignedClients}
        onAssignedUsers={handleAssignedUsers}
      />

      <DeleteDialog
        visible={deleteDialog}
        projectName={activeProject?.projectName ?? ''}
        onCancel={() => setDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />

      <ProjectFormModal
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        project={editProject}
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

  projectIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#EBF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  nameText: { fontSize: 13, fontWeight: '600', color: '#1C252E', flex: 1 },
  descText: { fontSize: 12, color: '#637381', lineHeight: 17 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  metaText: { fontSize: 12, color: '#637381' },

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
