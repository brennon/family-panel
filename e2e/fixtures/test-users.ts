/**
 * Browser-specific test user credentials
 *
 * Each browser gets its own set of test users to prevent cross-browser
 * test interference when running tests in parallel.
 *
 * Created by migration 007_add_browser_specific_test_users.sql
 */

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
}

export interface TestKid {
  id: string;
  pin: string;
  name: string;
}

export interface BrowserTestUsers {
  parent: TestUser;
  kid1: TestKid;
  kid2: TestKid;
}

// Map Playwright browser names to test users
const browserUsers: Record<string, BrowserTestUsers> = {
  chromium: {
    parent: {
      id: '00000010-0000-0000-0000-000000000000',
      email: 'parent-chromium@example.com',
      password: 'parentpassword123',
      name: 'Chromium Parent',
    },
    kid1: {
      id: '00000110-0000-0000-0000-000000000000',
      pin: '1234',
      name: 'Chromium Kid 1',
    },
    kid2: {
      id: '00000120-0000-0000-0000-000000000000',
      pin: '5678',
      name: 'Chromium Kid 2',
    },
  },
  firefox: {
    parent: {
      id: '00000020-0000-0000-0000-000000000000',
      email: 'parent-firefox@example.com',
      password: 'parentpassword123',
      name: 'Firefox Parent',
    },
    kid1: {
      id: '00000210-0000-0000-0000-000000000000',
      pin: '1234',
      name: 'Firefox Kid 1',
    },
    kid2: {
      id: '00000220-0000-0000-0000-000000000000',
      pin: '5678',
      name: 'Firefox Kid 2',
    },
  },
  webkit: {
    parent: {
      id: '00000030-0000-0000-0000-000000000000',
      email: 'parent-webkit@example.com',
      password: 'parentpassword123',
      name: 'WebKit Parent',
    },
    kid1: {
      id: '00000310-0000-0000-0000-000000000000',
      pin: '1234',
      name: 'WebKit Kid 1',
    },
    kid2: {
      id: '00000320-0000-0000-0000-000000000000',
      pin: '5678',
      name: 'WebKit Kid 2',
    },
  },
  'Mobile Chrome': {
    parent: {
      id: '00000040-0000-0000-0000-000000000000',
      email: 'parent-mobile-chrome@example.com',
      password: 'parentpassword123',
      name: 'Mobile Chrome Parent',
    },
    kid1: {
      id: '00000410-0000-0000-0000-000000000000',
      pin: '1234',
      name: 'Mobile Chrome Kid 1',
    },
    kid2: {
      id: '00000420-0000-0000-0000-000000000000',
      pin: '5678',
      name: 'Mobile Chrome Kid 2',
    },
  },
  'Mobile Safari': {
    parent: {
      id: '00000050-0000-0000-0000-000000000000',
      email: 'parent-mobile-safari@example.com',
      password: 'parentpassword123',
      name: 'Mobile Safari Parent',
    },
    kid1: {
      id: '00000510-0000-0000-0000-000000000000',
      pin: '1234',
      name: 'Mobile Safari Kid 1',
    },
    kid2: {
      id: '00000520-0000-0000-0000-000000000000',
      pin: '5678',
      name: 'Mobile Safari Kid 2',
    },
  },
};

/**
 * Get test users for the current browser
 *
 * @param browserName - The Playwright browser name (chromium, firefox, webkit, etc.)
 * @returns Test user credentials for this browser
 */
export function getTestUsers(browserName: string): BrowserTestUsers {
  const users = browserUsers[browserName];

  if (!users) {
    throw new Error(
      `No test users configured for browser: ${browserName}. ` +
      `Available browsers: ${Object.keys(browserUsers).join(', ')}`
    );
  }

  return users;
}
