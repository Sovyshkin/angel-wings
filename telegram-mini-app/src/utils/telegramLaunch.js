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

// Some Telegram clients currently supply only the user field. It is not an
// authentication credential, but can identify which existing session to
// validate against our server.
export function getUnsignedLaunchUserId() {
  if (!initialTelegramLaunchData || initialTelegramLaunchData.length > 8192) return ''
  const rawUser = new URLSearchParams(initialTelegramLaunchData).get('user')
  if (!rawUser) return ''
  try {
    const user = JSON.parse(rawUser)
    const id = String(user?.id || '')
    return /^[1-9]\d*$/.test(id) ? id : ''
  } catch {
    return ''
  }
}
