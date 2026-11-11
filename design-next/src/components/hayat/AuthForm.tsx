'use client'

import { useState } from 'react'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const register = mode === 'register'

  return (
    <form
      action={register ? '/app-auth/register' : '/app-auth/login'}
      method="post"
      className="auth-form"
      onSubmit={() => setSubmitting(true)}
    >
      {register && (
        <label>
          Full name
          <input name="name" autoComplete="name" required placeholder="Your full name" />
        </label>
      )}
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          inputMode="email"
          placeholder="name@example.com"
        />
      </label>
      {register ? (
        <div className="form-grid">
          <PasswordField
            name="password"
            label="Password"
            visible={showPassword}
            setVisible={setShowPassword}
          />
          <PasswordField
            name="confirmPassword"
            label="Confirm password"
            visible={showConfirm}
            setVisible={setShowConfirm}
          />
        </div>
      ) : (
        <PasswordField
          name="password"
          label="Password"
          visible={showPassword}
          setVisible={setShowPassword}
          current
        />
      )}
      {register && (
        <>
          <label>
            Preferred language
            <select name="language" defaultValue="en">
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input name="disclaimer" type="checkbox" required />
            <span>
              I understand that Hayat AI explains health information and is not medical advice.
            </span>
          </label>
        </>
      )}
      <button className="primary-button auth-submit" type="submit" disabled={submitting}>
        {submitting && <span className="button-spinner" aria-hidden="true" />}
        {submitting
          ? register
            ? 'Creating account…'
            : 'Signing in…'
          : register
            ? 'Create account'
            : 'Log in'}
      </button>
    </form>
  )
}

function PasswordField({
  name,
  label,
  visible,
  setVisible,
  current = false,
}: {
  name: string
  label: string
  visible: boolean
  setVisible: (visible: boolean) => void
  current?: boolean
}) {
  return (
    <label>
      {label}
      <span className="password-field">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          minLength={current ? undefined : 8}
          autoComplete={current ? 'current-password' : 'new-password'}
          required
          placeholder={current ? 'Enter your password' : 'At least 8 characters'}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </span>
    </label>
  )
}
