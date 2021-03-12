import { useState } from 'react';
import styled from 'styled-components';
import Autosuggest from 'react-autosuggest';

import GlobalStyle from './globalStyle';
import Term from './components/Term';

const Layout = styled.div`
display: flex;
flex-direction: row;
min-height: 100vh;

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

button {
  background-color: rgb(27, 125, 160);
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
}
`;

const Form = styled.div`
background-color: rgb(217, 217, 217);
flex: 1;
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
flex: 0.5;
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

const MainLabel = styled.div`
font-size: 2rem;
color: rgb(27, 125, 160);
font-weight: bold;
text-transform: uppercase;
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

const Label = styled.span`
color: rgb(27, 125, 160);
font-weight: bold;
text-transform: capitalize;
margin-right: 1em;
width: 120px;
overflow: hidden;
text-overflow: ellipsis;
display: inline-block;
vertical-align: middle;
`;


const Lemon = styled.div`
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

const datasets = [
  {
    name: '20NG',
    labels: ['baseball', 'car', 'cryptography', 'electronics', 'graphic', 'gun', 'hardware', 'hockey', 'medicine', 'middle_east', 'motorcycle', 'politics', 'religion', 'sale', 'space', 'windows']
  },
  {
    name: 'AFP',
    labels: []
  },
];

const getSuggestionValue = suggestion => suggestion.name;
const renderSuggestion = suggestion => (
  <div>
    {suggestion.name}
  </div>
);

const generateExplanations = (paths) => {
  const lis = [];
  paths.forEach((path, i) => {
    const relation = path[1] === 'label' ? 'is the label' : path[1];
    lis.push(<>[<Term>{path[0]}</Term>] {i === 0 ? 'which' : ''} {relation}{path[2] && <> [<Term>{path[2]}</Term>]</>}.<br /></>);
  });
  return lis;
}

function App() {
  const [ suggestions, setSuggestions ] = useState([]);
  const [ isLoading, setIsLoading ] = useState(false);
  const [ predictions, setPredictions ] = useState([]);
  const [ inputText, setInputText ] = useState('A NASA spacecraft set a new milestone Monday in cosmic exploration by entering orbit around an asteroid, Bennu, the smallest object ever to be circled by a human-made spaceship. The spacecraft, called OSIRIS-REx, is the first-ever US mission designed to visit an asteroid and return a sample of its dust back to Earth..');
  const [ inputLabel, setInputLabel ] = useState('');
  const [ userLabels, setUserLabels ] = useState([]);
  const [ error, setError ] = useState(null);
  const [ visibleExplanations, setVisibleExplanations ] = useState({});
  const [ showMoreExplanations, setShowMoreExplanations ] = useState({});
  const [ selectedDataset, setSelectedDataset ] = useState(null);

  const onSuggestionsFetchRequested = async ({ value }) => {
    const data = await (await fetch(`${process.env.REACT_APP_SERVER_URL}/autocomplete?q=${encodeURIComponent(value)}`)).json();
    const suggestions = data.map(item => ({ name: item[0] }));
    setSuggestions(suggestions);
  };
  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };
  const onSuggestionSelected = (ev, { suggestionValue }) => {
    if (suggestionValue.length > 0) {
      setUserLabels([...userLabels, suggestionValue]);
    }
    setInputLabel('');
  }

  const inputProps = {
    placeholder: 'spacecraft',
    value: inputLabel,
    onChange: (event, { newValue }) => {
      setInputLabel(newValue);
    },
    style: { width: 400 }
  };

  const predict = async () => {
    setPredictions([]);
    setIsLoading(true);
    setError(null);
    setVisibleExplanations({});
    setShowMoreExplanations({});

    const dataset = datasets.find(dataset => dataset.name === selectedDataset);
    const datasetLabels = dataset ? dataset.labels : [];

    let data;
    try {
      data = await (await fetch(`${process.env.REACT_APP_SERVER_URL}/predict`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: inputText,
          labels: [...userLabels, ...datasetLabels].join(';'),
        })
      })).json();

      if (data && data.error) {
        setError(data.error);
      } else {
        setPredictions(data);
        if (data[0] && data[0].label) {
          toggleExplanation(data[0].label);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLabel = (index) => {
    const newLabels = userLabels.slice();
    newLabels.splice(index, 1);
    setUserLabels(newLabels);
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
    setSelectedDataset(ev.target.value);
  }

  const dataset = datasets.find(dataset => dataset.name === selectedDataset);
  const datasetLabels = dataset ? dataset.labels : [];

  return (
    <>
      <GlobalStyle />
      <Layout>
        <Form>
          <h1>ZeSTE 🍋</h1>

          <div>
            <h2>1. Enter the text for which you want to extract topics</h2>
          </div>

          <div style={{ marginLeft: '1.5em', marginBottom: '2em' }}>
            <div>
              <Textarea value={inputText} onChange={(ev) => setInputText(ev.target.value)} />
            </div>
            <h2>Or enter the URL of a page</h2>
            <div>
              <input type="url" placeholder="https://example.com" pattern="https://.*" style={{ width: 400 }} />
            </div>
          </div>

          <div>
            <h2>2. Select labels from an existing dataset</h2>

            <div style={{ marginLeft: '1.5em', marginBottom: '2em' }}>
              <form onSubmit={onChangeDataset} style={{ display: 'flex' }}>
                <select onChange={onChangeDataset} style={{ marginRight: '1em', width: 400 }}>
                  <option value=""> </option>
                  {datasets.map(item => (
                    <option value={item.name}>{item.name}</option>
                  ))}
                </select>
              </form>

              {datasetLabels.length > 0 && datasetLabels.join(', ')}

              <div>
                <h2>Or add your own labels</h2>
              </div>

              <div>
                <div style={{ display: 'flex' }}>
                  <Autosuggest
                    suggestions={suggestions}
                    onSuggestionsFetchRequested={onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={onSuggestionsClearRequested}
                    onSuggestionSelected={onSuggestionSelected}
                    getSuggestionValue={getSuggestionValue}
                    renderSuggestion={renderSuggestion}
                    inputProps={inputProps}
                  />
                </div>
                <div>
                  <ul>
                    {userLabels.map((label, i) => (
                      <li><button onClick={() => deleteLabel(i)} style={{ fontSize:'0.6rem', display:'inline-block' }}>x</button> {label}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <button onClick={predict} disabled={isLoading}>Predict The Topics</button>
        </Form>

        {(isLoading || error !== null || predictions.length > 0) && (
          <Results>
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', height: '100%', margin: '1em' }}>
                <div><Lemon /></div>
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
                <div>
                  <MainLabel>
                    <Term>{predictions[0].label}</Term>
                    <Confidence>Confidence: {(predictions[0].score * 100).toFixed(2)}%</Confidence>
                  </MainLabel>
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
                        <button onClick={() => { toggleMoreExplanations(predictions[0].label); }}>show {showMoreExplanations[predictions[0].label] ? 'less' : 'more'}</button>
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
                          <div id={prediction.label}>
                            <div>
                              <Label title={prediction.label}>{prediction.label}</Label> Confidence: {(prediction.score * 100).toFixed(2)}%
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
                                    <button onClick={() => { toggleMoreExplanations(prediction.label); }}>show {showMoreExplanations[prediction.label] ? 'less' : 'more'}</button>
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
    </>
  );
}

export default App;
