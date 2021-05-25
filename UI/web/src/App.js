import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import AsyncSelect from 'react-select/async';
import Graph from 'react-graph-vis';
import { v4 as uuidv4 } from 'uuid';
import { useMenuState, Menu, MenuItem, MenuButton } from 'reakit/Menu';
import ReactCountryFlag from 'react-country-flag';

import GlobalStyle from './globalStyle';
import Term from './components/Term';
import GitHubForkRibbon from './components/GitHubForkRibbon';

import Lemon from './lemon.png'
import datasets from './datasets';
import MEMADLogo from './memad-logo.png';
import EURECOMLogo from './eurecom-logo.jpg';
import SILKNOWLogo from './silknow-logo.jpg';
import ASRAELLogo from './asrael-logo.png';

const Layout = styled.div`
background-color: #f9ffec;
display: flex;
flex-direction: row;

@media only screen and (max-width: 992px) {
  flex-direction: column;
}

input, select {
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
}
`;

const PrimaryButton = styled.button`
background-color: #82b623;
color: rgb(255, 255, 255);
flex: 0 1 120px;
font-size: 1rem;
padding: 0.5em;
appearance: none;
border: none;
border-radius: 0px;
cursor: pointer;
text-decoration: none;
display: flex;
align-items: center;
justify-content: center;
pointer-events: auto;
`;

const Form = styled.div`
flex: 0.7;
padding: 1rem 2rem;
`;

const Textarea = styled.textarea`
width: 100%;
height: 150px;

background-color: rgb(240, 240, 240);
border-style: solid;
border-color: rgb(0, 0, 0);
border-width: 0px 0px 2px;
border-radius: 0px;
outline: 0px;
box-sizing: border-box;
font: inherit;
min-height: 38px;
padding: 8px;
`;

const Results = styled.div`
flex: 0.6;
padding: 1rem 2rem;
box-shadow: 0 0 10px 0px rgba(0,0,0,0.2);

pre {
  overflow: auto;
  max-width: 250px;
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

const SpinningLemon = styled.div`
  box-shadow: 52px 74px 223px -9px rgba(255,200,0,1);
  width:100px;
  height:100px;
  background-color:#ffda0a;
  border-radius:50% 10%;
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

const Footer = styled.div`
background-color: white;
color: black;
padding: 2em;
box-shadow: inset 1px 4px 9px -6px rgba(0, 0, 0, 0.5);
display: flex;
flex-direction: row;
justify-content: space-evenly;
align-items: center;
min-height: 100px;
`;

