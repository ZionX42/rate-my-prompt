import React from 'react';

type GridProps = {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
};

const Grid: React.FC<GridProps> = ({
  children,
  className = '',
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
}) => {
  const getColsClass = () => {
    const baseClass = 'grid-cols-';
    const classes = [];

    if (cols.default) {
      classes.push(`${baseClass}${cols.default}`);
    }
    if (cols.sm) {
      classes.push(`sm:${baseClass}${cols.sm}`);
    }
    if (cols.md) {
      classes.push(`md:${baseClass}${cols.md}`);
    }
    if (cols.lg) {
      classes.push(`lg:${baseClass}${cols.lg}`);
    }
    if (cols.xl) {
      classes.push(`xl:${baseClass}${cols.xl}`);
    }

    return classes.join(' ');
  };

  return (
    <div className={`grid ${getColsClass()} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};

export default Grid;
