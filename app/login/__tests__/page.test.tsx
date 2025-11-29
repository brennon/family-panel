import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';
import { useAuth } from '@/lib/auth/context';

// Mock auth context
jest.mock('@/lib/auth/context', () => ({
  useAuth: jest.fn(),
}));

describe('Login Page', () => {
  const mockSignIn = jest.fn();
  const mockSignInWithPin = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signInWithPin: mockSignInWithPin,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    });
  });

  it('renders parent login form by default', () => {
    render(<LoginPage />);

    expect(screen.getByText('Welcome to Family Panel')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('switches to kid login mode', async () => {
    render(<LoginPage />);

    const kidButton = screen.getByRole('button', { name: /kid login/i });
    await userEvent.click(kidButton);

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pin code/i)).toBeInTheDocument();
  });

  it('validates parent login form', async () => {
    mockSignIn.mockResolvedValue({ error: null });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'parent@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('parent@example.com', 'password123');
    });
  });

  it('validates kid PIN login form', async () => {
    mockSignInWithPin.mockResolvedValue({ error: null });

    render(<LoginPage />);

    // Switch to kid mode
    const kidButton = screen.getByRole('button', { name: /kid login/i });
    await userEvent.click(kidButton);

    const userIdInput = screen.getByLabelText(/your name/i);
    const pinInput = screen.getByLabelText(/pin code/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(userIdInput, '00000000-0000-0000-0000-000000000002');
    await userEvent.type(pinInput, '1234');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignInWithPin).toHaveBeenCalledWith(
        '00000000-0000-0000-0000-000000000002',
        '1234'
      );
    });
  });

  it('displays error message on failed login', async () => {
    mockSignIn.mockResolvedValue({ error: new Error('Invalid credentials') });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'wrong@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('restricts PIN input to 4 digits', async () => {
    render(<LoginPage />);

    // Switch to kid mode
    const kidButton = screen.getByRole('button', { name: /kid login/i });
    await userEvent.click(kidButton);

    const pinInput = screen.getByLabelText(/pin code/i) as HTMLInputElement;

    await userEvent.type(pinInput, '123456');

    // Should only accept first 4 digits
    expect(pinInput.value).toBe('1234');
  });
});
