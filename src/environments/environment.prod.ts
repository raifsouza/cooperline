// export const environment = {
//   production: true,
//   apiUrl: typeof window !== 'undefined' ? window.location.origin : process.env['API_URL'] || 'http://copperline-api:3000'
// };

export const environment = {
  production: true,
  apiUrl: typeof process !== 'undefined' && process.env['API_URL'] 
    ? process.env['API_URL'] 
    : typeof window !== 'undefined' 
      ? window.location.origin.includes('localhost') 
        ? 'http://copperline-api:3000'
        : window.location.origin
      : 'http://copperline-api:3000'
};