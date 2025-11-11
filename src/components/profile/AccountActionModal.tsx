interface AccountActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountAction: 'disable' | 'anonymize' | 'delete' | null;
  profile: { disabled?: boolean } | null;
  disableTargetState: boolean;
  accountConfirm: boolean;
  setAccountConfirm: (confirm: boolean) => void;
  onSubmit: () => void;
}

export function AccountActionModal({
  isOpen,
  onClose,
  accountAction,
  profile,
  disableTargetState,
  accountConfirm,
  setAccountConfirm,
  onSubmit,
}: AccountActionModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <dialog className="profile-page__modal" open>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        method="dialog"
      >
        <h3>
          {accountAction === 'disable'
            ? profile?.disabled
              ? 'Re-enable account'
              : 'Disable account'
            : accountAction === 'anonymize'
            ? 'Anonymize account'
            : 'Delete account'}
        </h3>
        <p>
          {accountAction === 'disable'
            ? disableTargetState
              ? 'Your profile and logins will be disabled until you contact support to re-enable.'
              : 'Your account will be restored and logins re-enabled.'
            : accountAction === 'anonymize'
            ? 'Personal data will be removed. This action is irreversible.'
            : 'Your account and profile will be permanently deleted. This action cannot be undone.'}
        </p>
        <label className="profile-page__toggle">
          <input
            type="checkbox"
            checked={accountConfirm}
            onChange={(event) => setAccountConfirm(event.target.checked)}
          />
          I understand the consequences and wish to proceed.
        </label>
        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="danger" disabled={!accountConfirm}>
            Confirm
          </button>
        </footer>
      </form>
    </dialog>
  );
}
