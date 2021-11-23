import styled from 'styled-components';

export const Steps = styled.div`
width: 50%;
min-width: calc(768px - 160px);
@media only screen and (max-width: 768px) {
  min-width: 0;
  width: 80%;
}
border: 1px solid #f1f1f1;
border-radius: 12px;
height: 72px;
display: flex;
align-items: center;
margin: 2em auto;
`;

export const StepDetails = styled.div`
padding-left: 1em;
display: flex;
flex-direction: column;
justify-content: center;
font-family: Arial, Helvetica, sans-serif;
font-weight: bold;
`;

export const StepIcon = styled.svg`
flex: 1 0 auto;
height: 24px;
border-radius: 100%;
padding: 10px;
box-shadow: 0 0 8px -2px rgba(0,0,0,0.25);
`;

export const Step = styled.div`
cursor: ${props => props.clickable ? 'pointer' : 'default'};
padding: 0 1em;
display: flex;

&:not(:first-child) {
  border-left: 1px solid #f1f1f1;
}

${StepDetails} {
  display: ${props => props.active ? 'flex' : 'none'};
}

${StepIcon} {
  background-color: ${props => props.active ? '#82b623' : '#f7fff1'};
  color: ${props => props.active ? '#fff' : '#82b623'};
}
`;

export const StepNumber = styled.div`
color: #82b623;
font-size: 0.7em;
`;

export const StepLabel = styled.div`
font-size: 0.9em;
`;

export const StepBlock = styled.div`
display: none;
opacity: 0;
@keyframes slit {
  0% { transform: translateY(-0.5em); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
animation: slit .5s forwards ease-in-out;
`;