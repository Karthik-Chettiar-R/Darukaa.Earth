import { useState } from 'react'
import axios from 'axios'


export default function Register({ onNavigate }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await axios.post('http://localhost:8000/api/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      })
      onNavigate('/login')
    } catch (requestError) {
      const detail = requestError.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg).join(' ')
        : detail
      setError(message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--cream-200)] px-5 py-10 text-[var(--ink)] sm:px-8">
      <section className="grid w-full max-w-[960px] overflow-hidden rounded-[16px] border border-[var(--line-soft)] bg-[var(--white)] shadow-[0_16px_40px_rgba(19,42,30,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex min-h-[220px] flex-col justify-between bg-[var(--forest-900)] p-7 sm:p-10 lg:min-h-[600px]">
          <div className="flex items-center gap-2.5 font-display text-[19px] font-semibold text-[var(--cream-100)]">
            <span className="flex h-[28px] w-[28px] items-center justify-center rounded-[7px] bg-[var(--leaf-400)] text-sm text-[var(--forest-900)]">D</span>
            darukaa.earth
          </div>
          <div className="mt-12 max-w-[300px]">
            <p className="text-sm leading-6 text-[var(--moss-300)]">A clearer view of your field work.</p>
            <h1 className="mt-3 font-display text-[32px] font-medium leading-tight text-[var(--cream-100)]">Bring your conservation projects together.</h1>
          </div>
          <p className="mt-12 text-xs text-[var(--moss-300)]">Start with your first project and add sites as your work grows.</p>
        </div>

        <div className="p-7 sm:p-10 lg:p-12">
          <div className="mb-8">
            <p className="text-sm text-[var(--ink-soft)]">Get started today</p>
            <h2 className="mt-2 font-display text-[28px] font-medium text-[var(--forest-900)]">Create an account</h2>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block text-[13px] font-medium text-[var(--ink-soft)]" htmlFor="register-name">
              Full name
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                minLength={1}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--cream-100)] px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--moss-500)] focus:ring-2 focus:ring-[var(--leaf-400)]"
                placeholder="Your name"
              />
            </label>

            <label className="block text-[13px] font-medium text-[var(--ink-soft)]" htmlFor="register-email">
              Email address
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--cream-100)] px-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-soft)] focus:border-[var(--moss-500)] focus:ring-2 focus:ring-[var(--leaf-400)]"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-[13px] font-medium text-[var(--ink-soft)]" htmlFor="register-password">
              Password
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--cream-100)] px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--moss-500)] focus:ring-2 focus:ring-[var(--leaf-400)]"
                placeholder="Create a password"
              />
            </label>

            {error && <p className="text-sm text-[var(--forest-700)]" role="alert">{error}</p>}

            <button type="submit" disabled={isSubmitting} className="w-full rounded-[8px] bg-[var(--forest-800)] px-4 py-3 text-sm font-medium text-[var(--cream-100)] transition hover:bg-[var(--forest-700)] disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[var(--ink-soft)]">
            Already have an account?{' '}
            <button type="button" onClick={() => onNavigate('/login')} className="font-medium text-[var(--forest-700)] underline decoration-[var(--leaf-400)] underline-offset-4 hover:text-[var(--moss-500)]">
              Log in
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}