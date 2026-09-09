// ── Dummy data for offline / no-backend development ────────────────────
// Toggle this off once a real backend is reachable.
export const MOCK_ENABLED = true;

const now = Date.now();
const daysAgo = n => new Date(now - n * 86400000).toISOString();
const daysFromNow = n => new Date(now + n * 86400000).toISOString();

// ── Base records ─────────────────────────────────────────────────────
const employees = [
  {
    userId: 1,
    userName: 'Ravi Kumar',
    email: 'ravi.kumar@qryio.com',
    userGroup: { userGroupName: 'Developer' },
    status: true,
    createdOn: daysAgo(220),
    createdBy: { userName: 'System' },
  },
  {
    userId: 2,
    userName: 'Priya Sharma',
    email: 'priya.sharma@qryio.com',
    userGroup: { userGroupName: 'Admin' },
    status: true,
    createdOn: daysAgo(300),
    createdBy: { userName: 'System' },
  },
  {
    userId: 3,
    userName: 'Arjun Mehta',
    email: 'arjun.mehta@qryio.com',
    userGroup: { userGroupName: 'Developer' },
    status: false,
    createdOn: daysAgo(150),
    createdBy: { userName: 'Priya Sharma' },
  },
  {
    userId: 4,
    userName: 'Sneha Iyer',
    email: 'sneha.iyer@qryio.com',
    userGroup: { userGroupName: 'Super Admin' },
    status: true,
    createdOn: daysAgo(400),
    createdBy: { userName: 'System' },
  },
  {
    userId: 5,
    userName: 'Karthik Rao',
    email: 'karthik.rao@qryio.com',
    userGroup: { userGroupName: 'Developer' },
    status: true,
    createdOn: daysAgo(60),
    createdBy: { userName: 'Priya Sharma' },
  },
];

const clients = [
  {
    clientId: 1,
    clientName: 'Acme Corp',
    clientCode: 'ACME01',
    status: true,
    createdOn: daysAgo(280),
    createdBy: { userName: 'Priya Sharma' },
  },
  {
    clientId: 2,
    clientName: 'Globex Inc',
    clientCode: 'GLBX02',
    status: true,
    createdOn: daysAgo(190),
    createdBy: { userName: 'Priya Sharma' },
  },
  {
    clientId: 3,
    clientName: 'Initech Solutions',
    clientCode: 'INIT03',
    status: false,
    createdOn: daysAgo(340),
    createdBy: { userName: 'System' },
  },
  {
    clientId: 4,
    clientName: 'Umbrella Ltd',
    clientCode: 'UMBR04',
    status: true,
    createdOn: daysAgo(40),
    createdBy: { userName: 'Sneha Iyer' },
  },
];

// Group IDs match the real backend: 166 = Client Admin, 167 = Client User.
const clientUsers = [
  {
    userId: 101,
    clientId: 1,
    userName: 'John Watson',
    email: 'john.watson@acmecorp.com',
    status: true,
    userGroupId: 167,
    userGroup: { userGroupName: 'Client User' },
    createdOn: daysAgo(120),
    createdBy: { userName: 'System' },
  },
  {
    userId: 102,
    clientId: 1,
    userName: 'Emma Clarke',
    email: 'emma.clarke@acmecorp.com',
    status: true,
    userGroupId: 166,
    userGroup: { userGroupName: 'Client Admin' },
    createdOn: daysAgo(200),
    createdBy: { userName: 'System' },
  },
  {
    userId: 103,
    clientId: 2,
    userName: 'Liam Chen',
    email: 'liam.chen@globex.com',
    status: true,
    userGroupId: 167,
    userGroup: { userGroupName: 'Client User' },
    createdOn: daysAgo(80),
    createdBy: { userName: 'Priya Sharma' },
  },
  {
    userId: 104,
    clientId: 2,
    userName: 'Nora Patel',
    email: 'nora.patel@globex.com',
    status: false,
    userGroupId: 167,
    userGroup: { userGroupName: 'Client User' },
    createdOn: daysAgo(60),
    createdBy: { userName: 'Priya Sharma' },
  },
  {
    userId: 105,
    clientId: 3,
    userName: 'Victor Nguyen',
    email: 'victor.nguyen@initech.com',
    status: true,
    userGroupId: 166,
    userGroup: { userGroupName: 'Client Admin' },
    createdOn: daysAgo(150),
    createdBy: { userName: 'System' },
  },
];

