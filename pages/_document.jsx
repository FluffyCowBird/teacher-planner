import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-auth-compat.js"></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
