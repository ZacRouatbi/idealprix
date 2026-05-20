import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthModal from '../modules/layout/components/AuthModal'
import { AuthProvider } from '../lib/context/AuthContext'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

vi.mock('react-dom', () => ({
  createPortal: (node: any) => node,
}))

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onAuthSuccess: vi.fn(),
}

const renderWithAuth = (ui: React.ReactElement) => {
  return render(<AuthProvider>{ui}</AuthProvider>)
}

describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should not render when closed', () => {
      renderWithAuth(<AuthModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Connexion')).not.toBeInTheDocument()
    })

    it('should render login tab by default', () => {
      renderWithAuth(<AuthModal {...defaultProps} />)
      expect(screen.getByText('Connexion')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
    })

    it('should render register tab when switched', async () => {
      renderWithAuth(<AuthModal {...defaultProps} />)
      const registerButton = screen.getByText("Pas de compte ? S'inscrire")
      await fireEvent.click(registerButton)
      expect(screen.getByText('Créer un compte')).toBeInTheDocument()
      expect(screen.getByLabelText('Nom complet')).toBeInTheDocument()
    })

    it('should render reset password tab when switched', async () => {
      renderWithAuth(<AuthModal {...defaultProps} />)
      const resetButton = screen.getByText('Mot de passe oublié ?')
      await fireEvent.click(resetButton)
      expect(screen.getByText('Réinitialiser le mot de passe')).toBeInTheDocument()
    })
  })

  describe('Login', () => {
    it('should call backend API with correct credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          user: { id: '1', email: 'test@example.com', first_name: 'Test', last_name: 'User', role: 'customer' },
          token: 'test-jwt-token' 
        }),
      })

      renderWithAuth(<AuthModal {...defaultProps} />)
      
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })

      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'Password123',
          }),
        })
      })
    })

    it('should call onAuthSuccess and onClose on successful login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          user: { id: '1', email: 'test@example.com', first_name: 'Test', last_name: 'User', role: 'customer' },
          token: 'test-jwt-token' 
        }),
      })

      const onAuthSuccess = vi.fn()
      const onClose = vi.fn()

      renderWithAuth(
        <AuthModal {...defaultProps} onAuthSuccess={onAuthSuccess} onClose={onClose} />
      )

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })

      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await fireEvent.click(submitButton)

      await waitFor(() => {
        expect(onAuthSuccess).toHaveBeenCalled()
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('should display error message on failed login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
      })

      renderWithAuth(<AuthModal {...defaultProps} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })

      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'wrongpassword')
      await fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })

    it('should display generic error when no message provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })

      renderWithAuth(<AuthModal {...defaultProps} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })

      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Échec de la connexion')).toBeInTheDocument()
      })
    })

    it('should display generic error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      renderWithAuth(<AuthModal {...defaultProps} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })

      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion au serveur')).toBeInTheDocument()
      })
    })

    it('should show loading state during login', async () => {
      let resolveFetch: (value: any) => void
      mockFetch.mockImplementationOnce(
        () => new Promise((resolve) => { resolveFetch = resolve })
      )

      renderWithAuth(<AuthModal {...defaultProps} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })

      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await fireEvent.click(submitButton)

      expect(submitButton).toBeDisabled()
      expect(screen.getByText('Connexion...')).toBeInTheDocument()

      resolveFetch!({ ok: true, json: async () => ({ token: 'test' }) })

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('Register', () => {
    it('should call backend register API on successful registration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          user: { id: '1', email: 'john@example.com', first_name: 'John', last_name: 'Doe', role: 'customer' },
          token: 'test-jwt-token' 
        }),
      })

      const onAuthSuccess = vi.fn()

      renderWithAuth(
        <AuthModal {...defaultProps} onAuthSuccess={onAuthSuccess} />
      )

      await fireEvent.click(screen.getByText("Pas de compte ? S'inscrire"))

      const nameInput = screen.getByLabelText('Nom complet')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Créer le compte' })

      await userEvent.type(nameInput, 'John Doe')
      await userEvent.type(emailInput, 'john@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: 'john@example.com',
            password: 'Password123',
            first_name: 'John',
            last_name: 'Doe',
          }),
        })
      })
    })

    it('should display error on failed registration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already exists' }),
      })

      renderWithAuth(<AuthModal {...defaultProps} />)

      await fireEvent.click(screen.getByText("Pas de compte ? S'inscrire"))

      await userEvent.type(screen.getByLabelText('Nom complet'), 'John Doe')
      await userEvent.type(screen.getByLabelText('Email'), 'existing@example.com')
      await userEvent.type(screen.getByLabelText('Mot de passe'), 'Password123')
      await fireEvent.click(screen.getByRole('button', { name: 'Créer le compte' }))

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument()
      })
    })

    it('should show loading state during registration', async () => {
      let resolveFetch: (value: any) => void
      mockFetch.mockImplementationOnce(
        () => new Promise((resolve) => { resolveFetch = resolve })
      )

      renderWithAuth(<AuthModal {...defaultProps} />)
      await fireEvent.click(screen.getByText("Pas de compte ? S'inscrire"))

      await userEvent.type(screen.getByLabelText('Nom complet'), 'John Doe')
      await userEvent.type(screen.getByLabelText('Email'), 'john@example.com')
      await userEvent.type(screen.getByLabelText('Mot de passe'), 'Password123')
      await fireEvent.click(screen.getByRole('button', { name: 'Créer le compte' }))

      expect(screen.getByRole('button', { name: 'Création...' })).toBeDisabled()

      resolveFetch!({ ok: true, json: async () => ({ token: 'test' }) })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Créer le compte' })).not.toBeDisabled()
      })
    })
  })

  describe('Form validation', () => {
    it('should require email field', async () => {
      renderWithAuth(<AuthModal {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })
      await fireEvent.click(submitButton)

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should require password field', async () => {
      renderWithAuth(<AuthModal {...defaultProps} />)
      
      const emailInput = screen.getByLabelText('Email')
      await userEvent.type(emailInput, 'test@example.com')
      await fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should require name field in registration', async () => {
      renderWithAuth(<AuthModal {...defaultProps} />)
      await fireEvent.click(screen.getByText("Pas de compte ? S'inscrire"))

      await userEvent.type(screen.getByLabelText('Email'), 'john@example.com')
      await userEvent.type(screen.getByLabelText('Mot de passe'), 'Password123')
      await fireEvent.click(screen.getByRole('button', { name: 'Créer le compte' }))

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Tab switching', () => {
    it('should switch between login and register tabs', async () => {
      renderWithAuth(<AuthModal {...defaultProps} />)

      expect(screen.getByText('Connexion')).toBeInTheDocument()
      await fireEvent.click(screen.getByText("Pas de compte ? S'inscrire"))
      expect(screen.getByText('Créer un compte')).toBeInTheDocument()
      await fireEvent.click(screen.getByText('Déjà un compte ? Se connecter'))
      expect(screen.getByText('Connexion')).toBeInTheDocument()
    })

    it('should switch to reset password tab', async () => {
      renderWithAuth(<AuthModal {...defaultProps} />)

      await fireEvent.click(screen.getByText('Mot de passe oublié ?'))
      expect(screen.getByText('Réinitialiser le mot de passe')).toBeInTheDocument()
      await fireEvent.click(screen.getByText('Retour à la connexion'))
      expect(screen.getByText('Connexion')).toBeInTheDocument()
    })
  })

  describe('Close functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn()
      renderWithAuth(<AuthModal {...defaultProps} onClose={onClose} />)

      const closeButton = screen.getByRole('button', { name: '' }) || document.querySelector('button.absolute')

      await fireEvent.click(closeButton!)
      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when backdrop is clicked', async () => {
      const onClose = vi.fn()
      renderWithAuth(<AuthModal {...defaultProps} onClose={onClose} />)

      const backdrop = document.querySelector('.fixed.inset-0')
      await fireEvent.click(backdrop!)
      expect(onClose).toHaveBeenCalled()
    })
  })
})