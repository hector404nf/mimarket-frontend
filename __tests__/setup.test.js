/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'

// Test básico para verificar que Jest está configurado correctamente
describe('Jest Setup', () => {
  it('should be able to run tests', () => {
    expect(true).toBe(true)
  })

  it('should have access to DOM testing utilities', () => {
    const div = document.createElement('div')
    div.textContent = 'Test Element'
    document.body.appendChild(div)
    
    expect(document.querySelector('div')).toBeInTheDocument()
    expect(screen.getByText('Test Element')).toBeInTheDocument()
  })

  it('should have access to testing library matchers', () => {
    const element = document.createElement('button')
    element.textContent = 'Click me'
    element.disabled = true
    
    expect(element).toBeDisabled()
    expect(element).toHaveTextContent('Click me')
  })
})