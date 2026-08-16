import { signIn, getSession } from './auth.js'

document.addEventListener('DOMContentLoaded', async () => {
  // If already logged in, redirect to admin
  const session = await getSession()
  if (session) {
    window.location.href = '/admin'
    return
  }

  initLoginForm()
  initPasswordToggle()
})

function initLoginForm() {
  const form = document.getElementById('login-form')
  if (!form) return

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('login-email').value.trim()
    const password = document.getElementById('login-password').value
    const submitBtn = document.getElementById('login-submit')
    const errorEl = document.getElementById('login-error')
    const errorText = document.getElementById('login-error-text')

    // Reset error
    errorEl.classList.add('hidden')

    try {
      submitBtn.disabled = true
      submitBtn.innerHTML = `
        <span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
        Accediendo...
      `

      await signIn(email, password)
      window.location.href = '/admin'
    } catch (err) {
      console.error('Login error:', err)
      errorText.textContent = getErrorMessage(err)
      errorEl.classList.remove('hidden')
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = 'Acceder al Panel'
    }
  })
}

function initPasswordToggle() {
  const toggle = document.getElementById('toggle-password')
  const input = document.getElementById('login-password')
  if (!toggle || !input) return

  toggle.addEventListener('click', () => {
    const isPassword = input.type === 'password'
    input.type = isPassword ? 'text' : 'password'
    toggle.querySelector('span').textContent = isPassword ? 'visibility_off' : 'visibility'
  })
}

function getErrorMessage(err) {
  const message = err?.message?.toLowerCase() || ''
  if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (message.includes('email not confirmed')) {
    return 'Tu correo no ha sido confirmado. Revisa tu bandeja de entrada.'
  }
  if (message.includes('too many requests')) {
    return 'Demasiados intentos. Espera un momento antes de intentar de nuevo.'
  }
  return 'Error al iniciar sesión. Intenta de nuevo.'
}
