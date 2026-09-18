import { useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'

export default function Login({ onNavigate, onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, { email, password })
      localStorage.setItem('darukaa_access_token', response.data.access_token)
      onAuthenticated()
      onNavigate('/')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--cream-200)] px-5 py-10 text-[var(--ink)] sm:px-8">
      <section className="grid w-full max-w-[960px] overflow-hidden rounded-[16px] border border-[var(--line-soft)] bg-[var(--white)] shadow-[0_16px_40px_rgba(19,42,30,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex min-h-[220px] flex-col justify-between bg-[var(--forest-900)] p-7 sm:p-10 lg:min-h-[560px]">
          <div className="flex items-center gap-2.5 font-display text-[19px] font-semibold text-[var(--cream-100)]">
            <span className="flex h-[28px] w-[28px] items-center justify-center rounded-[7px] bg-[var(--leaf-400)] text-sm text-[var(--forest-900)]">D</span>
            darukaa.earth
          </div>
          <div className="mt-12 max-w-[300px]">
            <p className="text-sm leading-6 text-[var(--moss-300)]">Conservation work, made visible.</p>
            <h1 className="mt-3 font-display text-[32px] font-medium leading-tight text-[var(--cream-100)]">Welcome back to your projects.</h1>
          </div>
          <p className="mt-12 text-xs text-[var(--moss-300)]">Track restoration, sites, and impact in one place.</p>
        </div>

        <div className="p-7 sm:p-10 lg:p-12">
          <div className="mb-8">
            <p className="text-sm text-[var(--ink-soft)]">Sign in to continue</p>
            <h2 className="mt-2 font-display text-[28px] font-medium text-[var(--forest-900)]">Log in</h2>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block text-[13px] font-medium text-[var(--ink-soft)]" htmlFor="login-email">
              Email address
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--cream-100)] px-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-soft)] focus:border-[var(--moss-500)] focus:ring-2 focus:ring-[var(--leaf-400)]"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-[13px] font-medium text-[var(--ink-soft)]" htmlFor="login-password">
              Password
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--cream-100)] px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--moss-500)] focus:ring-2 focus:ring-[var(--leaf-400)]"
                placeholder="Enter your password"
              />
            </label>

            {error && <p className="text-sm text-[var(--forest-700)]" role="alert">{error}</p>}

            <button type="submit" disabled={isSubmitting} className="w-full rounded-[8px] bg-[var(--forest-800)] px-4 py-3 text-sm font-medium text-[var(--cream-100)] transition hover:bg-[var(--forest-700)] disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[var(--ink-soft)]">
            New to darukaa.earth?{' '}
            <button type="button" onClick={() => onNavigate('/register')} className="font-medium text-[var(--forest-700)] underline decoration-[var(--leaf-400)] underline-offset-4 hover:text-[var(--moss-500)]">
              Create an account
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}