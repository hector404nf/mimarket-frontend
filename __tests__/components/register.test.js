/**
 * Tests de Componente - Página de Registro
 * Verifica la funcionalidad del formulario de registro y su integración con el contexto de autenticación
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import RegisterPage from '../../app/registro/page.tsx';
import { useAuth } from '../../contexts/auth-context';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../contexts/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('RegisterPage Component', () => {
  const mockPush = jest.fn();
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    useRouter.mockReturnValue({
      push: mockPush,
    });

    useAuth.mockReturnValue({
      register: mockRegister,
      isAuthenticated: false,
    });
  });

  describe('Renderizado del formulario', () => {
    test('should render registration form with all fields', () => {
      render(<RegisterPage />);

      // Verificar título y descripción
      expect(screen.getAllByText('Crear Cuenta')).toHaveLength(2); // Título y botón
      expect(screen.getByText('Únete a la comunidad de MiMarket')).toBeInTheDocument();

      // Verificar campos del formulario
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/acepto los términos/i)).toBeInTheDocument();

      // Verificar botón de envío
      expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
    });

    test('should render social login buttons', () => {
      render(<RegisterPage />);

      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /twitter/i })).toBeInTheDocument();
    });

    test('should render login link', () => {
      render(<RegisterPage />);

      const loginLink = screen.getByRole('link', { name: /inicia sesión aquí/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Redirección de usuarios autenticados', () => {
    test('should redirect authenticated users to home', () => {
      useAuth.mockReturnValue({
        register: mockRegister,
        isAuthenticated: true,
      });

      render(<RegisterPage />);

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Visibilidad de contraseñas', () => {
    test('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Contraseña');
      const toggleButton = screen.getAllByRole('button')[0]; // Primer botón de toggle

      // Inicialmente debe ser tipo password
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Hacer clic para mostrar contraseña
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Hacer clic para ocultar contraseña
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should toggle confirm password visibility', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
      const toggleButtons = screen.getAllByRole('button');
      const confirmToggleButton = toggleButtons[1]; // Segundo botón de toggle

      // Inicialmente debe ser tipo password
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Hacer clic para mostrar contraseña
      await user.click(confirmToggleButton);
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');

      // Hacer clic para ocultar contraseña
      await user.click(confirmToggleButton);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Actualización de campos', () => {
    test('should update form fields when user types', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const nameInput = screen.getByLabelText(/nombre/i);
      const apellidoInput = screen.getByLabelText(/apellido/i);
      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const telefonoInput = screen.getByLabelText(/teléfono/i);
      const passwordInput = screen.getByLabelText('Contraseña');
      const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

      await user.type(nameInput, 'Juan');
      await user.type(apellidoInput, 'Pérez');
      await user.type(emailInput, 'juan@example.com');
      await user.type(telefonoInput, '+1234567890');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      expect(nameInput).toHaveValue('Juan');
      expect(apellidoInput).toHaveValue('Pérez');
      expect(emailInput).toHaveValue('juan@example.com');
      expect(telefonoInput).toHaveValue('+1234567890');
      expect(passwordInput).toHaveValue('password123');
      expect(confirmPasswordInput).toHaveValue('password123');
    });

    test('should handle terms checkbox', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const termsCheckbox = screen.getByLabelText(/acepto los términos/i);

      expect(termsCheckbox).not.toBeChecked();

      await user.click(termsCheckbox);
      expect(termsCheckbox).toBeChecked();

      await user.click(termsCheckbox);
      expect(termsCheckbox).not.toBeChecked();
    });
  });

  describe('Validación del formulario', () => {
    test('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      // Llenar formulario con contraseñas diferentes
      await user.type(screen.getByLabelText(/nombre/i), 'Juan');
      await user.type(screen.getByLabelText(/apellido/i), 'Pérez');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'juan@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password456');
      await user.click(screen.getByLabelText(/acepto los términos/i));

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
      await user.click(submitButton);

      expect(toast.error).toHaveBeenCalledWith('Las contraseñas no coinciden');
      expect(mockRegister).not.toHaveBeenCalled();
    });

    test('should show error when terms are not accepted', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      // Llenar formulario sin aceptar términos
      await user.type(screen.getByLabelText(/nombre/i), 'Juan');
      await user.type(screen.getByLabelText(/apellido/i), 'Pérez');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'juan@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
      await user.click(submitButton);

      expect(toast.error).toHaveBeenCalledWith('Debes aceptar los términos y condiciones');
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('Envío del formulario', () => {
    test('should submit form with valid data', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue({
        success: true,
        message: 'Registro exitoso',
      });

      render(<RegisterPage />);

      // Llenar formulario válido
      await user.type(screen.getByLabelText(/nombre/i), 'Juan');
      await user.type(screen.getByLabelText(/apellido/i), 'Pérez');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'juan@example.com');
      await user.type(screen.getByLabelText(/teléfono/i), '+1234567890');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');
      await user.click(screen.getByLabelText(/acepto los términos/i));

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Juan',
          apellido: 'Pérez',
          email: 'juan@example.com',
          password: 'password123',
          password_confirmation: 'password123',
          telefono: '+1234567890',
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Registro exitoso');
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });

    test('should handle registration failure with validation errors', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue({
        success: false,
        errors: {
          email: ['El email ya está en uso'],
          password: ['La contraseña debe tener al menos 8 caracteres'],
        },
      });

      render(<RegisterPage />);

      // Llenar formulario
      await user.type(screen.getByLabelText(/nombre/i), 'Juan');
      await user.type(screen.getByLabelText(/apellido/i), 'Pérez');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'juan@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');
      await user.click(screen.getByLabelText(/acepto los términos/i));

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('El email ya está en uso');
        expect(toast.error).toHaveBeenCalledWith('La contraseña debe tener al menos 8 caracteres');
      });
    });

    test('should handle registration failure with general error', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue({
        success: false,
        message: 'Error del servidor',
      });

      render(<RegisterPage />);

      // Llenar formulario
      await user.type(screen.getByLabelText(/nombre/i), 'Juan');
      await user.type(screen.getByLabelText(/apellido/i), 'Pérez');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'juan@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');
      await user.click(screen.getByLabelText(/acepto los términos/i));

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error del servidor');
      });
    });

    test('should handle network error', async () => {
      const user = userEvent.setup();
      mockRegister.mockRejectedValue(new Error('Network error'));

      render(<RegisterPage />);

      // Llenar formulario
      await user.type(screen.getByLabelText(/nombre/i), 'Juan');
      await user.type(screen.getByLabelText(/apellido/i), 'Pérez');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'juan@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');
      await user.click(screen.getByLabelText(/acepto los términos/i));

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error de conexión. Intenta nuevamente.');
      });
    });
  });

  describe('Estados del botón de envío', () => {
    test('should disable submit button during submission', async () => {
      const user = userEvent.setup();
      let resolveRegister;
      mockRegister.mockReturnValue(
        new Promise((resolve) => {
          resolveRegister = resolve;
        })
      );

      render(<RegisterPage />);

      // Llenar formulario
      await user.type(screen.getByLabelText(/nombre/i), 'Juan');
      await user.type(screen.getByLabelText(/apellido/i), 'Pérez');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'juan@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');
      await user.click(screen.getByLabelText(/acepto los términos/i));

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
      await user.click(submitButton);

      // Verificar que el botón está deshabilitado y muestra texto de carga
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Creando cuenta...')).toBeInTheDocument();

      // Resolver la promesa
      resolveRegister({ success: true });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Campos requeridos', () => {
    test('should have required attributes on mandatory fields', () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/nombre/i)).toBeRequired();
      expect(screen.getByLabelText(/apellido/i)).toBeRequired();
      expect(screen.getByLabelText(/correo electrónico/i)).toBeRequired();
      expect(screen.getByLabelText('Contraseña')).toBeRequired();
      expect(screen.getByLabelText(/confirmar contraseña/i)).toBeRequired();
      
      // Teléfono es opcional
      expect(screen.getByLabelText(/teléfono/i)).not.toBeRequired();
    });
  });

  describe('Accesibilidad', () => {
    test('should have proper labels and ARIA attributes', () => {
      render(<RegisterPage />);

      // Verificar que todos los campos tienen labels asociados
      const nameInput = screen.getByLabelText(/nombre/i);
      const apellidoInput = screen.getByLabelText(/apellido/i);
      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const telefonoInput = screen.getByLabelText(/teléfono/i);
      const passwordInput = screen.getByLabelText('Contraseña');
      const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
      const termsCheckbox = screen.getByLabelText(/acepto los términos/i);

      expect(nameInput).toHaveAccessibleName();
      expect(apellidoInput).toHaveAccessibleName();
      expect(emailInput).toHaveAccessibleName();
      expect(telefonoInput).toHaveAccessibleName();
      expect(passwordInput).toHaveAccessibleName();
      expect(confirmPasswordInput).toHaveAccessibleName();
      expect(termsCheckbox).toHaveAccessibleName();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const nameInput = screen.getByLabelText(/nombre/i);
      
      // Enfocar el primer campo
      nameInput.focus();
      expect(nameInput).toHaveFocus();

      // Navegar con Tab
      await user.tab();
      expect(screen.getByLabelText(/apellido/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/correo electrónico/i)).toHaveFocus();
    });
  });

  describe('Enlaces de términos y privacidad', () => {
    test('should render terms and privacy links', () => {
      render(<RegisterPage />);

      const termsLink = screen.getByRole('link', { name: /términos y condiciones/i });
      const privacyLink = screen.getByRole('link', { name: /política de privacidad/i });

      expect(termsLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute('href', '/terminos');

      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacidad');
    });
  });
});