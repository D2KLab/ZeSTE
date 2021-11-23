import styled from 'styled-components';

const SpinningLemon = styled.div`
  box-shadow: 52px 74px 223px -9px #c2ec59;
  width:100px;
  height:100px;
  background-color:#c2ec59;
  border-radius: 50% 10%;
  transform: rotate(45deg);
  box-shadow: inset -56px -17px 0px -38px rgba(0,0,0,0.16);
  animation: rotating 1s ease infinite;

  @keyframes rotating {
    0% {
      transform: rotate(45deg);
    }

    25% {
      transform: rotate(60deg);
    }

    25% {
      transform: rotate(60deg);
    }

    100% {
      transform: rotate(-315deg);
    }
  }
`;

export default SpinningLemon;