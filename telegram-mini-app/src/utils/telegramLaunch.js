// Capture launch parameters before Vue Router can replace the initial URL.
const initialHash = window.location.hash.slice(1)
// Telegram normally appends launch parameters directly after #. Some clients
// retain an existing hash route and append them after its ? instead.
const hashParams = new URLSearchParams(initialHash.includes('?') ? initialHash.slice(initialHash.indexOf('?') + 1) : initialHash)
const queryParams = new URLSearchParams(window.location.search)

export const initialTelegramLaunchData = hashParams.get('tgWebAppData') || queryParams.get('tgWebAppData') || ''

export const initialTelegramLaunchSource = hashParams.has('tgWebAppData')
  ? 'hash'
  : queryParams.has('tgWebAppData') ? 'query' : 'absent'
