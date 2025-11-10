'use client'

import { useState } from 'react'
import { useUser, useSession } from '@clerk/nextjs'

export default function TokenDebug() {
  const { user } = useUser()
  const { session } = useSession()
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const getTokenInfo = async () => {
    setLoading(true)
    try {
      if (!session) {
        setTokenInfo({ error: 'No session available' })
        return
      }

      // Get the token
      const token = await session.getToken()
      
      // Parse the JWT to see its structure
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          setTokenInfo({
            token: token.substring(0, 50) + '...',
            payload: payload,
            alg: payload.alg,
            fullTokenLength: token.length
          })
        } catch (parseError) {
          setTokenInfo({
            token: token.substring(0, 50) + '...',
            error: 'Could not parse token: ' + parseError,
            fullTokenLength: token.length
          })
        }
      } else {
        setTokenInfo({ error: 'No token received from session' })
      }
    } catch (error) {
      setTokenInfo({ error: 'Error getting token: ' + error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Диагностика токена Clerk</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Информация о пользователе</h2>
        <p><strong>Clerk User ID:</strong> {user?.id || 'Не вошли в систему'}</p>
        <p><strong>Статус:</strong> {user ? 'Вошли' : 'Не вошли'}</p>
        <p><strong>Session:</strong> {session ? 'Активна' : 'Нет'}</p>
      </div>
      
      <div className="mb-6">
        <button
          onClick={getTokenInfo}
          disabled={loading || !session}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Получение токена...' : 'Получить информацию о токене'}
        </button>
      </div>

      {tokenInfo && (
        <div className="mt-6 p-4 rounded border bg-white shadow">
          <h2 className="text-lg font-semibold mb-2">Информация о токене</h2>
          <div className="bg-gray-50 p-3 rounded">
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(tokenInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">Диагностика</h3>
        <p className="text-yellow-700">
          Эта страница помогает диагностировать проблему с токеном Clerk. 
          Ошибка "alg" (Algorithm) Header Parameter value not allowed означает, 
          что Clerk генерирует токен с алгоритмом, который не принимает Supabase.
        </p>
        <p className="text-yellow-700 mt-2">
          Обычно Supabase ожидает токены с алгоритмом HS256, но Clerk может использовать другой алгоритм.
        </p>
      </div>
    </div>
  )
}