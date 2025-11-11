import { useAccountActions } from '@/hooks/useAccountActions';
import { useChangeEmail } from '@/hooks/useChangeEmail';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ChangeEmailModal } from './ChangeEmailModal';
import { AccountActionModal } from './AccountActionModal';

export function AccountSecuritySettings() {
  const { profile, jwtToken, setFeedback } = useUserProfile();
  const {
    showEmailModal,
    setShowEmailModal,
    emailForm,
    setEmailForm,
    openEmailModal,
    handleEmailSubmit,
  } = useChangeEmail(jwtToken, setFeedback);
  const {
    accountAction,
    setAccountAction,
    accountConfirm,
    setAccountConfirm,
    disableTargetState,
    setDisableTargetState,
    handleAccountAction,
  } = useAccountActions(jwtToken, setFeedback);

  return (
    <section className="profile-page__secondary">
      <header>
        <h2>Account security</h2>
        <p>Sensitive changes require re-authentication.</p>
      </header>
      <div className="profile-page__actions">
        <button type="button" onClick={() => openEmailModal(profile?.username ? `${profile.username}@example.com` : '')}>
          Change email
        </button>
        <button
          type="button"
          onClick={() => {
            setDisableTargetState(!(profile?.disabled ?? false));
            setAccountAction('disable');
          }}
        >
          {profile?.disabled ? 'Re-enable account' : 'Disable account'}
        </button>
        <button type="button" onClick={() => setAccountAction('anonymize')}>
          Anonymize account (GDPR)
        </button>
        <button type="button" className="danger" onClick={() => setAccountAction('delete')}>
          Delete account
        </button>
      </div>

      <ChangeEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        emailForm={emailForm}
        setEmailForm={setEmailForm}
        onSubmit={handleEmailSubmit}
      />

      <AccountActionModal
        isOpen={!!accountAction}
        onClose={() => setAccountAction(null)}
        accountAction={accountAction}
        profile={profile}
        disableTargetState={disableTargetState}
        accountConfirm={accountConfirm}
        setAccountConfirm={setAccountConfirm}
        onSubmit={handleAccountAction}
      />
    </section>
  );
}
