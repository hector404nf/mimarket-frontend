/**
 * Tests de Componente - Página de Login
 * Verifica la funcionalidad del formulario de login y su integración con el contexto de auth
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import LoginPage from '../../app/login/page.tsx';
import { useAuth } from '../../contexts/auth-context';
import { toast } from 'sonner';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../contexts/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock del contexto de autenticación
const mockAuthContext = {
  login: jest.fn(),
  isAuthenticated: false,
  user: null,
  logout: jest.fn(),
  loading: false,
};

// Mock del router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

describe('LoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue(mockAuthContext);
    useRouter.mockReturnValue(mockRouter);
  });

  describe('Rendering', () => {
    test('should render login form correctly', () => {
      render(<LoginPage />);

      // Verificar elementos principales - hay 2 elementos con "Iniciar Sesión" (título y botón)
      expect(screen.getAllByText('Iniciar Sesión')).toHaveLength(2);
      expect(screen.getByText('Accede a tu cuenta de MiMarket')).toBeInTheDocument();
      
      // Verificar campos del formulario
      expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
      
      // Verificar enlaces
      expect(screen.getByText(/¿no tienes una cuenta?/i)).toBeInTheDocument();
      expect(screen.getByText(/regístrate aquí/i)).toBeInTheDocument();
      expect(screen.getByText(/¿olvidaste tu contraseña?/i)).toBeInTheDocument();
    });

    test('should show password toggle button', () => {
      render(<LoginPage />);
      
      const passwordInput = screen.getByPlaceholderText('••••••••');
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Buscar el botón de mostrar/ocultar contraseña
      const toggleButton = screen.getByRole('button', { name: /(mostrar|ocultar) contraseña/i });
      expect(toggleButton).toBeInTheDocument();
    });

    test('should redirect if user is already authenticated', () => {
      useAuth.mockReturnValue({
        ...mockAuthContext,
        isAuthenticated: true,
      });

      render(<LoginPage />);

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  describe('Form Interactions', () => {
    test('should update form fields when user types', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByPlaceholderText('••••••••');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    test('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText('••••••••');
      const toggleButton = screen.getByRole('button', { name: /(mostrar|ocultar) contraseña/i });

      // Inicialmente debe ser tipo password
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Hacer click para mostrar
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Hacer click para ocultar
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should handle remember me checkbox', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const rememberCheckbox = screen.getByRole('checkbox', { name: /recordarme/i });
      
      expect(rememberCheckbox).not.toBeChecked();
      
      await user.click(rememberCheckbox);
      expect(rememberCheckbox).toBeChecked();
    });
  });

  describe('Form Submission', () => {
    test('should call login function with correct credentials', async () => {
      const user = userEvent.setup();
      mockAuthContext.login.mockResolvedValue({
        success: true,
        message: 'Login exitoso',
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
       const passwordInput = screen.getByPlaceholderText('••••••••');
       const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(mockAuthContext.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    test('should show success message and redirect on successful login', async () => {
      const user = userEvent.setup();
      mockAuthContext.login.mockResolvedValue({
        success: true,
        message: 'Inicio de sesión exitoso',
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Inicio de sesión exitoso');
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });

    test('should show error message on failed login', async () => {
      const user = userEvent.setup();
      mockAuthContext.login.mockResolvedValue({
        success: false,
        message: 'Credenciales inválidas',
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Credenciales inválidas');
        expect(mockRouter.push).not.toHaveBeenCalled();
      });
    });

    test('should handle network errors', async () => {
      const user = userEvent.setup();
      mockAuthContext.login.mockRejectedValue(new Error('Network error'));

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error de conexión. Intenta nuevamente.');
      });
    });

    test('should disable submit button while submitting', async () => {
      const user = userEvent.setup();
      // Mock que simula una respuesta lenta
      mockAuthContext.login.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
      );

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Verificar que el botón esté habilitado inicialmente
      expect(submitButton).not.toBeDisabled();
      
      await user.click(submitButton);

      // Verificar que el botón se deshabilite durante el envío
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('should require email field', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      // Intentar enviar sin email
      await user.click(submitButton);

      expect(emailInput).toBeInvalid();
      expect(mockAuthContext.login).not.toHaveBeenCalled();
    });

    test('should require password field', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      // No escribir contraseña
      await user.click(submitButton);

      expect(passwordInput).toBeInvalid();
      expect(mockAuthContext.login).not.toHaveBeenCalled();
    });

    test('should validate email format', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(emailInput).toBeInvalid();
      expect(mockAuthContext.login).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('should have proper labels and ARIA attributes', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByPlaceholderText('••••••••');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
    });

    test('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      // Navegar con Tab
      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /(mostrar|ocultar) contraseña/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('checkbox', { name: /recordarme/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('link', { name: /¿olvidaste tu contraseña?/i })).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });
});
