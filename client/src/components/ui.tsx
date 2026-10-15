import React, { ReactNode } from 'react';
import styled from 'styled-components';

export const Page = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

export const PageTitle = styled.h1`
  margin-bottom: 24px;
  color: #333;
`;

const ALERT_COLORS = {
  success: { bg: '#d4edda', border: '#c3e6cb', color: '#155724' },
  error: { bg: '#f8d7da', border: '#f5c6cb', color: '#721c24' },
  info: { bg: '#d1ecf1', border: '#bee5eb', color: '#0c5460' },
  warning: { bg: '#fff3cd', border: '#ffeeba', color: '#856404' },
};

const AlertBox = styled.div<{ $variant: keyof typeof ALERT_COLORS }>`
  background: ${p => ALERT_COLORS[p.$variant].bg};
  border: 1px solid ${p => ALERT_COLORS[p.$variant].border};
  color: ${p => ALERT_COLORS[p.$variant].color};
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
`;

export const Alert: React.FC<{ variant: keyof typeof ALERT_COLORS; testId?: string; children: ReactNode }> = ({ variant, testId, children }) => (
  <AlertBox $variant={variant} role={variant === 'error' ? 'alert' : 'status'} data-testid={testId}>
    {children}
  </AlertBox>
);

const STATUS_COLORS: Record<string, string> = {
  pending: '#ffc107',
  processing: '#17a2b8',
  shipped: '#007bff',
  delivered: '#28a745',
  cancelled: '#dc3545',
};

export const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: ${p => (p.$status === 'pending' ? '#333' : '#fff')};
  background: ${p => STATUS_COLORS[p.$status] || '#6c757d'};
  text-transform: capitalize;
`;

export const FieldError: React.FC<{ message?: string; testId?: string }> = ({ message, testId }) =>
  message ? <div className="error-message" role="alert" data-testid={testId}>{message}</div> : null;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

const Dialog = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  h2 {
    margin-bottom: 12px;
    font-size: 1.25rem;
  }
`;

export const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

export const Modal: React.FC<{ title: string; testId: string; onClose: () => void; children: ReactNode }> = ({ title, testId, onClose, children }) => (
  <Backdrop onClick={onClose}>
    <Dialog role="dialog" aria-modal="true" aria-label={title} data-testid={testId} onClick={e => e.stopPropagation()}>
      <h2>{title}</h2>
      {children}
    </Dialog>
  </Backdrop>
);

export const ConfirmDialog: React.FC<{
  title: string;
  message: ReactNode;
  confirmLabel: string;
  testId: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}> = ({ title, message, confirmLabel, testId, busy, onConfirm, onCancel, children }) => (
  <Modal title={title} testId={testId} onClose={onCancel}>
    <p>{message}</p>
    {children}
    <DialogActions>
      <button type="button" className="btn-secondary" data-testid={`${testId}-cancel`} onClick={onCancel} disabled={busy}>
        Cancel
      </button>
      <button type="button" className="btn-danger" data-testid={`${testId}-confirm`} onClick={onConfirm} disabled={busy}>
        {busy ? 'Working...' : confirmLabel}
      </button>
    </DialogActions>
  </Modal>
);

const TabList = styled.div`
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const TabButton = styled.button<{ $active: boolean }>`
  background: ${p => (p.$active ? '#007bff' : 'transparent')};
  color: ${p => (p.$active ? '#fff' : '#333')};
  border-radius: 6px 6px 0 0;
  padding: 10px 18px;
`;

export const Tabs: React.FC<{ tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void; testId: string }> = ({ tabs, active, onChange, testId }) => (
  <TabList role="tablist" data-testid={testId}>
    {tabs.map(tab => (
      <TabButton
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={active === tab.id}
        $active={active === tab.id}
        data-testid={`tab-${tab.id}`}
        onClick={() => onChange(tab.id)}
      >
        {tab.label}
      </TabButton>
    ))}
  </TabList>
);

export const Stars: React.FC<{ rating: number; testId?: string }> = ({ rating, testId }) => {
  const full = Math.round(rating);
  return (
    <span aria-label={`${rating} out of 5 stars`} data-testid={testId} style={{ color: '#ffc107', letterSpacing: 2 }}>
      {'★'.repeat(full)}
      <span style={{ color: '#ddd' }}>{'★'.repeat(5 - full)}</span>
    </span>
  );
};

export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
  background: #fff;
  border-radius: 8px;
`;
