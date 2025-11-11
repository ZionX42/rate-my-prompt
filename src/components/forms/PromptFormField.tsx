import React from 'react';

interface PromptFormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: 'text' | 'textarea';
  placeholder?: string;
  required?: boolean;
}

export const PromptFormField: React.FC<PromptFormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  required = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const fieldId = `field-${name}`;
  const errorId = `error-${name}`;

  return (
    <div className="mb-4">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
          }`}
          rows={4}
        />
      ) : (
        <input
          type={type}
          id={fieldId}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
          }`}
        />
      )}

      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
