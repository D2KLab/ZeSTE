import { ThemeProvider } from 'styled-components';
import Head from 'next/head';

import GlobalStyle from '../globalStyle';

const theme = {
  colors: {
    primary: '#82b623',
  },
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ZeSTE 🍋 Zero-Shot Topic Extraction</title>
      </Head>
      <GlobalStyle />
      <ThemeProvider theme={theme}>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  )
}