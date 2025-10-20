'use client'

import CookieConsent from 'react-cookie-consent'

export default function CookieBanner() {
  const handleAccept = () => {
    console.log('Cookies accepted - Analytics enabled')
    // Future: Enable analytics tracking
    if (typeof window !== 'undefined') {
      localStorage.setItem('thriftai-analytics-consent', 'true')
    }
  }

  const handleDecline = () => {
    console.log('Cookies declined - Analytics disabled')
    // Future: Disable analytics tracking
    if (typeof window !== 'undefined') {
      localStorage.setItem('thriftai-analytics-consent', 'false')
    }
  }

  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept All"
      enableDeclineButton
      declineButtonText="Decline"
      cookieName="thriftai-consent"
      expires={365}
      overlay={false}
      style={{
        background: 'rgba(0, 0, 0, 0.95)',
        borderTop: '2px solid var(--accent-primary)',
        padding: '20px',
        fontSize: '15px',
        fontFamily: 'var(--font-body)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap'
      }}
      buttonStyle={{
        background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
        color: 'white',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '8px',
        padding: '12px 24px',
        minHeight: '44px',
        minWidth: '120px',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      declineButtonStyle={{
        background: 'transparent',
        border: '2px solid var(--text-tertiary)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '8px',
        padding: '12px 24px',
        minHeight: '44px',
        minWidth: '120px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      contentStyle={{
        flex: '1 1 300px',
        margin: '0',
        color: 'var(--text-primary)'
      }}
      buttonWrapperClasses="cookie-buttons"
      onAccept={handleAccept}
      onDecline={handleDecline}
      ariaAcceptLabel="Accept cookies and enable analytics"
      ariaDeclineLabel="Decline cookies and disable analytics"
    >
      <span style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>
        We use cookies to improve your shopping experience, personalize recommendations, and analyze site traffic.
        By clicking "Accept All", you consent to our use of cookies.{' '}
        <a
          href="/privacy-policy"
          style={{
            color: 'var(--accent-primary)',
            textDecoration: 'underline',
            fontWeight: '600'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          Learn more
        </a>
      </span>
    </CookieConsent>
  )
}