const projects = [
  {
    projectId: 1,
    projectName: 'Qryio CRM',
    description: 'Internal ticketing & CRM platform',
    status: true,
    endDate: daysFromNow(120),
    createdBy: { userName: 'Ravi Kumar' },
  },
  {
    projectId: 2,
    projectName: 'Client Portal',
    description: 'Self-service portal for clients',
    status: true,
    endDate: daysFromNow(12),
    createdBy: { userName: 'Priya Sharma' },
  },
  {
    projectId: 3,
    projectName: 'Legacy Migration',
    description: 'Migrate legacy billing system to the cloud',
    status: false,
    endDate: daysAgo(15),
    createdBy: { userName: 'Sneha Iyer' },
  },
  {
    projectId: 4,
    projectName: 'Mobile App Revamp',
    description: 'React Native rewrite of the mobile app',
    status: true,
    endDate: daysFromNow(200),
    createdBy: { userName: 'Karthik Rao' },
  },
];

const ticketBase = [
  {
    ticketId: 1,
    ticketCode: 'TCK-1001',
    ticketStatus: 'CREATED',
    title: 'Login page not loading on slow network',
    description:
      'Users on 3G connections see a blank screen instead of the login form.',
    remarks: null,
    componentName: 'Authentication',
    project: projects[0],
    client: clients[0],
    projectLead: employees[0],
    createdOn: daysAgo(6),
    modifiedOn: daysAgo(6),
  },
  {
    ticketId: 2,
    ticketCode: 'TCK-1002',
    ticketStatus: 'IN_PROGRESS',
    title: 'Export to Excel fails for large ticket lists',
    description:
      'Exporting more than 500 tickets times out and shows a generic error.',
    remarks: 'Investigating pagination in the export query.',
    componentName: 'Reports',
    project: projects[0],
    client: clients[1],
    projectLead: employees[0],
    createdOn: daysAgo(9),
    modifiedOn: daysAgo(2),
  },
  {
    ticketId: 3,
    ticketCode: 'TCK-1003',
    ticketStatus: 'RESOLVED',
    title: 'Add dark mode support',
    description: 'Client requested a dark theme option in settings.',
    remarks: 'Shipped behind a feature flag, enabled for all users.',
    componentName: 'UI/UX',
    project: projects[1],
    client: clients[1],
    projectLead: employees[4],
    createdOn: daysAgo(30),
    modifiedOn: daysAgo(20),
  },
  {
    ticketId: 4,
    ticketCode: 'TCK-1004',
    ticketStatus: 'CANCELLED',
    title: 'Duplicate of TCK-1001',
    description: 'Reported twice by different users on the same client team.',
    remarks: 'Closed as duplicate.',
    componentName: 'General',
    project: projects[0],
    client: clients[0],
    projectLead: employees[0],
    createdOn: daysAgo(6),
    modifiedOn: daysAgo(5),
  },
  {
    ticketId: 5,
    ticketCode: 'TCK-1005',
    ticketStatus: 'CREATED',
    title: 'Ticket detail page crashes on Android',
    description:
      'App crashes when opening a ticket with no attachments on Android 12.',
    remarks: null,
    componentName: 'Mobile App',
    project: projects[3],
    client: clients[2],
    projectLead: employees[2],
    createdOn: daysAgo(1),
    modifiedOn: daysAgo(1),
  },
  {
    ticketId: 6,
    ticketCode: 'TCK-1006',
    ticketStatus: 'IN_PROGRESS',
    title: 'Slow dashboard load times',
    description: 'Dashboard takes 8-10s to load for accounts with many tickets.',
    remarks: 'Adding server-side caching for aggregate counts.',
    componentName: 'Performance',
    project: projects[0],
    client: clients[3],
    projectLead: employees[4],
    createdOn: daysAgo(4),
    modifiedOn: daysAgo(1),
  },
];

function toTicketListItem(t) {
  return {
    ticketId: t.ticketId,
    ticketCode: t.ticketCode,
    ticketStatus: t.ticketStatus,
    title: t.title,
    componentName: t.componentName,
    createdOn: t.createdOn,
    assignResponseDto: { project: t.project },
  };
}

