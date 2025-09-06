import Link from 'next/link';
import React from 'react';
import ThemeToggle from './ui/ThemeToggle';
import SearchInput from './ui/SearchInput';

const Navigation = () => {
  return (
    <nav className="bg-bg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-heading">
                Prompt Hub
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/community"
                className="border-transparent text-subtext hover:text-heading inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Community
              </Link>
              <Link
                href="/academy"
                className="border-transparent text-subtext hover:text-heading inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Academy
              </Link>
              <Link
                href="/about"
                className="border-transparent text-subtext hover:text-heading inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="border-transparent text-subtext hover:text-heading inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Contact
              </Link>
              <Link
                href="/feedback"
                className="border-transparent text-subtext hover:text-heading inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Feedback
              </Link>
            </div>
          </div>

          {/* Right side navigation items */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex items-center">
              <SearchInput />
            </div>
            <div className="flex items-center ml-4">
              <Link
                href="/login"
                className="text-subtext hover:text-heading px-3 py-2 text-sm font-medium"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="ml-3 inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium shadow-soft text-white"
                style={{ backgroundImage: 'linear-gradient(90deg, #FF4B91, #5F5CFF)' }}
              >
                Sign up
              </Link>
              <ThemeToggle className="ml-4" />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-subtext hover:text-heading hover:bg-card focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-indigo"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className="hidden sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/community"
            className="bg-surface border-border text-heading block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Community
          </Link>
          <Link
            href="/academy"
            className="border-transparent text-subtext hover:bg-surface hover:border-border hover:text-heading block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Academy
          </Link>
          <Link
            href="/about"
            className="border-transparent text-subtext hover:bg-surface hover:border-border hover:text-heading block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="border-transparent text-subtext hover:bg-surface hover:border-border hover:text-heading block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Contact
          </Link>
          <Link
            href="/feedback"
            className="border-transparent text-subtext hover:bg-surface hover:border-border hover:text-heading block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Feedback
          </Link>
        </div>
        <div className="pt-4 pb-3 border-t border-border">
          <div className="flex items-center px-4">
            <div className="flex-shrink-0">
              <Link
                href="/login"
                className="block px-4 py-2 text-base font-medium text-subtext hover:text-heading hover:bg-card"
              >
                Log in
              </Link>
            </div>
            <div className="mt-3">
              <Link
                href="/signup"
                className="block w-full px-4 py-2 text-base font-medium text-center text-white rounded-2xl"
                style={{ backgroundImage: 'linear-gradient(90deg, #4A90E2, #34D399)' }}
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
