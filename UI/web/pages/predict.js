import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import Graph from 'react-graph-vis';
import { v4 as uuidv4 } from 'uuid';
import { TagFill as TagFillIcon } from '@styled-icons/bootstrap/TagFill';
import { Text as TextIcon } from '@styled-icons/entypo/Text';
import { ArrowLeftShort as ArrowLeftShortIcon } from '@styled-icons/bootstrap/ArrowLeftShort';
import { Hyperledger as HyperledgerIcon } from '@styled-icons/simple-icons/Hyperledger';
import { useMenuState, Menu, MenuItem, MenuButton } from 'ariakit/menu';
import ReactCountryFlag from 'react-country-flag';
import { Show as ShowIcon } from '@styled-icons/boxicons-regular/Show';
import { Hide as HideIcon } from '@styled-icons/boxicons-regular/Hide';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Term from '@/components/Term';
import { PrimaryButton, SecondaryButton } from '@/components/Button';
import { Steps, StepDetails, StepIcon, Step, StepNumber, StepLabel, StepBlock } from '@/components/Step';
import { shadeColor, getTextColour } from '@/helpers/utils';
import SpinningLemon from '@/components/SpinningLemon';
import datasets from '@/assets/datasets.json';

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
min-width: calc(768px - 160px);
@media only screen and (max-width: 768px) {
  min-width: 0;
  width: 80%;
}
`;

const Main = styled.main`
min-height: calc(100vh - 3em - 17em);
`;

const Input = styled.input`
width: 100%;
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

const StyledSelect = styled.select`
width: 100%;
background-color: rgb(240, 240, 240);
border-style: solid;
border-color: rgb(0, 0, 0);
border-width: 0px 0px 2px;
border-radius: 0px;
outline: 0px;
box-sizing: border-box;
font-size: 1rem;
min-height: 38px;
padding: 0px 8px;
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
padding: 0 7px;
margin: 4px 0;
line-height: 2.5em;
text-decoration: none;
position: relative;
display: inline-block;
font-weight: bold;
border-radius: 12px;
border: 1px solid #b7eb8f;
`;

const StyledMenu = styled(Menu)`
max-height: 300px;
overflow-y: auto;
padding-bottom: 4px;
padding-top: 4px;
position: relative;
-webkit-overflow-scrolling: touch;
box-sizing: border-box;
outline: 0;
background-color: hsl(0, 0%, 100%);
border-radius: 4px;
box-shadow: 0 0 0 1px hsla(0, 0%, 0%, 0.1), 0 4px 11px hsla(0, 0%, 0%, 0.1);
margin-bottom: 8px;
margin-top: 8px;
`;

const StyledMenuItem = styled(MenuItem)`
background-color: transparent;
color: inherit;
cursor: default;
display: block;
font-size: inherit;
padding: 8px 12px;
width: 100%;
user-select: none;
box-sizing: border-box;
border: 0;
border-radius: 0;
outline: 0;

&:hover {
  background-color: #deebff;
  color: inherit;
  cursor: default;
  display: block;
  font-size: inherit;
  padding: 8px 12px;
  width: 100%;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  box-sizing: border-box;
}

&:active {
  background-color: #b2d4ff;
}

&.selected {
  background-color: #82b623;
  color: hsl(0, 0%, 100%);
  cursor: default;
  display: block;
  font-size: inherit;
  padding: 8px 12px;
  width: 100%;
  user-select: none;
  box-sizing: border-box;
}
`;

const FlagButton = styled(MenuButton)`
cursor: pointer;
border-width: 0 0 2px;
border-color: black;
background-color: rgb(240, 240, 240);
outline: 0;
padding: 0 12px;

&:hover {
  background-color: rgb(210, 210, 210);
}
`;

