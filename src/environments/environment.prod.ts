// export const environment = {
//   production: true,
//   apiUrl: typeof window !== 'undefined' ? window.location.origin : process.env['API_URL'] || 'http://copperline-api:3000'
// };

// export const environment = {
//   production: true,
//   apiUrl: typeof process !== 'undefined' && process.env['API_URL'] 
//     ? process.env['API_URL'] 
//     : typeof window !== 'undefined' 
//       ? window.location.origin.includes('localhost') 
//         ? 'http://192.168.0.200:3333'
//         : window.location.origin
//       : 'http://192.168.0.200:3333'
// };

export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000'
};