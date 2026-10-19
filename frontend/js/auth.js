/**
 * PlantCare AI — Auth module
 * Handles login and registration forms.
 */

function initAuth() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormErrors(loginForm);

      const username = loginForm.querySelector('#login-username').value.trim();
      const password = loginForm.querySelector('#login-password').value;

      if (!username || !password) {
        showToast('Please fill in all fields.', 'error');
        return;
      }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      try {
        const data = await api.login({ username, password });
        currentUser = data.user;
        updateNavAuth();
        showToast('Login successful!', 'success');
        window.location.href = 'detect.html';
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormErrors(registerForm);

      const fullName = registerForm.querySelector('#reg-fullname').value.trim();
      const username = registerForm.querySelector('#reg-username').value.trim();
      const email = registerForm.querySelector('#reg-email').value.trim();
      const password = registerForm.querySelector('#reg-password').value;
      const confirmPassword = registerForm.querySelector('#reg-confirm-password').value;

      // Validate
      let hasError = false;

      if (username.length < 3) {
        showFieldError('reg-username', 'Username must be at least 3 characters.');
        hasError = true;
      }

      if (!email.includes('@')) {
        showFieldError('reg-email', 'Please enter a valid email address.');
        hasError = true;
      }

      if (password.length < 6) {
        showFieldError('reg-password', 'Password must be at least 6 characters.');
        hasError = true;
      }

      if (password !== confirmPassword) {
        showFieldError('reg-confirm-password', 'Passwords do not match.');
        hasError = true;
      }

      if (hasError) return;

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      try {
        const data = await api.register({ username, email, password, full_name: fullName });
        currentUser = data.user;
        updateNavAuth();
        showToast('Registration successful!', 'success');
        window.location.href = 'detect.html';
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  const existing = field.parentElement.querySelector('.form-error');
  if (existing) existing.remove();

  const error = document.createElement('p');
  error.className = 'form-error';
  error.textContent = message;
  field.parentElement.appendChild(error);
  field.setAttribute('aria-invalid', 'true');
}

function clearFormErrors(form) {
  form.querySelectorAll('.form-error').forEach(el => el.remove());
  form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
}

document.addEventListener('DOMContentLoaded', initAuth);
