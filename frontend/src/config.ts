// src/config.ts

export const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
// export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
// This used to be set to /api, really all the calls in the tsx files should not be `${API_URL}/api/models/${modelId}` and should in fact be `${API_URL}/models/${modelId}`, this current setup is dumb, please fix gabe