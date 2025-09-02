import React from 'react';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  categories: Array<{ id: string; name: string }>;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  error,
  categories = [],
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const fieldId = 'category-select';
  const errorId = 'category-error';

  return (
    <div className="mb-4">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
        Category <span className="text-red-500 ml-1">*</span>
      </label>

      <select
        id={fieldId}
        name="category"
        value={value}
        onChange={handleChange}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
          error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
        }`}
      >
        <option value="">Select a category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
