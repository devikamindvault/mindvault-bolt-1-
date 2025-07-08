import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Image,
  FileText,
  Smile,
  Type,
  Download,
  Upload,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  goalTitle?: string;
}

interface MediaItem {
  id: string;
  type: 'image' | 'document';
  url: string;
  name: string;
  size?: number;
}

export function RichTextEditor({ content, onChange, goalTitle }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [fontSize, setFontSize] = useState('16');
  const [fontFamily, setFontFamily] = useState('Georgia');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const { toast } = useToast();

  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐'
  ];

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          const mediaItem: MediaItem = {
            id: Date.now().toString() + Math.random(),
            type: 'image',
            url: imageUrl,
            name: file.name,
            size: file.size
          };
          
          setMediaItems(prev => [...prev, mediaItem]);
          insertImageAtCursor(imageUrl, file.name);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const documentUrl = e.target?.result as string;
        const mediaItem: MediaItem = {
          id: Date.now().toString() + Math.random(),
          type: 'document',
          url: documentUrl,
          name: file.name,
          size: file.size
        };
        
        setMediaItems(prev => [...prev, mediaItem]);
        insertDocumentAtCursor(documentUrl, file.name, file.size);
      };
      reader.readAsDataURL(file);
    });
  };

  const insertImageAtCursor = (imageUrl: string, imageName: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = imageName;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '8px';
      img.style.margin = '8px 0';
      img.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
      img.setAttribute('data-type', 'image');
      img.setAttribute('data-title', imageName);
      img.setAttribute('data-url', imageUrl);
      
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.setEndAfter(img);
      selection.removeAllRanges();
      selection.addRange(range);
      
      updateContent();
    }
  };

  const insertDocumentAtCursor = (documentUrl: string, documentName: string, size: number) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      const docContainer = document.createElement('span');
      docContainer.className = 'document-preview';
      docContainer.style.display = 'inline-flex';
      docContainer.style.alignItems = 'center';
      docContainer.style.padding = '8px 12px';
      docContainer.style.background = '#374151';
      docContainer.style.border = '1px solid #4b5563';
      docContainer.style.borderRadius = '6px';
      docContainer.style.margin = '4px';
      docContainer.style.color = '#e5e7eb';
      docContainer.style.textDecoration = 'none';
      docContainer.style.cursor = 'pointer';
      docContainer.setAttribute('data-type', 'document');
      docContainer.setAttribute('data-title', documentName);
      docContainer.setAttribute('data-url', documentUrl);
      docContainer.setAttribute('data-size', size.toString());
      
      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.style.width = '20px';
      icon.style.height = '20px';
      icon.style.marginRight = '8px';
      icon.style.background = '#60a5fa';
      icon.style.borderRadius = '4px';
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';
      icon.style.justifyContent = 'center';
      icon.style.color = 'white';
      icon.style.fontSize = '12px';
      icon.textContent = '📄';
      
      const text = document.createElement('span');
      text.textContent = `${documentName} (${Math.round(size / 1024)}KB)`;
      
      docContainer.appendChild(icon);
      docContainer.appendChild(text);
      
      docContainer.onclick = () => {
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = documentName;
        link.click();
      };
      
      range.deleteContents();
      range.insertNode(docContainer);
      range.setStartAfter(docContainer);
      range.setEndAfter(docContainer);
      selection.removeAllRanges();
      selection.addRange(range);
      
      updateContent();
    }
  };

  const insertEmoji = (emoji: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = document.createTextNode(emoji);
      range.deleteContents();
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      updateContent();
    }
    setShowEmojiPicker(false);
  };

  const downloadAsPDF = async () => {
    if (!editorRef.current) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = 20;

      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(goalTitle || 'Document', margin, yPosition);
      yPosition += 20;

      // Add date
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 20;

      // Process content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      // Extract text content
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      const lines = doc.splitTextToSize(textContent, pageWidth - 2 * margin);
      
      for (const line of lines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 7;
      }

      // Add media section
      const images = tempDiv.querySelectorAll('img[data-type="image"]');
      const documents = tempDiv.querySelectorAll('span[data-type="document"]');

      if (images.length > 0 || documents.length > 0) {
        yPosition += 20;
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Media Attachments', margin, yPosition);
        yPosition += 15;

        // Add images
        for (const img of Array.from(images)) {
          if (yPosition > pageHeight - 100) {
            doc.addPage();
            yPosition = margin;
          }

          const imgTitle = img.getAttribute('data-title') || 'Image';
          const imgUrl = img.getAttribute('data-url') || '';

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`📷 ${imgTitle}`, margin, yPosition);
          yPosition += 10;

          try {
            // Add image to PDF
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const image = new Image();
            
            await new Promise((resolve, reject) => {
              image.onload = () => {
                const maxWidth = 150;
                const maxHeight = 100;
                let { width, height } = image;
                
                if (width > maxWidth) {
                  height = (height * maxWidth) / width;
                  width = maxWidth;
                }
                if (height > maxHeight) {
                  width = (width * maxHeight) / height;
                  height = maxHeight;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(image, 0, 0, width, height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                doc.addImage(dataUrl, 'JPEG', margin, yPosition, width, height);
                doc.link(margin, yPosition, width, height, { url: imgUrl });
                resolve(null);
              };
              image.onerror = reject;
              image.src = imgUrl;
            });

            yPosition += 110;
          } catch (error) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text('(Image could not be embedded - click link to view)', margin, yPosition);
            yPosition += 15;
          }
        }

        // Add documents
        for (const docElement of Array.from(documents)) {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }

          const docTitle = docElement.getAttribute('data-title') || 'Document';
          const docUrl = docElement.getAttribute('data-url') || '';
          const docSize = docElement.getAttribute('data-size') || '';

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 255);
          doc.text(`📄 ${docTitle}`, margin, yPosition);
          doc.link(margin, yPosition, doc.getTextWidth(`📄 ${docTitle}`), 12, { url: docUrl });
          
          if (docSize) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`(${Math.round(parseInt(docSize) / 1024)}KB)`, margin + doc.getTextWidth(`📄 ${docTitle}`) + 5, yPosition);
          }
          
          doc.setTextColor(0, 0, 0);
          yPosition += 20;
        }
      }

      doc.save(`${goalTitle || 'document'}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: "Your document has been saved as PDF with all media attachments.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="editor-toolbar">
        {/* Text formatting */}
        <div className="toolbar-group">
          <button
            className="toolbar-button"
            onClick={() => handleCommand('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleCommand('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleCommand('underline')}
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </button>
        </div>

        {/* Font controls */}
        <div className="toolbar-group">
          <select
            className="toolbar-select"
            value={fontFamily}
            onChange={(e) => {
              setFontFamily(e.target.value);
              handleCommand('fontName', e.target.value);
            }}
          >
            <option value="Georgia">Georgia</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Courier New">Courier</option>
          </select>
          
          <select
            className="toolbar-select"
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              handleCommand('fontSize', '3');
              if (editorRef.current) {
                editorRef.current.style.fontSize = e.target.value + 'px';
              }
            }}
          >
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
            <option value="24">24px</option>
            <option value="28">28px</option>
            <option value="32">32px</option>
          </select>
        </div>

        {/* Alignment */}
        <div className="toolbar-group">
          <button
            className="toolbar-button"
            onClick={() => handleCommand('justifyLeft')}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleCommand('justifyCenter')}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleCommand('justifyRight')}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </div>

        {/* Media */}
        <div className="toolbar-group">
          <button
            className="toolbar-button"
            onClick={() => imageInputRef.current?.click()}
            title="Insert Image"
          >
            <Image className="h-4 w-4" />
          </button>
          <button
            className="toolbar-button"
            onClick={() => fileInputRef.current?.click()}
            title="Insert Document"
          >
            <FileText className="h-4 w-4" />
          </button>
          <div className="relative">
            <button
              className="toolbar-button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Insert Emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
            {showEmojiPicker && (
              <div className="emoji-picker">
                <div className="emoji-grid">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      className="emoji-item"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="toolbar-group">
          <button
            className="toolbar-button"
            onClick={downloadAsPDF}
            title="Download as PDF"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        className="rich-editor"
        contentEditable
        onInput={updateContent}
        onPaste={(e) => {
          // Handle paste events
          setTimeout(updateContent, 0);
        }}
        style={{
          fontSize: fontSize + 'px',
          fontFamily: fontFamily,
          minHeight: '500px',
          border: '1px solid #374151',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          background: '#1f2937',
          color: '#f9fafb',
          padding: '16px',
          lineHeight: '1.6',
          outline: 'none'
        }}
        suppressContentEditableWarning={true}
      />

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.rtf"
        multiple
        style={{ display: 'none' }}
        onChange={handleDocumentUpload}
      />
    </div>
  );
}