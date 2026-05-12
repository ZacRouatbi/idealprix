import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import Navbar from '../modules/layout/components/Navbar'
import { AuthProvider } from '../lib/context/AuthContext'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch as any

// Mock createPortal
vi.mock('react-dom', () => ({
  createPortal: (node: any) => node,
}))

// Mock AuthModal
vi.mock('../modules/layout/components/AuthModal', () => ({
  default: ({ isOpen, onAuthSuccess }: any) =>
    isOpen ? (
      <div data-testid="auth-modal">
        <button onClick={onAuthSuccess} data-testid="auth-success">
          Mock Auth
        </button>
      </div>
    ) : null,
}))

// Mock CartContext
vi.mock('@lib/context/CartContext', () => ({
  useCart: () => ({
    cart: null,
    totalItems: 0,
  }),
}))

const mockPublishableKey = 'test-publishable-key'
vi.stubEnv('VITE_MEDUSA_PUBLISHABLE_KEY', mockPublishableKey)

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render the logo', () => {
      renderWithRouter(<Navbar />)
      expect(screen.getByAltText('IdealPrix')).toBeInTheDocument()
    })

    it('should render the account icon', () => {
      renderWithRouter(<Navbar />)
      expect(screen.getByLabelText('Account')).toBeInTheDocument()
    })

    it('should render the cart icon', () => {
      renderWithRouter(<Navbar />)
      expect(screen.getByTestId('nav-cart-link')).toBeInTheDocument()
    })

    it('should render navigation menu items', () => {
      renderWithRouter(<Navbar />)
      expect(screen.getByText('Accueil')).toBeInTheDocument()
      expect(screen.getByText('Tous les produits')).toBeInTheDocument()
      expect(screen.getByText('Promotions')).toBeInTheDocument()
    })

    it('should render search input', () => {
      renderWithRouter(<Navbar />)
      expect(screen.getByPlaceholderText('Rechercher...')).toBeInTheDocument()
    })
  })

  describe('Account click behavior', () => {
    it('should show AuthModal when not logged in', async () => {
      renderWithRouter(<Navbar />)

      const accountButton = screen.getByLabelText('Account')
      await fireEvent.click(accountButton)

      expect(screen.getByTestId('auth-modal')).toBeInTheDocument()
    })
  })

  describe('Search functionality', () => {
    it('should navigate to products page with search query', async () => {
      renderWithRouter(<Navbar />)

      const searchInput = screen.getByPlaceholderText('Rechercher...')
      const searchForm = searchInput.closest('form')

      await userEvent.type(searchInput, 'test query')
      await fireEvent.submit(searchForm!)
    })

    it('should not submit empty search', async () => {
      renderWithRouter(<Navbar />)

      const searchForm = screen.getByPlaceholderText('Rechercher...').closest('form')
      await fireEvent.submit(searchForm!)
    })
  })

  describe('Navigation menu', () => {
    it('should have correct navigation links', () => {
      renderWithRouter(<Navbar />)

      const homeLink = screen.getByText('Accueil').closest('a')
      expect(homeLink).toHaveAttribute('href', '/')
    })

    it('should have products link', () => {
      renderWithRouter(<Navbar />)
      const productsLink = screen.getByText('Tous les produits').closest('a')
      expect(productsLink).toHaveAttribute('href', '/products')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on account button', () => {
      renderWithRouter(<Navbar />)
      expect(screen.getByLabelText('Account')).toBeInTheDocument()
    })

    it('should have aria-label on cart link', () => {
      renderWithRouter(<Navbar />)
      expect(screen.getByTestId('nav-cart-link')).toBeInTheDocument()
    })
  })
})