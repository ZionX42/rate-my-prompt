interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailForm: { newEmail: string; password: string };
  setEmailForm: (form: { newEmail: string; password: string }) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function ChangeEmailModal({
  isOpen,
  onClose,
  emailForm,
  setEmailForm,
  onSubmit,
}: ChangeEmailModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <dialog className="profile-page__modal" open>
      <form onSubmit={onSubmit} method="dialog">
        <h3>Change email address</h3>
        <p>Please confirm your current password to continue.</p>
        <label>
          New email
          <input
            type="email"
            value={emailForm.newEmail}
            onChange={(event) =>
              setEmailForm({ ...emailForm, newEmail: event.target.value })
            }
            required
          />
        </label>
        <label>
          Current password
          <input
            type="password"
            value={emailForm.password}
            onChange={(event) =>
              setEmailForm({ ...emailForm, password: event.target.value })
            }
            required
          />
        </label>
        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit">Submit</button>
        </footer>
      </form>
    </dialog>
  );
}
