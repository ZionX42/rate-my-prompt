/// <reference types="jest" />

declare global {
  interface Assertion {
    toBeInTheDocument(): this;
    toHaveAttribute(attr: string, value?: string): this;
    toHaveClass(...classNames: string[]): this;
    toBeDisabled(): this;
    toHaveBeenCalled(): this;
    toHaveBeenCalledWith(...expected: unknown[]): this;
  }
}

export {};
