// Admin panel — full super-admin: accounts list, create/edit/delete,
// users management (add / reset password / delete), block/unblock.
// All calls go to the License Server via AdminApi (licenseApi).

import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AdminApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../lib/format';
import { Badge, Card, CardHeader, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';

// ─── types ────────────────────────────────────────────────────────────────────

interface AccountUser {
  id: number;
  username: string;
  role: string;
}

interface Account {
  id: number;
  name: string;
  phone?: string | null;
  blocked: boolean;
  subscriptionExpires?: string | null;
  users?: AccountUser[];
}

// ─── main screen ──────────────────────────────────────────────────────────────

type ModalMode = 'add' | { type: 'edit'; account: Account } | { type: 'users'; account: Account };

export default function AdminScreen() {
  const colors = useColors();
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState<ModalMode | null>(null);

  const { data, loading, error, reload } = useApi(() => AdminApi.listAccounts(), [refreshKey]);
  const accounts: Account[] = (data as any) ?? [];

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleToggleBlock = (account: Account) => {
    const next = !account.blocked;
    Alert.alert(
      next ? 'Bloklash' : 'Blokdan chiqarish',
      `"${account.name}" akkauntini ${next ? 'bloklashni' : 'blokdan chiqarishni'} tasdiqlaysizmi?`,
      [
        { text: 'Bekor', style: 'cancel' },
        {
          text: 'Ha',
          style: next ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await AdminApi.setBlocked(account.id, next);
              refresh();
            } catch (e: any) {
              Alert.alert('Xatolik', e.message);
            }
          },
        },
      ],
    );
  };

  const handleDelete = (account: Account) => {
    Alert.alert(
      "O'chirish",
      `"${account.name}" akkauntini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.`,
      [
        { text: 'Bekor', style: 'cancel' },
        {
          text: "O'chirish",
          style: 'destructive',
          onPress: async () => {
            try {
              await AdminApi.deleteAccount(account.id);
              refresh();
            } catch (e: any) {
              Alert.alert('Xatolik', e.message);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Summary row */}
        <View style={styles.summaryRow}>
          <SummaryCard label="Jami" value={accounts.length} color={colors.primary} />
          <SummaryCard label="Faol" value={accounts.filter((a) => !a.blocked).length} color="#10B981" />
          <SummaryCard label="Bloklangan" value={accounts.filter((a) => a.blocked).length} color="#EF4444" />
        </View>

        <Card>
          <CardHeader title="Akkauntlar ro'yxati" hint={`${accounts.length} ta`} />
          <Loader loading={loading} error={error} onRetry={reload}>
            {accounts.length === 0 ? (
              <EmptyState icon="🔐" text="Akkaunt topilmadi" />
            ) : (
              accounts.map((acc, idx) => (
                <View
                  key={acc.id}
                  style={[
                    styles.row,
                    idx < accounts.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                  ]}
                >
                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={[styles.accName, { color: colors.text }]}>{acc.name}</Text>
                      {acc.blocked && <Badge label="Bloklangan" variant="red" />}
                    </View>
                    {acc.phone ? (
                      <Text style={[styles.accMeta, { color: colors.textMuted }]}>{acc.phone}</Text>
                    ) : null}
                    <Text style={[styles.accMeta, { color: colors.textMuted }]}>
                      {acc.users?.length ?? 0} ta foydalanuvchi
                      {acc.subscriptionExpires
                        ? ` · ${formatDate(acc.subscriptionExpires)} gacha`
                        : ' · ∞'}
                    </Text>
                  </View>

                  {/* Action buttons */}
                  <View style={styles.actions}>
                    {/* Edit */}
                    <ActionBtn
                      label="✏️"
                      onPress={() => setModal({ type: 'edit', account: acc })}
                      color={colors.primary}
                    />
                    {/* Users */}
                    <ActionBtn
                      label="👥"
                      onPress={() => setModal({ type: 'users', account: acc })}
                      color="#6366F1"
                    />
                    {/* Block / Unblock */}
                    <ActionBtn
                      label={acc.blocked ? '🔓' : '🔒'}
                      onPress={() => handleToggleBlock(acc)}
                      color={acc.blocked ? '#10B981' : '#F59E0B'}
                    />
                    {/* Delete */}
                    <ActionBtn
                      label="🗑️"
                      onPress={() => handleDelete(acc)}
                      color="#EF4444"
                    />
                  </View>
                </View>
              ))
            )}
          </Loader>
        </Card>
      </ScrollView>

      {/* FAB — add account */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setModal('add')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Modals */}
      {modal === 'add' && (
        <CreateAccountModal
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refresh(); }}
        />
      )}
      {modal !== null && typeof modal === 'object' && modal.type === 'edit' && (
        <EditAccountModal
          account={modal.account}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refresh(); }}
        />
      )}
      {modal !== null && typeof modal === 'object' && modal.type === 'users' && (
        <UsersModal
          account={modal.account}
          onClose={() => setModal(null)}
        />
      )}
    </View>
  );
}

