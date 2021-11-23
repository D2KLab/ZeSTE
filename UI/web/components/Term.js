import styled from 'styled-components';

const Container = styled.a`
text-decoration: none;
position: relative;
display: inline-block;
font-weight: bold;
margin: 4px 0;
padding: 0 7px;
transition: all .3s;
color: #5B7F18;
background: #f6ffed;
border: 1px solid #b7eb8f;
border-radius: 12px;

&::after {
  position: absolute;
  top: 100%;
  left: 0px;
  width: 100%;
  height: 1px;
  background: currentcolor;
  content: "";
  opacity: 0;
  transition: height 0.3s ease 0s, opacity 0.3s ease 0s, transform 0.3s ease 0s;
  transform: translateY(-0.3em);
}
&:hover::after {
  height: 2px;
  border-radius: 3px;
  opacity: 1;
  transform: translateY(-0.2em);
}
`;

function Term({ children }) {
  return (
    <Container href={`https://conceptnet.io/c/en/${children}`} target="_blank" rel="noopener noreferrer">{children}</Container>
  )
}

export default Term;