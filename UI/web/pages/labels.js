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

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Term from '@/components/Term';
import { PrimaryButton, SecondaryButton } from '@/components/Button';
import { Steps, StepDetails, StepIcon, Step, StepNumber, StepLabel, StepBlock } from '@/components/Step';
import { shadeColor, getTextColour } from '@/helpers/utils';
import SpinningLemon from '@/components/SpinningLemon';

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

const Columns = styled.div`
display: flex;
flex-direction: row;
`;

const Column = styled.div`
flex: 1;
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
  clickToUse: true,
  height: '100%',
  width: '100%',
  layout: {
    hierarchical: false
  },
  edges: {
    arrows: {
      from: {
        enabled: false
      },
      to: {
        enabled: false
      }
    },
    color: '#000000'
  },
  interaction: {
    hideEdgesOnZoom: true
  },
  physics: {
    enabled: true,
    solver: "forceAtlas2Based",
    stabilization: {
      enabled: false,
    }
  }
};

function LabelsPage({ reactAppServerUrl }) {
  const [ isLoading, setIsLoading ] = useState(false);
  const [ predictions, setPredictions ] = useState([]);
  const [ differences, setDifferences ] = useState([]);
  const [ diffSearch, setDiffSearch ] = useState('');
  const [ inputText, setInputText ] = useState('Prompt default value...');
  const [ userLabel, setUserLabel ] = useState(null);
  const [ error, setError ] = useState(null);
  const [ graphKey, setGraphKey ] = useState(uuidv4());
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
    const data = [["atheism"]];
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

      data = {
        "results": {
          "conceptnet_scores": [["atheism", "1.0"], ["atheisms", "0.99816245"], ["antiatheist", "0.9432749"], ["atheisticalness", "0.92178965"], ["atheophobia", "0.89585364"], ["antiatheistic", "0.89280087"], ["new_atheism", "0.8903558"], ["ignosticism", "0.8804883"], ["new_atheist", "0.87132925"], ["atheistically", "0.866252"], ["atheophobic", "0.8501979"], ["atheophobe", "0.8486393"], ["atheist", "0.8464324"], ["atheistic", "0.84560066"], ["pascal's_wager", "0.84548426"], ["neo_atheist", "0.84135807"], ["panatheism", "0.84067667"], ["apatheism", "0.8396679"], ["unatheist", "0.8326859"], ["nonatheist", "0.8295317"], ["ignostic", "0.82828856"], ["unatheistic", "0.82713157"], ["atheistical", "0.82607484"], ["apeirotheism", "0.8204372"], ["atheous", "0.8069635"], ["nontheism", "0.8038705"], ["atheisticness", "0.8030062"], ["antitheistic", "0.7977978"], ["hard_atheist", "0.79668975"], ["antitheism", "0.7938669"], ["theism", "0.79238707"], ["atheization", "0.7900487"], ["antitheist", "0.7895245"], ["pre_theistic", "0.7874249"], ["theistical", "0.78543186"], ["omnitheism", "0.78429556"], ["aatheist", "0.78307927"], ["soft_atheist", "0.7810514"], ["atheize", "0.7786294"], ["believer_in_atheism", "0.77850604"], ["nontheist", "0.7730323"], ["tetratheist", "0.7695253"], ["theistic", "0.7668107"], ["disgodded", "0.76656425"], ["atheologist", "0.7663959"], ["allotheism", "0.76549876"], ["multitheism", "0.76301605"], ["apatheist", "0.7580654"], ["omnitheist", "0.75650764"], ["theistically", "0.753034"], ["nontheistic", "0.7482475"], ["theists", "0.74098027"], ["theaism", "0.7398045"], ["faitheist", "0.7368498"], ["suitheism", "0.7361367"], ["polypantheism", "0.735822"], ["pandeist", "0.73018086"], ["atheology", "0.72488075"], ["cosmotheism", "0.7234782"], ["ditheistic", "0.7223948"], ["suitheistic", "0.7216623"], ["theist", "0.71951175"], ["agnosticism", "0.71743304"], ["tetratheism", "0.71411127"], ["autotheism", "0.71224946"], ["theopanism", "0.7088544"], ["ditheism", "0.7078639"], ["theinism", "0.7072703"], ["dawkinsian", "0.703584"], ["monolatrism", "0.70126134"], ["tritheistic", "0.69983685"], ["bitheism", "0.6971245"], ["dystheism", "0.6958946"], ["nonbelief", "0.6954435"], ["deism", "0.6952714"], ["transtheistic", "0.6936227"], ["anti_agnostic", "0.692332"], ["atheists", "0.69058514"], ["hylotheism", "0.68886787"], ["non_religious_person", "0.68716246"], ["tritheist", "0.6864368"], ["ultra_darwinism", "0.6858478"], ["dawkinite", "0.6852431"], ["personal_god", "0.68344474"], ["deisms", "0.6825536"], ["pandeism", "0.68189275"], ["god_hypothesis", "0.67711246"], ["atheological", "0.6747699"], ["free_thought", "0.67426753"], ["kathenotheism", "0.67076856"], ["nullifidian", "0.6703827"], ["azeusist", "0.6681278"], ["dystheist", "0.6665698"], ["panendeism", "0.6645181"], ["gaytheist", "0.663959"], ["religious_naturalist", "0.663186"], ["duotheism", "0.65847546"], ["panendeist", "0.6579374"], ["eutheism", "0.6544288"], ["antireligion", "0.65095836"], ["deistical", "0.6470841"], ["neo_pantheism", "0.64681137"], ["atheitard", "0.64630234"], ["tritheism", "0.64610636"], ["religious_naturalism", "0.6453934"], ["panentheism", "0.644391"], ["agnostics", "0.643996"], ["pantheistical", "0.6392638"], ["pantheology", "0.63691175"], ["binitarianism", "0.6359154"], ["binitarian", "0.6353352"], ["antiagnostic", "0.6334094"], ["pantheism", "0.6299648"], ["neo_pantheist", "0.62958664"], ["nonreligion", "0.62885445"], ["transtheism", "0.6272246"], ["bitheistic", "0.62717545"], ["theistic_religion", "0.62560266"], ["istical", "0.62493086"], ["cataphatism", "0.6246064"], ["godite", "0.62332004"], ["godless", "0.62231547"], ["freethinker", "0.617712"], ["duotheistic", "0.6147053"], ["maltheism", "0.6126097"], ["irreligious", "0.60973585"], ["secularism", "0.6093723"], ["pantheisms", "0.6088499"], ["deconversion", "0.6087852"], ["religionistic", "0.60849863"], ["pantheistically", "0.6080581"], ["multidogmatic", "0.60739"], ["polydeism", "0.6038892"], ["religion", "0.60271966"], ["nonbeliever", "0.59709436"], ["antignostic", "0.59679526"], ["panentheist", "0.5936828"], ["religionlessly", "0.5925568"], ["unreligion", "0.5913155"], ["spiritual_naturalism", "0.59112597"], ["theophobist", "0.5909344"], ["deist", "0.5881542"], ["unitarianism", "0.58749497"], ["secular_progressivism", "0.58531517"], ["panentheistical", "0.58513874"], ["pantheist", "0.5846743"], ["religious_orientation", "0.584215"], ["deconfessionalize", "0.58374095"], ["deistic", "0.5831953"], ["religionization", "0.5826549"], ["religionless", "0.5815681"], ["western_christian", "0.580024"], ["creationism", "0.5778423"], ["panvitalism", "0.5769651"], ["quadrinitarianism", "0.5767801"], ["septenarianism", "0.5767801"], ["septarianism", "0.5767801"], ["religious_denomination", "0.57654357"], ["religious_belief", "0.5750137"], ["pseudoreligion", "0.5747166"], ["parareligion", "0.5741242"], ["deconfessionalization", "0.573236"], ["unprotestantize", "0.57184064"], ["theomonism", "0.5714597"], ["christianity", "0.5708972"], ["misreligion", "0.57087916"], ["theophobe", "0.56992185"], ["theophobia", "0.5695607"], ["organized_religion", "0.56767416"], ["apophatism", "0.56722915"], ["secularistic", "0.56303155"], ["ultra_darwinist", "0.56271863"], ["church_planter", "0.56248605"], ["clockwork_universe", "0.5604398"], ["antireligious", "0.5583802"], ["hierophanically", "0.5578599"], ["heliotheistic", "0.55638623"], ["hierophanic", "0.5556031"], ["polytheism", "0.55293864"], ["psychotheism", "0.5524428"], ["theophilosophy", "0.5523722"], ["hierophanical", "0.5520371"], ["anythingarianism", "0.5513922"], ["anticelibacy", "0.55063736"], ["anti_metaphysics", "0.5502644"], ["hylozoism", "0.54855394"], ["judeo_christo_islamic", "0.5482646"], ["physicotheology", "0.548104"], ["nunc_stans", "0.54786223"], ["physiolatry", "0.5476677"], ["unbelief", "0.54748404"], ["panentheistic", "0.5473734"], ["teleological_argument", "0.54651725"], ["antimetaphysics", "0.5464933"], ["trinitarianism", "0.5456759"], ["abrahamism", "0.5453706"], ["religiose", "0.54390967"], ["religiophilosophical", "0.5410199"], ["monotheism", "0.5408037"], ["religioner", "0.54022664"], ["pantheistic", "0.53926355"], ["triunitarianism", "0.5388967"], ["henotheism", "0.5377732"], ["religicide", "0.53706276"], ["religiocide", "0.53706276"], ["pan_theism", "0.5353347"], ["mama_tata", "0.5345268"], ["vamachara", "0.5330564"], ["agnostic", "0.5330311"], ["total_depravity", "0.53040487"], ["secularist", "0.5281478"], ["polytheisms", "0.5278145"], ["unbelievingness", "0.52778506"], ["ontological_argument", "0.5264912"], ["creatianism", "0.52644694"], ["old_earth_creationism", "0.5261872"], ["agnostically", "0.5259379"], ["i'm_atheist", "0.5251934"], ["master_of_universe", "0.5246984"], ["omphalos_hypothesis", "0.5244949"], ["religitard", "0.52421236"], ["secularity", "0.5240569"], ["mandaeism", "0.5232924"], ["heliotheism", "0.52204216"], ["original_sin", "0.52198386"], ["unitarian_universalism", "0.5217552"], ["egotheism", "0.5214922"], ["heliotheist", "0.52001226"], ["disbeliever", "0.5194354"], ["confessionalize", "0.5188935"], ["urreligion", "0.51872796"], ["caodaiist", "0.51821506"], ["antichristianism", "0.5176206"], ["christian_anarchism", "0.51751906"], ["ietsism", "0.5172671"], ["polytheistical", "0.5161058"], ["religionism", "0.5160901"], ["monotheisms", "0.51493055"], ["belief_system", "0.514016"], ["religionary", "0.5129087"], ["judeo_christian", "0.5128758"], ["fundamentalism", "0.5127985"], ["zootheism", "0.5112723"], ["prorevivalist", "0.510401"], ["polytheist", "0.5102029"], ["unbeliever", "0.5090137"], ["kierkegaardianism", "0.50895953"], ["theophobic", "0.50876284"], ["voluntas_ordinata", "0.5076891"], ["misotheism", "0.50751066"], ["anythingarian", "0.50638705"], ["humanism", "0.50616884"], ["religioning", "0.5057565"], ["means_of_grace", "0.5056386"], ["religionist", "0.5041524"], ["jehovah's_witnesses", "0.503389"], ["tertullianist", "0.5033821"], ["theothanatology", "0.5031868"], ["probabiliorism", "0.503106"], ["religofascist", "0.5029222"], ["recatholization", "0.50224847"], ["catholization", "0.50224847"], ["wanbelief", "0.5021627"], ["misbeliever", "0.50134575"], ["christian_science", "0.49972165"], ["satanic_bible", "0.49957305"], ["calvinism", "0.49893317"], ["monotheistic", "0.4988052"], ["transubstantiationism", "0.49849692"], ["religtard", "0.49724388"], ["multifaith", "0.49705458"], ["monotheist", "0.49679223"], ["baha_ism", "0.4961598"], ["ultimism", "0.49610686"], ["god_squad", "0.49543917"], ["evangelicalism", "0.49504054"], ["religiophilosophy", "0.49491903"], ["cantheism", "0.4939039"], ["cao_dai", "0.49349892"], ["mother_of_god", "0.49309978"], ["trinitize", "0.49251944"], ["evolutionism", "0.49230456"], ["cosmological_argument", "0.4904924"], ["bahaism", "0.48977572"], ["monolatrous", "0.48941785"], ["church_militant", "0.48932263"], ["indifferentism", "0.48910773"], ["romanism", "0.4890141"], ["spiritual_violence", "0.4889509"], ["eternal_return", "0.4886901"], ["nature_worship", "0.48847902"], ["religionize", "0.48845395"], ["ancient_of_days", "0.48806"], ["important_to_people", "0.4877305"], ["catholicism", "0.48626375"], ["won_buddhism", "0.48618668"], ["cataphatic", "0.4857183"], ["belief_in_god", "0.48491827"], ["desecularize", "0.4846763"], ["theanthroposophy", "0.48461482"], ["kimbanguism", "0.48430955"], ["rajneeshee", "0.4835578"], ["monolater", "0.4828969"], ["people_of_book", "0.48288772"], ["old_believer", "0.48276043"], ["docetae", "0.48248196"], ["caodaism", "0.48187226"], ["darwinism", "0.48065138"], ["antisecular", "0.4792965"], ["ametaphysics", "0.47914833"], ["rationalism", "0.4790286"], ["christo_islamic", "0.47828576"], ["theodicy", "0.47777945"], ["theanthropism", "0.4768046"], ["hussitism", "0.47643948"], ["ontotheology", "0.47637767"], ["deconvert", "0.47573605"], ["ens_entium", "0.47552222"], ["physicalism", "0.47535938"], ["pray_gay_away", "0.47526824"], ["tripersonalism", "0.4752006"], ["apostles_creed", "0.47507173"], ["heathendom", "0.474295"], ["goddist", "0.47423202"], ["religious_education", "0.47401834"], ["five_point_calvinist", "0.47219783"], ["reichism", "0.47088623"], ["god_of_gaps", "0.4702969"], ["semipelagianism", "0.469738"], ["nusayri", "0.4697283"], ["politicoreligious", "0.46942267"], ["prosperity_theology", "0.469218"], ["adevism", "0.46908876"], ["g\u00fcntherian", "0.4685565"], ["tengrism", "0.46846625"], ["eternal_recurrence", "0.46815985"], ["nonfaith", "0.467096"], ["theatine", "0.46519902"], ["euthyphro_dilemma", "0.46505374"], ["patrological", "0.4649993"], ["free_thinking", "0.4645709"], ["immanentism", "0.46312356"], ["leap_of_faith", "0.46172416"], ["antimetaphysically", "0.4603522"], ["predestinarianism", "0.45988035"], ["theology", "0.4597925"], ["paganism", "0.4593636"], ["evilutionist", "0.45892414"], ["nihilism", "0.45881703"], ["evidentialism", "0.45860597"], ["mono_theism", "0.45820177"], ["theosophism", "0.45723724"], ["belief", "0.45718902"], ["interfaithless", "0.45711714"], ["thanatolatry", "0.45646104"], ["four_point_calvinist", "0.45603466"], ["ayyavazhi", "0.45597482"], ["kadiempembe", "0.45452726"], ["diabology", "0.45452726"], ["materialism", "0.45408255"], ["theophilanthropy", "0.45383117"], ["religions", "0.45357776"], ["agnosis", "0.45353857"], ["nikonian", "0.45350555"], ["gnosticism", "0.45324668"], ["author_of_life", "0.45305353"], ["plymouthism", "0.452204"], ["polytheize", "0.4508822"], ["hierophany", "0.4493376"], ["ufo_religion", "0.44925946"], ["religiofascist", "0.44835025"], ["anticult", "0.44818324"], ["ecclesiarchy", "0.44817096"], ["beliefless", "0.44784006"], ["secular", "0.44758087"], ["suprareligious", "0.4473108"], ["monism", "0.4464147"], ["anticonversion", "0.44639474"], ["ungod", "0.44603074"], ["multireligious", "0.44593605"], ["nuwaubianism", "0.4447769"], ["theopneust", "0.44466037"], ["monolatry", "0.44410375"], ["sandemanian", "0.44395304"], ["miscreance", "0.44346836"], ["theistic_evolution", "0.44292468"], ["fundamentalist", "0.44248414"], ["jesusanity", "0.44181573"], ["intelligent_design", "0.44142443"], ["deityless", "0.44139832"], ["unitarian", "0.4409743"], ["plymouthist", "0.44071805"], ["confessionalization", "0.44064263"], ["praise_lord", "0.44033164"], ["anthropotheism", "0.4400121"], ["arrow_prayer", "0.4398306"], ["hierology", "0.4381546"], ["infidel", "0.4366898"], ["panzoism", "0.4363034"], ["subreligion", "0.4357362"], ["apophatic", "0.43528295"], ["mouridism", "0.43495592"], ["tree_of_life", "0.43402547"], ["supernaturalism", "0.4335057"], ["kroni", "0.43330306"], ["world_soul", "0.4321732"], ["african_traditional_religion", "0.43206537"], ["latreutic", "0.431506"], ["osophy", "0.43128943"], ["mormonism", "0.43078473"], ["zindiq", "0.4301746"], ["orthodoxy", "0.42977548"], ["universalism", "0.42972288"], ["antimetaphysicality", "0.42945194"], ["misfaith", "0.4274515"], ["antimissionary", "0.42664576"], ["malebranchism", "0.42645884"], ["polytheistic", "0.42626533"], ["word_of_faith", "0.42528415"], ["feminist_theology", "0.42480496"], ["impedient", "0.42443404"], ["theosis", "0.42408732"], ["thearchy", "0.42405662"], ["waheguru", "0.4238032"], ["holy_fire", "0.42369318"], ["arch_heretic", "0.4233824"], ["multiconfessional", "0.42321938"], ["homodoxy", "0.4224179"], ["belieflike", "0.42237294"], ["calvinist", "0.42221457"], ["eupraxophy", "0.42184272"], ["washing_of_feet", "0.4217376"], ["antimetaphysical", "0.42145708"], ["archdeceiver", "0.4211997"], ["anthropomorphist", "0.42106992"], ["dogma", "0.4207312"], ["dogmatic", "0.42029306"], ["open_table", "0.42007053"], ["stercoranism", "0.4198346"], ["religism", "0.4192405"], ["nonobservant", "0.41886544"], ["ecclesiasticism", "0.41870517"], ["theopathy", "0.41769564"], ["blik", "0.4161788"], ["psycholatry", "0.4159874"], ["great_schism", "0.41511142"], ["local_preacher", "0.41475165"], ["lay_speaker", "0.41475165"], ["religious", "0.4145326"], ["theopaschism", "0.41431332"], ["beliefs", "0.41429132"], ["religiophobia", "0.4139803"], ["rapturist", "0.41300994"], ["theatines", "0.41282684"], ["thomism", "0.41277826"], ["ploutos", "0.41247052"], ["misbelief", "0.41157493"], ["magicoreligious", "0.41156238"], ["deistic_evolution", "0.41155624"], ["hyperdulic", "0.41067296"], ["lay_preacher", "0.41017026"], ["frankism", "0.40990597"], ["felix_culpa", "0.40951157"], ["simonism", "0.4095036"], ["catechismal", "0.4091441"], ["misbelieve", "0.40828192"], ["pastafarianism", "0.40759832"], ["desacralization", "0.40733066"], ["somethingism", "0.4072012"], ["faith", "0.4067817"], ["humanist", "0.40587962"], ["hesychast_controversy", "0.40584043"], ["exomologesis", "0.4046928"], ["icism", "0.40463996"], ["anthropos", "0.40460557"], ["wodenist", "0.4045291"], ["faith_based", "0.40415066"], ["abstract_idea", "0.40396172"], ["interconfessional", "0.40349925"], ["self_religion", "0.40339857"], ["shariatic", "0.40336648"], ["religiophobic", "0.40269"], ["foundationalism", "0.40260178"], ["god_botherer", "0.4025849"], ["lay_reader", "0.40244037"], ["religiophobe", "0.4015314"], ["autosoterism", "0.40141138"], ["heaven_of_heavens", "0.40140444"], ["invincible_ignorance", "0.4003303"], ["molinism", "0.39989507"], ["dispensationalism", "0.3998931"], ["metabelief", "0.39980915"], ["hedge_parson", "0.39934778"], ["origenist", "0.3991083"], ["heresy", "0.3989464"], ["deathbed_conversion", "0.39858305"], ["laicism", "0.39851117"], ["terminism", "0.39772323"], ["metaphysics", "0.39768866"], ["acosmism", "0.3973093"], ["satanity", "0.39631245"], ["sola_gratia", "0.3962335"], ["prevenient_grace", "0.39608878"], ["proselytize", "0.3958153"], ["atenism", "0.39572075"], ["marprelatist", "0.3954668"], ["de_islamization", "0.39519793"], ["presbyterianism", "0.3951773"], ["religious_pluralism", "0.39438626"], ["spread_ideas", "0.3939835"], ["desert_father", "0.39358264"], ["believer", "0.3929792"], ["kardecism", "0.3929237"], ["heterodoxy", "0.3926778"], ["gymnosophy", "0.39266345"], ["miraculism", "0.39247"], ["syneisaktism", "0.3924431"], ["sedevacantism", "0.3914576"], ["flying_spaghetti_monsterism", "0.39084697"], ["naassene", "0.3903106"], ["cosmism", "0.38953662"], ["monothelete", "0.38918936"], ["creeded", "0.3887382"], ["modalism", "0.3886691"], ["emanationism", "0.3872767"], ["inclusivism", "0.3871536"], ["first_vision", "0.38707113"], ["anglicanism", "0.38700107"], ["eternal_sin", "0.38679788"], ["spirituality", "0.38641468"], ["exercitant", "0.38638735"], ["gentilism", "0.38519835"], ["apocatastasis", "0.38494486"], ["homodox", "0.38449162"], ["prorevival", "0.38422298"], ["godlore", "0.38422272"], ["forebelief", "0.38360333"], ["latitudinarian", "0.38329208"], ["doctrine", "0.3832467"], ["unbelieving", "0.3832082"], ["secularization", "0.3831446"], ["physicism", "0.38274646"], ["gettiered", "0.38257515"], ["denominationalism", "0.38196835"], ["scotist", "0.38192242"], ["primum_mobile", "0.38130572"], ["matrixism", "0.38080537"], ["univocity", "0.38027808"], ["swedenborgianism", "0.3798956"], ["godsome", "0.37973535"], ["millah", "0.3796143"], ["apotactite", "0.37958193"], ["god", "0.37906212"], ["nihilist", "0.378731"], ["bogomilist", "0.37854066"], ["protestant", "0.37833798"], ["protopapas", "0.37818027"], ["fallen_angel", "0.37807828"], ["yoism", "0.3773297"], ["beliefful", "0.37678567"], ["holy_spirit", "0.37664098"], ["original_righteousness", "0.37638944"], ["christer", "0.37628716"], ["theosoph", "0.3762166"], ["sikhism", "0.37502164"], ["theosophe", "0.37494308"], ["christian", "0.37475446"], ["believers", "0.37455803"], ["argumentum_ad_hominem", "0.37441504"], ["spiritualism", "0.37439325"], ["apostasy", "0.37360322"], ["ultraconservatism", "0.37330252"], ["mammetry", "0.3731302"], ["theocracy", "0.3725663"], ["omnism", "0.37224567"], ["neo_druidry", "0.37187576"], ["heavenly_father", "0.37181073"], ["atoothfairyist", "0.37162465"], ["philosophy", "0.371479"], ["scepticism", "0.37123948"], ["ascesis", "0.37111259"], ["impiety", "0.371099"], ["hedge_priest", "0.3710455"], ["torture_stake", "0.3708148"], ["sanamahism", "0.3707046"], ["skepticism", "0.37020683"], ["malism", "0.37019125"], ["peculiar_people", "0.36985648"], ["beatificate", "0.36949492"], ["ironism", "0.36893287"], ["solicitant", "0.36886808"], ["animism", "0.3686555"], ["god_fearer", "0.36834478"], ["come_outer", "0.36817402"], ["divine_retribution", "0.36814672"], ["utraquism", "0.36812425"], ["nondenominational", "0.36744636"], ["sda", "0.36723584"], ["priscillianist", "0.3666796"], ["revealed_religion", "0.36663678"], ["grand_lodge_freemasonry", "0.3666129"], ["revivalistic", "0.3665274"], ["tawhid", "0.36607432"], ["quakerization", "0.36521915"], ["wotanism", "0.36509925"], ["monarchian", "0.3649295"], ["lutheranism", "0.36447123"], ["creed", "0.36438826"], ["febronianism", "0.36423868"], ["remonstrant", "0.36288542"], ["ontologism", "0.36279425"], ["preacher's_kid_syndrome", "0.3627381"], ["enhypostasia", "0.3621598"], ["hinduism", "0.36196423"], ["theopathic", "0.36142033"], ["avestaic", "0.36137444"], ["godship", "0.3612057"], ["theolog", "0.36100495"], ["irenicism", "0.3607609"], ["apocalypticism", "0.36074555"], ["eschatology", "0.36072758"], ["disopinion", "0.36049363"], ["transverberation", "0.36047882"], ["ingersollian", "0.36030963"], ["human_mind", "0.36026013"], ["new_religious_movement", "0.3602165"], ["islam", "0.36020118"], ["apollinarianism", "0.36000884"], ["pseudoservice", "0.36000487"], ["eunomian", "0.3598184"], ["discordianism", "0.3596781"], ["acatalepsy", "0.35956353"], ["taborite", "0.35936323"], ["oism", "0.35934377"], ["muslimism", "0.35897776"], ["godkind", "0.35880676"], ["yazidism", "0.35763013"], ["higher_power", "0.3570763"], ["cult_site", "0.35697725"], ["cult_place", "0.35697725"], ["singhbonga", "0.35667568"], ["theosophy", "0.35656095"], ["antidemonic", "0.35603955"], ["neo_druidism", "0.3555482"], ["pneumatology", "0.3554426"], ["nongod", "0.35539472"], ["christian_atheism", "0.35539472"], ["philosophia_perennis", "0.35534346"], ["established_church", "0.35532165"], ["godhood", "0.35469943"], ["hedge_sermon", "0.35438365"], ["heresiarch", "0.35432678"], ["demythologization", "0.3543184"], ["antepaschal", "0.35411328"], ["god_holy_spirit", "0.35388204"], ["economic_liberalism", "0.35323715"], ["jainism", "0.35267594"], ["anhypostasia", "0.3525203"], ["quakerize", "0.35243553"], ["our_father", "0.3521218"], ["beatific_vision", "0.3516279"], ["mazdaism", "0.35139728"], ["culthead", "0.35127488"], ["laodiceanism", "0.35102966"], ["shint\u014d", "0.35089946"], ["missionaryize", "0.3503452"], ["cosmicism", "0.35013366"], ["uu", "0.34955025"], ["churchwork", "0.34915113"], ["predeterminism", "0.3487934"], ["theologist", "0.34872907"], ["theological_virtue", "0.3487043"], ["protevangelium", "0.34840643"], ["afgod", "0.34783858"], ["cerinthian", "0.3477385"], ["satanism", "0.34736216"], ["omnibenevolent", "0.34709138"], ["imparsonee", "0.34707767"], ["polyatheist", "0.34695572"], ["abiogenesis", "0.34694996"], ["gettier_problem", "0.3462577"], ["taoism", "0.34623694"], ["higher_being", "0.3462028"], ["mother_church", "0.34481835"], ["deity", "0.34474677"], ["desacralize", "0.34450102"], ["subdoxastic", "0.3441727"], ["credobaptist", "0.34368503"], ["nonelect", "0.3433879"], ["lollardism", "0.3432806"], ["morrisite", "0.3432379"], ["theomachist", "0.34303686"], ["high_churchmanship", "0.34293923"], ["discordian", "0.34287935"], ["ante_nicene", "0.34281084"], ["deicide", "0.3427087"], ["nescience", "0.34270114"], ["disestablishment", "0.34227455"], ["donatist", "0.34224862"], ["methodism", "0.34218234"], ["will_worship", "0.34217757"], ["pagan", "0.34198913"], ["divinity", "0.34157926"], ["spontaneous_generation", "0.34084874"], ["origenism", "0.3403743"], ["judaism", "0.34036237"], ["inlibration", "0.34015715"], ["diriment", "0.34001762"], ["new_thought", "0.33994305"], ["positivism", "0.33991325"], ["son_of_god", "0.33984637"], ["transcendentalism", "0.33876967"], ["indeterminism", "0.33824193"], ["chirotony", "0.3382374"], ["omega_point", "0.33822405"], ["malicide", "0.33818823"], ["nonpracticing", "0.33752626"], ["asectarian", "0.33707353"], ["holy_father", "0.33700186"], ["kingdom_of_heaven", "0.3367691"], ["worldview", "0.3364499"], ["god_holy_ghost", "0.33559385"], ["mu'tazila", "0.33463943"], ["godcasting", "0.3341916"], ["morality", "0.33369815"], ["buddhism", "0.33356208"], ["zoroastrianism", "0.33353883"], ["doubting_thomas", "0.33300662"], ["catholic", "0.3326673"], ["khalsa", "0.33263648"], ["pandemonism", "0.33243972"], ["\u014dkuninushi", "0.3323279"], ["jahiliyyah", "0.33202568"], ["godwards", "0.33161864"], ["godliness", "0.33153498"], ["apolysis", "0.33152837"], ["leggism", "0.3301957"], ["episcopalian", "0.33010197"], ["akathistos", "0.3297605"], ["\u014dkuninushi_no_mikoto", "0.32975817"], ["congregationalism", "0.32916605"], ["god_father", "0.32910052"], ["dualism", "0.32906473"], ["miscredulity", "0.32875603"], ["stercorianism", "0.32819322"], ["heretic", "0.32791585"], ["godness", "0.32752383"], ["supreme_being", "0.3268844"], ["meaning_of_life", "0.32683176"], ["fence_tables", "0.32677114"], ["bigotry", "0.32659668"], ["twelver", "0.3265485"], ["godslaughter", "0.32624793"], ["heathen", "0.3255508"], ["skydaddy", "0.32540902"], ["wrongthink", "0.32529086"], ["scientology", "0.32505706"], ["godcast", "0.32500178"], ["theocrasy", "0.32487166"], ["cosmocrat", "0.32483655"], ["unprovable", "0.32465792"], ["devout", "0.32433468"], ["quantum_mysticism", "0.3237511"], ["yahuwah", "0.32370844"], ["mormonize", "0.32320395"], ["metamorphist", "0.3230729"], ["demolatry", "0.32201716"], ["cheesefare", "0.32173795"], ["most_high", "0.32112116"], ["orthodox", "0.32036874"], ["god_fearing", "0.32023716"], ["damianist", "0.32003134"], ["holy_ghost", "0.31988347"], ["mithraism", "0.31972086"], ["odyssean_wicca", "0.31963515"], ["technotopianism", "0.31867793"], ["paleocontact", "0.31840587"], ["druidry", "0.3176396"], ["flemingian", "0.31750274"], ["reconstructionist_judaism", "0.3175004"], ["value_voter", "0.31739444"], ["blood_baptism", "0.31731033"], ["lollardy", "0.3171398"], ["erastian", "0.31702054"], ["carthusianism", "0.31643927"], ["deiparous", "0.31609207"], ["monergism", "0.31608286"], ["doxogenic", "0.31601965"], ["waldense", "0.31568378"], ["encratite", "0.3156833"], ["brahmanist", "0.31562817"], ["pythagoreanism", "0.3154884"], ["heterodox", "0.31548536"], ["noncommunicant", "0.31532964"], ["panpsychism", "0.31519222"], ["theography", "0.314753"], ["creance", "0.31459892"], ["undeify", "0.31439644"], ["congregationalist", "0.31424668"], ["attractional", "0.31424478"], ["antipaedobaptism", "0.31424215"], ["g_d", "0.31390867"], ["occasionalism", "0.3134467"], ["pharisaism", "0.31317398"], ["liturgical_language", "0.3131482"], ["godfearing", "0.31300163"], ["euhemerism", "0.31287897"], ["disbelief", "0.31284916"], ["transcosmic", "0.31284684"], ["mormon", "0.31241888"], ["allahu_akbar", "0.31239453"], ["ancestor_worship", "0.3119496"], ["christian_soldier", "0.31163025"], ["xueta", "0.31160668"], ["blasphemy", "0.31155154"], ["brahmanism", "0.31099427"], ["anarchism", "0.31099412"], ["hyper_real_religion", "0.31058717"], ["monophysite", "0.31037468"], ["religious_order", "0.3096053"], ["subgenius", "0.30946308"], ["puritanism", "0.3086375"], ["hanif", "0.3084672"], ["ex_god", "0.30781257"], ["quiverfull", "0.30774578"], ["co_religionary", "0.30767238"], ["illuminism", "0.30760372"], ["godhead", "0.3068241"], ["separatical", "0.3066176"], ["presbyterian", "0.30638948"], ["extropianism", "0.3063754"], ["shai_hulud", "0.30624214"], ["nrm", "0.3059569"], ["gomarist", "0.3059404"], ["goddidit", "0.3058598"], ["supreme_deity", "0.30549535"], ["theophilanthropism", "0.3053674"], ["antigod", "0.30483288"], ["deen", "0.3042351"], ["apostatize", "0.30373818"], ["alogi", "0.30337077"], ["alogian", "0.30337077"], ["god_son", "0.30290747"], ["piety", "0.30260918"], ["abbot_primate", "0.30212873"], ["judgement_day", "0.30205488"], ["manichaeism", "0.30133146"], ["theoconservative", "0.3012161"], ["perate", "0.3011971"], ["religiopolitical", "0.30092114"], ["credal", "0.30071008"], ["neuromyth", "0.30062282"], ["ecclesiolater", "0.30057427"], ["ecclesiolatry", "0.30057427"], ["wicca", "0.30051023"], ["gettier_case", "0.30036196"], ["word_of_god", "0.29997414"], ["semitization", "0.29972783"], ["platonist", "0.2994473"], ["paramaatma", "0.29941696"], ["muggletonian", "0.29936108"], ["sufism", "0.29921868"], ["navjote", "0.29898417"], ["esoterism", "0.29891753"], ["adessenarian", "0.29865274"], ["psychagogy", "0.29859358"], ["impious", "0.29828674"], ["divine_law", "0.2981252"], ["backfire_effect", "0.29757383"], ["ousia", "0.29746053"], ["rule_of_three", "0.29741523"], ["spiritual_being", "0.29713038"], ["begod", "0.29703718"], ["church_of_satan", "0.29675037"], ["orarium", "0.29618782"], ["philosophy_of_mind", "0.29616988"], ["restorationist", "0.29600602"], ["protogospel", "0.29600465"], ["proselyte", "0.2955756"], ["undergod", "0.29482704"], ["druidism", "0.29459077"], ["anglican", "0.29457778"], ["awan", "0.2945299"], ["left_hooker", "0.29447508"], ["lutheran", "0.29415092"], ["geocentrism", "0.29398578"], ["spiritual_incest", "0.29391786"], ["non_constat", "0.29374498"], ["beatus", "0.2936368"], ["three_g's", "0.2936363"], ["theomachy", "0.29346"], ["pre_radicalization", "0.2929031"], ["ramism", "0.2926317"], ["euromyth", "0.29254597"], ["idea_of_reference", "0.29212895"], ["sacerdotalism", "0.2920366"], ["play_god", "0.29184425"], ["secularize", "0.2917493"], ["defeater", "0.29160693"], ["gettier_intuition", "0.29129207"], ["ladder_of_jacob", "0.29025793"], ["ogmios", "0.28953975"], ["anthropopathy", "0.28938627"], ["dulic", "0.28935748"], ["disconfirmation", "0.28926343"], ["lord_be_praised", "0.288733"], ["toshigami", "0.28827888"], ["god's_word", "0.28744474"], ["ancient_astronaut", "0.28695685"], ["libertarian", "0.28694242"], ["proselytess", "0.28675652"], ["unsinkable_rubber_duck", "0.2864524"], ["wish_fulfillment", "0.2864132"], ["smarta", "0.28641027"], ["mysticism", "0.28588516"], ["thomas_henry_huxley", "0.2854736"], ["sabaoth", "0.2854096"], ["mysterial", "0.28537935"], ["man_upstairs", "0.2852695"], ["deceptor", "0.28526932"], ["romish", "0.2851238"], ["paulicianism", "0.284751"], ["bwiti", "0.28460652"], ["circumcellion", "0.2843792"], ["teapotism", "0.28429997"], ["asherah", "0.284227"], ["labadist", "0.28405157"], ["house_of_worship", "0.28395104"], ["superstition", "0.28387845"], ["maheshwari", "0.28386027"], ["shia_islam", "0.2835171"], ["anthropophuism", "0.28346586"], ["prisoner_of_conscience", "0.2834598"], ["albigenses", "0.28343564"], ["believing", "0.2833434"], ["goddessling", "0.2829504"], ["suffragism", "0.28258577"], ["unbelieve", "0.28240782"], ["millenarianism", "0.2823764"], ["ethnoreligious", "0.2823754"], ["theo", "0.28223437"], ["godself", "0.2818779"], ["hypatia", "0.28185192"], ["theophilic", "0.28125834"], ["apollinarian", "0.2811178"], ["deodate", "0.28075922"], ["virtualist", "0.28000498"], ["sky_daddy", "0.2798044"], ["devaprasnam", "0.27963516"], ["bicovenantal", "0.2796281"], ["austromarxism", "0.27932215"], ["bogomil", "0.27928007"], ["pillarist", "0.2789636"], ["sky_fairy", "0.27856934"], ["aspergillum", "0.2784205"], ["blasphemer", "0.2783586"], ["methodist", "0.27820468"], ["denomination", "0.2778902"], ["credo", "0.27770028"], ["lamarckism", "0.27748197"], ["autotelism", "0.27736807"], ["laudian", "0.27700466"], ["confessionalism", "0.2769546"], ["hubal", "0.27694035"], ["traditionalism", "0.27683514"], ["manifest_destiny", "0.27648568"], ["utukku", "0.27623504"], ["jovinianist", "0.2761658"], ["uckewallist", "0.2761594"], ["paleoconservatism", "0.27565756"], ["bus_ministry", "0.27564055"], ["keep_one's_chapels", "0.2754801"], ["interreligious", "0.27524886"], ["doctrinaire", "0.2751184"], ["state_of_nature", "0.2748226"], ["revolutionism", "0.27460346"], ["shahada", "0.27437848"], ["impossibilism", "0.27433085"], ["huguenotism", "0.2736155"], ["totalism", "0.27353075"], ["oxford_movement", "0.27346098"], ["ahura_mazda", "0.27333885"], ["legalism", "0.27309304"], ["elementalism", "0.2730859"], ["syncretism", "0.27151108"], ["enlightenment", "0.27063587"], ["divine_providence", "0.27061728"], ["dragonnade", "0.27032208"], ["church", "0.27030054"], ["racovian", "0.2696664"], ["godman", "0.26956835"], ["predestination", "0.2695531"], ["kharijite", "0.26955304"], ["theocentric", "0.26937717"], ["theonomy", "0.2691891"], ["alhamdulillah", "0.2688496"], ["cleric", "0.2687852"], ["volitionalism", "0.2687003"], ["hemerobaptist", "0.26868153"], ["theogony", "0.26835018"]],
          "bert_scores": [["religion", "1.0"], ["atheism", "1.0"], ["christianity", "0.8129622"], ["science", "0.8018606"], ["politics", "0.7803088"], ["homosexuality", "0.76997954"], ["god", "0.76834714"], ["sex", "0.75922036"], ["suicide", "0.75310963"], ["islam", "0.747884"], ["buddhism", "0.7370243"], ["education", "0.7364644"], ["death", "0.7238835"], ["scientology", "0.7213783"], ["terrorism", "0.7130677"], ["evolution", "0.69734156"], ["violence", "0.69399166"], ["feminism", "0.68179065"], ["abortion", "0.6717284"], ["philosophy", "0.66855574"], ["racism", "0.6676844"], ["spirituality", "0.6585485"], ["cancer", "0.65761393"], ["ethics", "0.6557749"], ["communism", "0.6485984"], ["biology", "0.6408662"], ["morality", "0.6406515"], ["witchcraft", "0.63930744"], ["jesus", "0.6229888"], ["economics", "0.62024343"], ["faith", "0.61873406"], ["slavery", "0.61842066"], ["socialism", "0.61483926"], ["freedom", "0.6111333"], ["marriage", "0.6102973"], ["evil", "0.60603386"], ["intelligence", "0.60576326"], ["hinduism", "0.60253096"], ["sexuality", "0.60157263"], ["history", "0.59829277"], ["health", "0.5978706"], ["magic", "0.59191597"], ["liberation", "0.59043324"], ["nature", "0.5900978"], ["torture", "0.5884824"], ["psychology", "0.5883328"], ["murder", "0.58813304"], ["technology", "0.58669096"], ["prayer", "0.5850824"], ["love", "0.58491963"], ["judaism", "0.5830468"], ["music", "0.5826419"], ["television", "0.58206093"], ["pornography", "0.58114827"], ["it", "0.58004594"], ["crime", "0.57607037"], ["power", "0.57580936"], ["ecology", "0.57359844"], ["physics", "0.5690877"], ["skepticism", "0.5640626"], ["gender", "0.5602821"], ["medicine", "0.5599865"], ["journalism", "0.5594146"], ["justice", "0.55834305"], ["life", "0.55746937"], ["censorship", "0.55687636"], ["sin", "0.5554405"], ["race", "0.555027"], ["psychiatry", "0.54918116"], ["art", "0.5486063"], ["democracy", "0.54482204"], ["electricity", "0.54398656"], ["neuroscience", "0.5431005"], ["fascism", "0.5379333"], ["culture", "0.53635406"], ["satan", "0.53356504"], ["divorce", "0.5317628"], ["theology", "0.526921"], ["meditation", "0.520171"], ["rape", "0.5191584"], ["mathematics", "0.51890796"], ["equality", "0.514902"], ["poetry", "0.51484054"], ["sociology", "0.5129324"], ["this", "0.51158494"], ["aids", "0.510302"], ["ideology", "0.5086218"], ["fear", "0.5086094"], ["marxism", "0.50821877"], ["genetics", "0.5082055"], ["sustainability", "0.5074398"], ["pollution", "0.5045984"], ["drugs", "0.504346"], ["astronomy", "0.50290173"], ["discrimination", "0.5018493"], ["capitalism", "0.49885818"], ["adultery", "0.4963914"], ["law", "0.49254712"], ["religions", "0.48994398"], ["poverty", "0.48983732"], ["language", "0.48855415"], ["photography", "0.4872307"], ["depression", "0.4856181"], ["marijuana", "0.4828593"], ["consciousness", "0.47907656"], ["advertising", "0.47878802"], ["gravity", "0.47869155"], ["literature", "0.47805783"], ["agriculture", "0.47604418"], ["yoga", "0.47291902"], ["zen", "0.47190833"], ["baseball", "0.47156903"], ["genocide", "0.47143912"], ["addiction", "0.47058922"], ["catholicism", "0.47023734"], ["media", "0.46957746"], ["mythology", "0.4684501"], ["sports", "0.46745563"], ["cannabis", "0.4645772"], ["revolution", "0.4632864"], ["activism", "0.4631962"], ["belief", "0.46216345"], ["truth", "0.4621452"], ["karma", "0.46080083"], ["liberty", "0.4605914"], ["prophecy", "0.45862272"], ["hell", "0.45771122"], ["criticism", "0.45705786"], ["war", "0.45619443"], ["hiv", "0.45555675"], ["liberalism", "0.45553938"], ["football", "0.45529345"], ["schizophrenia", "0.4547662"], ["prison", "0.45279458"], ["peace", "0.45255136"], ["chaos", "0.4518986"], ["prostitution", "0.45062247"], ["surgery", "0.45055985"], ["independence", "0.45027125"], ["knowledge", "0.44918975"], ["immigration", "0.4491601"], ["wrestling", "0.4489626"], ["autism", "0.44817644"], ["cinema", "0.44751504"], ["creativity", "0.44723836"], ["salvation", "0.44681334"], ["entertainment", "0.44598928"], ["society", "0.4442394"], ["security", "0.44422755"], ["gambling", "0.44413623"], ["women", "0.44355795"], ["reality", "0.44336557"], ["whaling", "0.4430267"], ["christ", "0.4427577"], ["autobiography", "0.44224653"], ["insanity", "0.44168514"], ["healing", "0.44120967"], ["bullying", "0.4409321"], ["mars", "0.43998182"], ["hope", "0.4398206"], ["everything", "0.43740255"], ["anthropology", "0.4372156"], ["apartheid", "0.43475068"], ["fiction", "0.43399042"], ["teaching", "0.4305213"], ["alcohol", "0.42974174"], ["news", "0.42936286"], ["money", "0.42915604"], ["fire", "0.4262589"], ["creation", "0.42203492"], ["happiness", "0.42055988"], ["communication", "0.41989434"], ["diversity", "0.41967627"], ["class", "0.41918275"], ["america", "0.41830236"], ["energy", "0.41812634"], ["animals", "0.41666275"], ["humor", "0.4162895"], ["relativity", "0.41541544"], ["humanity", "0.4150587"], ["them", "0.4149984"], ["auschwitz", "0.41474476"], ["research", "0.4135225"], ["biodiversity", "0.412882"], ["alcoholism", "0.4128768"], ["space", "0.41277382"], ["smoking", "0.41216537"], ["youth", "0.41216287"], ["him", "0.41185775"], ["film", "0.41184345"], ["compassion", "0.41168013"], ["soccer", "0.40984744"], ["chemistry", "0.4097452"], ["government", "0.4088533"], ["hate", "0.4083722"], ["satire", "0.4081577"], ["wikipedia", "0.4076254"], ["abuse", "0.40565872"], ["jihad", "0.4044814"], ["muhammad", "0.40341708"], ["work", "0.40319487"], ["progress", "0.4025607"], ["suffering", "0.40115073"], ["authority", "0.40073773"], ["humans", "0.40063632"], ["children", "0.4003908"], ["assassination", "0.40037137"], ["itself", "0.3986527"], ["propaganda", "0.39830127"], ["nationalism", "0.39794496"], ["parliament", "0.39761457"], ["pregnancy", "0.3975794"], ["baptism", "0.39679316"], ["segregation", "0.39617613"], ["finance", "0.39558956"], ["twitter", "0.3947253"], ["success", "0.39442617"], ["biotechnology", "0.39427227"], ["dna", "0.39418966"], ["illness", "0.39418805"], ["facebook", "0.39355025"], ["warfare", "0.3934791"], ["preaching", "0.39227262"], ["conspiracy", "0.39209622"], ["punishment", "0.39166468"], ["writing", "0.39149874"], ["heresy", "0.39144558"], ["broadcasting", "0.39125836"], ["statistics", "0.39014682"], ["geology", "0.38958186"], ["worship", "0.38890418"], ["fishing", "0.38853723"], ["stress", "0.3884723"], ["allah", "0.3881888"], ["color", "0.3881636"], ["food", "0.3879267"], ["computers", "0.3857786"], ["math", "0.38576776"], ["pain", "0.38456398"], ["globalization", "0.3839825"], ["aliens", "0.38343355"], ["healthcare", "0.38329932"], ["archaeology", "0.38252228"], ["privacy", "0.38067424"], ["learning", "0.3799134"], ["radio", "0.37936524"], ["tourism", "0.37784213"], ["ai", "0.377713"], ["scouting", "0.3765029"], ["responsibility", "0.37526998"], ["darkness", "0.37372917"], ["disability", "0.37281972"], ["persecution", "0.37131032"], ["survival", "0.37101135"], ["reason", "0.37051603"], ["safety", "0.3703228"], ["farming", "0.3702097"], ["scripture", "0.37014166"], ["basketball", "0.3698232"], ["harassment", "0.36973584"], ["forgiveness", "0.36936477"], ["nothing", "0.36934382"], ["cricket", "0.36912546"], ["imprisonment", "0.3690264"], ["obesity", "0.3688587"], ["conservation", "0.3688469"], ["killing", "0.36836618"], ["horror", "0.36816403"], ["aviation", "0.36788952"], ["tv", "0.36774427"], ["charity", "0.3664802"], ["guilt", "0.3664751"], ["israel", "0.3649521"], ["wealth", "0.36457875"], ["dharma", "0.3641767"], ["light", "0.36412638"], ["relationships", "0.36359116"], ["vietnam", "0.3632205"], ["aggression", "0.3626885"], ["anarchy", "0.36207986"], ["heaven", "0.3617314"], ["beliefs", "0.3609225"], ["business", "0.36090147"], ["superman", "0.35997918"], ["development", "0.35959724"], ["that", "0.35893458"], ["thought", "0.3576152"], ["india", "0.35759953"], ["jews", "0.35742685"], ["paradise", "0.35702845"], ["miracles", "0.35667425"], ["publishing", "0.35645464"], ["greed", "0.35608172"], ["therapy", "0.35520208"], ["laughter", "0.3541776"], ["treason", "0.3540833"], ["immortality", "0.35338408"], ["blood", "0.35248262"], ["silence", "0.3524411"], ["autonomy", "0.35219696"], ["hunger", "0.3519565"], ["enlightenment", "0.35188645"], ["disease", "0.3515656"], ["prohibition", "0.3514026"], ["fitness", "0.3512643"], ["controversy", "0.34983635"], ["repression", "0.34912542"], ["mt", "0.34911558"], ["longevity", "0.348872"], ["experience", "0.3484668"], ["religious", "0.34830967"], ["motivation", "0.3481958"], ["athletics", "0.34809837"], ["arson", "0.3475435"], ["rap", "0.3475348"], ["hollywood", "0.34752995"], ["hunting", "0.34736568"], ["lust", "0.34634826"], ["elections", "0.3460876"], ["copyright", "0.34606814"], ["leadership", "0.34586886"], ["aesthetics", "0.34583765"], ["painting", "0.345316"], ["christians", "0.3452666"], ["nietzsche", "0.34435907"], ["terror", "0.34409758"], ["action", "0.3430854"], ["church", "0.34294817"], ["logic", "0.3427534"], ["sacrifice", "0.34270355"], ["theft", "0.34249225"], ["information", "0.34226036"], ["identity", "0.3421577"], ["nutrition", "0.34134078"], ["me", "0.34119356"], ["china", "0.34119117"], ["guns", "0.34075963"], ["cheating", "0.3398466"], ["temperance", "0.33955947"], ["architecture", "0.33932522"], ["ecstasy", "0.339177"], ["prejudice", "0.33913326"], ["behavior", "0.33903006"], ["climate", "0.33898008"], ["change", "0.33849204"], ["comedy", "0.33808213"], ["inequality", "0.33772326"], ["christmas", "0.33722723"], ["diabetes", "0.33705908"], ["disbelief", "0.33704552"], ["friendship", "0.33676153"], ["oppression", "0.33612975"], ["anxiety", "0.33587298"], ["evidence", "0.3358443"], ["angels", "0.3358188"], ["halloween", "0.3357146"], ["virginity", "0.3355652"], ["accountability", "0.33534157"], ["man", "0.33496967"], ["travel", "0.3343146"], ["terrorists", "0.3335668"], ["earth", "0.33351597"], ["conflict", "0.3329088"], ["hacking", "0.33235162"], ["vampires", "0.33205092"], ["comics", "0.33159485"], ["corruption", "0.33072773"], ["vice", "0.33037317"], ["respect", "0.33024207"], ["movies", "0.3299078"], ["folklore", "0.32969067"], ["citizenship", "0.32948533"], ["protest", "0.329218"], ["irony", "0.3291753"], ["vision", "0.32898965"], ["resistance", "0.32855293"], ["judo", "0.32827485"], ["jazz", "0.32826233"], ["abduction", "0.32766747"], ["robots", "0.32761896"], ["entropy", "0.3270883"], ["us", "0.32650563"], ["transportation", "0.32644248"], ["hatred", "0.32640627"], ["parody", "0.32635942"], ["algebra", "0.32578716"], ["extinction", "0.32566017"], ["racing", "0.3255537"], ["welfare", "0.3255279"], ["bankruptcy", "0.32502028"], ["fashion", "0.32449257"], ["hockey", "0.32409567"], ["fate", "0.32389358"], ["sport", "0.32389265"], ["parenting", "0.3238693"], ["lgbt", "0.32316607"], ["debate", "0.32296208"], ["rebellion", "0.32282218"], ["tragedy", "0.3225902"], ["loneliness", "0.32208917"], ["age", "0.32208076"], ["you", "0.32164964"], ["temptation", "0.3214713"], ["english", "0.3213767"], ["diet", "0.32135186"], ["injustice", "0.32057416"], ["choice", "0.32029977"], ["karate", "0.32016507"], ["tradition", "0.3192767"], ["dying", "0.3189963"], ["metaphor", "0.3187496"], ["shame", "0.31855983"], ["homicide", "0.31796214"], ["wisdom", "0.3179023"], ["boxing", "0.3177158"], ["sabotage", "0.31764084"], ["marketing", "0.31761512"], ["snakes", "0.3172103"], ["interest", "0.31699318"], ["exploration", "0.31688905"], ["denial", "0.3163103"], ["legislation", "0.31628397"], ["witches", "0.31558454"], ["risk", "0.31556427"], ["strategy", "0.315148"], ["branding", "0.31507272"], ["fun", "0.31500927"], ["strength", "0.3148211"], ["myth", "0.31460974"], ["kali", "0.31440014"], ["employment", "0.31377643"], ["care", "0.31376365"], ["abolition", "0.3135454"], ["secrecy", "0.31343177"], ["orientation", "0.31336203"], ["orgasm", "0.31305268"], ["golf", "0.3128524"], ["ministry", "0.31270453"], ["nasa", "0.31251934"], ["modernism", "0.31204277"], ["mohammed", "0.3116539"], ["taxes", "0.31140748"], ["something", "0.31092316"], ["muslims", "0.3105931"], ["espionage", "0.30987725"], ["danger", "0.30897135"], ["economy", "0.30893338"], ["failure", "0.30881944"], ["demons", "0.30874228"], ["isolation", "0.3085046"], ["africa", "0.3083979"], ["krishna", "0.30756035"], ["defamation", "0.30751076"], ["acting", "0.30724034"], ["caste", "0.3071376"], ["dissent", "0.3070965"], ["atheist", "0.30704632"], ["doping", "0.30602986"], ["transparency", "0.3059104"], ["beauty", "0.30534288"], ["aging", "0.3050967"], ["heroism", "0.30501652"], ["training", "0.30496794"], ["mortality", "0.30482382"], ["ignorance", "0.30480763"], ["geography", "0.30450875"], ["revenge", "0.30426744"], ["personality", "0.30383155"], ["sailing", "0.30309516"], ["dreams", "0.3030593"], ["her", "0.30283"], ["filmmaking", "0.30254355"], ["anger", "0.30217293"], ["destruction", "0.3013221"], ["surveillance", "0.3011014"], ["ghosts", "0.30072945"], ["isis", "0.3001209"], ["cheerleading", "0.29974124"], ["innovation", "0.29959548"], ["cruelty", "0.29917955"], ["computing", "0.29908025"], ["sarcasm", "0.29906845"], ["linguistics", "0.2988414"], ["anatomy", "0.29881102"], ["hamlet", "0.29873472"], ["demographics", "0.29867768"], ["publicity", "0.2985152"], ["literacy", "0.29847184"], ["chess", "0.29750422"], ["heat", "0.2970262"], ["paranoia", "0.29625022"], ["ritual", "0.2959412"], ["gossip", "0.29586816"], ["ufo", "0.2956186"], ["fertility", "0.29549202"], ["canada", "0.2954458"], ["hezbollah", "0.29452494"], ["biochemistry", "0.29447225"], ["condoms", "0.29434043"], ["imperialism", "0.294155"], ["taboo", "0.29401648"], ["email", "0.29397964"], ["school", "0.29305044"], ["kindness", "0.29291907"], ["courage", "0.29286364"], ["events", "0.29279155"], ["camping", "0.29271904"], ["desire", "0.29267067"], ["p", "0.2926148"], ["genealogy", "0.292499"], ["purity", "0.29189137"], ["programming", "0.29128903"], ["viruses", "0.29115012"], ["memory", "0.29087818"], ["conditioning", "0.29077825"], ["speculation", "0.29051274"], ["tolerance", "0.29031968"], ["mining", "0.29024827"], ["cooking", "0.29010087"], ["sanity", "0.2896868"], ["election", "0.28928712"], ["academia", "0.28897855"], ["neutrality", "0.28884584"], ["inspiration", "0.28870752"], ["reading", "0.28845552"], ["dance", "0.28820485"], ["realism", "0.2880646"], ["madness", "0.28794235"], ["chocolate", "0.28791228"], ["ethnicity", "0.2879082"], ["morals", "0.28776315"], ["gandhi", "0.2877229"], ["recycling", "0.28749308"], ["eve", "0.28735954"], ["symbolism", "0.2872712"], ["divinity", "0.2870982"], ["time", "0.28703302"], ["movement", "0.28677267"], ["gospel", "0.28674945"], ["others", "0.2865617"], ["recreation", "0.28637987"], ["conscience", "0.28616363"], ["stupidity", "0.2860108"], ["flight", "0.28578013"], ["termination", "0.2857281"], ["conversion", "0.28550452"], ["empathy", "0.28461552"], ["investigation", "0.28432554"], ["betrayal", "0.28419292"], ["labor", "0.28385648"], ["sleep", "0.28367049"], ["fraud", "0.28365016"], ["industry", "0.28357318"], ["advocacy", "0.28267384"], ["porn", "0.28249228"], ["values", "0.28220508"], ["unemployment", "0.28207245"], ["communists", "0.28166738"], ["grief", "0.28057447"], ["trust", "0.28028336"], ["people", "0.28013968"], ["unity", "0.27963072"], ["christian", "0.2795286"], ["punk", "0.27925214"], ["books", "0.2792044"], ["atlantis", "0.27844784"], ["radiation", "0.2782398"], ["fantasy", "0.27811864"], ["mao", "0.27794462"], ["lies", "0.27760616"], ["wilderness", "0.2774323"], ["thinking", "0.27742907"], ["rugby", "0.27689412"], ["tennis", "0.27685714"], ["kidnapping", "0.2766421"], ["stealing", "0.2765106"], ["popularity", "0.27641237"], ["patience", "0.27635583"], ["asia", "0.27625486"], ["counseling", "0.27579388"], ["fortune", "0.2756421"], ["voting", "0.2753898"], ["rage", "0.27477723"], ["poker", "0.2747325"], ["both", "0.27468556"], ["passion", "0.274551"], ["weather", "0.2744929"], ["japan", "0.27435791"], ["robotics", "0.27408928"], ["botany", "0.2738736"], ["bible", "0.27356464"], ["family", "0.2734075"], ["manga", "0.27316844"], ["integration", "0.27313536"], ["burning", "0.2729282"], ["engineering", "0.27210173"], ["humour", "0.27194032"], ["grace", "0.27187052"], ["wildlife", "0.27128094"], ["hygiene", "0.2711381"], ["korea", "0.2709443"], ["surrender", "0.27067038"], ["judgment", "0.2705651"], ["gaming", "0.270465"], ["principle", "0.2701208"], ["geometry", "0.26999998"], ["arrogance", "0.26992372"], ["swimming", "0.26976553"], ["policing", "0.26969993"], ["childhood", "0.26965776"], ["destiny", "0.26932144"], ["hitler", "0.26923382"], ["##ism", "0.26911938"], ["surfing", "0.2683792"], ["australia", "0.2683162"], ["cooperation", "0.2682908"], ["blackmail", "0.2682308"], ["innocence", "0.26818052"], ["force", "0.26804918"], ["testing", "0.26796126"], ["policy", "0.2679043"], ["boredom", "0.26760274"], ["design", "0.26750374"], ["shakespeare", "0.26738122"], ["theatre", "0.26736525"], ["biography", "0.2668153"], ["simplicity", "0.26659715"], ["emotion", "0.26545015"], ["intuition", "0.2653547"], ["possession", "0.2653032"], ["improvisation", "0.26476908"], ["brazil", "0.2647169"], ["narcotics", "0.26435328"], ["russia", "0.2643306"], ["revelation", "0.26430947"], ["kant", "0.2639555"], ["dialogue", "0.263854"], ["wine", "0.2638058"], ["prisons", "0.26364437"], ["separation", "0.2636334"], ["insects", "0.26361203"], ["prosperity", "0.26264507"], ["labour", "0.2622987"], ["schooling", "0.26228148"], ["celebrity", "0.26224118"], ["translation", "0.26193383"], ["execution", "0.2618353"], ["flying", "0.2618332"], ["water", "0.26174322"], ["kissing", "0.26168567"], ["speech", "0.26167843"], ["birth", "0.2616469"], ["transformation", "0.26137373"], ["anything", "0.26136005"], ["medication", "0.26119182"], ["games", "0.2611026"], ["eating", "0.26097208"], ["adoption", "0.26071626"], ["cartoons", "0.26062712"], ["ideas", "0.2601137"], ["crimes", "0.25976777"], ["iran", "0.25957525"], ["childbirth", "0.2591365"], ["swearing", "0.2590405"], ["x", "0.25891048"], ["tuberculosis", "0.2584756"], ["spying", "0.25834098"], ["opera", "0.25800171"], ["pride", "0.2579363"], ["occupation", "0.25744215"], ["civilization", "0.25724542"], ["nascar", "0.25705528"], ["navigation", "0.25692973"], ["volcanoes", "0.2569218"], ["today", "0.25667724"], ["shiva", "0.2558841"], ["facts", "0.255806"], ["entrepreneurship", "0.25539672"], ["consumption", "0.2551784"], ["college", "0.25491977"], ["piracy", "0.2546683"], ["balance", "0.25464073"], ["theater", "0.2545891"], ["linux", "0.25444046"], ["orthodoxy", "0.25441864"], ["npr", "0.25434747"], ["utopia", "0.2536039"], ["drowning", "0.25341454"], ["holocaust", "0.2533922"], ["resignation", "0.25299796"], ["drama", "0.2525139"], ["reproduction", "0.25249708"], ["gods", "0.25232103"], ["iq", "0.2517802"], ["philanthropy", "0.25156492"], ["darwin", "0.25151333"], ["influence", "0.25083795"], ["communications", "0.2503618"], ["black", "0.25035852"], ["men", "0.25035334"], ["zombies", "0.25025967"], ["knitting", "0.24978134"], ["disguise", "0.24954903"], ["genius", "0.24926956"], ["taxation", "0.24922204"], ["explosives", "0.24909788"], ["unix", "0.24889913"], ["symmetry", "0.24884282"], ["nuclear", "0.2486927"], ["jeopardy", "0.24860436"], ["taxonomy", "0.24858229"], ["animation", "0.24839123"], ["combat", "0.24837177"], ["pleasure", "0.24819188"], ["nowhere", "0.24768563"], ["prediction", "0.24754748"], ["storytelling", "0.24745929"], ["fact", "0.24744102"], ["macbeth", "0.24738313"], ["deception", "0.24730997"], ["zero", "0.2467996"], ["trauma", "0.24658892"], ["milk", "0.24619369"], ["socrates", "0.24587676"], ["coincidence", "0.24556601"], ["wolves", "0.24548902"], ["commitment", "0.24506779"], ["cycling", "0.24493086"], ["emotions", "0.24488269"], ["malaria", "0.24483973"], ["gardening", "0.24478039"], ["sunlight", "0.24441545"], ["genes", "0.2437276"], ["integrity", "0.24343948"], ["earthquakes", "0.24305382"], ["property", "0.24296409"], ["firearms", "0.24233255"], ["continuity", "0.2422791"], ["probability", "0.24213894"], ["perception", "0.2421118"], ["infinity", "0.24205059"], ["honesty", "0.24189581"], ["pr", "0.24151698"], ["uncertainty", "0.24118671"], ["venus", "0.2408822"], ["despair", "0.24076222"], ["chicken", "0.24012308"], ["governance", "0.24001105"], ["construction", "0.23977593"], ["rhetoric", "0.23892395"], ["pot", "0.23867992"], ["boring", "0.23859107"], ["attraction", "0.23827805"], ["c", "0.23744258"], ["tobacco", "0.23705527"], ["environment", "0.23689905"], ["rt", "0.23684207"], ["priesthood", "0.23677388"], ["romance", "0.23664083"], ["collaboration", "0.23648347"], ["jealousy", "0.23642406"], ["management", "0.23581877"], ["clothing", "0.23573093"], ["tension", "0.23550957"], ["inflation", "0.23512572"], ["noise", "0.23497285"], ["awareness", "0.23478651"], ["bacteria", "0.23474891"], ["id", "0.23462255"], ["virtue", "0.23462069"], ["regression", "0.23451449"], ["cobra", "0.2344759"], ["ordination", "0.23432447"], ["sanitation", "0.23412241"], ["voodoo", "0.23386008"], ["rousseau", "0.2338312"], ["profit", "0.23377524"], ["penis", "0.23364717"], ["mankind", "0.23341101"], ["massage", "0.23339184"], ["trade", "0.23337659"], ["europe", "0.2329238"], ["prayers", "0.23290873"], ["theory", "0.23258457"], ["films", "0.23249789"], ["durga", "0.23216668"], ["coffee", "0.23211157"], ["sunday", "0.2320435"], ["cain", "0.23170437"], ["mystery", "0.23147996"], ["control", "0.23128948"], ["revolt", "0.2311735"], ["loyalty", "0.23108292"], ["buddha", "0.23106147"], ["liberals", "0.23101105"], ["complexity", "0.23067515"], ["closure", "0.23042233"], ["walking", "0.2302801"], ["banking", "0.23024724"], ["blame", "0.23019177"], ["r", "0.23012081"], ["blackness", "0.22998028"], ["garbage", "0.22994137"], ["optimism", "0.22977933"], ["lying", "0.22954859"], ["myths", "0.22936349"], ["style", "0.22934216"], ["studies", "0.22920126"], ["community", "0.22902828"], ["colour", "0.22892955"], ["stigma", "0.22836612"], ["indonesia", "0.22798209"], ["insight", "0.22783414"], ["interrogation", "0.22763342"], ["debt", "0.22754134"], ["rights", "0.22724026"], ["academics", "0.22701874"], ["taiwan", "0.22638872"], ["play", "0.22632138"], ["regulation", "0.22609824"], ["milton", "0.22604649"], ["nursing", "0.22596276"], ["churches", "0.2254989"], ["sewage", "0.22545521"], ["solidarity", "0.22544228"], ["mormon", "0.22535199"], ["experimentation", "0.22511029"], ["spiritual", "0.2244515"], ["crisis", "0.22437982"], ["insurance", "0.22426453"], ["cuba", "0.22411133"], ["pbs", "0.22360182"], ["spain", "0.22276245"], ["confession", "0.22223035"], ["luck", "0.22198488"], ["anime", "0.22195318"], ["curiosity", "0.22185992"], ["practice", "0.22180742"], ["congress", "0.22125377"], ["exile", "0.22124761"], ["sugar", "0.22100239"], ["doctrine", "0.22096948"], ["celebrities", "0.22080782"], ["j", "0.22079669"], ["physiology", "0.22065152"], ["perspective", "0.22058056"], ["jung", "0.21996129"], ["hysteria", "0.219897"], ["cult", "0.21987464"], ["acceptance", "0.21983345"], ["identification", "0.2197431"], ["lucifer", "0.219733"], ["homo", "0.21963061"], ["growth", "0.21959434"], ["rituals", "0.21902402"], ["caution", "0.21891463"], ["encryption", "0.21890119"], ["defeat", "0.21870403"], ["cnn", "0.21861222"], ["automation", "0.21828741"], ["melancholy", "0.21827145"], ["pressure", "0.21821468"], ["weapons", "0.21795468"], ["tibet", "0.21776398"], ["youtube", "0.21772827"], ["dating", "0.21766642"], ["efficiency", "0.21717301"], ["sovereignty", "0.21712825"], ["exercise", "0.21707496"], ["performance", "0.21673104"], ["inheritance", "0.21634828"], ["singing", "0.21576643"], ["masonry", "0.21514215"], ["attitude", "0.2150856"], ["themselves", "0.21489434"], ["bollywood", "0.21474785"], ["clergy", "0.21431552"], ["sanctuary", "0.21422558"], ["induction", "0.21400212"], ["stalking", "0.21379401"], ["mexico", "0.21364331"], ["fr", "0.21319193"], ["scriptures", "0.21292111"], ["spirit", "0.2127898"], ["politicians", "0.21276464"], ["rehabilitation", "0.21274632"], ["abraham", "0.21267664"], ["sf", "0.21211365"], ["video", "0.21210651"], ["turbulence", "0.21209675"], ["chance", "0.21163192"], ["sect", "0.21122149"], ["equity", "0.21087116"], ["questioning", "0.21083893"], ["fall", "0.21068512"], ["motorsports", "0.21033038"], ["reflection", "0.21031252"], ["apocalypse", "0.21016905"], ["retirement", "0.21002614"], ["homosexual", "0.21000382"], ["principles", "0.20998721"], ["praise", "0.20995948"], ["lightning", "0.20977296"], ["mission", "0.20962717"], ["prevention", "0.20945704"], ["sincerity", "0.20879714"], ["alignment", "0.20872061"], ["elimination", "0.20858479"], ["cheese", "0.20854454"], ["running", "0.20853136"], ["smuggling", "0.20851907"], ["transgender", "0.208517"], ["stereotypes", "0.20842293"], ["uranium", "0.20836803"], ["erosion", "0.20823637"], ["americans", "0.20806456"], ["birds", "0.20805155"], ["hierarchy", "0.20779252"], ["mania", "0.20772141"], ["werewolves", "0.2077033"], ["internet", "0.20768559"], ["minors", "0.20729342"], ["competition", "0.20714737"], ["discovery", "0.20714548"], ["nirvana", "0.20696464"], ["what", "0.20695461"], ["intercourse", "0.20689663"], ["accounting", "0.20688829"], ["infection", "0.20683354"], ["unification", "0.20663583"], ["twins", "0.2065488"], ["mafia", "0.20616254"], ["eternity", "0.20570801"], ["solitude", "0.20522025"], ["taekwondo", "0.20482442"], ["jurisprudence", "0.20471121"], ["dinosaurs", "0.2046441"], ["java", "0.20460376"], ["genesis", "0.20437054"], ["intimacy", "0.20402873"], ["dictatorship", "0.20388348"], ["discipline", "0.2038065"], ["descent", "0.20375162"], ["egypt", "0.20363675"], ["poison", "0.20350409"], ["feminist", "0.20344456"], ["analysis", "0.20339863"], ["thanksgiving", "0.20313643"], ["dogs", "0.20301731"], ["publication", "0.2029223"], ["doom", "0.20287564"], ["queer", "0.20281464"], ["observation", "0.20269799"], ["adam", "0.2026385"], ["isil", "0.20262921"], ["importance", "0.20261185"], ["mass", "0.20258822"], ["hindi", "0.20252424"], ["betting", "0.20234992"], ["injury", "0.20230693"], ["context", "0.20228769"], ["existence", "0.20226197"], ["escape", "0.202231"], ["ancestry", "0.2018905"], ["discussion", "0.20185085"], ["hamas", "0.2018135"], ["good", "0.20180036"], ["exodus", "0.20164645"], ["necessity", "0.20154054"], ["spirits", "0.20149203"], ["paradox", "0.20105335"], ["breeding", "0.20093243"], ["logging", "0.20085075"], ["order", "0.20069821"], ["disorder", "0.2003802"], ["speed", "0.200253"], ["focus", "0.19998251"], ["electronics", "0.19967717"], ["print", "0.1994729"], ["obsession", "0.19865407"], ["crazy", "0.1985942"], ["bliss", "0.19842345"], ["sgt", "0.19810776"], ["duty", "0.19782817"], ["heroin", "0.19770424"], ["telecommunications", "0.19736212"], ["envy", "0.196968"], ["mind", "0.19653822"], ["robbery", "0.19640857"], ["assimilation", "0.19640517"], ["commerce", "0.19638258"], ["empowerment", "0.19610633"], ["lithium", "0.1957084"], ["\"", "0.19531842"], ["providence", "0.19524485"], ["invasion", "0.19521089"], ["holiness", "0.19517575"], ["humiliation", "0.1946815"], ["housing", "0.19434191"], ["study", "0.19395284"]],
        },
      };

      if (typeof data.error !== 'undefined') {
        setError(data.error);
      } else {
        // setInputText(data.text);
        setPredictions(data.results);

        const bertCache = {};
        data.results.bert_scores.forEach(([ bertLabel, bertScore ]) => {
          bertCache[bertLabel] = bertScore;
        });
        const conceptNetCache = {};
        data.results.conceptnet_scores.forEach(([ conceptNetLabel, conceptNetScore ]) => {
          conceptNetCache[conceptNetLabel] = conceptNetScore;
        });

        const diffs = [];
        data.results.bert_scores.forEach(([ bertLabel, bertScore ]) => {
          if (typeof conceptNetCache[bertLabel] === 'undefined') {
            diffs.push({ type: 'add', label: bertLabel, score: bertScore });
          }
        });
        data.results.conceptnet_scores.forEach(([ conceptNetLabel, conceptNetScore ]) => {
          if (typeof bertCache[conceptNetLabel] === 'undefined') {
            diffs.push({ type: 'remove', label: conceptNetLabel, score: conceptNetScore });
          } else if (bertCache[conceptNetLabel] !== conceptNetScore) {
            diffs.push({ type: 'edit', label: conceptNetLabel, score: bertCache[conceptNetLabel], prevScore: conceptNetScore });
          }
        });
        setDifferences(diffs);

        const results = [
          ...diffs.filter(diff => diff.type === 'add').slice(0, 16),
          ...diffs.filter(diff => diff.type === 'remove').slice(0, 16),
          ...diffs.filter(diff => diff.type === 'edit').slice(0, 16),
        ];
        setGraphState(({ graph: { nodes, edges }, counter, ...rest }) => {
          const idsCache = [];
          const id = counter + 1;
          return {
            graph: {
              nodes: [
                { id: userLabel, label: userLabel, color: 'white', font: { color: 'black' }, shape: 'box' },
                ...results.reduce((acc, cur) => {
                  const { type, label, score } = cur;
                  let backgroundColor;
                  if (type === 'remove') {
                    backgroundColor = 'rgba(0,0,0,0.25)';
                  } else {
                    backgroundColor = shadeColor('#4bff00', -Number.parseFloat(score) * 100);
                  }
                  const textColor = getTextColour(backgroundColor);
                  const displayLabel = type === 'remove' ? label : `${label}\n(${parseFloat(score).toFixed(2)})`;
                  if (!idsCache.includes(label)) {
                    acc.push({
                      id: label,
                      label: displayLabel,
                      borderWidth: type === 'add' ? 3 : 1,
                      borderWidthSelected: type === 'add' ? 4 : 0,
                      color: {
                        background: backgroundColor,
                        border: type === 'add' ? '#2b7ce9' : 'transparent',
                      },
                      font: {
                        color: textColor
                      },
                      shape: 'box'
                    });
                    idsCache.push(label);
                  }
                  return acc;
                }, []),
              ],
              edges: results.reduce((acc, cur) => {
                const { label } = cur;
                acc.push({ from: label, to: userLabel })
                return acc;
              }, []),
              counter: id,
              ...rest
            }
          };
        });
        setGraphKey(uuidv4());
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

  const diffIcons = {
    'add': { element: DiffAddedIcon, label: 'Added', color: '#347d39' },
    'remove': { element: DiffRemovedIcon, label: 'Removed', color: '#c93c37' },
    'edit': { element: DiffModifiedIcon, label: 'Modified', color: '#636e7b' },
  };

  const addDiffs = differences.filter(diff => diff.type === 'add');
  const removeDiffs = differences.filter(diff => diff.type === 'remove');
  const editedDiffs = differences.filter(diff => diff.type === 'edit');

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

            <div style={{ display: 'flex', height: '500px', marginBottom: '1em', border: '1px solid #f1f1f1', position: 'relative' }}>
              <Graph key={graphKey} graph={graph} options={graphOptions} events={events} ref={graphRef} getNetwork={network => setNetworkInstance(network)} />
              <div style={{ position: 'absolute', fontSize: '0.8em', top: '1em', left: '1em', zIndex: 10, pointerEvents: 'none' }}>
                <h4 style={{ display: 'inline-block', margin: '0 0.5em 0 0' }}>Legend</h4>
                <span style={{ border: '3px solid #2b7ce9', padding: '0.25em', marginRight: '0.5em' }}>new term</span>
                <span style={{ border: '3px solid transparent', background: 'rgba(0,0,0,0.25)', color: 'white', padding: '0.25em', lineHeight: 1 }}>deleted term</span>
              </div>
            </div>

            {/* <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ marginRight: '0.5em' }}>View enhanced graph</span><Toggle defaultChecked={true} onChange={handleToggleView} />
            </div> */}

            <div style={{ marginBottom: '1.5em' }}>
              <h2>{differences.length} difference{differences.length === 1 ? '' : 's'}</h2>
              <div>
                <Input type="text" value={diffSearch} onChange={(ev) => setDiffSearch(ev.target.value)} placeholder="Search for a term..." style={{ width: 400, marginBottom: '1.5em' }} />
              </div>
              <Columns style={{ marginLeft: '1em' }}>
                <Column>
                  <h3>{addDiffs.length} added</h3>
                  <ChangesList>
                    {addDiffs.filter(diff => !diffSearch.length || diff.label.search(new RegExp(diffSearch, 'i')) > -1).map(diff => {
                      const icon = diffIcons[diff.type];
                      return (
                        <li key={diff.label}><icon.element width="1em" style={{ color: icon.color }} /> {icon.label} &quot;{diff.label}&quot; ({parseFloat(diff.score).toFixed(2)})</li>
                      );
                    })}
                  </ChangesList>
                </Column>
                <Column>
                  <h3>{removeDiffs.length} removed</h3>
                  <ChangesList>
                    {removeDiffs.filter(diff => !diffSearch.length || diff.label.search(new RegExp(diffSearch, 'i')) > -1).map(diff => {
                      const icon = diffIcons[diff.type];
                      return (
                        <li key={diff.label}><icon.element width="1em" style={{ color: icon.color }} /> {icon.label} &quot;{diff.label}&quot; ({parseFloat(diff.score).toFixed(2)})</li>
                      );
                    })}
                  </ChangesList>
                </Column>
                <Column>
                  <h3>{editedDiffs.length} modified</h3>
                  <ChangesList>
                    {editedDiffs.filter(diff => !diffSearch.length || diff.label.search(new RegExp(diffSearch, 'i')) > -1).map(diff => {
                      const icon = diffIcons[diff.type];
                      return (
                        <li key={diff.label}><icon.element width="1em" style={{ color: icon.color }} /> {icon.label} &quot;{diff.label}&quot; ({parseFloat(diff.score).toFixed(2)})</li>
                      );
                    })}
                  </ChangesList>
                </Column>
              </Columns>
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
                        return <ul key={term.paths.join('|')}><li>{explanations}</li></ul>;
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
                        <div key={prediction.label} id={prediction.label} style={{ marginBottom: '1em' }}>
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
                                  return <ul key={term.paths.join('|')}><li>{explanations}</li></ul>;
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
