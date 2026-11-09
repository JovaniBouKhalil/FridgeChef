export function validateAuth(form, signup) {
  const errors = {}
  if (signup && form.name.trim().length < 2)
    errors.name = 'Please enter at least 2 characters.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = 'Enter a valid email address.'
  if (!form.password) errors.password = 'Enter your password.'
  else if (signup && form.password.length < 8)
    errors.password = 'Use at least 8 characters.'
  if (signup && form.password !== form.confirmPassword)
    errors.confirmPassword = 'Your passwords don’t match.'
  return errors
}

export function validateIngredient(form) {
  const errors = {}
  if (!form.ingredientName.trim())
    errors.ingredientName = 'Enter an ingredient name.'
  if (!form.quantity.trim()) errors.quantity = 'Enter a quantity, e.g. 500 g.'
  return errors
}

export function focusFirstError(formElement, errors) {
  formElement.elements.namedItem(Object.keys(errors)[0])?.focus()
}
