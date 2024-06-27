import React, { useState, useRef,useEffect } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import MermaidDiagram from './MermaidDiagram';
import BpmnDiagram from './BpmnDiagram';
import './App.css';
import { Button, colors } from '@material-ui/core';
import logo from './Asset/idsVqwDGmE.png';
const initialMermaidChart = `
  graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
`;

const initialBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

function App() {
  const [chart, setChart] = useState(initialMermaidChart);
 
  const [xml, setXml] = useState(initialBpmnXml);
  const [isBpmn, setIsBpmn] = useState(false);
  const [isRough, setIsRough] = useState(false);
  const [isPanZoom, setIsPanZoom] = useState(false);
  const [taskColor, setTaskColor] = useState('#FFFFFF');
  const [eventColor, setEventColor] = useState('#FFFFFF');
  const [gatewayColor, setGatewayColor] = useState('#FFFFFF');
  const [leftPaneWidth, setLeftPaneWidth] = useState(50); // Initial width percentage of left pane
  const [activeTab, setActiveTab] = useState('scenario');

  const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [userQuestion, setUserQuestion] = useState('');
    const [forwardText, setForwardText] = useState('');
    const promptRef = useRef(null);
    const [popmessage, setPopmessage] = useState();
    const [uploadedFile, setUploadedFile] = useState(null);
   
    const [open, setOpen] = useState(false);
    const ipaddress = "11.15.209.141";
    
  const mermaidRef = useRef();
  const bpmnRef = useRef();
  const dividerRef = useRef();



  const handleInputChange = (event) => {
    if (isBpmn) {
      setXml(event.target.value);
    } else {
      setChart(event.target.value);
    }
  };
  const handleDiagramChange = (newXml) => {
    setXml(newXml);
  };
  const toggleDiagramType = () => {
    setIsBpmn(!isBpmn);
  };

  const toggleRoughDiagram = () => {
    setIsRough(!isRough);
  };

  const togglePanZoom = () => {
    setIsPanZoom(!isPanZoom);
  };

  const openMermaidFullscreen = () => {
    if (mermaidRef.current) {
      mermaidRef.current.openInNewTab();
    }
  };
  const handleOpenFullscreen = () => {
    if (bpmnRef.current) {
      bpmnRef.current.openInFullscreen();
    }
  };
 

  const exportMermaidAsSVG = () => {
    if (mermaidRef.current) {
      mermaidRef.current.exportAsSVG();
    }
  };

  const exportMermaidAsPNG = () => {
    if (mermaidRef.current) {
      mermaidRef.current.exportAsPNG();
    }
  };

  const exportBpmnAsSVG = () => {
    bpmnRef.current.exportAsSVG();
  };

  const exportBpmnAsPNG = () => {
    bpmnRef.current.exportAsPNG();
  };


  const handleMouseDown = (e) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 10 && newWidth < 90) {
      setLeftPaneWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  
const switchTab = (tab) => {
        setActiveTab(tab);
    };

    const handleFileChange1 = async (e) => {
      const selectedFile = e.target.files[0];
  
      if (selectedFile) {
        setFile(selectedFile);
  
        // Reading .docx file and setting the scenario with the file content
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target.result;
  
          const zip = await JSZip.loadAsync(arrayBuffer);
          const doc = await zip.file("word/document.xml").async("text");
  
          // Extract text from document.xml
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(doc, "application/xml");
          const paragraphs = xmlDoc.getElementsByTagName("w:t");
  
          let textContent = "";
          for (let i = 0; i < paragraphs.length; i++) {
            textContent += paragraphs[i].textContent + " ";
          }
  
          setInput(textContent);
        };
        reader.readAsArrayBuffer(selectedFile);
      }

    };

    
  
    const readFileContent = (file) => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
              resolve(event.target.result);
          };
          reader.onerror = (error) => {
              reject(error);
          };
          reader.readAsText(file);
      });
  };

    const handleSend = async (endpoint) => {
      setLoading(true);
      let content;
      // setMessages((prevMessages) => [...prevMessages, { text: input, sender: 'User' }]);
      if (uploadedFile) {
          
          content = await readFileContent(uploadedFile);
      } else if (input) {
          content = input;
      } else {
          console.error('No input provided');
          return;
      }
  
      try {
          const formData = new FormData();
          formData.append('file', uploadedFile);
          formData.append('inputText', input); 
  
          if (uploadedFile) {
            formData.append('file', uploadedFile);
        }
  
          const messages = [
              {
                  role: 'user',
                  content,
              },
          ];
  
          const { data } = await axios.post(`http://${ipaddress}:8082/api/v1/${endpoint}`,
            formData,
            {
              params: {
                model: 'GPT-4-Turbo',
              },
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
  
          console.log('Complete Response:', data);
  
          let newDiagramCode = '';
  
          if (data && data.prompt && data.response) {
            const trimmedCode = data.response
            .replace(/\/\*[\s\S]*?\*\//g, '') // To remove comments
            .replace(/`/g, '') // To remove backticks
            .replace(/mermaid/g, '') // Remove the word "mermaid"
              newDiagramCode = trimmedCode;
              setMessages((prevMessages) => [...prevMessages, { text: trimmedCode, sender: 'Bot' }]);
          } else {
              console.error('Unexpected response format:', data);
          }
  
          setChart(newDiagramCode);
          setPrompt(data.prompt);
          setActiveTab('prompt');
  
      } catch (error) {
          console.error('Error fetching reply:', error);
          setOpen(true);
          setPopmessage(error.response.data);
      } finally {
        setLoading(false);
      }
  };
  const adjustTextAreaHeight = () => {
   if (promptRef.current) {
      //promptRef.current.style.height = 'auto'; // Reset height to auto
      promptRef.current.style.height = `${promptRef.current.scrollHeight}px`; // Set to the scroll height
    }
  };

  useEffect(() => {
   adjustTextAreaHeight();
  },[prompt]);

  const handleSendRegenerate = async () => {
    const newPrompt = prompt ? `${prompt}\n${userQuestion}` : userQuestion;
    setMessages((prevMessages) => [...prevMessages, { text: newPrompt, sender: 'User' }]);
    // Set the concatenated prompt as forward text
    setForwardText('\n'+newPrompt);
    // Clear the user question
    setUserQuestion('');

 
    
    // Set loading to true to indicate the process has started
    setLoading(true);

  

    try {
      const { data } = await axios.post(`http://${ipaddress}:8082/api/v1/regenerate`, {
        model: 'GPT-4-Turbo',
        messages: [
          {
            role: 'user',
            content: newPrompt,
          },
        ],
      });
 
      console.log('Complete Response:', data);
      let newDiagramCode = '';
 
      if (typeof data.response === 'string') {
        const trimmedCode = data.response
          .replace(/\/\*[\s\S]*?\*\//g, '') // To remove comments
          .replace(/`/g, '') // To remove backticks
          .replace(/mermaid/g, '') // Remove the word "mermaid"
          .replace(/end/g, 'End') //Replace end with End
        setMessages((prevMessages) => [...prevMessages, { text: trimmedCode, sender: 'Bot' }]);
        newDiagramCode = trimmedCode;
 
      } else if (data && data.choices && data.choices[0] && data.choices[0].text) {
        const trimmedCode = data.choices[0].text
          .replace(/\/\*[\s\S]*?\*\//g, '') // To remove comments
          .replace(/`/g, '') // To remove backticks
          .replace(/mermaid/g, '') // Remove the word "mermaid"
          .replace(/end/g, 'End') //Replace end with End
 
        setMessages((prevMessages) => [...prevMessages, { text: trimmedCode, sender: 'Bot' }]);
        newDiagramCode = trimmedCode;
      } else {
        console.error('Unexpected response format:', data);
      }
 
      setChart(newDiagramCode);
      setPrompt(data.prompt);
    } catch (error) {
      console.error('Error fetching reply:', error);
      setOpen(true);
      setPopmessage(error.response.data);
    } finally {
      setLoading(false);
    }
    
  };

  const scrollToBottom = () => {
    if (promptRef.current) {
        promptRef.current.scrollTop = promptRef.current.scrollHeight;
    }
};

// Scroll to bottom whenever prompt changes
useEffect(() => {
    scrollToBottom();
   adjustTextAreaHeight();
}, [prompt]);
 
  
useEffect(() => {
  if (activeTab === 'prompt') {
    adjustTextAreaHeight();
  }
}, [activeTab]);
  return (
    <div className="App">
      <div className="header">
      <img src={logo} className="App-logo" alt="logo" style={{marginLeft : '50px',width:'100px'}}/>
        <h1 style={{marginRight:'230px',fontSize:'45px',fontFamily:'serif',fontWeight:'bold'}}>AUTO CRAFTER</h1>
          
        <div className="controls" >
          {isBpmn ? (
            <>
              <button className='fullscreen-btn' onClick={handleOpenFullscreen} >
              <svg viewBox="0 0 448 512" height="1em" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32s32-14.3 32-32V96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H64V352zM320 32c-17.7 0-32 14.3-32 32s14.3 32 32 32h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V64c0-17.7-14.3-32-32-32H320zM448 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V352z"
    ></path>
  </svg>
  <span class="tooltip">Fullscreen</span>
              </button>
              <button className="export" onClick={exportBpmnAsSVG} >Export as SVG</button>
              <button className="export" onClick={exportBpmnAsPNG} >Export as PNG</button>
              <div className='bpcon' style={{marginLeft:'10px'}}>
              <label>
                Task Color
                <input type="color" value={taskColor} onChange={(e) => setTaskColor(e.target.value)} />
              </label>
              <label >
                Event Color
                <input
                  type="color"
                  value={eventColor}
                  onChange={(e) => setEventColor(e.target.value)}
                />
              </label>
              <label >
                GatewayColor
                <input
                  type="color"
                  value={gatewayColor}
                  onChange={(e) => setGatewayColor(e.target.value)}
                />
              </label>
              </div>
            </>
          ) : (
            <>
              <button className='fullscreen-btn' onClick={openMermaidFullscreen}> 
              <svg viewBox="0 0 448 512" height="1em" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32s32-14.3 32-32V96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H64V352zM320 32c-17.7 0-32 14.3-32 32s14.3 32 32 32h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V64c0-17.7-14.3-32-32-32H320zM448 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V352z"
    ></path>
  </svg>
  <span class="tooltip">Fullscreen</span>
              </button>
              <button className="export" onClick={exportMermaidAsSVG}>Export as SVG</button>
              <button className="export" onClick={exportMermaidAsPNG}>Export as PNG</button>
              <div className="mermaid-controls">
                
                               <label className='r'style={{fontSize:'23px',fontWeight:'bold',fontFamily:'serif'}}> Rough</label> 
              <label className='switch' style={{marginLeft:'7px'}}>
                  
                  <input
                    type="checkbox"
                    checked={isRough}
                    onChange={toggleRoughDiagram}
                  />
                    <span className="slider round" ></span>
                </label>
                <label className='r'style={{fontSize:'20px',fontWeight:'bold',fontFamily:'serif'}}> Pan and Zoom</label>
                <label className='switch' style={{marginLeft:'7px'}}>
                 
                  <input
                    type="checkbox"
                    checked={isPanZoom}
                    onChange={togglePanZoom}
                  />
                   <span className="slider round" ></span>
                </label>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="container">
        <div className="left" style={{ width: `${leftPaneWidth}%` }}>
          <div className='tab-container'>
        <Button className={`tab-button ${activeTab === 'scenario' ? 'active' : ''}`} onClick={() => switchTab('scenario') } >
                        Scenario
                    </Button>
                    <Button className={`btn btn-light tab-button ${activeTab === 'prompt' ? 'active' : ''}`} onClick={() => switchTab('prompt')}>
                        Prompt
                    </Button>
                    <Button className={`btn btn-light tab-button ${activeTab === 'code' ? 'active' : ''}`} onClick={() => {  switchTab('code'); }}>
    Code
</Button>
<label className="switch">
          <input
            type="checkbox"
            checked={isBpmn}
            onChange={toggleDiagramType}
          />
          <span className="slider round"></span>
        </label>
</div>

{activeTab === 'scenario' && (          <div className="row">
                       <div className="input-group">
                           <textarea
                               type="text"
                               className="form-control custom-textarea thick-border scen"
                               style={{ height: "200px", textAlign: 'left'}}
                               placeholder="Type your Scenario or upload a document"
                               value={input}
                               onChange={(e) => setInput(e.target.value)}
                           />
                           <div className="input-group">
                               <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange1} />
                           </div>

                           <div className='container mt-2' style={{paddingRight: '75px'}}>
         <div className="row" style={{marginTop:'30px'}}>
           <div className="col-md-2 mb-3" style={{marginLeft: '20px',marginTop:'30px'}}>
             <button className="shadow__btn"  type="button" disabled={!uploadedFile  && input.length<50} onClick={() => handleSend('flowdiagram')}>
               {loading ? 'Loading...' : 'Flow Diagram'}
             </button>
           </div>
           <div className="col-md-2 mb-3" style={{marginLeft: '20px',marginTop:'30px'}}>
             <button className="shadow__btn" type="button" disabled={!uploadedFile  && input.length<50} onClick={() => handleSend('sequencediagram')}>
             {loading ? 'Loading...' : 'Sequence'}
             </button>
           </div>
           
           <div className="col-md-2 mb-3" style={{marginLeft: '20px',marginTop:'30px'}}>
             <button className="shadow__btn"  type="button" disabled={input.length<50 && !uploadedFile } onClick={() => handleSend('componentdiagram')}>
             {loading ? 'Loading...' : 'Component'}
             </button>
           </div>
           </div>
           <div className="col-md-2 mb-3" style={{marginLeft: '50px',marginTop:'120px'}}>
             <button className="shadow__btn" type="button" disabled={input.length<50 && !uploadedFile} onClick={() => handleSend('statediagram')}>
             {loading ? 'Loading...' : 'State Diagram'}
             </button>
           </div>

           
           <div className='container mt-2'>
         <div className="row" >
          
                   <div className="col-md-2 mb-2" style={{marginLeft: '60px',marginTop:'50px'}}>
             <button className="shadow__btn" disabled={input.length<50 && !uploadedFile } type="button" onClick={() => handleSend('erdiagram')}>
             {loading ? 'Loading...' : 'ER Diagram'}
             </button>
           </div>
           <div className="col-md-2 mb-2" style={{marginLeft: '60px',marginTop:'30px'}}>
             <button className="shadow__btn"  disabled={input.length<50 && !uploadedFile } type="button" onClick={() => handleSend('piechart')}>
             {loading ? 'Loading...' : 'Pie Chart'}
             </button>
           </div>
           {/* <div className="col-md-2 mb-2">
             <button className="btn btn-pink btn-sm btn-equal-size" type="button" onClick={() => handleSend('gitgraph')}>
               Git
             </button>
           </div> */}
           <div className="col-md-2 mb-2" style={{marginLeft: '60px',marginTop:'30px'}}>
             <button className="shadow__btn" disabled={input.length<50 && !uploadedFile } type="button"  onClick={() => handleSend('mindmap')}>
             {loading ? 'Loading...' : 'Mind Map'}
             </button>
           </div>
         </div>
         </div>
         </div>



                       </div>

                   </div>
                   
                
           
                   )}



                   
                   {activeTab === 'prompt' &&( <>   
    <div className="input-group">
        <textarea
          className="form-control custom-textarea thick-border scen"
          style={{ textAlign: 'left' }}
          value={prompt}
          placeholder="Edit the prompt sent to OpenAI"
          onChange={(e) => setPrompt(e.target.value)}
          ref={promptRef}
         
        />
      </div>

      <div class="containe "> 
       <textarea className='scen' style={{ height: "60px", textAlign: 'left' }}
          value={userQuestion}
          placeholder="Ask your question here..."
          onChange={(e) => setUserQuestion(e.target.value)}>
        </textarea> <div class="btn-container">
           <button type="button" onClick={handleSendRegenerate}>Submit</button> </div></div>
      
      
      
       </> )}
                  
       
                  
           
              
          {activeTab === 'code' && (
    <>
        <h1 className='tit'>{isBpmn ? 'BPMN CODE' : 'MERMAID CODE'}</h1>
        <textarea
            value={isBpmn ? xml : chart}
            onChange={handleInputChange}
        />
    </>
)}
        </div>
 

        <div
          className="divider"
          ref={dividerRef}
          onMouseDown={handleMouseDown}
        />
        <div className="right" style={{ width: `${100 - leftPaneWidth}%` }}>
          
          {isBpmn ? (
            <BpmnDiagram
              ref={bpmnRef}
              xml={xml}
              onChange={handleDiagramChange}
              isRough={isRough}
              taskColor={taskColor}
              eventColor={eventColor}
              gatewayColor={gatewayColor}
            />
          ) : (
            <MermaidDiagram ref={mermaidRef} code={chart} isRough={isRough} isPanZoom={isPanZoom} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;