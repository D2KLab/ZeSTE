import styled from 'styled-components';

const Container = styled.button`
flex: 0 1 auto;
font-size: 1rem;
padding: ${props => props.small ? '0.75em' : '1.5em'};
appearance: none;
border: none;
border-radius: 12px;
cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
pointer-events: ${props => props.disabled ? 'none' : 'all'};
transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
text-decoration: none;
pointer-events: auto;
background: none;
display: inline-block;
&:not(:last-child) {
  margin-right: 1em;
}
`;
const Button = ({ children, ...props }) => {
  return (
    <Container {...props}>
      {children}
    </Container>
  );
};

export const PrimaryButton = styled(Button)`
background-color: ${props => props.disabled ? '#f9f9fb' : '#82b623'};
color: ${props => props.disabled ? '#999' : 'rgb(255, 255, 255)'};
&:hover {
  box-shadow: ${props => props.disabled ? 'none' : '0 0 10px 0 rgba(0,0,0,0.25)'};
}
`;

export const SecondaryButton = styled(Button)`
color: #82b623;
&:hover {
  background-color: #f9f9fb;
}
`;