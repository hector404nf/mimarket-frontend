"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuthPage() {
  const [email, setEmail] = useState('test@test.com')
  const [password, setPassword] = useState('password123')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🔄 Iniciando prueba de login...')
      
      const response = await fetch('http://localhost:8010/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const data = await response.json()
      console.log('✅ Respuesta:', data)
      
      setResult({
        success: true,
        data: data,
        message: 'Login exitoso'
      })

      // Si el login es exitoso, probar el endpoint /me
      if (data.success && data.data?.access_token) {
        console.log('🔄 Probando endpoint /me...')
        
        const meResponse = await fetch('http://localhost:8010/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${data.data.access_token}`
          }
        })

        const meData = await meResponse.json()
        console.log('✅ Respuesta /me:', meData)
        
        setResult(prev => ({
          ...prev,
          meData: meData
        }))
      }
      
    } catch (error) {
      console.error('❌ Error:', error)
      setResult({
        success: false,
        error: error.message,
        message: 'Error en la conexión'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Prueba de Autenticación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@test.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password:</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
              />
            </div>
            
            <Button 
              onClick={testLogin} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Probando...' : 'Probar Login'}
            </Button>
            
            {result && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Resultado:</h3>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}