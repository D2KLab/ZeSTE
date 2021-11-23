import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import AsyncSelect from 'react-select/async';
import Graph from 'react-graph-vis';
import { v4 as uuidv4 } from 'uuid';
import { TagFill as TagFillIcon } from '@styled-icons/bootstrap/TagFill';
import { Text as TextIcon } from '@styled-icons/entypo/Text';
import { ArrowLeftShort as ArrowLeftShortIcon } from '@styled-icons/bootstrap/ArrowLeftShort';
import { Hyperledger as HyperledgerIcon } from '@styled-icons/simple-icons/Hyperledger';
import { Close as CloseIcon } from '@styled-icons/evaicons-solid/Close';
import { DiffAdded as DiffAddedIcon } from '@styled-icons/octicons/DiffAdded';
import { DiffRemoved as DiffRemovedIcon } from '@styled-icons/octicons/DiffRemoved';
import { DiffModified as DiffModifiedIcon } from '@styled-icons/octicons/DiffModified';
import { ArrowIosUpward as ArrowIosUpwardIcon } from '@styled-icons/evaicons-solid/ArrowIosUpward';
import { ArrowIosDownward as ArrowIosDownwardIcon } from '@styled-icons/evaicons-solid/ArrowIosDownward';
import Toggle from 'react-toggle';

import Header from '../components/Header';
import Footer from '../components/Footer';
import Term from '../components/Term';
import { PrimaryButton, SecondaryButton } from '../components/Button';
import { Steps, StepDetails, StepIcon, Step, StepNumber, StepLabel, StepBlock } from '../components/Step';
import { shadeColor, getTextColour } from '../helpers/utils';
import SpinningLemon from '../components/SpinningLemon';

const Buttons = styled.div`
display: flex;
align-items: center;
justify-content: flex-end;
border-top: 1px solid #f1f1f1;
padding-top: 2em;
`;

const Form = styled.div`
flex: 0.7;
margin: 0 auto;
width: 50%;
@media only screen and (max-width: 768px) {
  width: 80%;
}
`;

const Main = styled.main`
min-height: calc(100vh - 3em - 17em);
`;

const Textarea = styled.textarea`
width: 100%;
height: 200px;
resize: none;
background-color: rgb(240, 240, 240);
border-style: solid;
border-color: #ddd;
border-width: 1px;
border-radius: 12px;
outline: 0px;
box-sizing: border-box;
font: inherit;
min-height: 38px;
padding: 8px;
`;

const Results = styled.div`
box-shadow: 0 0 10px 0px rgb(0 0 0 / 20%);
position: fixed;
bottom: 0;
background: white;
width: 100%;
bottom: ${props => props.visible ? 0 : '-100%'};
height: calc(100% - 8em);
transition: bottom 0.5s ease-in-out;

pre {
  overflow: auto;
  max-width: 250px;
}
`;

const CloseButton = styled.div`
margin: 1em;
font-weight: bold;
cursor: pointer;
display: flex;
align-items: center;
position: absolute;
top: 0;
right: 0;
color: #888;
transition: color 0.2s ease-in-out;
&:hover {
  color: #000;
}
`;

const Confidence = styled.span`
margin-left: 1em;
`;

const Label = styled.span`
color: #658b1c;
font-weight: bold;
text-transform: capitalize;
margin-right: 1em;
width: 120px;
overflow: hidden;
text-overflow: ellipsis;
display: inline-block;
vertical-align: middle;
`;

const MainLabel = styled(Label)`
font-size: 2rem;
text-transform: uppercase;
width: auto;
overflow: visible;
margin-right: 0;
margin-bottom: 1em;

& ${Confidence} {
  margin-left: 0.5em;
  text-transform: none;
  font-size: 1.5rem;
  position: relative;
  top: 1em;
  color: #000;
  font-weight: normal;
}
`;