function toTicketDetail(t) {
  return {
    ticketId: t.ticketId,
    ticketCode: t.ticketCode,
    ticketStatus: t.ticketStatus,
    title: t.title,
    description: t.description,
    remarks: t.remarks,
    componentName: t.componentName,
    attachments: [],
    assignResponseDto: {
      project: t.project,
      client: t.client,
      projectLead: t.projectLead,
      createdOn: t.createdOn,
      modifiedOn: t.modifiedOn,
    },
  };
}

const ok = (data = {}) => ({ status: 'success', message: 'OK', data });

// ── URL → handler map. `url` is the axios config.url with the baseURL
// stripped (e.g. "ctpl/tickets/list"); `payload` is the parsed JSON body. ──
export const MOCK_HANDLERS = {
  'ctpl/tickets/list': () =>
    ok({ data: ticketBase.map(toTicketListItem), total: ticketBase.length }),

  'ctpl/tickets/view': payload => {
    const ticket = ticketBase.find(t => t.ticketId === payload?.ticketId);
    return ok(ticket ? toTicketDetail(ticket) : null);
  },

  'ctpl/tickets/update/status': payload => {
    const ticket = ticketBase.find(t => t.ticketId === payload?.ticketId);
    if (ticket) {
      ticket.ticketStatus = payload.ticketStatus;
      ticket.remarks = payload.remarks ?? ticket.remarks;
      ticket.modifiedOn = new Date().toISOString();
    }
    return ok({});
  },

  'ctpl/tickets/create': () => ok({}),

  'ctpl/user/company-users': () => ok(employees),
  'ctpl/user/company-users/create': () => ok({}),
  'ctpl/user/company-users/update': () => ok({}),
  // "Delete" is a soft-delete everywhere in this app — it flips status to
  // inactive and the record stays in the table. Shared between company
  // users and client users.
  'ctpl/user/delete': payload => {
    const emp = employees.find(e => e.userId === payload?.userId);
    if (emp) emp.status = false;
    const cu = clientUsers.find(u => u.userId === payload?.userId);
    if (cu) cu.status = false;
    return ok({});
  },

  'ctpl/master/clients/list': () => ok(clients),
  'ctpl/master/clients/info-list': () => ok(clients),
  'ctpl/master/clients/create': () => ok({}),
  'ctpl/master/clients/update': () => ok({}),
  'ctpl/master/clients/delete': payload => {
    const c = clients.find(c => c.clientId === payload?.clientId);
    if (c) c.status = false;
    return ok({});
  },

  'ctpl/user/client-users': payload => {
    const list = payload?.clientId
      ? clientUsers.filter(u => u.clientId === payload.clientId)
      : clientUsers;
    return ok(list);
  },
  'ctpl/user/client-users/create': payload => {
    clientUsers.push({
      userId: Date.now(),
      clientId: payload.clientId,
      userName: payload.userName,
      email: payload.email,
      status: true,
      userGroupId: payload.userGroupId,
      userGroup: {
        userGroupName: payload.userGroupId === 166 ? 'Client Admin' : 'Client User',
      },
      createdOn: new Date().toISOString(),
      createdBy: { userName: 'You' },
    });
    return ok({});
  },
  // Group can't be changed after creation — only name/email/status.
  'ctpl/user/client-users/update': payload => {
    const u = clientUsers.find(u => u.userId === payload.clientUserId);
    if (u) {
      u.userName = payload.userName ?? u.userName;
      u.email = payload.email ?? u.email;
      if (payload.status !== undefined) u.status = payload.status;
    }
    return ok({});
  },

  'ctpl/master/projects': () => ok(projects),
  'ctpl/master/project/info-list': () => ok(projects),
  'ctpl/master/projects/create': () => ok({}),
  'ctpl/master/projects/update': () => ok({}),
  // Soft-delete, same as clients/users. Mobile's Projects screen already
  // sends an explicit status (it toggles: reactivate if already inactive,
  // deactivate otherwise) — honor that, defaulting to deactivate.
  'ctpl/master/projects/delete': payload => {
    const p = projects.find(p => p.projectId === payload?.projectId);
    if (p) p.status = payload?.status ?? false;
    return ok({});
  },
  'ctpl/master/component/info-list': () => ok([]),

  'ctpl/tickets/user-projects': () => ok(projects),
  'ctpl/tickets/project-components': () =>
    ok([
      { componentId: 1, componentName: 'Authentication' },
      { componentId: 2, componentName: 'Reports' },
      { componentId: 3, componentName: 'UI/UX' },
      { componentId: 4, componentName: 'Performance' },
    ]),
};
