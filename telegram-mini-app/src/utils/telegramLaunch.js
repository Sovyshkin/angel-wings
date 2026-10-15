// Capture launch parameters before Vue Router can replace the initial URL.
const hashParams = new URLSearchParams(window.location.hash.slice(1))
const queryParams = new URLSearchParams(window.location.search)

export const initialTelegramLaunchData = hashParams.get('tgWebAppData') || queryParams.get('tgWebAppData') || ''