const HighlightTerm = styled.span`
padding: 0.5em;
line-height: 2.5em;
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

function shadeColor(color, percent) {
  var R = parseInt(color.substring(1,3),16);
  var G = parseInt(color.substring(3,5),16);
  var B = parseInt(color.substring(5,7),16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R<255)?R:255;
  G = (G<255)?G:255;
  B = (B<255)?B:255;

  var RR = ((R.toString(16).length === 1)?'0'+R.toString(16):R.toString(16));
  var GG = ((G.toString(16).length === 1)?'0'+G.toString(16):G.toString(16));
  var BB = ((B.toString(16).length === 1)?'0'+B.toString(16):B.toString(16));

  return '#'+RR+GG+BB;
}

function getTextColour(color) {
  var R = parseInt(color.substring(1,3),16);
  var G = parseInt(color.substring(3,5),16);
  var B = parseInt(color.substring(5,7),16);

  R = (R<255)?R:255;
  G = (G<255)?G:255;
  B = (B<255)?B:255;

  // http://www.w3.org/TR/AERT#color-contrast
  const brightness = Math.round(((parseInt(R) * 299) +
                      (parseInt(G) * 587) +
                      (parseInt(B) * 114)) / 1000);
  const textColour = (brightness > 125) ? 'black' : 'white';
  return textColour;
}

function App() {
  const [ isLoading, setIsLoading ] = useState(false);
  const [ predictions, setPredictions ] = useState([]);
  const [ inputText, setInputText ] = useState('A NASA spacecraft set a new milestone Monday in cosmic exploration by entering orbit around an asteroid, Bennu, the smallest object ever to be circled by a human-made spaceship. The spacecraft, called OSIRIS-REx, is the first-ever US mission designed to visit an asteroid and return a sample of its dust back to Earth..');
  const [ inputURL, setInputURL ] = useState('');
  const [ userLabels, setUserLabels ] = useState([]);
  const [ error, setError ] = useState(null);
  const [ visibleExplanations, setVisibleExplanations ] = useState({});
  const [ showMoreExplanations, setShowMoreExplanations ] = useState({});
  const [ selectedDataset, setSelectedDataset ] = useState(null);
  const [ datasetError, setDatasetError ] = useState(undefined);
  const [ language, setLanguage ] = useState(Object.keys(datasets)[0]);
  const graphRef = useRef(null);

  const [graphState, setGraphState] = useState({
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
    if (graphRef.current) {
      graphRef.current.Network.moveTo({ scale: 1 });
    }
  }, [graphState]);
  const { graph, events } = graphState;

  const onLoadOptions = async (value) => {
    const data = await (await fetch(`${process.env.REACT_APP_SERVER_URL}/autocomplete?q=${encodeURIComponent(value)}&hl=${language}`)).json();
    const suggestions = data.map(item => ({ value: item[0], label: item[0] }));
    return suggestions;
  };

  const predict = async () => {
    setPredictions([]);
    setError(null);
    setVisibleExplanations({});
    setShowMoreExplanations({});
    setDatasetError(undefined);

    const dataset = datasets[language].find(dataset => dataset.name === selectedDataset);
    const datasetLabels = dataset ? dataset.labels : [];
    const params = {
      labels: [...userLabels, ...datasetLabels].join(';'),
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

      data = await (await fetch(`${process.env.REACT_APP_SERVER_URL}/predict`, {
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
                          acc.push({ id: path[0], label: path[0], color: backgroundColor, font: { color: textColor } });
                          idsCache.push(path[0]);
                        }
                        if (!idsCache.includes(path[2])) {
                          acc.push({ id: path[2], label: path[2], color: backgroundColor, font: { color: textColor } });
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

  const onChangeDataset = (ev) => {
    ev.preventDefault();
    setDatasetError(undefined);
    setSelectedDataset(ev.target.value);
  }

  const handleSelectLabel = (items) => {
    setDatasetError(undefined);
    setUserLabels(items.map(item => item.value));
  }

  const dataset = datasets[language].find(dataset => dataset.name === selectedDataset);

  const languageMenu = useMenuState();

  return (
    <>
      <GlobalStyle />
      <Layout>
        <GitHubForkRibbon className="right-top" href="https://github.com/D2KLab/ZeSTE" data-ribbon="Fork me on GitHub" title="Fork me on GitHub">Fork me on GitHub</GitHubForkRibbon>

        <Form>
          <h1>
            <span style={{ verticalAlign: 'middle' }}>ZeSTE</span>
            {' '}
            <img src={Lemon} alt="Logo" style={{ verticalAlign: 'middle' }} />
            {' '}
            <small style={{ verticalAlign: 'middle' }}>Zero-Shot Topic Extraction</small>
          </h1>

          <p><em>Only English is currently supported.</em></p>
          <h2>1. Enter the URL of a page</h2>

          <div style={{ marginLeft: '1.5em', marginBottom: '2em' }}>
          <div>
            <input value={inputURL} onChange={(ev) => setInputURL(ev.target.value)} type="url" placeholder="https://example.com" pattern="https://.*" style={{ width: 400 }} />
          </div>
            <h2>Or enter the text for which you want to extract topics</h2>
            <div>
              <Textarea value={inputText} onChange={(ev) => setInputText(ev.target.value)} />
            </div>
          </div>

          <div>
            <h2>2. Select an existing set of topics</h2>

            <div style={{ marginLeft: '1.5em', marginBottom: '2em' }}>
              <form onSubmit={onChangeDataset} style={{ display: 'flex' }}>
                <StyledMenu {...languageMenu} tabIndex={0} aria-label="Preferences">
                <StyledMenuItem
                    {...languageMenu}
                    key={"en"}
                    className={language === 'en' ? 'selected' : ''}
                    onClick={() => {
                      setLanguage('en');
                      languageMenu.hide();
                    }}
                  >
                    <ReactCountryFlag countryCode="US" svg />
                  </StyledMenuItem>
                  <StyledMenuItem
                    {...languageMenu}
                    key={"fr"}
                    className={language === 'fr' ? 'selected' : ''}
                    onClick={() => {
                      setLanguage('fr');
                      languageMenu.hide();
                    }}
                  >
                    <ReactCountryFlag countryCode="FR" svg />
                  </StyledMenuItem>
                </StyledMenu>
                <FlagButton
                  {...languageMenu}
                  name="language"
                >
                  <ReactCountryFlag countryCode={language === 'fr' ? 'FR' : 'US'} svg />
                </FlagButton>

                <select onChange={onChangeDataset} style={{ marginRight: '1em', width: 400 }}>
                  <option value=""> </option>
                  {datasets[language].map(item => (
                    <option value={item.name}>{item.name}</option>
                  ))}
                </select>
              </form>

              {dataset && <p dangerouslySetInnerHTML={{__html: dataset.description}} />}

              <div>
                <h2>Or create your own set of topics</h2>
              </div>

              <div>
                <div style={{ display: 'flex' }}>
                  <AsyncSelect
                    isMulti
                    cacheOptions
                    defaultOptions
                    loadOptions={onLoadOptions}
                    onChange={handleSelectLabel}
                    menuPlacement="top"
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
            </div>

            {datasetError && <div style={{ marginLeft: '1.5em', marginBottom: '1em', color: 'red' }}>{datasetError}</div>}
          </div>

          <PrimaryButton onClick={predict} disabled={isLoading} style={{ marginLeft: '1.5em' }}>Predict The Topics</PrimaryButton>
        </Form>

        {(isLoading || error !== null || predictions.length > 0) && (
          <Results>
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
              </div>
            )}
            {Array.isArray(predictions) && predictions.length > 0 && (
              <>
                <h2>The predicted main topic is:</h2>

                <div style={{ marginBottom: '1em' }}>
                  <MainLabel>
                    <Term>{predictions[0].label}</Term>
                    <Confidence>Confidence: {(predictions[0].score * 100).toFixed(2)}%</Confidence>
                  </MainLabel>
                </div>

                <div style={{ display: 'flex', height: '300px', marginBottom: '1em' }}>
                  <Graph key={uuidv4()} graph={graph} options={graphOptions} events={events} ref={graphRef} />
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
        )}
      </Layout>
      <Footer>
        <a href="https://www.eurecom.fr" rel="noopener noreferrer">
          <img src={EURECOMLogo} alt="EURECOM" height="100" />
        </a>
        <a href="https://memad.eu" rel="noopener noreferrer">
          <img src={MEMADLogo} alt="MEMAD" height="100" />
        </a>
        <a href="https://silknow.eu" rel="noopener noreferrer">
          <img src={SILKNOWLogo} alt="SILKNOW" height="200" />
        </a>
        <a href="http://asrael.eurecom.fr" rel="noopener noreferrer">
          <img src={ASRAELLogo} alt="ASRAEL" height="100" />
        </a>
      </Footer>
    </>
  );
}

export default App;
