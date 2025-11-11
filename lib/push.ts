import { api } from '@/lib/axios'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function getVapidPublicKey(): Promise<string> {
  const res = await api.get('/v1/push/vapid-public-key')
  return res.data?.data?.publicKey
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) throw new Error('Service Worker no soportado')
  // Registrar y esperar a que el SW esté listo/controlando la página
  console.log('[Push] Registrando Service Worker...')
  await navigator.serviceWorker.register('/sw.js')
  const readyRegistration = await navigator.serviceWorker.ready
  console.log('[Push] Service Worker listo:', readyRegistration)
  return readyRegistration
}

export async function subscribeUser(device?: string) {
  if (!('Notification' in window)) throw new Error('Notificaciones no soportadas')
  // Solo solicitar permiso si aún no está concedido
  const currentPermission = Notification.permission
  console.log('[Push] Notification.permission:', currentPermission)
  const permission = currentPermission === 'granted' ? 'granted' : await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permiso de notificaciones denegado')

  const registration = await registerServiceWorker()

  console.log('[Push] Obteniendo VAPID public key...')
  const pubKey = await getVapidPublicKey()
  if (!pubKey) throw new Error('Clave VAPID no configurada en el backend')
  const pubKeySanitized = pubKey.trim().replace(/\s+/g, '')
  const applicationServerKey = urlBase64ToUint8Array(pubKeySanitized)
  console.log('[Push] applicationServerKey length:', applicationServerKey.byteLength)

  // Reutilizar suscripción existente si ya existe para evitar errores de estado
  if (!registration.pushManager) throw new Error('PushManager no disponible en este navegador')
  const existing = await registration.pushManager.getSubscription()
  console.log('[Push] Suscripción existente:', !!existing)
  const subscribeOpts: PushSubscriptionOptionsInit = {
    userVisibleOnly: true,
    applicationServerKey,
  }
  const subscription = existing || (await registration.pushManager.subscribe(subscribeOpts))
  console.log('[Push] Suscripción creada/recuperada')

  const json = subscription.toJSON() as any
  if (!json?.keys?.p256dh || !json?.keys?.auth) {
    throw new Error('Suscripción inválida: faltan claves p256dh/auth')
  }
  if (!subscription.endpoint) {
    throw new Error('Suscripción inválida: endpoint faltante')
  }
  const body = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    device: device || 'browser',
  }

  await api.post('/v1/push/subscriptions', body)
  return subscription
}

export async function unsubscribeUser() {
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return
  const sub = await registration.pushManager.getSubscription()
  if (!sub) return
  await sub.unsubscribe()
  await api.delete('/v1/push/subscriptions', { data: { endpoint: sub.endpoint } })
}