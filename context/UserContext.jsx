import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Role Constants ────────────────────────────────────────────────────
export const ROLES = {
  ROLE_ADMIN: 'ROLE_Admin',
  COMPANY_USER: 'Company_User',
  CLIENT_ADMIN: 'Client_Admin',
  CLIENT_USER: 'Client_User',
};

// ── Role Labels & Colors (matching web) ──────────────────────────────
export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  COMPANY_ADMIN: 'Company Admin',
  COMPANY_USER: 'Developer',
  CLIENT_ADMIN: 'Client Admin',
  CLIENT_USER: 'User',
};

export const ROLE_COLORS = {
  SUPER_ADMIN: { bg: '#7C3AED', text: '#FFFFFF' }, // purple  - secondary
  COMPANY_ADMIN: { bg: '#0288D1', text: '#FFFFFF' }, // blue    - info
  COMPANY_USER: { bg: '#2E7D32', text: '#FFFFFF' }, // green   - success
  CLIENT_ADMIN: { bg: '#0288D1', text: '#FFFFFF' }, // blue    - info
  CLIENT_USER: { bg: '#ED6C02', text: '#FFFFFF' }, // orange  - warning
};

// ── Role Resolver (identical logic to web) ────────────────────────────
export function getUserRole(profile) {
  if (!profile) return null;

  const roleName = profile?.userGroup?.roles?.[0]?.roleName;
  const userType = profile?.userType;

  if (roleName === 'ROLE_Client_Admin') return 'CLIENT_ADMIN';
  if (roleName === 'ROLE_Admin' && userType === 'Company_User')
    return 'COMPANY_ADMIN';

  if (userType === ROLES.COMPANY_USER) return 'COMPANY_USER';
  if (userType === ROLES.CLIENT_USER) return 'CLIENT_USER';

  // defaultUser flag → Super Admin (same as web)
  if (profile?.defaultUser) return 'SUPER_ADMIN';

  return null;
}

// ── Storage Keys ──────────────────────────────────────────────────────
const STORAGE_KEY = 'qryio_user';
const TOKEN_KEY = 'token';

// ── Context ───────────────────────────────────────────────────────────
// Change this line at the top
const UserContext = createContext({
  user: null,
  setUser: async () => {},
  logout: async () => {},
  loading: true,
  resolvedRole: null,
  isCompanyAdmin: false,
  isCompanyUser: false,
  isClientAdmin: false,
  isClientUser: false,
  isSuperAdmin: false,
});

export function UserProvider({ children }) {
  const [user, _setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from AsyncStorage on app start
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) _setUser(JSON.parse(raw));
      } catch (e) {
        console.error('Failed to load user:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const setUser = useCallback(async newUser => {
    _setUser(newUser);
    try {
      if (newUser)
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      else await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to save user:', e);
    }
  }, []);

  const logout = useCallback(async () => {
    _setUser(null);
    await AsyncStorage.multiRemove([
      STORAGE_KEY,
      TOKEN_KEY,
      'qryio_login_time',
    ]);
  }, []);

  // ── Resolve role ─────────────────────────────────────────────────
  const resolvedRole = useMemo(() => {
    if (!user) return null;
    if (user.defaultUser) return 'SUPER_ADMIN';
    return getUserRole(user);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      logout,
      loading,
      resolvedRole,
      isCompanyAdmin: resolvedRole === 'COMPANY_ADMIN',
      isCompanyUser: resolvedRole === 'COMPANY_USER',
      isClientAdmin: resolvedRole === 'CLIENT_ADMIN',
      isClientUser: resolvedRole === 'CLIENT_USER',
      isSuperAdmin: resolvedRole === 'SUPER_ADMIN',
    }),
    [user, setUser, logout, loading, resolvedRole],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  return ctx;
}