// ─── summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.summaryVal, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

// ─── action button ────────────────────────────────────────────────────────────

function ActionBtn({ label, onPress, color }: { label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { borderColor: color + '55' }]}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
    >
      <Text style={{ fontSize: 15 }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Create account modal ─────────────────────────────────────────────────────

function CreateAccountModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!name.trim() || !username.trim() || !password) {
      setErr("Majburiy maydonlarni to'ldiring");
      return;
    }
    setBusy(true);
    try {
      await AdminApi.createAccount({
        name: name.trim(),
        phone: phone.trim() || undefined,
        ownerUsername: username.trim(),
        ownerPassword: password,
      });
      onSaved();
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <BottomModal title="Yangi akkaunt" onClose={onClose}>
      <MInput label="Biznes nomi *" value={name} onChange={setName} autoFocus />
      <MInput label="Telefon" value={phone} onChange={setPhone} keyboardType="phone-pad" />
      <MInput label="Egasi (username) *" value={username} onChange={setUsername} autoCapitalize="none" />
      <MInput label="Parol *" value={password} onChange={setPassword} secureTextEntry />
      {err ? <Text style={styles.errText}>{err}</Text> : null}
      <ModalButtons onCancel={onClose} onSave={save} busy={busy} saveLabel="Yaratish" />
    </BottomModal>
  );
}

// ─── Edit account modal ───────────────────────────────────────────────────────

