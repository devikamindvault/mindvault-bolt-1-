import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

interface RichTextEditorProps {
  onTranscription?: (text: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ onTranscription }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const toast = (options: {
    title: string;
    description: string;
    status: string;
    duration: number;
    isClosable: boolean;
  }) => {
    console.log(`${options.status.toUpperCase()}: ${options.title} - ${options.description}`);
  };

  const handleTranscription = (text: string) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = document.createTextNode(' ' + text + ' ');
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.innerHTML += ' ' + text + ' ';
      }
    }
    if (onTranscription) {
      onTranscription(text);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.margin = '10px 0';
            
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.insertNode(img);
              range.setStartAfter(img);
              range.setEndAfter(img);
            } else if (editorRef.current) {
              editorRef.current.appendChild(img);
            }
          };
          reader.readAsDataURL(file);
        }
      } else if (item.type === 'text/plain') {
        item.getAsString((text) => {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const textNode = document.createTextNode(text);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
          }
        });
      }
    }
  };

  const downloadAsPDF = async () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      
      const content = editorRef.current?.querySelector('.rich-editor');
      if (!content) return;
      
      const contentWidth = content.scrollWidth;
      const contentHeight = content.scrollHeight;
      
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      
      const scale = Math.min(pdfWidth / contentWidth, pdfHeight / contentHeight) * 0.9;
      
      const canvas = await htmlToImage.toCanvas(content as HTMLElement, {
        pixelRatio: 2,
        skipFonts: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: `${contentWidth}px`,
          height: `${contentHeight}px`
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const scaledWidth = contentWidth * scale;
      const scaledHeight = contentHeight * scale;
      
      doc.addImage(imgData, 'PNG', 10, 10, scaledWidth, scaledHeight);
      
      doc.save('document.pdf');
      
      toast({
        title: "Document Downloaded",
        description: "Your document has been downloaded as a PDF.",
        status: "success",
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    }
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <button onClick={downloadAsPDF} className="download-btn">
          📄 Download PDF
        </button>
      </div>
      
      <div 
        ref={editorRef}
        className="rich-editor"
        contentEditable
        suppressContentEditableWarning={true}
        onPaste={handlePaste}
        style={{
          minHeight: '400px',
          border: '1px solid #ccc',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          fontSize: '16px',
          lineHeight: '1.6',
          outline: 'none'
        }}
      >
        <p>Start writing your journal entry...</p>
      </div>
    </div>
  );
};

export default RichTextEditor;