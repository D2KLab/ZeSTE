import styled from 'styled-components';
import Image from 'next/image';

import MEMADLogo from '@/assets/images/memad-logo.png';
import EURECOMLogo from '@/assets/images/eurecom-logo.jpg';
import SILKNOWLogo from '@/assets/images/silknow-logo.jpg';
import ASRAELLogo from '@/assets/images/asrael-logo.png';

const Container = styled.footer`
background-color: #fafbfc;
color: black;
padding: 2em;
box-shadow: inset 1px 2px 7px -6px rgba(0, 0, 0, 0.5);
display: flex;
flex-wrap: wrap;
flex-direction: row;
justify-content: space-evenly;
align-items: center;
min-height: 100px;
margin-top: 2em;
@media only screen and (max-width: 600px) {
  flex-direction: column;

  a:not(:last-child) {
    margin-bottom: 1em;
  }
}
`;

export default function Footer() {
  return (
    <Container>
      <a href="https://www.eurecom.fr" target="_blank" rel="noopener noreferrer">
        <Image src={EURECOMLogo.src} title="EURECOM" alt="EURECOM" height="100" />
      </a>
      <a href="https://memad.eu" target="_blank" rel="noopener noreferrer">
        <Image src={MEMADLogo.src} title="MEMAD" alt="MEMAD" height="100" />
      </a>
      <a href="https://silknow.eu" target="_blank" rel="noopener noreferrer">
        <Image src={SILKNOWLogo.src} title="SILKNOW" alt="SILKNOW" width="200" />
      </a>
      <a href="http://asrael.eurecom.fr" target="_blank" rel="noopener noreferrer">
        <Image src={ASRAELLogo.src} title="ASRAEL" alt="ASRAEL" height="100" />
      </a>
    </Container>
  );
};
