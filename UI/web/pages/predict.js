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

      // data = await (await fetch(`${reactAppServerUrl}/predict`, {
      //   method: 'POST',
      //   headers: {
      //     'Accept': 'application/json',
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(params)
      // })).json();

      data = {"labels":["art-culture-entertainment","crime-law-justice","disaster-accident","economy-business-finance","environment","education","leisure","lifestyle-leisure","health","interest-activity","politics","religion-belief","science-technology","social-issue","sport","unrest-conflict-war","weather"],"results":[{"highlights":[["nasa","0.39292422"],["spacecraft","0.22852156"],["set","-0.02127157"],["new","0.16940069"],["milestone","0.05289496"],["monday","-1"],["cosmic","0.21323831"],["exploration","0.25006065"],["entering","-1"],["orbit","0.15505539"],["around","0.058052488"],["asteroid","0.16233854"],["bennu","-1"],["smallest","-0.008440901"],["object","0.07012857"],["ever","0.09471833"],["circled","-1"],["human_made","0.21389076"],["spaceship","0.21231966"],["spacecraft","0.22852156"],["called","0.059458554"],["osiris_rex","-1"],["first_ever","-1"],["u","0.023140812"],["mission","0.14940466"],["designed","-1"],["visit","0.02778787"],["asteroid","0.16233854"],["return","-0.026544526"],["sample","0.07815369"],["dust","0.06259438"],["back","0.029972723"],["earth","0.24502055"]],"label":"science-technology","score":0.17808304647754147,"terms":[{"paths":[["nasa","has in context","technology"]],"score":0.3929242193698883},{"paths":[["nasa","is related to","space"],["space","is related to","science"]],"score":0.3929242193698883},{"paths":[["exploration","is related to","space"],["space","is related to","science"]],"score":0.25006064772605896},{"paths":[["exploration","is related to","space"],["space","is related to","technology"]],"score":0.25006064772605896},{"paths":[["earth","is related to","science"]],"score":0.2450205534696579},{"paths":[["earth","is related to","technology"]],"score":0.2450205534696579},{"paths":[["spacecraft","is related to","technology"]],"score":0.22852155566215515},{"paths":[["spacecraft","is related to","space"],["space","is related to","science"]],"score":0.22852155566215515},{"paths":[["human_made","is related to","technology"]],"score":0.21389076113700867},{"paths":[["human_made","is related to","nature"],["nature","is related to","science"]],"score":0.21389076113700867},{"paths":[["cosmic","is related to","universe"],["universe","is the location for","technology"]],"score":0.21323831379413605},{"paths":[["cosmic","is related to","universe"],["universe","is the location for","science"]],"score":0.21323831379413605},{"paths":[["spaceship","can be found at","space"],["space","is related to","science"]],"score":0.21231965720653534},{"paths":[["spaceship","is related to","technology"]],"score":0.21231965720653534},{"paths":[["new","desires","technology"]],"score":0.16940069198608398},{"paths":[["new","is related to","discovery"],["discovery","is used for","science"]],"score":0.16940069198608398},{"paths":[["asteroid","can be found at","space"],["space","is related to","science"]],"score":0.16233853995800018},{"paths":[["asteroid","can be found at","space"],["space","is related to","technology"]],"score":0.16233853995800018},{"paths":[["orbit","is the location for","earth"],["earth","is related to","science"]],"score":0.15505538880825043},{"paths":[["orbit","is the location for","earth"],["earth","is related to","technology"]],"score":0.15505538880825043},{"paths":[["ever","is in the context of","epidemiology"],["epidemiology","is related to","science"]],"score":0.0947183296084404},{"paths":[["ever","is related to","technology"]],"score":0.0947183296084404},{"paths":[["object","is related to","technology"]],"score":0.07012856751680374},{"paths":[["object","is related to","medicine"],["medicine","has in context","science"]],"score":0.07012856751680374},{"paths":[["dust","is related to","atom"],["atom","is derived from","science"]],"score":0.06259437650442123},{"paths":[["dust","is synonym of","technology"]],"score":0.06259437650442123},{"paths":[["around","is related to","space"],["space","is related to","science"]],"score":0.058052487671375275},{"paths":[["around","is related to","technology"]],"score":0.058052487671375275},{"paths":[["back","is related to","technology"]],"score":0.029972722753882408},{"paths":[["back","has as manner","finance"],["finance","is related to","science"]],"score":0.029972722753882408},{"paths":[["visit","is related to","space"],["space","is related to","technology"]],"score":0.027787869796156883},{"paths":[["visit","is related to","space"],["space","is related to","science"]],"score":0.027787869796156883},{"paths":[["u","is in the context of","finance"],["finance","is related to","technology"]],"score":0.023140812292695045},{"paths":[["u","is in the context of","finance"],["finance","is related to","science"]],"score":0.023140812292695045}]},{"highlights":[["nasa","-0.016741702"],["spacecraft","0.02637821"],["set","0.080371134"],["new","-0.013240606"],["milestone","0.047507904"],["monday","0.031144334"],["cosmic","-1"],["exploration","0.28417963"],["entering","0.08196258"],["orbit","0.08633491"],["around","0.0902196"],["asteroid","-1"],["bennu","-1"],["smallest","0.042907722"],["object","0.18150587"],["ever","0.07123604"],["circled","-0.006887633"],["human_made","-1"],["spaceship","0.034897633"],["spacecraft","0.02637821"],["called","0.04334081"],["osiris_rex","-1"],["first_ever","-1"],["u","0.08514579"],["mission","0.14871578"],["designed","-1"],["visit","0.14420472"],["asteroid","-1"],["return","0.101994224"],["sample","-0.0009091004"],["dust","0.0465629"],["back","0.072991416"],["earth","0.018411351"]],"label":"interest-activity","score":0.09311629058907465,"terms":[{"paths":[["exploration","is a(n)","activity"]],"score":0.2841796278953552},{"paths":[["object","is a manner of","challenge"],["challenge","is used for","interest"]],"score":0.18150587379932404},{"paths":[["object","is related to","activity"]],"score":0.18150587379932404},{"paths":[["mission","is related to","activity"]],"score":0.1487157791852951},{"paths":[["visit","is related to","activity"]],"score":0.14420472085475922},{"paths":[["return","is distinct from","interest"]],"score":0.10199422389268875},{"paths":[["return","is distinct from","activity"]],"score":0.10199422389268875},{"paths":[["around","is related to","activity"]],"score":0.09021960198879242},{"paths":[["orbit","is related to","activity"]],"score":0.08633490651845932},{"paths":[["u","is in the context of","activity"]],"score":0.08514578640460968},{"paths":[["u","is in the context of","finance"],["finance","has in context","interest"]],"score":0.08514578640460968},{"paths":[["entering","is related to","activity"]],"score":0.08196257799863815},{"paths":[["set","is synonym of","time"],["time","is a(n)","interest"]],"score":0.08037113398313522},{"paths":[["set","is in the context of","activity"]],"score":0.08037113398313522},{"paths":[["back","is related to","activity"]],"score":0.07299141585826874},{"paths":[["back","is related to","return"],["return","is distinct from","interest"]],"score":0.07299141585826874},{"paths":[["ever","is related to","activity"]],"score":0.0712360367178917},{"paths":[["ever","is related to","time"],["time","is a(n)","interest"]],"score":0.0712360367178917},{"paths":[["milestone","is related to","activity"]],"score":0.04750790446996689},{"paths":[["dust","is related to","activity"]],"score":0.04656289890408516},{"paths":[["called","is synonym of","activity"]],"score":0.043340809643268585},{"paths":[["smallest","is related to","activity"]],"score":0.0429077222943306},{"paths":[["spaceship","is related to","activity"]],"score":0.03489763289690018},{"paths":[["monday","is related to","activity"]],"score":0.031144334003329277},{"paths":[["spacecraft","is related to","activity"]],"score":0.02637821063399315},{"paths":[["earth","is related to","activity"]],"score":0.01841135136783123}]},{"highlights":[["nasa","-1"],["spacecraft","-1"],["set","0.10592024"],["new","0.032384854"],["milestone","-0.024794886"],["monday","-1"],["cosmic","-1"],["exploration","0.13896602"],["entering","-1"],["orbit","0.10899584"],["around","0.14194068"],["asteroid","-1"],["bennu","-1"],["smallest","-0.036594808"],["object","0.18389782"],["ever","0.048118293"],["circled","-1"],["human_made","0.24727264"],["spaceship","0.12349246"],["spacecraft","-1"],["called","-1"],["osiris_rex","-1"],["first_ever","-1"],["u","0.006704768"],["mission","0.0912018"],["designed","-1"],["visit","0.034253802"],["asteroid","-1"],["return","0.010407674"],["sample","0.04939209"],["dust","0.085009515"],["back","-1"],["earth","0.25153333"]],"label":"environment","score":0.08848290260331722,"terms":[{"paths":[["earth","is related to","nature"],["nature","is related to","environment"]],"score":0.2515333294868469},{"paths":[["human_made","is related to","nature"],["nature","is related to","environment"]],"score":0.24727264046669006},{"paths":[["object","is related to","hardware"],["hardware","is related to","environment"]],"score":0.18389782309532166},{"paths":[["around","is related to","weather"],["weather","is related to","environment"]],"score":0.14194068312644958},{"paths":[["set","is related to","office"],["office","is related to","environment"]],"score":0.10592024028301239},{"paths":[["sample","is related to","culture"],["culture","is related to","environment"]],"score":0.04939208924770355},{"paths":[["ever","is related to","weather"],["weather","is related to","environment"]],"score":0.04811829328536987}]},{"highlights":[["nasa","-1"],["spacecraft","0.053495005"],["set","0.056211956"],["new","0.08743415"],["milestone","0.05719211"],["monday","-1"],["cosmic","0.035231985"],["exploration","0.13837463"],["entering","0.05660233"],["orbit","0.06685753"],["around","0.075891726"],["asteroid","-1"],["bennu","-1"],["smallest","-1"],["object","0.15772739"],["ever","0.041202787"],["circled","-1"],["human_made","0.08084323"],["spaceship","0.040641516"],["spacecraft","0.053495005"],["called","0.020313414"],["osiris_rex","-1"],["first_ever","-1"],["u","0.050346226"],["mission","0.08045343"],["designed","0.17502613"],["visit","-1"],["asteroid","-1"],["return","0.021446453"],["sample","0.120484"],["dust","0.035005003"],["back","0.021823948"],["earth","0.117414944"]],"label":"art-culture-entertainment","score":0.08763102461178597,"terms":[{"paths":[["object","is related to","entertainment"]],"score":0.15772739052772522},{"paths":[["object","is related to","culture"]],"score":0.15772739052772522},{"paths":[["object","is related to","product"],["product","is related to","art"]],"score":0.15772739052772522},{"paths":[["exploration","is used for","entertainment"],["entertainment","is synonym of","art"]],"score":0.13837462663650513},{"paths":[["exploration","is used for","entertainment"],["entertainment","is synonym of","culture"]],"score":0.13837462663650513},{"paths":[["exploration","is used for","entertainment"]],"score":0.13837462663650513},{"paths":[["sample","is in the context of","business"],["business","is related to","art"]],"score":0.12048400193452835},{"paths":[["sample","is in the context of","culture"]],"score":0.12048400193452835},{"paths":[["sample","is in the context of","entertainment"]],"score":0.12048400193452835},{"paths":[["earth","is related to","culture"]],"score":0.1174149438738823},{"paths":[["earth","is related to","entertainment"]],"score":0.1174149438738823},{"paths":[["earth","is related to","art"]],"score":0.1174149438738823},{"paths":[["new","is related to","fashion"],["fashion","is related to","art"]],"score":0.08743415027856827},{"paths":[["new","is related to","culture"]],"score":0.08743415027856827},{"paths":[["new","is related to","entertainment"]],"score":0.08743415027856827},{"paths":[["human_made","is related to","culture"]],"score":0.0808432325720787},{"paths":[["human_made","is related to","nature"],["nature","is related to","art"]],"score":0.0808432325720787},{"paths":[["human_made","is related to","nature"],["nature","is related to","entertainment"]],"score":0.0808432325720787},{"paths":[["mission","is a(n)","entertainment"]],"score":0.08045343309640884},{"paths":[["mission","is a(n)","culture"]],"score":0.08045343309640884},{"paths":[["mission","has a(n)","culture"],["culture","is used for","art"]],"score":0.08045343309640884},{"paths":[["around","is related to","culture"]],"score":0.07589172571897507},{"paths":[["around","is related to","entertainment"]],"score":0.07589172571897507},{"paths":[["around","is related to","nature"],["nature","is related to","art"]],"score":0.07589172571897507},{"paths":[["orbit","is related to","culture"]],"score":0.06685753166675568},{"paths":[["orbit","is the location for","earth"],["earth","is related to","art"]],"score":0.06685753166675568},{"paths":[["orbit","is the location for","earth"],["earth","is related to","entertainment"]],"score":0.06685753166675568},{"paths":[["milestone","is related to","culture"]],"score":0.057192109525203705},{"paths":[["milestone","is related to","career"],["career","is related to","art"]],"score":0.057192109525203705},{"paths":[["milestone","is related to","career"],["career","is related to","entertainment"]],"score":0.057192109525203705},{"paths":[["entering","has as a prerequisite","entertainment"],["entertainment","is synonym of","art"]],"score":0.05660232901573181},{"paths":[["entering","has as a prerequisite","entertainment"]],"score":0.05660232901573181},{"paths":[["entering","has as a prerequisite","entertainment"],["entertainment","is synonym of","culture"]],"score":0.05660232901573181},{"paths":[["set","is part of","entertainment"]],"score":0.05621195584535599},{"paths":[["set","is part of","culture"]],"score":0.05621195584535599},{"paths":[["set","is in the context of","education"],["education","is used for","art"]],"score":0.05621195584535599},{"paths":[["u","is related to","culture"]],"score":0.05034622550010681},{"paths":[["u","is in the context of","education"],["education","is used for","art"]],"score":0.05034622550010681},{"paths":[["u","is in the context of","education"],["education","is used for","entertainment"]],"score":0.05034622550010681},{"paths":[["ever","is related to","entertainment"]],"score":0.041202787309885025},{"paths":[["ever","is related to","time"],["time","is related to","art"]],"score":0.041202787309885025},{"paths":[["ever","is related to","time"],["time","is related to","culture"]],"score":0.041202787309885025},{"paths":[["spaceship","is related to","culture"],["culture","is used for","art"]],"score":0.04064151644706726},{"paths":[["spaceship","is related to","culture"]],"score":0.04064151644706726},{"paths":[["spaceship","is related to","culture"],["culture","is used for","entertainment"]],"score":0.04064151644706726},{"paths":[["cosmic","is related to","culture"]],"score":0.03523198515176773},{"paths":[["cosmic","is related to","culture"],["culture","is used for","art"]],"score":0.03523198515176773},{"paths":[["cosmic","is related to","culture"],["culture","is used for","entertainment"]],"score":0.03523198515176773},{"paths":[["dust","can be found at","culture"],["culture","is used for","art"]],"score":0.035005003213882446},{"paths":[["dust","can be found at","culture"],["culture","is used for","entertainment"]],"score":0.035005003213882446},{"paths":[["dust","can be found at","culture"]],"score":0.035005003213882446},{"paths":[["back","is related to","culture"]],"score":0.021823948249220848},{"paths":[["back","is related to","entertainment"]],"score":0.021823948249220848},{"paths":[["back","is related to","culture"],["culture","is used for","art"]],"score":0.021823948249220848},{"paths":[["return","is a(n)","entertainment"],["entertainment","is synonym of","art"]],"score":0.021446453407406807},{"paths":[["return","is a(n)","entertainment"]],"score":0.021446453407406807},{"paths":[["return","is a(n)","entertainment"],["entertainment","is synonym of","culture"]],"score":0.021446453407406807},{"paths":[["called","is related to","culture"],["culture","is used for","art"]],"score":0.020313413813710213},{"paths":[["called","is related to","culture"],["culture","is used for","entertainment"]],"score":0.020313413813710213},{"paths":[["called","is related to","culture"]],"score":0.020313413813710213}]},{"highlights":[["nasa","-1"],["spacecraft","-1"],["set","0.121189855"],["new","0.10068528"],["milestone","0.113203436"],["monday","0.07889213"],["cosmic","-1"],["exploration","0.01736076"],["entering","0.01437727"],["orbit","0.047328994"],["around","0.09529736"],["asteroid","0.012667608"],["bennu","-1"],["smallest","0.001972238"],["object","0.14391777"],["ever","0.09833324"],["circled","-1"],["human_made","0.07758111"],["spaceship","-1"],["spacecraft","-1"],["called","0.08672595"],["osiris_rex","-1"],["first_ever","-1"],["u","0.0050019003"],["mission","0.06630867"],["designed","-1"],["visit","0.057149965"],["asteroid","0.012667608"],["return","0.04312702"],["sample","-0.08264782"],["dust","0.035087984"],["back","0.08542084"],["earth","0.051498473"]],"label":"social-issue","score":0.07282322460199031,"terms":[{"paths":[["object","is related to","issue"]],"score":0.1439177691936493},{"paths":[["set","is related to","issue"]],"score":0.12118985503911972},{"paths":[["milestone","is related to","issue"]],"score":0.11320343613624573},{"paths":[["new","is related to","issue"]],"score":0.10068528354167938},{"paths":[["new","is related to","fashion"],["fashion","has in context","social"]],"score":0.10068528354167938},{"paths":[["ever","is related to","issue"]],"score":0.09833323955535889},{"paths":[["around","is related to","issue"]],"score":0.09529735893011093},{"paths":[["back","has as manner","issue"]],"score":0.08542083948850632},{"paths":[["human_made","is related to","issue"]],"score":0.07758110761642456},{"paths":[["mission","is a(n)","issue"]],"score":0.06630866974592209},{"paths":[["earth","is related to","issue"]],"score":0.051498472690582275},{"paths":[["return","is synonym of","issue"]],"score":0.043127018958330154},{"paths":[["dust","is related to","issue"]],"score":0.035087984055280685},{"paths":[["exploration","is a(n)","issue"]],"score":0.017360759899020195},{"paths":[["entering","is related to","issue"]],"score":0.014377269893884659},{"paths":[["asteroid","is related to","issue"]],"score":0.012667608447372913},{"paths":[["u","is in the context of","issue"]],"score":0.005001900251954794},{"paths":[["smallest","is related to","issue"]],"score":0.001972238067537546}]},{"highlights":[["nasa","0.03522389"],["spacecraft","0.0114622535"],["set","0.053691305"],["new","0.056305367"],["milestone","0.07197408"],["monday","0.04587605"],["cosmic","-1"],["exploration","0.064346686"],["entering","0.05321342"],["orbit","0.027573012"],["around","0.065116666"],["asteroid","-1"],["bennu","-1"],["smallest","0.07222282"],["object","0.055502996"],["ever","-0.00023573615"],["circled","-1"],["human_made","-0.07030021"],["spaceship","-0.004690857"],["spacecraft","0.0114622535"],["called","0.048425097"],["osiris_rex","-1"],["first_ever","-1"],["u","0.04194337"],["mission","0.12078809"],["designed","-1"],["visit","0.032228705"],["asteroid","-1"],["return","0.06874002"],["sample","-0.007806108"],["dust","0.047836687"],["back","0.06619917"],["earth","0.0866752"]],"label":"economy-business-finance","score":0.060613732933772035,"terms":[{"paths":[["mission","is related to","business"]],"score":0.1207880899310112},{"paths":[["mission","is related to","finance"]],"score":0.1207880899310112},{"paths":[["mission","has a(n)","business"],["business","has in context","economy"]],"score":0.1207880899310112},{"paths":[["earth","is related to","business"]],"score":0.08667519688606262},{"paths":[["earth","is synonym of","business"],["business","has in context","economy"]],"score":0.08667519688606262},{"paths":[["earth","is related to","finance"]],"score":0.08667519688606262},{"paths":[["smallest","is related to","finance"],["finance","has in context","business"]],"score":0.07222282141447067},{"paths":[["smallest","is related to","finance"]],"score":0.07222282141447067},{"paths":[["milestone","is related to","business"]],"score":0.07197407633066177},{"paths":[["milestone","is related to","finance"]],"score":0.07197407633066177},{"paths":[["milestone","is related to","business"],["business","has in context","economy"]],"score":0.07197407633066177},{"paths":[["return","is in the context of","business"]],"score":0.06874001771211624},{"paths":[["return","is related to","business"],["business","has in context","economy"]],"score":0.06874001771211624},{"paths":[["return","is in the context of","finance"]],"score":0.06874001771211624},{"paths":[["back","has as manner","business"]],"score":0.0661991685628891},{"paths":[["back","is derived from","business"],["business","has in context","economy"]],"score":0.0661991685628891},{"paths":[["back","has as manner","finance"]],"score":0.0661991685628891},{"paths":[["around","is derived from","business"],["business","has in context","economy"]],"score":0.06511666625738144},{"paths":[["around","is related to","business"]],"score":0.06511666625738144},{"paths":[["around","is related to","finance"]],"score":0.06511666625738144},{"paths":[["exploration","is related to","business"],["business","has in context","finance"]],"score":0.06434668600559235},{"paths":[["exploration","is related to","business"]],"score":0.06434668600559235},{"paths":[["exploration","is related to","business"],["business","has in context","economy"]],"score":0.06434668600559235},{"paths":[["new","is related to","business"]],"score":0.05630536749958992},{"paths":[["new","is related to","finance"]],"score":0.05630536749958992},{"paths":[["new","is the antonym of","business"],["business","has in context","economy"]],"score":0.05630536749958992},{"paths":[["object","is related to","business"],["business","has in context","economy"]],"score":0.0555029958486557},{"paths":[["object","is related to","business"]],"score":0.0555029958486557},{"paths":[["object","is related to","finance"]],"score":0.0555029958486557},{"paths":[["set","is related to","business"],["business","has in context","economy"]],"score":0.053691305220127106},{"paths":[["set","is related to","business"]],"score":0.053691305220127106},{"paths":[["set","is related to","finance"]],"score":0.053691305220127106},{"paths":[["entering","is related to","business"],["business","has in context","finance"]],"score":0.05321342125535011},{"paths":[["entering","is related to","business"]],"score":0.05321342125535011},{"paths":[["entering","is related to","business"],["business","has in context","economy"]],"score":0.05321342125535011},{"paths":[["called","is related to","finance"]],"score":0.0484250970184803},{"paths":[["called","is related to","finance"],["finance","has in context","business"]],"score":0.0484250970184803},{"paths":[["dust","is synonym of","business"],["business","has in context","economy"]],"score":0.04783668741583824},{"paths":[["dust","is related to","business"]],"score":0.04783668741583824},{"paths":[["dust","is related to","finance"]],"score":0.04783668741583824},{"paths":[["monday","is a(n)","business"],["business","has in context","finance"]],"score":0.045876048505306244},{"paths":[["monday","is a(n)","business"],["business","has in context","economy"]],"score":0.045876048505306244},{"paths":[["monday","is a(n)","business"]],"score":0.045876048505306244},{"paths":[["u","is in the context of","finance"]],"score":0.041943371295928955},{"paths":[["u","is in the context of","business"],["business","has in context","economy"]],"score":0.041943371295928955},{"paths":[["u","is in the context of","business"]],"score":0.041943371295928955},{"paths":[["nasa","has in context","business"]],"score":0.03522389009594917},{"paths":[["nasa","has in context","business"],["business","has in context","finance"]],"score":0.03522389009594917},{"paths":[["nasa","has in context","business"],["business","has in context","economy"]],"score":0.03522389009594917},{"paths":[["visit","is related to","finance"]],"score":0.032228704541921616},{"paths":[["visit","is related to","business"]],"score":0.032228704541921616},{"paths":[["visit","is related to","business"],["business","has in context","economy"]],"score":0.032228704541921616},{"paths":[["orbit","is related to","business"],["business","has in context","finance"]],"score":0.027573011815547943},{"paths":[["orbit","is related to","business"],["business","has in context","economy"]],"score":0.027573011815547943},{"paths":[["orbit","is related to","business"]],"score":0.027573011815547943},{"paths":[["spacecraft","is a(n)","business"],["business","has in context","economy"]],"score":0.011462253518402576},{"paths":[["spacecraft","is a(n)","business"],["business","has in context","finance"]],"score":0.011462253518402576},{"paths":[["spacecraft","is a(n)","business"]],"score":0.011462253518402576}]},{"highlights":[["nasa","0.04829716"],["spacecraft","0.061958622"],["set","0.057512313"],["new","-0.011305321"],["milestone","-0.032280076"],["monday","-1"],["cosmic","0.033187807"],["exploration","-1"],["entering","0.062264405"],["orbit","0.029256767"],["around","0.1298"],["asteroid","-1"],["bennu","-1"],["smallest","-1"],["object","0.0864032"],["ever","0.09289527"],["circled","-1"],["human_made","0.04039892"],["spaceship","-1"],["spacecraft","0.061958622"],["called","-1"],["osiris_rex","-1"],["first_ever","-1"],["u","0.03239175"],["mission","0.13454574"],["designed","-1"],["visit","0.025495933"],["asteroid","-1"],["return","0.045676213"],["sample","-0.0021330605"],["dust","0.09784245"],["back","0.035373498"],["earth","0.05514095"]],"label":"unrest-conflict-war","score":0.06027208941273196,"terms":[{"paths":[["mission","has a(n)","war"]],"score":0.13454574346542358},{"paths":[["around","is the antonym of","war"]],"score":0.1298000067472458},{"paths":[["dust","is related to","conflict"]],"score":0.09784244745969772},{"paths":[["dust","is related to","war"]],"score":0.09784244745969772},{"paths":[["ever","is related to","war"]],"score":0.0928952693939209},{"paths":[["object","is related to","conflict"]],"score":0.08640319854021072},{"paths":[["object","is related to","war"]],"score":0.08640319854021072},{"paths":[["entering","is related to","war"]],"score":0.06226440519094467},{"paths":[["entering","is related to","conflict"]],"score":0.06226440519094467},{"paths":[["spacecraft","is the location for","conflict"]],"score":0.06195862218737602},{"paths":[["spacecraft","is the location for","war"]],"score":0.06195862218737602},{"paths":[["set","is related to","war"]],"score":0.0575123131275177},{"paths":[["set","is related to","conflict"]],"score":0.0575123131275177},{"paths":[["earth","is related to","conflict"]],"score":0.05514094978570938},{"paths":[["earth","is related to","war"]],"score":0.05514094978570938},{"paths":[["nasa","is related to","war"]],"score":0.04829715937376022},{"paths":[["return","is related to","war"]],"score":0.04567621275782585},{"paths":[["return","is related to","conflict"]],"score":0.04567621275782585},{"paths":[["human_made","is related to","war"]],"score":0.04039892181754112},{"paths":[["back","is distinct from","conflict"]],"score":0.0353734977543354},{"paths":[["back","is distinct from","war"]],"score":0.0353734977543354},{"paths":[["cosmic","is similar to","war"]],"score":0.033187806606292725},{"paths":[["u","is related to","conflict"]],"score":0.0323917493224144},{"paths":[["u","is related to","war"]],"score":0.0323917493224144},{"paths":[["orbit","is the location for","war"]],"score":0.02925676666200161},{"paths":[["orbit","is the location for","conflict"]],"score":0.02925676666200161},{"paths":[["visit","is related to","conflict"]],"score":0.02549593336880207},{"paths":[["visit","is related to","war"]],"score":0.02549593336880207}]},{"highlights":[["nasa","-1"],["spacecraft","0.08820445"],["set","0.006974835"],["new","0.011736085"],["milestone","0.11813699"],["monday","-1"],["cosmic","-1"],["exploration","0.04239152"],["entering","-1"],["orbit","-1"],["around","0.008158717"],["asteroid","-1"],["bennu","-1"],["smallest","0.00890053"],["object","0.073251925"],["ever","-1"],["circled","-1"],["human_made","-1"],["spaceship","0.09901617"],["spacecraft","0.08820445"],["called","-1"],["osiris_rex","-1"],["first_ever","-1"],["u","0.022784445"],["mission","0.053327847"],["designed","0.08554068"],["visit","0.09201636"],["asteroid","-1"],["return","0.062008318"],["sample","-1"],["dust","0.1099745"],["back","0.04402902"],["earth","0.09020804"]],"label":"disaster-accident","score":0.058910595483847174,"terms":[{"paths":[["milestone","is related to","accident"]],"score":0.11813698709011078},{"paths":[["dust","is related to","atom"],["atom","is related to","disaster"]],"score":0.10997450351715088},{"paths":[["dust","is related to","accident"]],"score":0.10997450351715088},{"paths":[["spaceship","is related to","accident"]],"score":0.09901616722345352},{"paths":[["visit","is related to","accident"]],"score":0.09201636165380478},{"paths":[["earth","is in the context of","accident"]],"score":0.090208038687706},{"paths":[["spacecraft","is related to","accident"]],"score":0.08820445090532303},{"paths":[["designed","is related to","accident"]],"score":0.08554068207740784},{"paths":[["object","is related to","accident"]],"score":0.07325192540884018},{"paths":[["object","is related to","atom"],["atom","is related to","disaster"]],"score":0.07325192540884018},{"paths":[["return","is related to","accident"]],"score":0.062008317559957504},{"paths":[["mission","is related to","accident"]],"score":0.05332784727215767},{"paths":[["back","is related to","accident"]],"score":0.04402901977300644},{"paths":[["exploration","causes","accident"]],"score":0.042391519993543625},{"paths":[["new","is related to","accident"]],"score":0.011736084707081318},{"paths":[["smallest","is related to","accident"]],"score":0.008900529704988003},{"paths":[["smallest","is related to","atom"],["atom","is related to","disaster"]],"score":0.008900529704988003},{"paths":[["around","is related to","accident"]],"score":0.008158717304468155},{"paths":[["set","is related to","accident"]],"score":0.0069748349487781525},{"paths":[["set","is related to","atom"],["atom","is related to","disaster"]],"score":0.0069748349487781525}]},{"highlights":[["nasa","-1"],["spacecraft","-0.0038052914"],["set","0.07248779"],["new","0.022279914"],["milestone","-1"],["monday","-1"],["cosmic","-1"],["exploration","0.17118189"],["entering","0.08534613"],["orbit","0.004578567"],["around","-0.0061590355"],["asteroid","-1"],["bennu","-1"],["smallest","-1"],["object","0.013246166"],["ever","-0.016835902"],["circled","-1"],["human_made","-1"],["spaceship","0.015373262"],["spacecraft","-0.0038052914"],["called","-1"],["osiris_rex","-1"],["first_ever","-1"],["u","0.09174712"],["mission","0.18034016"],["designed","-1"],["visit","0.13339207"],["asteroid","-1"],["return","0.002469875"],["sample","-0.013818666"],["dust","-0.059916932"],["back","0.009010077"],["earth","0.041999366"]],"label":"education","score":0.044972269829582745,"terms":[{"paths":[["u","is in the context of","education"]],"score":0.09174712002277374},{"paths":[["set","is in the context of","education"]],"score":0.07248778641223907},{"paths":[["earth","is synonym of","art"],["art","uses","education"]],"score":0.041999366134405136},{"paths":[["new","is related to","idea"],["idea","is related to","education"]],"score":0.02227991446852684}]},{"highlights":[["nasa","0.0043062777"],["spacecraft","0.010131659"],["set","0.016023578"],["new","0.059914652"],["milestone","-1"],["monday","-1"],["cosmic","0.16337483"],["exploration","-1"],["entering","-1"],["orbit","0.06796242"],["around","-1"],["asteroid","0.044889845"],["bennu","-1"],["smallest","-1"],["object","0.07650519"],["ever","-1"],["circled","-1"],["human_made","-1"],["spaceship","-1"],["spacecraft","0.010131659"],["called","-1"],["osiris_rex","-1"],["first_ever","-1"],["u","-0.06993914"],["mission","0.15504739"],["designed","-1"],["visit","-0.040126678"],["asteroid","0.044889845"],["return","0.020404894"],["sample","-0.03787922"],["dust","0.015503079"],["back","-0.010644132"],["earth","0.11798396"]],"label":"religion-belief","score":0.043032349318733336,"terms":[{"paths":[["mission","is related to","belief"]],"score":0.15504738688468933},{"paths":[["earth","is related to","belief"]],"score":0.11798395961523056},{"paths":[["earth","is related to","religion"]],"score":0.11798395961523056},{"paths":[["object","is related to","belief"]],"score":0.07650519162416458},{"paths":[["orbit","is the location for","earth"],["earth","is related to","religion"]],"score":0.06796242296695709},{"paths":[["orbit","is related to","belief"]],"score":0.06796242296695709},{"paths":[["new","desires","belief"]],"score":0.05991465225815773},{"paths":[["asteroid","is related to","belief"]],"score":0.044889844954013824},{"paths":[["return","is related to","belief"]],"score":0.020404893904924393},{"paths":[["set","is related to","office"],["office","is related to","religion"]],"score":0.016023578122258186},{"paths":[["set","is related to","belief"]],"score":0.016023578122258186}]},{"highlights":[["nasa","-0.0035504156"],["spacecraft","0.01949758"],["set","0.044725914"],["new","-0.0033574319"],["milestone","0.05215623"],["monday","-1"],["cosmic","-1"],["exploration","0.15847622"],["entering","-1"],["orbit","-1"],["around","0.06730187"],["asteroid","-0.024015961"],["bennu","-1"],["smallest","-1"],["object","-0.016411042"],["ever","-0.033155132"],["circled","-1"],["human_made","-1"],["spaceship","0.03155378"],["spacecraft","0.01949758"],["called","-1"],["osiris_rex","-1"],["first_ever","-1"],["u","-1"],["mission","0.1487204"],["designed","-1"],["visit","0.1138416"],["asteroid","-0.024015961"],["return","-1"],["sample","0.025501553"],["dust","-1"],["back","-0.0016390211"],["earth","0.07663738"]],"label":"lifestyle-leisure","score":0.040411217794615976,"terms":[{"paths":[["exploration","is related to","leisure"]],"score":0.15847621858119965},{"paths":[["mission","is a(n)","leisure"]],"score":0.1487203985452652},{"paths":[["visit","is related to","leisure"]],"score":0.11384160071611404},{"paths":[["earth","is related to","leisure"]],"score":0.0766373798251152},{"paths":[["around","is related to","leisure"]],"score":0.06730186939239502},{"paths":[["set","is synonym of","leisure"]],"score":0.04472591355443001},{"paths":[["spaceship","can be found at","leisure"]],"score":0.03155377879738808},{"paths":[["sample","is in the context of","leisure"]],"score":0.0255015529692173},{"paths":[["sample","is related to","culture"],["culture","is related to","lifestyle"]],"score":0.0255015529692173},{"paths":[["spacecraft","is related to","leisure"]],"score":0.0194975808262825}]},{"highlights":[["nasa","0.011734581"],["spacecraft","-1"],["set","0.08131558"],["new","0.13656357"],["milestone","-1"],["monday","-1"],["cosmic","-1"],["exploration","-0.09832398"],["entering","0.058464885"],["orbit","-0.0014310944"],["around","-0.014886554"],["asteroid","0.01781399"],["bennu","-1"],["smallest","0.047258396"],["object","0.015259667"],["ever","0.02307925"],["circled","-1"],["human_made","-1"],["spaceship","-1"],["spacecraft","-1"],["called","-1"],["osiris_rex","-1"],["first_ever","-1"],["u","0.06779356"],["mission","0.017359596"],["designed","-1"],["visit","-0.0006354599"],["asteroid","0.01781399"],["return","0.05455815"],["sample","-0.04406352"],["dust","0.091220275"],["back","0.013106927"],["earth","0.07192309"]],"label":"crime-law-justice","score":0.03867063162929745,"terms":[{"paths":[["new","is related to","law"]],"score":0.13656356930732727},{"paths":[["new","is related to","law"],["law","is related to","crime"]],"score":0.13656356930732727},{"paths":[["new","is related to","justice"]],"score":0.13656356930732727},{"paths":[["dust","is in the context of","law"]],"score":0.09122027456760406},{"paths":[["dust","is in the context of","law"],["law","is related to","justice"]],"score":0.09122027456760406},{"paths":[["dust","is in the context of","law"],["law","is related to","crime"]],"score":0.09122027456760406},{"paths":[["set","is related to","law"],["law","is related to","justice"]],"score":0.08131557703018188},{"paths":[["set","is related to","law"],["law","is related to","crime"]],"score":0.08131557703018188},{"paths":[["set","is related to","law"]],"score":0.08131557703018188},{"paths":[["earth","is related to","law"]],"score":0.07192309200763702},{"paths":[["earth","is part of","law"],["law","is related to","crime"]],"score":0.07192309200763702},{"paths":[["earth","is related to","justice"]],"score":0.07192309200763702},{"paths":[["u","is in the context of","law"],["law","is related to","crime"]],"score":0.06779356300830841},{"paths":[["u","is in the context of","law"],["law","is related to","justice"]],"score":0.06779356300830841},{"paths":[["u","is in the context of","law"]],"score":0.06779356300830841},{"paths":[["entering","is related to","law"],["law","is related to","crime"]],"score":0.058464884757995605},{"paths":[["entering","is related to","law"],["law","is related to","justice"]],"score":0.058464884757995605},{"paths":[["entering","is related to","law"]],"score":0.058464884757995605},{"paths":[["return","is related to","law"],["law","is related to","crime"]],"score":0.054558150470256805},{"paths":[["return","is a(n)","justice"]],"score":0.054558150470256805},{"paths":[["return","is a(n)","law"]],"score":0.054558150470256805},{"paths":[["smallest","is related to","justice"]],"score":0.047258395701646805},{"paths":[["ever","is in the context of","law"],["law","is related to","crime"]],"score":0.023079250007867813},{"paths":[["ever","is related to","law"]],"score":0.023079250007867813},{"paths":[["ever","is related to","justice"]],"score":0.023079250007867813},{"paths":[["asteroid","is related to","justice"]],"score":0.017813989892601967},{"paths":[["mission","is synonym of","law"],["law","is related to","crime"]],"score":0.017359595745801926},{"paths":[["mission","is synonym of","law"]],"score":0.017359595745801926},{"paths":[["mission","is synonym of","law"],["law","is related to","justice"]],"score":0.017359595745801926},{"paths":[["object","is related to","law"]],"score":0.015259667299687862},{"paths":[["object","is related to","law"],["law","is related to","crime"]],"score":0.015259667299687862},{"paths":[["object","is related to","justice"]],"score":0.015259667299687862},{"paths":[["back","is related to","law"]],"score":0.013106927275657654},{"paths":[["back","is related to","law"],["law","is related to","crime"]],"score":0.013106927275657654},{"paths":[["back","is related to","law"],["law","is related to","justice"]],"score":0.013106927275657654},{"paths":[["nasa","is related to","law"],["law","is related to","crime"]],"score":0.011734580621123314},{"paths":[["nasa","is related to","law"]],"score":0.011734580621123314},{"paths":[["nasa","is related to","law"],["law","is related to","justice"]],"score":0.011734580621123314}]},{"highlights":[["nasa","-1"],["spacecraft","-1"],["set","0.009113047"],["new","0.02213493"],["milestone","-0.03327766"],["monday","0.11120317"],["cosmic","0.058685474"],["exploration","-0.03850006"],["entering","0.03216047"],["orbit","0.072018474"],["around","0.03753391"],["asteroid","-1"],["bennu","-1"],["smallest","-1"],["object","0.036198925"],["ever","-0.0072472687"],["circled","-1"],["human_made","-1"],["spaceship","0.0132781165"],["spacecraft","-1"],["called","-0.015482399"],["osiris_rex","-1"],["first_ever","-1"],["u","0.0025518655"],["mission","-1"],["designed","-1"],["visit","-1"],["asteroid","-1"],["return","0.035961863"],["sample","-0.0778903"],["dust","0.12826192"],["back","-0.06055917"],["earth","0.1355517"]],"label":"weather","score":0.037038441496950854,"terms":[{"paths":[["earth","is distinct from","moon"],["moon","is the location for","weather"]],"score":0.13555170595645905},{"paths":[["dust","can be found at","moon"],["moon","is the location for","weather"]],"score":0.12826192378997803},{"paths":[["orbit","is related to","moon"],["moon","is the location for","weather"]],"score":0.07201847434043884},{"paths":[["around","is related to","weather"]],"score":0.03753390908241272},{"paths":[["object","is related to","moon"],["moon","is the location for","weather"]],"score":0.036198925226926804},{"paths":[["return","is related to","change"],["change","is related to","weather"]],"score":0.03596186265349388},{"paths":[["new","is related to","time"],["time","is related to","weather"]],"score":0.022134929895401},{"paths":[["set","is synonym of","time"],["time","is related to","weather"]],"score":0.009113047271966934}]},{"highlights":[["nasa","0.042628348"],["spacecraft","-1"],["set","0.041059013"],["new","0.05034602"],["milestone","0.0019198279"],["monday","-1"],["cosmic","-1"],["exploration","0.04679147"],["entering","0.010786243"],["orbit","-1"],["around","0.010644636"],["asteroid","0.008643962"],["bennu","-1"],["smallest","0.05664832"],["object","0.05246342"],["ever","0.0844536"],["circled","-1"],["human_made","-1"],["spaceship","-0.032919116"],["spacecraft","-1"],["called","0.027683077"],["osiris_rex","-1"],["first_ever","-1"],["u","0.06981151"],["mission","-1"],["designed","-1"],["visit","-0.033052526"],["asteroid","0.008643962"],["return","0.033009794"],["sample","-1"],["dust","0.006089752"],["back","0.02480115"],["earth","0.00966749"]],"label":"sport","score":0.031249979387310875,"terms":[{"paths":[["return","is in the context of","cricket"],["cricket","is a(n)","sport"]],"score":0.03300979360938072}]},{"highlights":[["nasa","-0.013020366"],["spacecraft","-0.042450685"],["set","0.014255899"],["new","0.036699556"],["milestone","0.0581201"],["monday","-1"],["cosmic","-1"],["exploration","0.03756523"],["entering","-1"],["orbit","0.018161416"],["around","0.032772418"],["asteroid","0.005980087"],["bennu","-1"],["smallest","-1"],["object","0.020463552"],["ever","-1"],["circled","-1"],["human_made","-1"],["spaceship","-1"],["spacecraft","-0.042450685"],["called","-1"],["osiris_rex","-1"],["first_ever","-1"],["u","0.057876438"],["mission","-1"],["designed","-1"],["visit","0.086655855"],["asteroid","0.005980087"],["return","0.07194122"],["sample","-1"],["dust","0.020101255"],["back","0.054747194"],["earth","0.04627075"]],"label":"health","score":0.030263544268872046,"terms":[{"paths":[["visit","is in the context of","insurance"],["insurance","is related to","health"]],"score":0.08665585517883301},{"paths":[["new","is related to","apple"],["apple","is related to","health"]],"score":0.036699555814266205},{"paths":[["object","is related to","medicine"],["medicine","is related to","health"]],"score":0.020463552325963974}]},{"highlights":[["nasa","-0.0035504156"],["spacecraft","0.01949758"],["set","-0.008435039"],["new","-0.0033574319"],["milestone","-1"],["monday","-1"],["cosmic","-1"],["exploration","0.15847622"],["entering","-1"],["orbit","-1"],["around","0.06730187"],["asteroid","-0.024015961"],["bennu","-1"],["smallest","-1"],["object","-0.016411042"],["ever","-0.033155132"],["circled","-1"],["human_made","-1"],["spaceship","0.03155378"],["spacecraft","0.01949758"],["called","-1"],["osiris_rex","-1"],["first_ever","-1"],["u","-1"],["mission","-0.041332066"],["designed","-1"],["visit","0.1138416"],["asteroid","-0.024015961"],["return","-1"],["sample","-0.04060822"],["dust","-1"],["back","-0.014264355"],["earth","-0.002224184"]],"label":"leisure","score":0.0218698942627799,"terms":[{"paths":[["exploration","is related to","space"],["space","is related to","leisure"]],"score":0.15847621858119965},{"paths":[["visit","is related to","space"],["space","is related to","leisure"]],"score":0.11384160071611404},{"paths":[["around","is related to","space"],["space","is related to","leisure"]],"score":0.06730186939239502},{"paths":[["spaceship","can be found at","space"],["space","is related to","leisure"]],"score":0.03155377879738808},{"paths":[["spacecraft","is related to","space"],["space","is related to","leisure"]],"score":0.0194975808262825}]},{"highlights":[["nasa","0.011057248"],["spacecraft","-1"],["set","-0.022810739"],["new","0.041567385"],["milestone","-1"],["monday","-1"],["cosmic","-1"],["exploration","0.07650129"],["entering","-1"],["orbit","0.047579266"],["around","-1"],["asteroid","-1"],["bennu","-1"],["smallest","-1"],["object","0.0015739304"],["ever","-1"],["circled","-1"],["human_made","-1"],["spaceship","-1"],["spacecraft","-1"],["called","-1"],["osiris_rex","-1"],["first_ever","-1"],["u","-1"],["mission","-0.0009778687"],["designed","-1"],["visit","-1"],["asteroid","-1"],["return","0.027468901"],["sample","-0.06959897"],["dust","-1"],["back","0.029790914"],["earth","-0.004767689"]],"label":"politics","score":0.012558765297796037,"terms":[]}],"text":"A NASA spacecraft set a new milestone Monday in cosmic exploration by entering orbit around an asteroid, Bennu, the smallest object ever to be circled by a human-made spaceship. The spacecraft, called OSIRIS-REx, is the first-ever US mission designed to visit an asteroid and return a sample of its dust back to Earth.."}


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

              <h2>Or enter the text for which you want to extract topics</h2>

              {inputURL.length === 0 && (
                <div>
                  <Textarea value={inputText} onChange={(ev) => setInputText(ev.target.value)} />
                </div>
              ) || (
                <div style={{ marginBottom: '1.5em' }}>
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
