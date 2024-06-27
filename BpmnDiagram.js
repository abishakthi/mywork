import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import BpmnJS from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import './App.css';

const BpmnDiagram = forwardRef(({ xml, onChange, taskColor, eventColor, gatewayColor }, ref) => {
  const containerRef = useRef(null);
  const bpmnModelerRef = useRef(null);

  const handleDiagramChange = useCallback(async () => {
    try {
      const { xml } = await bpmnModelerRef.current.saveXML({ format: true });
      onChange(xml);
    } catch (error) {
      console.error('Error saving BPMN diagram', error);
    }
  }, [onChange]);

  useEffect(() => {
    const bpmnModeler = new BpmnJS({
      container: containerRef.current
    });
    bpmnModelerRef.current = bpmnModeler;

    bpmnModeler.on('commandStack.changed', handleDiagramChange);

    const renderDiagram = async () => {
      try {
        await bpmnModeler.importXML(xml);
        bpmnModeler.get('canvas').zoom('fit-viewport');
        removeWatermark();
        colorizeElements();
      } catch (error) {
        console.error('Error rendering BPMN diagram', error);
      }
    };

    if (xml) {
      renderDiagram();
    }

    return () => {
      bpmnModeler.destroy();
    };
  }, [xml, handleDiagramChange, taskColor, eventColor, gatewayColor]);

  useImperativeHandle(ref, () => ({
    async exportAsSVG() {
      try {
        const { svg } = await bpmnModelerRef.current.saveSVG();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'diagram.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error exporting as SVG', error);
      }
    },
    async exportAsPNG() {
      try {
        const { svg } = await bpmnModelerRef.current.saveSVG();
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          context.fillStyle = '#FFFFFF'; // Background color
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'diagram.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 'image/png');
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svg);
      } catch (error) {
        console.error('Error exporting as PNG', error);
      }
    },
    openInFullscreen() {
      try {
        const { svg } = bpmnModelerRef.current.saveSVG();
        openDiagramInNewWindow(svg);
      } catch (error) {
        console.error('Error opening in fullscreen', error);
      }
    }
  }));

  const openDiagramInNewWindow = async () => {
    try {
      const { svg } = await bpmnModelerRef.current.saveSVG();
      const newWindow = window.open('', '_blank', 'fullscreen=yes');
      if (newWindow) {
        const documentContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>BPMN Diagram Fullscreen View</title>
            <style>
              body, html {
                margin: 0;
                height: 100%;
                overflow: hidden;
              }
              svg {
                width: 100%;
                height: 100%;
              }
            </style>
          </head>
          <body>
            ${svg}
          </body>
          </html>
        `;
        newWindow.document.open();
        newWindow.document.write(documentContent);
        newWindow.document.close();
      } else {
        throw new Error('Failed to open fullscreen window');
      }
    } catch (error) {
      console.error('Error opening in fullscreen', error);
    }
  };
  
  const colorizeElements = () => {
    const elementRegistry = bpmnModelerRef.current.get('elementRegistry');
    const modeling = bpmnModelerRef.current.get('modeling');

    elementRegistry.getAll().forEach(element => {
      const businessObject = element.businessObject;
      const strokeColor = '#000';

      if (businessObject.$instanceOf('bpmn:Task')) {
        modeling.setColor(element, {
          fill: taskColor,
          stroke: strokeColor
        });
      } else if (businessObject.$instanceOf('bpmn:Event')) {
        modeling.setColor(element, {
          fill: eventColor,
          stroke: strokeColor
        });
      } else if (businessObject.$instanceOf('bpmn:Gateway')) {
        modeling.setColor(element, {
          fill: gatewayColor,
          stroke: strokeColor
        });
      }
    });
  };

  const removeWatermark = () => {
    const watermark = containerRef.current.querySelector('.bjs-powered-by');
    if (watermark) {
      watermark.remove();
    }
  };

  return <div ref={containerRef} className="diagramContainer" style={{ width: '100%', height: '100%' }}></div>;
});

export default BpmnDiagram;