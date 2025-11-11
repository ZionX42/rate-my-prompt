import { Metadata } from 'next';
import Script from 'next/script';
import styles from '@/styles/secure-example.module.css';

export const metadata: Metadata = {
  title: 'Secure Page Example',
  description: 'Example of secure page with CSP (no inline script/style).',
};

export default function SecurePageExample() {
  return (
    <div>
      <h1>Secure Page with Minimal CSP</h1>
      <p>This page demonstrates avoiding inline scripts/styles for strict CSP.</p>

      <div className={styles.secureContent}>
        <p>This content is styled via an external CSS module.</p>
      </div>

      {/* External script instead of inline */}
      <Script src="/js/secure-example.js" strategy="afterInteractive" />
    </div>
  );
}
