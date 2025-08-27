import React from 'react';
import Container from './Container';

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  containerMaxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  containerClassName?: string;
  id?: string;
  withContainer?: boolean;
  withPadding?: boolean;
  as?: React.ElementType;
};

const Section: React.FC<SectionProps> = ({
  children,
  className = '',
  containerMaxWidth = 'xl',
  containerClassName = '',
  id,
  withContainer = true,
  withPadding = true,
  as: Component = 'section',
}) => {
  const content = withContainer ? (
    <Container maxWidth={containerMaxWidth} className={containerClassName} padding={withPadding}>
      {children}
    </Container>
  ) : (
    children
  );

  return (
    <Component 
      id={id} 
      className={`${withPadding ? 'py-12 md:py-16' : ''} ${className}`}
    >
      {content}
    </Component>
  );
};

export default Section;
