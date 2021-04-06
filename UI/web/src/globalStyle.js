import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  html {
    font-size: 16px;
  }

  html, body {
    background-color: #fff;
    color: #000;
  }

  *, *:before, *:after {
    box-sizing: inherit;
    text-rendering: geometricPrecision;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-size: 1rem;
    line-height: 1.5;
    margin: 0;
    padding: 0;
    min-height: 100%;
    position: relative;
    overflow-x: hidden;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  }

  a {
    color: #82b623;
  }

  .react-autosuggest__container {
    position: relative;
  }

  .react-autosuggest__input {
    width: 240px;
    height: 30px;
    padding: 10px 20px;
    font-family: Helvetica, sans-serif;
    font-weight: 300;
    font-size: 16px;
    border: 1px solid #aaa;
    border-radius: 4px;
  }

  .react-autosuggest__input:focus {
    outline: none;
  }

  .react-autosuggest__container--open .react-autosuggest__input {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .react-autosuggest__suggestions-list {
    position: absolute;
    width: 280px;
    margin: 0;
    padding: 0;
    list-style-type: none;
    border: 1px solid #aaa;
    background-color: #fff;
    font-family: Helvetica, sans-serif;
    font-weight: 300;
    font-size: 16px;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    z-index: 2;
  }

  .react-autosuggest__suggestion {
    cursor: pointer;
    padding: 10px 20px;
    list-style: none;
  }

  .react-autosuggest__suggestion--focused {
    background-color: #ddd;
  }
`;

export default GlobalStyle;
