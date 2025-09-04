import { Metadata } from 'next';
import { SecurityUtils } from '@/lib/security/utils';

// Generate a nonce for this request
const nonce = SecurityUtils.generateNonce();

export const metadata: Metadata = {
  title: 'Secure Page Example',
  description: 'Example of secure page with CSP nonces',
};

// This is an example of how to use nonces with Next.js
// Note: This is for demonstration purposes only
export default function SecurePageExample() {
  return (
    <div>
      <h1>Secure Page with CSP Nonce</h1>
      <p>This page demonstrates how to use CSP nonces for inline scripts/styles.</p>

      {/* Example of inline style with nonce (if needed) */}
      <style nonce={nonce}>
        {`
          .secure-content {
            background-color: #f0f0f0;
            padding: 1rem;
            border-radius: 4px;
          }
        `}
      </style>

      <div className="secure-content">
        <p>This content is styled with a nonce-protected inline style.</p>
      </div>

      {/* Example of inline script with nonce (if needed) */}
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `
            console.log('This inline script is protected by CSP nonce');
          `,
        }}
      />
    </div>
  );
}
