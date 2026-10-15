import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import apiClient, { getErrorMessage, getFieldErrors } from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';
import { AddressInput, FieldErrors, SavedAddress } from '../types';
import AddressForm, { emptyAddress, validateAddressInput } from '../components/AddressForm';
import { Alert, ConfirmDialog, DialogActions, FieldError, Modal, Page, PageTitle, Tabs } from '../components/ui';

const MAX_ADDRESSES = 5;
const NAME_PATTERN = /^[A-Za-z][A-Za-z' -]*$/;

const Panel = styled.section`
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  max-width: 640px;
`;

const AddressCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;

  .actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;
  }

  .actions button {
    padding: 6px 12px;
  }
`;

const DefaultBadge = styled.span`
  background: #007bff;
  color: #fff;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
`;

const nameError = (value: string, label: string) => {
  const v = value.trim();
  if (!v) return `${label} is required`;
  if (v.length < 2 || v.length > 50) return `${label} must be 2-50 characters`;
  if (!NAME_PATTERN.test(v)) return `${label} can only contain letters, spaces, hyphens and apostrophes`;
  return undefined;
};

const passwordError = (value: string, label: string) => {
  if (!value) return `${label} is required`;
  if (value.length < 8) return `${label} must be at least 8 characters`;
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return `${label} must contain at least one letter and one number`;
  return undefined;
};

const ProfileTab: React.FC = () => {
  const { user, setCurrentUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const next: FieldErrors = {};
    const f = nameError(firstName, 'First name');
    if (f) next.firstName = f;
    const l = nameError(lastName, 'Last name');
    if (l) next.lastName = l;
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      setCurrentUser(await apiClient.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() }));
      setMessage({ text: 'Your profile was updated.', variant: 'success' });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setMessage({ text: getErrorMessage(err, 'Could not update your profile'), variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel data-testid="profile-panel">
      {message && <Alert variant={message.variant} testId="profile-message">{message.text}</Alert>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-first-name">First name</label>
          <input id="profile-first-name" value={firstName} data-testid="profile-first-name-input" onChange={e => setFirstName(e.target.value)} />
          <FieldError message={errors.firstName} testId="profile-first-name-error" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-last-name">Last name</label>
          <input id="profile-last-name" value={lastName} data-testid="profile-last-name-input" onChange={e => setLastName(e.target.value)} />
          <FieldError message={errors.lastName} testId="profile-last-name-error" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-email">Email</label>
          <input id="profile-email" value={user?.email || ''} readOnly disabled data-testid="profile-email-input" />
        </div>
        <button type="submit" className="btn-primary" disabled={saving} data-testid="save-profile-button">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </Panel>
  );
};

const PasswordTab: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const next: FieldErrors = {};
    if (!currentPassword) next.currentPassword = 'Current password is required';
    const n = passwordError(newPassword, 'New password');
    if (n) next.newPassword = n;
    else if (newPassword === currentPassword) next.newPassword = 'New password must be different from the current password';
    if (confirmPassword !== newPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await apiClient.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ text: 'Your password was changed.', variant: 'success' });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setMessage({ text: getErrorMessage(err, 'Could not change your password'), variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const type = show ? 'text' : 'password';
  return (
    <Panel data-testid="password-panel">
      {message && <Alert variant={message.variant} testId="password-message">{message.text}</Alert>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="current-password">Current password</label>
          <input id="current-password" type={type} autoComplete="current-password" value={currentPassword} data-testid="current-password-input" onChange={e => setCurrentPassword(e.target.value)} />
          <FieldError message={errors.currentPassword} testId="current-password-error" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="new-password">New password</label>
          <input id="new-password" type={type} autoComplete="new-password" value={newPassword} data-testid="new-password-input" onChange={e => setNewPassword(e.target.value)} />
          <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>At least 8 characters, including a letter and a number.</div>
          <FieldError message={errors.newPassword} testId="new-password-error" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="confirm-password">Confirm new password</label>
          <input id="confirm-password" type={type} autoComplete="new-password" value={confirmPassword} data-testid="confirm-password-input" onChange={e => setConfirmPassword(e.target.value)} />
          <FieldError message={errors.confirmPassword} testId="confirm-password-error" />
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={show} data-testid="show-passwords-checkbox" onChange={e => setShow(e.target.checked)} />
          Show passwords
        </label>
        <button type="submit" className="btn-primary" disabled={saving} data-testid="change-password-button">
          {saving ? 'Updating...' : 'Change password'}
        </button>
      </form>
    </Panel>
  );
};

interface AddressDraft {
  id?: string;
  label: string;
  isDefault: boolean;
  address: AddressInput;
}

const AddressesTab: React.FC = () => {
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [draft, setDraft] = useState<AddressDraft | null>(null);
  const [draftErrors, setDraftErrors] = useState<FieldErrors>({});
  const [draftError, setDraftError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<SavedAddress | null>(null);
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiClient.getAddresses().then(setAddresses).catch(err => setMessage({ text: getErrorMessage(err), variant: 'error' }));
  }, []);

  const openNew = () => {
    setDraftErrors({});
    setDraftError(null);
    setDraft({ label: '', isDefault: false, address: emptyAddress() });
  };

  const openEdit = (a: SavedAddress) => {
    setDraftErrors({});
    setDraftError(null);
    const { fullName, phone, street, city, state, zipCode, country } = a;
    setDraft({ id: a.id, label: a.label, isDefault: a.isDefault, address: { fullName, phone, street, city, state, zipCode, country } });
  };

  const saveDraft = async () => {
    if (!draft) return;
    const errors = validateAddressInput(draft.address);
    if (!draft.label.trim()) errors.label = 'Label is required';
    else if (draft.label.trim().length > 30) errors.label = 'Label must be 30 characters or fewer';
    setDraftErrors(errors);
    if (Object.keys(errors).length) return;
    setBusy(true);
    setDraftError(null);
    try {
      const payload = { ...draft.address, label: draft.label.trim(), isDefault: draft.isDefault };
      if (draft.id) await apiClient.updateAddress(draft.id, payload);
      else await apiClient.createAddress(payload);
      setAddresses(await apiClient.getAddresses());
      setMessage({ text: draft.id ? 'Address updated.' : 'Address added.', variant: 'success' });
      setDraft(null);
    } catch (err) {
      setDraftErrors(getFieldErrors(err));
      setDraftError(getErrorMessage(err, 'Could not save the address'));
    } finally {
      setBusy(false);
    }
  };

  const makeDefault = async (id: string) => {
    try {
      setAddresses(await apiClient.setDefaultAddress(id));
      setMessage({ text: 'Default address updated.', variant: 'success' });
    } catch (err) {
      setMessage({ text: getErrorMessage(err), variant: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      setAddresses(await apiClient.deleteAddress(deleting.id));
      setMessage({ text: 'Address deleted.', variant: 'success' });
    } catch (err) {
      setMessage({ text: getErrorMessage(err), variant: 'error' });
    } finally {
      setDeleting(null);
      setBusy(false);
    }
  };

  const full = (addresses?.length || 0) >= MAX_ADDRESSES;

  return (
    <Panel data-testid="addresses-panel">
      {message && <Alert variant={message.variant} testId="addresses-message">{message.text}</Alert>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span data-testid="address-count">{addresses?.length || 0} of {MAX_ADDRESSES} addresses</span>
        <button type="button" className="btn-primary" data-testid="add-address-button" disabled={full} onClick={openNew}>
          Add address
        </button>
      </div>
      {full && <p style={{ color: '#856404', marginBottom: 12 }} data-testid="address-limit-message">You have reached the limit of {MAX_ADDRESSES} addresses. Delete one to add another.</p>}
      {addresses && addresses.length === 0 && <p data-testid="no-addresses">You have no saved addresses.</p>}
      {addresses?.map(a => (
        <AddressCard key={a.id} data-testid="address-card" data-address-id={a.id}>
          <strong data-testid="address-label">{a.label}</strong>
          {a.isDefault && <DefaultBadge data-testid="default-badge">Default</DefaultBadge>}
          <p style={{ marginTop: 6 }} data-testid="address-text">
            {a.fullName} · {a.phone}<br />
            {a.street}, {a.city}{a.state ? `, ${a.state}` : ''} {a.zipCode}, {a.country}
          </p>
          <div className="actions">
            <button type="button" className="btn-outline" data-testid="edit-address-button" onClick={() => openEdit(a)}>Edit</button>
            {!a.isDefault && (
              <button type="button" className="btn-secondary" data-testid="set-default-address-button" onClick={() => makeDefault(a.id)}>Set as default</button>
            )}
            <button type="button" className="btn-danger" data-testid="delete-address-button" onClick={() => setDeleting(a)}>Delete</button>
          </div>
        </AddressCard>
      ))}

      {draft && (
        <Modal title={draft.id ? 'Edit address' : 'Add address'} testId="address-modal" onClose={() => setDraft(null)}>
          {draftError && <Alert variant="error" testId="address-modal-error">{draftError}</Alert>}
          <div className="form-group">
            <label className="form-label" htmlFor="address-label">Label (e.g. Home, Work)</label>
            <input id="address-label" value={draft.label} maxLength={30} data-testid="address-label-input" onChange={e => setDraft({ ...draft, label: e.target.value })} />
            <FieldError message={draftErrors.label} testId="address-label-error" />
          </div>
          <AddressForm idPrefix="address" value={draft.address} errors={draftErrors} onChange={address => setDraft({ ...draft, address })} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={draft.isDefault} data-testid="address-default-checkbox" onChange={e => setDraft({ ...draft, isDefault: e.target.checked })} />
            Set as default address
          </label>
          <DialogActions>
            <button type="button" className="btn-secondary" data-testid="address-cancel-button" onClick={() => setDraft(null)}>Cancel</button>
            <button type="button" className="btn-primary" data-testid="address-save-button" disabled={busy} onClick={saveDraft}>
              {busy ? 'Saving...' : 'Save address'}
            </button>
          </DialogActions>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete address?"
          message={`${deleting.label}: ${deleting.street}, ${deleting.city}`}
          confirmLabel="Delete"
          testId="confirm-delete-address"
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </Panel>
  );
};

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'password', label: 'Password' },
  { id: 'addresses', label: 'Addresses' },
];

const Account: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(t => t.id === params.get('tab')) ? (params.get('tab') as string) : 'profile';

  return (
    <Page data-testid="account-page">
      <PageTitle>My Account</PageTitle>
      <Tabs tabs={TABS} active={tab} testId="account-tabs" onChange={id => setParams({ tab: id }, { replace: true })} />
      {tab === 'profile' && <ProfileTab />}
      {tab === 'password' && <PasswordTab />}
      {tab === 'addresses' && <AddressesTab />}
    </Page>
  );
};

export default Account;
