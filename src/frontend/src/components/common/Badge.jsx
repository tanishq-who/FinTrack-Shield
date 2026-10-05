import React from 'react';

export const Badge = ({ children, variant = 'category', className = '' }) => {
  let variantClass = 'badge-category';
  if (variant === 'income') variantClass = 'badge-income';
  if (variant === 'expense') variantClass = 'badge-expense';

  return (
    <span className={`badge ${variantClass} ${className}`}>
      {children}
    </span>
  );
};
