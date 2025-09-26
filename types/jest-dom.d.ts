import { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module '@jest/expect' {
  interface Matchers<R = void, T = unknown> extends TestingLibraryMatchers<T, R> {
    /** @internal */
    readonly _jestDomMatchersBrand?: never;
  }
}

declare module '@jest/globals' {
  interface Matchers<R = void, T = unknown> extends TestingLibraryMatchers<T, R> {
    /** @internal */
    readonly _jestDomMatchersBrand?: never;
  }
}

declare module 'expect' {
  interface Matchers<R = void, T = unknown> extends TestingLibraryMatchers<T, R> {
    /** @internal */
    readonly _jestDomMatchersBrand?: never;
  }
}
