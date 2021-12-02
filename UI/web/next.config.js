module.exports = {
  i18n: {
    locales: ['en'],
    defaultLocale: 'en'
  },
  async rewrites() {
    return [{
      source: '/',
      destination: '/labels',
    }]
  },
}