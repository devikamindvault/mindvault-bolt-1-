import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Upload, FileText, X, Download, Save, Trash2, Lightbulb, ChevronDown, Smile } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import jsPDF from 'jspdf';

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  isPinned: boolean;
  createdAt: string;
}

interface RichTextEditorProps {
  selectedIdea: Idea | null;
  ideas: Idea[];
  onSelectIdea: (idea: Idea) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ selectedIdea, ideas, onSelectIdea }) => {
  const [content, setContent] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{name: string, content: string, type: string} | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showIdeaSelector, setShowIdeaSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Common emojis for quick access
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣'
  ];

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (selectedIdea && content) {
      try {
        const key = `mindvault-content-${selectedIdea.id}`;
        
        // Check if content is too large (localStorage limit is ~5-10MB)
        const contentSize = new Blob([content]).size;
        const maxSize = 4 * 1024 * 1024; // 4MB limit to be safe
        
        if (contentSize > maxSize) {
          console.warn('Content too large for localStorage, compressing...');
          // Remove base64 images from auto-save to reduce size
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = content;
          const images = tempDiv.querySelectorAll('img');
          images.forEach(img => {
            if (img.src.startsWith('data:')) {
              img.src = 'data:image/placeholder'; // Replace with placeholder
            }
          });
          localStorage.setItem(key, tempDiv.innerHTML);
          console.log('Auto-saved compressed content');
        } else {
          localStorage.setItem(key, content);
          console.log('Auto-saved content');
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, clearing old data...');
          // Clear old content to make space
          const keys = Object.keys(localStorage);
          const contentKeys = keys.filter(key => key.startsWith('mindvault-content-'));
          // Keep only the current idea and 2 most recent ones
          contentKeys.sort().slice(0, -3).forEach(key => {
            localStorage.removeItem(key);
          });
          
          try {
            localStorage.setItem(`mindvault-content-${selectedIdea.id}`, content);
            console.log('Auto-saved after cleanup');
          } catch (retryError) {
            console.error('Failed to save even after cleanup:', retryError);
            alert('Storage full. Please export your work and refresh the page.');
          }
        } else {
          console.error('Error auto-saving:', error);
        }
      }
    }
  }, [selectedIdea, content]);

  // Set up auto-save timer
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    if (selectedIdea && content) {
      autoSaveTimeoutRef.current = setTimeout(autoSave, 30000); // 30 seconds
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, selectedIdea, autoSave]);

  // Load content when idea changes
  useEffect(() => {
    if (selectedIdea) {
      const key = `mindvault-content-${selectedIdea.id}`;
      const savedContent = localStorage.getItem(key);
      
      // If no saved content exists, create initial content from idea data
      let initialContent = savedContent;
      if (!savedContent) {
        initialContent = `
          <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px;">
            <h2 style="margin: 0 0 10px 0; color: #007bff; font-size: 24px; font-weight: bold;">${selectedIdea.title}</h2>
            ${selectedIdea.category ? `<div style="margin-bottom: 8px;"><strong>Category:</strong> <span style="background: #e3f2fd; padding: 2px 8px; border-radius: 12px; font-size: 12px; color: #1976d2;">${selectedIdea.category}</span></div>` : ''}
            ${selectedIdea.deadline ? `<div style="margin-bottom: 8px;"><strong>Target Date:</strong> ${new Date(selectedIdea.deadline).toLocaleDateString()}</div>` : ''}
            <div style="color: #333; line-height: 1.6; white-space: pre-wrap; margin-top: 15px;">${selectedIdea.description}</div>
          </div>
        `;
      }
      
      setContent(initialContent || '');
      if (editorRef.current) {
        editorRef.current.innerHTML = initialContent || '';
      }
    } else {
      setContent('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }
  }, [selectedIdea]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowImageModal(false);
        setShowDocumentModal(false);
        setShowEmojiPicker(false);
        setShowIdeaSelector(false);
      }
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'b':
            e.preventDefault();
            execCommand('bold');
            break;
          case 'i':
            e.preventDefault();
            execCommand('italic');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdea, content]);

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (!selectedIdea) {
      alert('Please select an idea first');
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      } else {
        handleDocumentUpload(file);
      }
    });
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const insertAtCursor = (html: string) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const div = document.createElement('div');
      div.innerHTML = html;
      const fragment = document.createDocumentFragment();
      
      while (div.firstChild) {
        fragment.appendChild(div.firstChild);
      }
      
      range.insertNode(fragment);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current.innerHTML += html;
    }
    
    setContent(editorRef.current.innerHTML);
    editorRef.current.focus();
  };

  const validateFile = (file: File, type: 'image' | 'document'): boolean => {
    const maxSize = type === 'image' ? 10 * 1024 * 1024 : 25 * 1024 * 1024; // 10MB for images, 25MB for docs
    
    if (file.size > maxSize) {
      alert(`File too large. Maximum size is ${type === 'image' ? '10MB' : '25MB'}`);
      return false;
    }

    if (type === 'image') {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Invalid image format. Supported: JPG, PNG, GIF, WebP');
        return false;
      }
    } else {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown'
      ];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
        alert('Invalid document format. Supported: PDF, DOC, DOCX, TXT');
        return false;
      }
    }

    return true;
  };

  const handleImageUpload = async (file: File) => {
    if (!validateFile(file, 'image')) return;
    
    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const imageHtml = `
          <span class="image-wrapper" contenteditable="false" style="display: inline-block; position: relative; margin: 2px; vertical-align: top;">
            <img 
              id="${imageId}"
              src="${imageUrl}" 
              alt="${file.name}"
              onclick="window.openImagePreview && window.openImagePreview('${imageUrl}')"
              style="max-width: 200px; max-height: 150px; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; resize: both; overflow: hidden; display: block;"
            />
            <button 
              onclick="this.parentElement.remove(); window.updateContent && window.updateContent()"
              style="position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; border-radius: 50%; background: #ef4444; color: white; border: none; cursor: pointer; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; z-index: 10;"
            >×</button>
          </span>
        `;
        
        insertAtCursor(imageHtml);
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
      setIsUploading(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    if (!validateFile(file, 'document')) return;
    
    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Store document data
        const docData = {
          id: docId,
          name: file.name,
          type: file.type,
          content: content,
          size: file.size
        };
        
        localStorage.setItem(`doc-${docId}`, JSON.stringify(docData));
        
        const getDocIcon = (type: string) => {
          if (type.includes('pdf')) return '📄';
          if (type.includes('word') || type.includes('document')) return '📝';
          if (type.includes('text')) return '📃';
          return '📎';
        };
        
        const documentHtml = `
          <span class="document-wrapper" contenteditable="false" style="display: inline-block; position: relative; margin: 2px 4px; vertical-align: top;">
            <span 
              onclick="window.openDocumentPreview && window.openDocumentPreview('${docId}')"
              style="display: inline-flex; align-items: center; padding: 6px 10px; background: #f3f4f6; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; max-width: 200px; font-size: 14px; color: #374151;"
            >
              <span style="font-size: 18px; margin-right: 8px;">${getDocIcon(file.type)}</span>
              <span style="font-weight: 500; truncate: true;">${file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}</span>
            </span>
            <button 
              onclick="this.parentElement.remove(); window.updateContent && window.updateContent()"
              style="position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; border-radius: 50%; background: #ef4444; color: white; border: none; cursor: pointer; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; z-index: 10;"
            >×</button>
          </span>
        `;
        
        insertAtCursor(documentHtml);
        setIsUploading(false);
      };
      
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document. Please try again.');
      setIsUploading(false);
    }
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(handleImageUpload);
    }
    e.target.value = '';
  };

  const handleDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(handleDocumentUpload);
    }
    e.target.value = '';
  };

  const handleSave = () => {
    if (!selectedIdea) {
      alert('Please select an idea first');
      return;
    }

    try {
      const key = `mindvault-content-${selectedIdea.id}`;
      localStorage.setItem(key, content);
      alert('Content saved successfully!');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert('Storage full! Please export your work or delete old content.');
      } else {
        alert('Error saving content. Please try again.');
      }
    }
  };

  const exportToSimplePDF = async () => {
    if (!selectedIdea || !content) {
      alert('Please select an idea and add some content first');
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;

      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedIdea.title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Content (simplified text extraction)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(textContent, pageWidth - (margin * 2));
      pdf.text(lines, margin, yPosition);

      pdf.save(`${selectedIdea.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Error exporting to PDF. Please try again.');
    }
  };

  // Parse editor content for PDF generation
  const parseEditorContent = (htmlContent: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const elements = [];
    const images = [];
    const documents = [];
    
    // Walk through all nodes
    const walkNodes = (node: Node, x = 50, y = 50) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          const parent = node.parentElement;
          elements.push({
            type: 'text',
            text,
            x,
            y,
            bold: parent?.tagName === 'STRONG' || parent?.tagName === 'B',
            italic: parent?.tagName === 'EM' || parent?.tagName === 'I',
            fontSize: 12
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        
        if (element.tagName === 'IMG') {
          const img = element as HTMLImageElement;
          images.push({
            src: img.src,
            x,
            y,
            width: Math.min(img.width || 200, 200),
            height: Math.min(img.height || 150, 150),
            alt: img.alt || 'Image'
          });
        } else if (element.classList.contains('document-wrapper')) {
          const docSpan = element.querySelector('span[onclick]');
          if (docSpan) {
            const onclick = docSpan.getAttribute('onclick') || '';
            const docIdMatch = onclick.match(/openDocumentPreview\('([^']+)'\)/);
            if (docIdMatch) {
              const docId = docIdMatch[1];
              const docData = localStorage.getItem(`doc-${docId}`);
              if (docData) {
                const doc = JSON.parse(docData);
                documents.push({
                  id: docId,
                  name: doc.name,
                  type: doc.type,
                  content: doc.content,
                  x,
                  y,
                  width: 100,
                  height: 30
                });
              }
            }
          }
        }
        
        // Recursively process child nodes
        for (let i = 0; i < node.childNodes.length; i++) {
          walkNodes(node.childNodes[i], x, y + (i * 20));
        }
      }
    };
    
    walkNodes(doc.body);
    
    return { elements, images, documents };
  };

  // Convert image to buffer
  const imageToBuffer = async (src: string): Promise<Uint8Array> => {
    if (src.startsWith('data:')) {
      // Base64 image
      const base64Data = src.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } else {
      // URL image - convert to canvas then to buffer
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => {
                const arrayBuffer = reader.result as ArrayBuffer;
                resolve(new Uint8Array(arrayBuffer));
              };
              reader.readAsArrayBuffer(blob);
            } else {
              reject(new Error('Failed to convert image to blob'));
            }
          }, 'image/png');
        };
        img.onerror = reject;
        img.src = src;
      });
    }
  };

  // Generate interactive PDF
  const generateInteractivePDF = async () => {
    if (!selectedIdea || !content) {
      alert('Please select an idea and add some content first');
      return;
    }

    setIsGeneratingPDF(true);
    setPdfProgress(10);

    try {
      // Parse editor content
      const parsedContent = parseEditorContent(content);
      setPdfProgress(20);

      // Create PDF document
      const pdfDoc = await PDFLib.create();
      const page = pdfDoc.addPage([612, 792]); // Letter size
      const { width, height } = page.getSize();
      
      setPdfProgress(30);

      // Add title
      const titleFont = await pdfDoc.embedFont('Helvetica-Bold');
      page.drawText(selectedIdea.title, {
        x: 50,
        y: height - 50,
        size: 20,
        font: titleFont,
        color: rgb(0, 0, 0)
      });

      let currentY = height - 100;
      setPdfProgress(40);

      // Add text elements
      const regularFont = await pdfDoc.embedFont('Helvetica');
      const boldFont = await pdfDoc.embedFont('Helvetica-Bold');
      
      for (const element of parsedContent.elements) {
        if (currentY < 50) {
          // Add new page if needed
          const newPage = pdfDoc.addPage([612, 792]);
          currentY = height - 50;
        }
        
        page.drawText(element.text, {
          x: element.x,
          y: currentY,
          size: element.fontSize,
          font: element.bold ? boldFont : regularFont,
          color: rgb(0, 0, 0)
        });
        
        currentY -= 20;
      }
      
      setPdfProgress(60);

      // Add images with clickable areas
      for (const img of parsedContent.images) {
        try {
          const imageBuffer = await imageToBuffer(img.src);
          let embeddedImage;
          
          // Determine image type and embed
          if (img.src.includes('data:image/png') || img.src.includes('.png')) {
            embeddedImage = await pdfDoc.embedPng(imageBuffer);
          } else {
            embeddedImage = await pdfDoc.embedJpg(imageBuffer);
          }
          
          // Calculate position
          const imageY = Math.max(currentY - img.height, 50);
          
          // Draw image
          page.drawImage(embeddedImage, {
            x: img.x,
            y: imageY,
            width: img.width,
            height: img.height
          });
          
          // Add clickable annotation (link to full-size view)
          const annotation = pdfDoc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [img.x, imageY, img.x + img.width, imageY + img.height],
            Border: [0, 0, 2],
            C: [0, 0, 1], // Blue border
            A: {
              Type: 'Action',
              S: 'JavaScript',
              JS: `this.zoom = 200; this.gotoNamedDest("image_${img.alt}");`
            }
          });
          
          page.node.set('Annots', pdfDoc.context.obj([annotation]));
          currentY = imageY - 20;
          
        } catch (imgError) {
          console.warn('Failed to embed image:', imgError);
        }
      }
      
      setPdfProgress(80);

      // Add document attachments
      for (const doc of parsedContent.documents) {
        try {
          // Add document icon (using text for now)
          const docY = Math.max(currentY - 20, 50);
          
          page.drawText(`📄 ${doc.name}`, {
            x: doc.x,
            y: docY,
            size: 12,
            font: regularFont,
            color: rgb(0, 0, 0.8)
          });
          
          // Create attachment
          if (doc.content && doc.type.startsWith('text/')) {
            const textBuffer = new TextEncoder().encode(doc.content);
            await pdfDoc.attach(textBuffer, doc.name, {
              mimeType: doc.type,
              description: `Attached document: ${doc.name}`
            });
            
            // Add clickable annotation
            const docAnnotation = pdfDoc.context.obj({
              Type: 'Annot',
              Subtype: 'FileAttachment',
              Rect: [doc.x, docY, doc.x + 200, docY + 15],
              Contents: `Click to open ${doc.name}`,
              Name: 'Paperclip',
              F: 4, // Print flag
              FS: {
                Type: 'Filespec',
                F: doc.name,
                UF: doc.name
              }
            });
            
            page.node.set('Annots', pdfDoc.context.obj([docAnnotation]));
          }
          
          currentY = docY - 25;
          
        } catch (docError) {
          console.warn('Failed to attach document:', docError);
        }
      }
      
      setPdfProgress(90);

      // Set PDF metadata
      pdfDoc.setTitle(selectedIdea.title);
      pdfDoc.setAuthor('Mind Vault');
      pdfDoc.setSubject('Interactive Document Export');
      pdfDoc.setCreator('Mind Vault Editor');
      pdfDoc.setProducer('Mind Vault PDF Generator');
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());

      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save();
      setPdfProgress(100);

      // Download PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const filename = `${selectedIdea.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_interactive_${Date.now()}.pdf`;
      saveAs(blob, filename);

      alert('Interactive PDF generated successfully! Images are clickable and documents are attached.');
      
    } catch (error) {
      console.error('Error generating interactive PDF:', error);
      alert('Error generating interactive PDF. Falling back to simple PDF...');
      // Fallback to simple PDF
      await exportToSimplePDF();
    } finally {
      setIsGeneratingPDF(false);
      setPdfProgress(0);
    }
  };

  const clearContent = () => {
    if (confirm('Are you sure you want to clear all content? This action cannot be undone.')) {
      setContent('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    insertAtCursor(emoji);
    setShowEmojiPicker(false);
  };

  const handleVoiceTranscription = (text: string) => {
    insertAtCursor(` ${text} `);
  };

  // Global functions for media handling
  useEffect(() => {
    (window as any).openImagePreview = (src: string) => {
      setSelectedImage(src);
      setShowImageModal(true);
    };

    (window as any).openDocumentPreview = (docId: string) => {
      const docData = localStorage.getItem(`doc-${docId}`);
      if (docData) {
        const doc = JSON.parse(docData);
        
        let content = '';
        if (doc.type.includes('pdf')) {
          content = 'PDF preview not available in this view. Download to view the full document.';
        } else if (doc.type.includes('word') || doc.type.includes('document')) {
          content = 'Word document preview not available. Download to view the full document.';
        } else if (doc.type.startsWith('text/') || doc.name.endsWith('.txt') || doc.name.endsWith('.md')) {
          content = doc.content;
        } else {
          content = 'Preview not available for this file type.';
        }
        
        setSelectedDocument({
          name: doc.name,
          type: doc.type,
          content: content
        });
        setShowDocumentModal(true);
      }
    };

    (window as any).updateContent = () => {
      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
      }
    };

    return () => {
      delete (window as any).openImagePreview;
      delete (window as any).openDocumentPreview;
      delete (window as any).updateContent;
    };
  }, []);

  const filteredIdeas = ideas.filter(idea =>
    idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rich-text-editor-container">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center gap-2 flex-wrap shadow-sm">
        <button
          onClick={() => execCommand('bold')}
          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors font-semibold"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => execCommand('italic')}
          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2"></div>

        <button
          onClick={() => imageInputRef.current?.click()}
          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2"
          disabled={!selectedIdea || isUploading}
          title="Insert Image"
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm">Image</span>
        </button>

        <button
          onClick={() => documentInputRef.current?.click()}
          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2"
          disabled={!selectedIdea || isUploading}
          title="Insert Document"
        >
          <FileText className="w-4 h-4" />
          <span className="text-sm">Document</span>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2"></div>

        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Insert Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
              <div className="grid grid-cols-8 gap-1 w-64">
                {commonEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => insertEmoji(emoji)}
                    className="p-2 hover:bg-gray-100 rounded text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <VoiceRecorder 
          onTranscription={handleVoiceTranscription}
          disabled={!selectedIdea}
        />

        <div className="flex-1"></div>

        <div className="relative">
          <button
            onClick={() => setShowIdeaSelector(!showIdeaSelector)}
            className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2"
            title="Switch Idea"
          >
            <Lightbulb className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {showIdeaSelector && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] max-h-96 overflow-hidden">
              <div className="p-3 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search ideas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredIdeas.length > 0 ? (
                  filteredIdeas.map((idea) => (
                    <button
                      key={idea.id}
                      onClick={() => {
                        onSelectIdea(idea);
                        setShowIdeaSelector(false);
                        setSearchTerm('');
                      }}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                        selectedIdea?.id === idea.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium text-sm truncate" style={{ color: '#1f2937 !important' }}>
                        {idea.title}
                        {idea.isPinned && <span className="ml-2 text-yellow-500">📌</span>}
                      </div>
                      <div className="text-xs truncate mt-1" style={{ color: '#6b7280 !important' }}>
                        {idea.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {idea.category && (
                          <span className="text-xs bg-blue-100 px-2 py-1 rounded" style={{ color: '#1e40af !important' }}>
                            {idea.category}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: '#9ca3af !important' }}>
                          {new Date(idea.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm" style={{ color: '#6b7280 !important' }}>
                    {searchTerm ? 'No ideas found matching your search' : 'No ideas available'}
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowIdeaSelector(false);
                    window.dispatchEvent(new CustomEvent('switchToIdeas'));
                  }}
                  className="w-full text-center hover:text-blue-700 text-sm font-medium"
                  style={{ color: '#2563eb !important' }}
                >
                  + Create New Idea
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2"></div>

        <button
          onClick={handleSave}
          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          disabled={!selectedIdea}
          title="Save (Ctrl+S)"
        >
          <Save className="w-4 h-4" />
        </button>

        <button
          onClick={generateInteractivePDF}
          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          disabled={!selectedIdea || !content || isGeneratingPDF}
          title="Export Interactive PDF"
        >
          {isGeneratingPDF ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={exportToSimplePDF}
          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-xs"
          disabled={!selectedIdea || !content || isGeneratingPDF}
          title="Export Simple PDF"
        >
          PDF
        </button>

        <button
          onClick={clearContent}
          className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Clear Content"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div className="relative">
        {/* PDF Generation Progress */}
        {isGeneratingPDF && (
          <div className="absolute top-0 left-0 right-0 bg-blue-600 h-1 z-50">
            <div 
              className="bg-blue-400 h-full transition-all duration-300"
              style={{ width: `${pdfProgress}%` }}
            ></div>
          </div>
        )}
        
        {isGeneratingPDF && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-40">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">Generating Interactive PDF...</p>
              <p className="text-sm text-gray-500">{pdfProgress}% complete</p>
            </div>
          </div>
        )}

        <div
          ref={editorRef}
          className={`min-h-[600px] p-6 bg-white focus:outline-none text-gray-900 leading-relaxed ${
            dragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
          }`}
          contentEditable={!!selectedIdea}
          onInput={(e) => setContent((e.target as HTMLDivElement).innerHTML)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#1f2937 !important'
          }}
          placeholder={selectedIdea ? `Start writing about: ${selectedIdea.title}` : "Select an idea to start writing..."}
        />

        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-gray-600">Uploading...</div>
          </div>
        )}

        {!selectedIdea && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            <div className="text-center text-gray-500" style={{ color: '#6b7280' }}>
              <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#374151' }}>No Idea Selected</h3>
              <p className="mb-4" style={{ color: '#6b7280' }}>Choose an idea from the toolbar or create a new one to start writing.</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('switchToIdeas'))}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Go to Ideas Page
              </button>
            </div>
          </div>
        )}

        {dragOver && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center border-2 border-dashed border-blue-300">
            <div className="text-center text-blue-600">
              <Upload className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg font-medium">Drop files here to upload</p>
              <p className="text-sm">Images and documents supported</p>
            </div>
          </div>
        )}
      </div>

      {/* File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        multiple
        onChange={handleImageInputChange}
        className="hidden"
      />

      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        multiple
        onChange={handleDocumentInputChange}
        className="hidden"
      />

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10000]"
          onClick={() => setShowImageModal(false)}
        >
          <button 
            className="absolute top-6 right-6 w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full flex items-center justify-center transition-all duration-200 z-[10001] backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowImageModal(false);
            }}
            title="Close preview"
          >
            <X className="w-6 h-6" />
          </button>
          <button 
            className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full flex items-center justify-center transition-all duration-200 z-[10001]"
            onClick={(e) => {
              e.stopPropagation();
              setShowImageModal(false);
            }}
            title="Close preview"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && selectedDocument && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10000] p-4"
          onClick={() => setShowDocumentModal(false)}
        >
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedDocument.name}</h3>
                <p className="text-sm text-gray-500">{selectedDocument.type}</p>
              </div>
              <button 
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => setShowDocumentModal(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                {selectedDocument.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;