const HighlightTerm = styled.span`
padding: 0.5em;
line-height: 2.5em;
`;

const ChangesList = styled.ul`
list-style: none;
margin: 0;
padding: 0 0 0 0.5em;
svg {
  display: inline-block;
  vertical-align: middle;
}
`;

const generateExplanations = (paths) => {
  const lis = [];
  paths.forEach((path, i) => {
    const relation = path[1] === 'label' ? 'is the label' : path[1];
    lis.push(<>[<Term>{path[0]}</Term>] {i === 0 ? 'which' : ''} {relation}{path[2] && <> [<Term>{path[2]}</Term>]</>}.<br /></>);
  });
  return lis;
}

const graphOptions = {
  autoResize: true,
  height: '100%',
  width: '100%',
  layout: {
    hierarchical: false
  },
  edges: {
    color: '#000000'
  }
};


function LabelsPage({ reactAppServerUrl }) {
  const [ isLoading, setIsLoading ] = useState(false);
  const [ predictions, setPredictions ] = useState([]);
  const [ inputText, setInputText ] = useState('Prompt default value...');
  const [ userLabel, setUserLabel ] = useState(null);
  const [ error, setError ] = useState(null);
  const [ visibleExplanations, setVisibleExplanations ] = useState({});
  const [ showMoreExplanations, setShowMoreExplanations ] = useState({});
  const [ isResultsVisible, setResultsVisible ] = useState(false);
  const [ language, setLanguage ] = useState('en');
  const [ currentStep, setCurrentStep ] = useState(1);
  const graphRef = useRef(null);
  const networkInstance = useRef(null);

  const [graphState, setGraphState] = useState({
    width: '100%',
    height: '100%',
    counter: 5,
    graph: { nodes: [], edges: [] },
    events: {
      select: ({ nodes, edges }) => {
        console.log('Selected nodes:');
        console.log(nodes);
        console.log('Selected edges:');
        console.log(edges);
      },
      doubleClick: ({ pointer: { canvas } }) => {
      }
    }
  });
  useEffect(() => {
    setTimeout(() => {
      if (networkInstance.current) {
        networkInstance.current.view.fit();
      }
    }, 1);
  }, [graphState]);
  const { graph, events } = graphState;

  const onLoadOptions = async (value) => {
    // const data = await (await fetch(`${reactAppServerUrl}/autocomplete?q=${encodeURIComponent(value)}&hl=${language}`)).json();
    const data = [["compute"],["compulse"],["compunct"],["compuper"],["computed"],["computer"],["computes"]];
    const suggestions = data.map(item => ({ value: item[0], label: item[0] }));
    return suggestions;
  };

  const predict = async () => {
    setPredictions([]);
    setError(null);
    setVisibleExplanations({});
    setShowMoreExplanations({});
    // setResultsVisible(true);
    setCurrentStep(3);

    const params = {
      label: userLabel,
      language,
    };

    if (params.label === null || params.label.length === 0) {
      return;
    }

    let data;
    try {
      setIsLoading(true);

      // data = await (await fetch(`${reactAppServerUrl}/predict`, {
      //   method: 'POST',
      //   headers: {
      //     'Accept': 'application/json',
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(params)
      // })).json();

      data = {"labels":["baseball","car","cryptography","electronics","graphic","gun","hardware","hockey","medicine","middle_east","motorcycle","politics","religion","sale","space","windows"],"results":[{"highlights":[["nasa","0.4918359"],["spacecraft","0.5440217"],["set","0.07339813"],["new","0.071121044"],["milestone","-0.017215598"]],"label":"space","score":0.42000714595430716,"terms":[{"paths":[["spacecraft","is related to","space"]],"score":0.544021725654602},{"paths":[["nasa","is related to","space"]],"score":0.49183589220046997},{"paths":[["set","is related to","space"]],"score":0.07339812815189362},{"paths":[["new","is related to","move"],["move","is related to","space"]],"score":0.07112104445695877}]},{"highlights":[["nasa","0.13073643"],["spacecraft","0.16399273"],["set","0.041428156"],["new","-1"],["milestone","-0.045128644"]],"label":"electronics","score":0.11961305524369495,"terms":[]},{"highlights":[["nasa","-0.026614632"],["spacecraft","0.15695503"],["set","-0.016441781"],["new","0.076046966"],["milestone","0.019730017"]],"label":"car","score":0.08992827853817448,"terms":[{"paths":[["new","has the property","car"]],"score":0.07604696601629257}]},{"highlights":[["nasa","-0.0020549183"],["spacecraft","-1"],["set","0.112512626"],["new","0.06709681"],["milestone","0.05596502"]],"label":"sale","score":0.08382319519721738,"terms":[{"paths":[["set","is synonym of","time"],["time","is related to","sale"]],"score":0.11251262575387955},{"paths":[["new","is related to","sale"]],"score":0.06709680706262589}]},{"highlights":[["nasa","-1"],["spacecraft","-1"],["set","0.06930514"],["new","0.04144506"],["milestone","-1"]],"label":"hardware","score":0.03940764940876475,"terms":[]},{"highlights":[["nasa","-1"],["spacecraft","-1"],["set","0.047154464"],["new","0.052200887"],["milestone","-1"]],"label":"graphic","score":0.03535308201708252,"terms":[]},{"highlights":[["nasa","-0.04260529"],["spacecraft","-1"],["set","0.05068613"],["new","0.03687403"],["milestone","-0.0715201"]],"label":"gun","score":0.03115606173521889,"terms":[]},{"highlights":[["nasa","0.015053586"],["spacecraft","-1"],["set","0.03644415"],["new","0.034149908"],["milestone","-1"]],"label":"baseball","score":0.030475541888956043,"terms":[{"paths":[["set","has as manner","change"],["change","is in the context of","baseball"]],"score":0.036444149911403656},{"paths":[["new","is related to","change"],["change","is in the context of","baseball"]],"score":0.034149907529354095}]},{"highlights":[["nasa","0.016414484"],["spacecraft","-0.021392876"],["set","-0.034199294"],["new","0.05929903"],["milestone","0.0048859934"]],"label":"medicine","score":0.028679290470145648,"terms":[]},{"highlights":[["nasa","-1"],["spacecraft","-1"],["set","-1"],["new","0.07814594"],["milestone","-1"]],"label":"windows","score":0.027806252204354568,"terms":[{"paths":[["new","has the property","car"],["car","is part of","windows"]],"score":0.07814594358205795}]},{"highlights":[["nasa","0.0043062777"],["spacecraft","0.010131659"],["set","-0.028350761"],["new","0.059914652"],["milestone","-1"]],"label":"religion","score":0.02645648316705679,"terms":[]},{"highlights":[["nasa","0.011057248"],["spacecraft","-1"],["set","-0.022810739"],["new","0.041567385"],["milestone","-1"]],"label":"politics","score":0.018725141257268867,"terms":[]},{"highlights":[["nasa","-1"],["spacecraft","-1"],["set","0.050766733"],["new","-1"],["milestone","-1"]],"label":"cryptography","score":0.018064054306530054,"terms":[]},{"highlights":[["nasa","-1"],["spacecraft","-1"],["set","0.029228812"],["new","0.018028291"],["milestone","-1"]],"label":"hockey","score":0.01681524164854298,"terms":[]},{"highlights":[["nasa","-1"],["spacecraft","-1"],["set","0.03847268"],["new","-1"],["milestone","-1"]],"label":"motorcycle","score":0.013689526962684894,"terms":[{"paths":[["set","is etymologically related to","s"],["s","is a(n)","motorcycle"]],"score":0.038472678512334824}]},{"highlights":[["nasa","-1"],["spacecraft","-1"],["set","-1"],["new","-1"],["milestone","-1"]],"label":"middle_east","score":0.0,"terms":[]}],"text":"A NASA spacecraft set a new milestone "}

      if (typeof data.error !== 'undefined') {
        setError(data.error);
      } else {
        setInputText(data.text);
        setPredictions(data.results);

        if (data.results[0] && data.results[0].label) {
          toggleExplanation(data.results[0].label);

          const highlights = {};
          if (Array.isArray(data.results[0].highlights)) {
            data.results[0].highlights.forEach(highlight => {
              highlights[highlight[0]] = highlight[1];
            });
          }

          setGraphState(({ graph: { nodes, edges }, counter, ...rest }) => {
            const idsCache = [];
            const id = counter + 1;
            return {
              graph: {
                nodes: data.results[0].terms.slice(0, 10).reduce((acc, cur) => {
                    cur.paths.forEach(path => {
                      if (typeof path[2] !== 'undefined') {
                        const backgroundColor = shadeColor('#4bff00', -highlights[path[0]] * 100);
                        const textColor = getTextColour(backgroundColor);
                        if (!idsCache.includes(path[0])) {
                          acc.push({ id: path[0], label: path[0], color: backgroundColor, font: { color: textColor }, shape: 'box' });
                          idsCache.push(path[0]);
                        }
                        if (!idsCache.includes(path[2])) {
                          acc.push({ id: path[2], label: path[2], color: backgroundColor, font: { color: textColor }, shape: 'box'  });
                          idsCache.push(path[2]);
                        }
                      }
                    });
                    return acc;
                  }, []),
                edges: data.results[0].terms.reduce((acc, cur) => {
                    cur.paths.forEach(path => {
                      if (typeof path[1] !== 'undefined' && typeof path[2] !== 'undefined') {
                        acc.push({ from: path[0], to: path[2] })
                      }
                    });
                    return acc;
                  }, []),
                counter: id,
                ...rest
              }
            };
          });
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMoreExplanations = (label) => {
    setShowMoreExplanations({
      ...showMoreExplanations,
      [label]: !showMoreExplanations[label]
    });
  };

  const toggleExplanation = (label) => {
    setVisibleExplanations({
      ...visibleExplanations,
      [label]: !visibleExplanations[label]
    })
  };

  const handleSelectLabel = (label) => {
    setUserLabel(label.value);
    setCurrentStep(2);
  }

  const setNetworkInstance = (nw) => {
    networkInstance.current = nw;
  };

  const handleToggleView = (ev) => {
    console.log(ev);
  };

  return (
    <>
      <Header />
      <Main>
        <Steps>
          <Step onClick={() => setCurrentStep(1)} active={currentStep === 1}>
            <StepIcon as={TagFillIcon} />
            <StepDetails>
              <StepNumber>Step 1/3</StepNumber>
              <StepLabel>Topic selection</StepLabel>
            </StepDetails>
          </Step>

          <Step onClick={() => setCurrentStep(2)} active={currentStep === 2}>
            <StepIcon as={TextIcon} />
            <StepDetails>
              <StepNumber>Step 2/3</StepNumber>
              <StepLabel>Prompt input</StepLabel>
            </StepDetails>
          </Step>

          <Step onClick={() => setCurrentStep(3)} active={currentStep === 3}>
            <StepIcon as={HyperledgerIcon} />
            <StepDetails>
              <StepNumber>Step 3/3</StepNumber>
              <StepLabel>Results comparison</StepLabel>
            </StepDetails>
          </Step>
        </Steps>
        <Form>
          <StepBlock step={1} style={{display: currentStep === 1 ? 'block' : 'none'}}>

            <div>
              <h2>Select a topic from ConceptNet</h2>

              <div style={{ marginBottom: '2em' }}>
                <div style={{ display: 'flex' }}>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={onLoadOptions}
                    onChange={handleSelectLabel}
                    menuPlacement="bottom"
                    placeholder="Start typing a topic"
                    styles={{
                      container: base => ({
                        ...base,
                        width: 400,
                      }),
                      control: base => ({
                        ...base,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#ddd',
                        backgroundColor: '#f0f0f4',
                      })
                    }}
                    theme={theme => ({
                      ...theme,
                      borderRadius: 12,
                      colors: {
                        ...theme.colors,
                        primary: 'black',
                      },
                    })}
                  />
                </div>
              </div>
            </div>

            <Buttons>
              <PrimaryButton onClick={() => setCurrentStep(2)} disabled={userLabel === null}>Continue</PrimaryButton>
            </Buttons>
          </StepBlock>

          <StepBlock step={2} style={{display: currentStep === 2 ? 'block' : 'none'}}>
            <div>
              <h2>Enter a prompt{userLabel ? ` for "${userLabel}"` : ''}</h2>
              <p><em>Note: only English is currently supported.</em></p>

              <div style={{ marginBottom: '2em' }}>
                <Textarea value={inputText} onChange={(ev) => setInputText(ev.target.value)} />
              </div>
            </div>

            <Buttons>
              <SecondaryButton onClick={() => setCurrentStep(1)} disabled={isLoading}><ArrowLeftShortIcon height="2em" /> Back</SecondaryButton>
              <PrimaryButton onClick={predict} disabled={isLoading || inputText.length === 0}>Compute the results</PrimaryButton>
            </Buttons>
          </StepBlock>

          <StepBlock step={3} style={{display: currentStep === 3 ? 'block' : 'none'}}>
            <div>
              <h2>Results</h2>
            </div>

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', height: '100%', margin: '1em' }}>
                <div><SpinningLemon /></div>
                <p><em>Squeezing some lemons...</em></p>
              </div>
            )}

            <div style={{ display: 'flex', height: '500px', marginBottom: '1em', border: '1px solid #f1f1f1' }}>
              <Graph key={uuidv4()} graph={graph} options={graphOptions} events={events} ref={graphRef} getNetwork={network => setNetworkInstance(network)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ marginRight: '0.5em' }}>View enhanced graph</span><Toggle defaultChecked={true} onChange={handleToggleView} />
            </div>

            <div style={{ marginBottom: '1.5em' }}>
              <h2>Differences</h2>
              <ChangesList>
                <li><DiffAddedIcon width="1em" style={{ color: '#347d39' }} /> Added label "nasa"</li>
                <li><DiffRemovedIcon width="1em" style={{ color: '#c93c37' }}  /> Removed label "science"</li>
                <li><DiffModifiedIcon width="1em" style={{ color: '#636e7b' }}  /> Modified label "rocket" <ArrowIosUpwardIcon width="1em" /></li>
                <li><DiffModifiedIcon width="1em" style={{ color: '#636e7b' }}  /> Modified label "gravity" <ArrowIosDownwardIcon width="1em" /></li>
              </ChangesList>
            </div>

            <Buttons>
              <SecondaryButton onClick={() => setCurrentStep(2)} disabled={isLoading} style={{ marginRight: 'auto'}}><ArrowLeftShortIcon height="2em" /> Back to prompt</SecondaryButton>
            </Buttons>
          </StepBlock>
        </Form>

        <Results visible={isResultsVisible}>
          <CloseButton onClick={() => setResultsVisible(false)}><CloseIcon width="2em" /> Close</CloseButton>
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', height: '100%', margin: '1em' }}>
              <div><SpinningLemon /></div>
              <p><em>Squeezing some lemons...</em></p>
            </div>
          )}
          {error !== null && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', height: '100%', margin: '1em' }}>
              <h2>Uh-oh</h2>
              <p>Something wrong happened 😕</p>
              <pre>{error}</pre>
              <SecondaryButton onClick={predict}>Retry</SecondaryButton>
            </div>
          )}
          {Array.isArray(predictions) && predictions.length > 0 && (
            <>
              <h2>The predicted labels are:</h2>

              <div style={{ marginBottom: '1em' }}>
                <MainLabel>
                  <Term>{predictions[0].label}</Term>
                  <Confidence>Confidence: {(predictions[0].score * 100).toFixed(2)}%</Confidence>
                </MainLabel>
              </div>

              <div style={{ display: 'flex', height: '300px', marginBottom: '1em' }}>
                {/* <Graph key={uuidv4()} graph={graph} options={graphOptions} events={events} ref={graphRef} /> */}
              </div>

              <div style={{ marginBottom: '1em' }}>
                {Array.isArray(predictions[0].highlights) && predictions[0].highlights.map(highlight => {
                  const backgroundColor = shadeColor('#4bff00', -highlight[1] * 100);
                  const textColor = getTextColour(backgroundColor);
                  return <><HighlightTerm style={{ backgroundColor, color: textColor }}>{highlight[0]}</HighlightTerm>{' '}</>;
                })}
              </div>

              <div style={{ marginBottom: '1em' }}>
                <h2 style={{ display: 'inline' }}>Explanation:</h2>
                {' '}
                {visibleExplanations[predictions[0].label] && (
                  <small><a href={`#${predictions[0].label}`} onClick={() => toggleExplanation(predictions[0].label)}>(hide)</a></small>
                )}
              </div>
              {visibleExplanations[predictions[0].label] ? (
                <div>
                  <div>The document contains the terms:</div>
                  <div>
                      {predictions[0].terms.slice(0, showMoreExplanations[predictions[0].label] ? undefined : 10).map(term => {
                        const explanations = generateExplanations(term.paths);
                        return <ul><li>{explanations}</li></ul>;
                      })}
                  </div>
                  {predictions[0].terms.length > 10 && (
                    <div style={{ marginLeft: '2.5em' }}>
                      <PrimaryButton onClick={() => { toggleMoreExplanations(predictions[0].label); }}>show {showMoreExplanations[predictions[0].label] ? 'less' : 'more'}</PrimaryButton>
                    </div>
                  )}
                </div>
              ) : (
                <a href={`#${predictions[0].label}`} onClick={() => toggleExplanation(predictions[0].label)}>(show explanations for the main topic)</a>
              )}

              {predictions.length > 1 && (
                <div>
                  <div>
                    <h2>The other possible topics with their explanation for this document are:</h2>
                  </div>
                  <div>
                    {predictions.slice(1).map(prediction => {
                      return (
                        <div id={prediction.label} style={{ marginBottom: '1em' }}>
                          <div>
                            <Label title={prediction.label}><Term>{prediction.label}</Term></Label> Confidence: {(prediction.score * 100).toFixed(2)}%
                            {' '}
                            <a href={`#${prediction.label}`} onClick={() => toggleExplanation(prediction.label)}>({visibleExplanations[prediction.label] ? 'hide explanation' : 'see explanation'})</a>
                          </div>

                          {visibleExplanations[prediction.label] && (
                            <>
                              <div>
                                {prediction.terms.slice(0, showMoreExplanations[prediction.label] ? undefined : 10).map(term => {
                                  const explanations = generateExplanations(term.paths);
                                  return <ul><li>{explanations}</li></ul>;
                                })}
                              </div>
                              {prediction.terms.length > 10 && (
                                <div style={{ marginLeft: '2.5em' }}>
                                  <PrimaryButton onClick={() => { toggleMoreExplanations(prediction.label); }}>show {showMoreExplanations[prediction.label] ? 'less' : 'more'}</PrimaryButton>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </Results>
      </Main>
      <Footer />
    </>
  );
}

export async function getServerSideProps(context) {
  return {
    props: {
      reactAppServerUrl: process.env.REACT_APP_SERVER_URL,
    },
  }
}

export default LabelsPage;
