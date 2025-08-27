import React from 'react';

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
};

const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  as: Component = 'div',
  maxWidth = 'xl',
  padding = true,
}) => {
  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  return (
    <Component
      className={`mx-auto w-full ${maxWidthClasses[maxWidth]} ${
        padding ? 'px-4 sm:px-6 lg:px-8' : ''
      } ${className}`}
    >
      {children}
    </Component>
  );
};

export default Container;
