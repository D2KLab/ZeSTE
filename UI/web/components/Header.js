import styled from 'styled-components';
import Link from 'next/link';
import { Github as GithubIcon } from '@styled-icons/evaicons-solid/Github';

import Lemon from '@/assets/images/lemon.png'

const Container = styled.header`
display: flex;
align-items: center;
padding: 2em 3em;
margin-bottom: 3em;
/* border-bottom: 1px solid #f1f1f1; */
box-shadow: inset 0 -3px 5px -6px rgba(0, 0, 0, 0.5);
`;

const DesktopTitle = styled.h1`
flex: 1 0 auto;
margin: 0;
display: block;
@media only screen and (max-width: 768px) {
  display: none;
}
`;

const MobileTitle = styled.h1`
flex: 1 0 auto;
margin: 0;
display: none;
@media only screen and (max-width: 768px) {
  display: block;
}
`;

const Menu = styled.div`
margin-left: 2em;
padding-top: 0.6rem;

a {
  margin-right: 1em;
  text-decoration: none;
  font-weight: bold;
  &:hover {
    text-decoration: underline;
  }
  &:not(:last-child) {
    padding-right: 1em;
    border-right: 1px solid #f1f1f1;
  }
}
`;

export default function Header() {
  return (
    <Container>
      <DesktopTitle>
        <span style={{ verticalAlign: 'middle' }}>ZeSTE</span>
        {' '}
        <img src={Lemon.src} alt="Logo" style={{ verticalAlign: 'middle' }} />
        {' '}
        <small style={{ verticalAlign: 'middle' }}>Zero-Shot Topic Extraction</small>
      </DesktopTitle>
      <MobileTitle>
        <span style={{ verticalAlign: 'middle' }}>ZeSTE</span>
        {' '}
        <img src={Lemon.src} alt="Logo" style={{ verticalAlign: 'middle' }} />
      </MobileTitle>
      <Menu>
        <Link href="/predict"><a>Predict</a></Link>
        <Link href="/labels"><a>Labels</a></Link>
        <a href="https://github.com/D2KLab/ZeSTE" target="_blank" rel="noopener noreferrer">
          <GithubIcon height="1rem" /> GitHub
        </a>
      </Menu>
    </Container>
  );
};