const generateExplanations = (paths) => {
  const lis = [];
  paths.forEach((path, i) => {
    const relation = path[1] === 'label' ? 'is the label' : path[1];
    lis.push(<><Term>{path[0]}</Term> {i === 0 ? 'which' : ''} {relation}{path[2] && <> <Term>{path[2]}</Term></>}.<br /></>);
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


function PredictPage({ reactAppServerUrl }) {
  const [ isLoading, setIsLoading ] = useState(false);
  const [ predictions, setPredictions ] = useState([]);
  const [ inputURL, setInputURL ] = useState('');
  const [ inputText, setInputText ] = useState('A NASA spacecraft set a new milestone Monday in cosmic exploration by entering orbit around an asteroid, Bennu, the smallest object ever to be circled by a human-made spaceship. The spacecraft, called OSIRIS-REx, is the first-ever US mission designed to visit an asteroid and return a sample of its dust back to Earth..');
  const [ userLabels, setUserLabels ] = useState([]);
  const [ error, setError ] = useState(null);
  const [ visibleExplanations, setVisibleExplanations ] = useState({});
  const [ showMoreExplanations, setShowMoreExplanations ] = useState({});
  const [ selectedDataset, setSelectedDataset ] = useState(null);
  const [ datasetError, setDatasetError ] = useState(undefined);
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
    const data = await (await fetch(`${reactAppServerUrl}/autocomplete?q=${encodeURIComponent(value)}&hl=${language}`)).json();
    const suggestions = data.map(item => ({ value: item[0], label: item[0] }));
    return suggestions;
  };

  const predict = async () => {
    setPredictions([]);
    setError(null);
    setVisibleExplanations({});
    setShowMoreExplanations({});
    setDatasetError(undefined);
    setCurrentStep(3);

    const dataset = datasets[language].find(dataset => selectedDataset && dataset.name === selectedDataset.value);
    const datasetLabels = dataset ? dataset.labels : [];
    const params = {
      labels: [...userLabels, ...datasetLabels],
      language,
    };
    if (inputURL.length > 0) {
      params.uri = inputURL;
    } else {
      params.text = inputText;
    }

    if (params.labels.length === 0) {
      setDatasetError('Please select at least one topic.');
      return;
    }

    let data;
    try {
      setIsLoading(true);

      data = await (await fetch(`${reactAppServerUrl}/predict`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })).json();

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
                          acc.push({ id: path[0], label: path[0], color: backgroundColor, font: { color: textColor }, shape: 'box'  });
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

  const onChangeDataset = (item) => {
    setDatasetError(undefined);
    setSelectedDataset(item);
  }

  const handleSelectLabel = (items) => {
    setDatasetError(undefined);
    setUserLabels(items.map(item => item.value));
  }

  const setNetworkInstance = (nw) => {
    networkInstance.current = nw;
  };

  const dataset = datasets[language].find(dataset => selectedDataset && dataset.name === selectedDataset.value);

  const languageMenu = useMenuState();

  return (
    <>
      <Header />
      <Main>
        <Steps>
          <Step onClick={() => currentStep > 1 && setCurrentStep(1)} clickable={currentStep > 1} step={currentStep} active={currentStep === 1}>
            <StepIcon as={TagFillIcon} />
            <StepDetails>
              <StepNumber>Step 1/3</StepNumber>
              <StepLabel>URL/Text input</StepLabel>
            </StepDetails>
          </Step>

          <Step onClick={() => currentStep > 2 && setCurrentStep(2)} clickable={currentStep > 2} step={currentStep} active={currentStep === 2}>
            <StepIcon as={TextIcon} />
            <StepDetails>
              <StepNumber>Step 2/3</StepNumber>
              <StepLabel>Topic selection</StepLabel>
            </StepDetails>
          </Step>

          <Step onClick={() => currentStep > 3 && setCurrentStep(3)} clickable={currentStep > 3} step={currentStep} active={currentStep === 3}>
            <StepIcon as={HyperledgerIcon} />
            <StepDetails>
              <StepNumber>Step 3/3</StepNumber>
              <StepLabel>Results</StepLabel>
            </StepDetails>
          </Step>
        </Steps>
        <Form>
          <StepBlock step={1} style={{display: currentStep === 1 ? 'block' : 'none'}}>
            <div>
              <h2>Enter the URL of a page</h2>

              <div>
                <Input value={inputURL} onChange={(ev) => setInputURL(ev.target.value)} type="url" placeholder="https://example.com" pattern="https://.*" style={{ width: 400 }} />
              </div>

              {inputURL.length === 0 && (
                <>
                  <h2>Or enter the text for which you want to extract topics</h2>
                  <div>
                    <Textarea value={inputText} onChange={(ev) => setInputText(ev.target.value)} />
                  </div>
                </>
              ) || (
                <div style={{ marginTop: '1.5em', marginBottom: '1.5em' }}>
                  <SecondaryButton onClick={() => setInputURL('')}>Click to use text instead of URL</SecondaryButton>
                </div>
              )}
            </div>

            <Buttons>
              <PrimaryButton onClick={() => setCurrentStep(2)} disabled={inputURL.length === 0 && inputText.length === 0}>Continue</PrimaryButton>
            </Buttons>
          </StepBlock>

          <StepBlock step={2} style={{display: currentStep === 2 ? 'block' : 'none'}}>
            <div>
              <h2>Select an existing set of topics</h2>
            </div>

            <div>
              <form onSubmit={(ev) => ev.preventDefault()} style={{ display: 'flex' }}>
                <StyledMenu state={languageMenu} tabIndex={0} aria-label="Preferences">
                <StyledMenuItem
                    state={languageMenu}
                    key={"en"}
                    className={language === 'en' ? 'selected' : ''}
                    onClick={() => {
                      setSelectedDataset(null);
                      setLanguage('en');
                      languageMenu.hide();
                    }}
                  >
                    <ReactCountryFlag countryCode="US" svg />
                  </StyledMenuItem>
                  <StyledMenuItem
                    state={languageMenu}
                    key={"fr"}
                    className={language === 'fr' ? 'selected' : ''}
                    onClick={() => {
                      setSelectedDataset(null);
                      setLanguage('fr');
                      languageMenu.hide();
                    }}
                  >
                    <ReactCountryFlag countryCode="FR" svg />
                  </StyledMenuItem>
                </StyledMenu>
                <FlagButton
                  state={languageMenu}
                  name="language"
                >
                  <ReactCountryFlag countryCode={language === 'fr' ? 'FR' : 'US'} svg />
                </FlagButton>

                <Select
                  isClearable
                  value={selectedDataset}
                  options={datasets[language].map(item => ({ value: item.name, label: item.name }))}
                  onChange={onChangeDataset}
                  styles={{
                    container: base => ({
                      ...base,
                      width: 364,
                    }),
                    control: base => ({
                      ...base,
                      borderRadius: 0,
                      borderWidth: '0px 0px 2px',
                      borderColor: 'black',
                      backgroundColor: 'rgb(240,240,240)',
                    })
                  }}
                  theme={theme => ({
                    ...theme,
                    borderRadius: 0,
                    colors: {
                      ...theme.colors,
                      primary: 'black',
                    },
                  })}
                />
              </form>

              {dataset && <p dangerouslySetInnerHTML={{__html: dataset.description}} />}
            </div>

            <div>
              <h2>Or create your own set of topics</h2>
            </div>

            <div>
              <div style={{ display: 'flex' }}>
                <AsyncSelect
                  isMulti
                  isClearable
                  cacheOptions
                  defaultOptions
                  loadOptions={onLoadOptions}
                  onChange={handleSelectLabel}
                  placeholder="Start typing a topic"
                  styles={{
                    container: base => ({
                      ...base,
                      width: 400,
                    }),
                    control: base => ({
                      ...base,
                      borderRadius: 0,
                      borderWidth: '0px 0px 2px',
                      borderColor: 'black',
                      backgroundColor: 'rgb(240,240,240)',
                    })
                  }}
                  theme={theme => ({
                    ...theme,
                    borderRadius: 0,
                    colors: {
                      ...theme.colors,
                      primary: 'black',
                    },
                  })}
                />
              </div>
            </div>

            <div>
              {datasetError && <div style={{ marginLeft: '1.5em', marginBottom: '1em', color: 'red' }}>{datasetError}</div>}
            </div>

            <Buttons>
              <SecondaryButton onClick={() => setCurrentStep(1)} disabled={isLoading}><ArrowLeftShortIcon height="2em" /> Back</SecondaryButton>
              <PrimaryButton onClick={predict} disabled={isLoading || (selectedDataset === null && userLabels.length === 0)}>Compute the results</PrimaryButton>
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
                <h3>The predicted main topic is:</h3>

                <div style={{ marginBottom: '1em' }}>
                  <MainLabel>
                    <Term>{predictions[0].label}</Term>
                    <Confidence>Confidence: {(predictions[0].score * 100).toFixed(2)}%</Confidence>
                  </MainLabel>
                </div>

                <div style={{ display: 'flex' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', height: '500px', marginBottom: '1em', border: '1px solid #f1f1f1', marginRight: '1.5em' }}>
                      <Graph key={uuidv4()} graph={graph} options={graphOptions} events={events} ref={graphRef} getNetwork={network => setNetworkInstance(network)} />
                    </div>

                    <div style={{ marginBottom: '1em' }}>
                      {Array.isArray(predictions[0].highlights) && predictions[0].highlights.map(highlight => {
                        const backgroundColor = shadeColor('#4bff00', -highlight[1] * 100);
                        const textColor = getTextColour(backgroundColor);
                        return <><HighlightTerm style={{ backgroundColor, color: textColor }}>{highlight[0]}</HighlightTerm>{' '}</>;
                      })}
                    </div>

                    <div>
                      {predictions.length > 1 && (
                        <div>
                          <div>
                            <h2>The other possible topics with their explanation for this document are:</h2>
                          </div>
                          <div>
                            {predictions.slice(1).map(prediction => {
                              return (
                                <div key={prediction.label} id={prediction.label} style={{ marginBottom: '1em' }}>
                                  <div>
                                    <Label title={prediction.label}><Term>{prediction.label}</Term></Label> Confidence: {(prediction.score * 100).toFixed(2)}%
                                    {' '}
                                    {prediction.terms.length && (
                                      <SecondaryButton small href={`#${prediction.label}`} onClick={() => toggleExplanation(prediction.label)}>
                                        {visibleExplanations[prediction.label]
                                          ? <HideIcon height="1.5em" />
                                          : <ShowIcon height="1.5em" />
                                        }
                                      </SecondaryButton>
                                    ) || undefined}
                                  </div>

                                  {visibleExplanations[prediction.label] && (
                                    <>
                                      <div>
                                        {prediction.terms.slice(0, showMoreExplanations[prediction.label] ? undefined : 10).map(term => {
                                          const explanations = generateExplanations(term.paths);
                                          return <ul key={term.paths.join('|')}><li>{explanations}</li></ul>;
                                        })}
                                      </div>
                                      {prediction.terms.length > 10 && (
                                        <div style={{ marginLeft: '2.5em' }}>
                                          <PrimaryButton small onClick={() => { toggleMoreExplanations(prediction.label); }}>Show {showMoreExplanations[prediction.label] ? 'less' : 'more'}</PrimaryButton>
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
                    </div>
                  </div>

                  <div style={{ width: '35%' }}>
                    <div style={{ marginBottom: '1em' }}>
                      <h2 style={{ display: 'inline' }}>Explanation:</h2>
                      {' '}
                      {visibleExplanations[predictions[0].label] && (
                        <small><SecondaryButton small href={`#${predictions[0].label}`} onClick={() => toggleExplanation(predictions[0].label)}>(hide)</SecondaryButton></small>
                      )}
                    </div>
                    {visibleExplanations[predictions[0].label] ? (
                      <div>
                        <div>The document contains the terms:</div>
                        <div>
                            {predictions[0].terms.slice(0, showMoreExplanations[predictions[0].label] ? undefined : 10).map(term => {
                              const explanations = generateExplanations(term.paths);
                              return <ul key={term.paths.join('|')}><li>{explanations}</li></ul>;
                            })}
                        </div>
                        {predictions[0].terms.length > 10 && (
                          <div style={{ marginLeft: '2.5em' }}>
                            <PrimaryButton small onClick={() => { toggleMoreExplanations(predictions[0].label); }}>Show {showMoreExplanations[predictions[0].label] ? 'less' : 'more'}</PrimaryButton>
                          </div>
                        )}
                      </div>
                    ) : (
                      <SecondaryButton href={`#${predictions[0].label}`} onClick={() => toggleExplanation(predictions[0].label)}>Show explanations for main topic</SecondaryButton>
                    )}
                  </div>
                </div>
              </>
            )}

            <Buttons>
              <SecondaryButton onClick={() => setCurrentStep(2)} disabled={isLoading} style={{ marginRight: 'auto'}}><ArrowLeftShortIcon height="2em" /> Back to topic selection</SecondaryButton>
            </Buttons>
          </StepBlock>
        </Form>
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

export default PredictPage;
