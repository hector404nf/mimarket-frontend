/**
 * Tests de Componente - Navbar
 * Verifica la funcionalidad básica del componente de navegación
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import Navbar from '../../components/navbar'
import { useCart } from '../../lib/cart-store'
import { useProfileType, useStoreAccess } from '../../hooks/use-profile-type'
import { useAuth } from '../../contexts/auth-context'

// Mocks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

jest.mock('../../lib/cart-store', () => ({
  useCart: jest.fn(),
}))

jest.mock('../../hooks/use-profile-type', () => ({
  useProfileType: jest.fn(),
  useStoreAccess: jest.fn(),
}))

jest.mock('../../contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../components/search', () => {
  return function MockSearchComponent() {
    return <div data-testid="search-component">Search Component</div>
  }
})

describe('Navbar Component', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup default mock implementations
    usePathname.mockReturnValue('/')
    useCart.mockReturnValue({
      items: [],
      totalItems: 0,
      totalPrice: 0,
    })
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    })
    useProfileType.mockReturnValue('buyer')
    useStoreAccess.mockReturnValue(false)
  })

  test('debe renderizar el componente navbar', () => {
    render(<Navbar />)
    
    expect(screen.getByText('MiMarket')).toBeInTheDocument()
  })

  test('debe renderizar elementos de navegación básicos', () => {
    render(<Navbar />)
    
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Productos')).toBeInTheDocument()
    expect(screen.getByText('Tiendas')).toBeInTheDocument()
  })

  test('debe mostrar elementos de accesibilidad', () => {
    render(<Navbar />)
    
    expect(screen.getByText('Buscar')).toBeInTheDocument()
    expect(screen.getByText('Carrito')).toBeInTheDocument()
    expect(screen.getByText('Perfil')).toBeInTheDocument()
    expect(screen.getByText('Menú')).toBeInTheDocument()
  })

  test('debe mostrar el contador del carrito cuando hay items', () => {
    useCart.mockReturnValue({
      items: [{ id: 1, name: 'Test Product' }],
      totalItems: 2,
      totalPrice: 100,
    })

    render(<Navbar />)
    
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  test('debe mostrar enlace de tienda para propietarios', () => {
    useStoreAccess.mockReturnValue(true)

    render(<Navbar />)
    
    expect(screen.getByText('Mi Tienda')).toBeInTheDocument()
  })
})