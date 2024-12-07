import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (window.location.pathname === '/login') {
      router.push('/login')
    }
  }, [])

  return (
    // Your existing home page content
  )
}