function EditAccountModal({
  account,
  onClose,
  onSaved,
}: {
  account: Account;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(account.name);
  const [phone, setPhone] = useState(account.phone ?? '');
  const [expires, setExpires] = useState(account.subscriptionExpires ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!name.trim()) { setErr('Nom majburiy'); return; }
    setBusy(true);
    try {
      await AdminApi.updateAccount(account.id, {
        name: name.trim(),
        phone: phone.trim() || null,
        subscriptionExpires: expires.trim() || null,
      });
      onSaved();
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <BottomModal title="Akkauntni tahrirlash" onClose={onClose}>
      <MInput label="Biznes nomi *" value={name} onChange={setName} autoFocus />
      <MInput label="Telefon" value={phone} onChange={setPhone} keyboardType="phone-pad" />
      <MInput label="Obuna tugashi (YYYY-MM-DD)" value={expires} onChange={setExpires} placeholder="2026-12-31" />
      {err ? <Text style={styles.errText}>{err}</Text> : null}
      <ModalButtons onCancel={onClose} onSave={save} busy={busy} saveLabel="Saqlash" />
    </BottomModal>
  );
}

// ─── Users modal ──────────────────────────────────────────────────────────────

function UsersModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const colors = useColors();
  const [refreshKey, setRefreshKey] = useState(0);
  const [adding, setAdding] = useState(false);

  const { data, loading, error, reload } = useApi(
    () => AdminApi.accountDetail(account.id),
    [refreshKey],
  );
  const detail: Account = (data as any) ?? account;
  const users: AccountUser[] = detail.users ?? [];

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleDeleteUser = (user: AccountUser) => {
    Alert.alert(
      "Foydalanuvchini o'chirish",
      `"${user.username}" ni o'chirishni tasdiqlaysizmi?`,
      [
        { text: 'Bekor', style: 'cancel' },
        {
          text: "O'chirish",
          style: 'destructive',
          onPress: async () => {
            try {
              await AdminApi.deleteUser(user.id);
              refresh();
            } catch (e: any) {
              Alert.alert('Xatolik', e.message);
            }
          },
        },
      ],
    );
  };

  const handleResetPassword = (user: AccountUser) => {
    Alert.prompt?.(
      'Yangi parol',
      `${user.username} uchun yangi parol kiriting:`,
      async (newPass) => {
        if (!newPass) return;
        try {
          await AdminApi.resetPassword(user.id, newPass);
          Alert.alert('✅', 'Parol muvaffaqiyatli o\'zgartirildi');
        } catch (e: any) {
          Alert.alert('Xatolik', e.message);
        }
      },
      'secure-text',
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%', maxHeight: '85%' }}
        >
          <View style={[styles.formBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                👥 {account.name}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: colors.textMuted, fontSize: 24, lineHeight: 28 }}>×</Text>
              </TouchableOpacity>
            </View>

            <Loader loading={loading} error={error} onRetry={reload}>
              <ScrollView style={{ maxHeight: 300 }}>
                {users.length === 0 ? (
                  <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 16 }}>
                    Foydalanuvchi yo'q
                  </Text>
                ) : (
                  users.map((u) => (
                    <View
                      key={u.id}
                      style={[styles.userRow, { borderBottomColor: colors.border }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[{ fontSize: 14, fontWeight: '600', color: colors.text }]}>
                          {u.username}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>{u.role}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.userBtn, { borderColor: '#6366F155' }]}
                        onPress={() => handleResetPassword(u)}
                      >
                        <Text style={{ fontSize: 13, color: '#6366F1' }}>🔑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.userBtn, { borderColor: '#EF444455' }]}
                        onPress={() => handleDeleteUser(u)}
                      >
                        <Text style={{ fontSize: 13, color: '#EF4444' }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            </Loader>

            {adding ? (
              <AddUserForm
                accountId={account.id}
                onSaved={() => { setAdding(false); refresh(); }}
                onCancel={() => setAdding(false)}
              />
            ) : (
              <TouchableOpacity
                style={[styles.addUserBtn, { backgroundColor: colors.primary }]}
                onPress={() => setAdding(true)}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>+ Foydalanuvchi qo'shish</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function AddUserForm({
  accountId,
  onSaved,
  onCancel,
}: {
  accountId: number;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const colors = useColors();

  const save = async () => {
    if (!username.trim() || !password) { setErr("To'ldiring"); return; }
    setBusy(true);
    try {
      await AdminApi.createUser(accountId, { username: username.trim(), password, role: 'CASHIER' });
      onSaved();
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <View style={{ marginTop: 12 }}>
      <MInput label="Username *" value={username} onChange={setUsername} autoCapitalize="none" autoFocus />
      <MInput label="Parol *" value={password} onChange={setPassword} secureTextEntry />
      {err ? <Text style={styles.errText}>{err}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: colors.border }]}
          onPress={onCancel}
        >
          <Text style={{ color: colors.text }}>Bekor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={save}
          disabled={busy}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            {busy ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── shared primitives ────────────────────────────────────────────────────────

function BottomModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%' }}
        >
          <View style={[styles.formBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.formTitle, { color: colors.text }]}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: colors.textMuted, fontSize: 24, lineHeight: 28 }}>×</Text>
              </TouchableOpacity>
            </View>
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function MInput({
  label,
  value,
  onChange,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  secureTextEntry,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  secureTextEntry?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>{label}</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
        value={value}
        onChangeText={onChange}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoFocus={autoFocus}
        autoCorrect={false}
      />
    </View>
  );
}

function ModalButtons({
  onCancel,
  onSave,
  busy,
  saveLabel,
}: {
  onCancel: () => void;
  onSave: () => void;
  busy: boolean;
  saveLabel: string;
}) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
      <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onCancel}>
        <Text style={{ color: colors.text }}>Bekor</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
        onPress={onSave}
        disabled={busy}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>{busy ? 'Saqlanmoqda...' : saveLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { padding: 12, paddingBottom: 88 },
  summaryRow:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center' },
  summaryVal:  { fontSize: 26, fontWeight: '700' },
  summaryLabel:{ fontSize: 12, marginTop: 2 },
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  accName:     { fontSize: 14, fontWeight: '600' },
  accMeta:     { fontSize: 12, marginTop: 2 },
  actions:     { flexDirection: 'row', gap: 6 },
  actionBtn:   { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  userRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  userBtn:     { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  addUserBtn:  { height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  fab:         { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabIcon:     { color: '#fff', fontSize: 28, lineHeight: 32 },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  formBox:     { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  formTitle:   { fontSize: 18, fontWeight: '700' },
  input:       { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 15 },
  errText:     { color: '#EF4444', fontSize: 12, marginBottom: 8 },
  cancelBtn:   { flex: 1, height: 46, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn:     { flex: 1, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
