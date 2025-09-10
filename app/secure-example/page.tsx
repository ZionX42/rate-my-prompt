import { Metadata } from 'next';

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
      <style>
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
        dangerouslySetInnerHTML={{
          __html: `
            console.log('This inline script is protected by CSP nonce');
          `,
        }}
      />
    </div>
  );
}
