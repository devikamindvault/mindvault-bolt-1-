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
  X,
  Eye,
  EyeOff
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
  const [showMediaPreview, setShowMediaPreview] = useState(true);
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
          insertImageAtCursor(imageUrl, file.name, mediaItem.id);
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Reset input
    event.target.value = '';
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
        insertDocumentAtCursor(documentUrl, file.name, file.size, mediaItem.id);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    event.target.value = '';
  };

  const insertImageAtCursor = (imageUrl: string, imageName: string, mediaId: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Create a line break before the media if we're not at the start
      const br1 = document.createElement('br');
      range.insertNode(br1);
      range.setStartAfter(br1);
      
      // Create container for image with delete button
      const container = document.createElement('div');
      container.className = 'media-preview-container';
      container.style.cssText = `
        display: block;
        position: relative;
        margin: 12px 0;
        border: 2px solid #374151;
        border-radius: 8px;
        background: #1f2937;
        padding: 8px;
        max-width: 300px;
        width: fit-content;
      `;
      container.setAttribute('data-media-id', mediaId);
      container.setAttribute('data-type', 'image');
      container.setAttribute('data-url', imageUrl);
      container.setAttribute('data-title', imageName);
      container.contentEditable = 'false';

      // Create thumbnail image
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = imageName;
      img.style.cssText = `
        width: 100%;
        height: auto;
        max-height: 200px;
        object-fit: cover;
        border-radius: 4px;
        cursor: pointer;
        display: block;
      `;
      
      // Add click to preview
      img.onclick = (e) => {
        e.stopPropagation();
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          cursor: pointer;
          animation: fadeIn 0.3s ease;
        `;
        
        const fullImg = document.createElement('img');
        fullImg.src = imageUrl;
        fullImg.style.cssText = `
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        `;
        
        modal.appendChild(fullImg);
        modal.onclick = () => document.body.removeChild(modal);
        document.body.appendChild(modal);
      };

      // Create title
      const title = document.createElement('div');
      title.textContent = imageName;
      title.style.cssText = `
        color: #e5e7eb;
        font-size: 12px;
        margin-top: 8px;
        text-align: center;
        word-break: break-all;
        font-weight: 500;
      `;

      // Create delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '×';
      deleteBtn.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #ef4444;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: all 0.2s ease;
      `;
      
      deleteBtn.onmouseover = () => {
        deleteBtn.style.background = '#dc2626';
        deleteBtn.style.transform = 'scale(1.1)';
      };
      
      deleteBtn.onmouseout = () => {
        deleteBtn.style.background = '#ef4444';
        deleteBtn.style.transform = 'scale(1)';
      };
      
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        container.remove();
        setMediaItems(prev => prev.filter(item => item.id !== mediaId));
        updateContent();
      };

      container.appendChild(img);
      container.appendChild(title);
      container.appendChild(deleteBtn);
      
      range.insertNode(container);
      range.setStartAfter(container);
      
      // Add a line break after the media
      const br2 = document.createElement('br');
      range.insertNode(br2);
      range.setStartAfter(br2);
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      updateContent();
    }
  };

  const insertDocumentAtCursor = (documentUrl: string, documentName: string, size: number, mediaId: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Create a line break before the media if we're not at the start
      const br1 = document.createElement('br');
      range.insertNode(br1);
      range.setStartAfter(br1);
      
      // Create container for document with delete button
      const container = document.createElement('div');
      container.className = 'media-preview-container';
      container.style.cssText = `
        display: block;
        position: relative;
        margin: 12px 0;
        border: 2px solid #374151;
        border-radius: 8px;
        background: #1f2937;
        padding: 16px;
        max-width: 300px;
        width: fit-content;
        cursor: pointer;
        transition: all 0.2s ease;
      `;
      container.setAttribute('data-media-id', mediaId);
      container.setAttribute('data-type', 'document');
      container.setAttribute('data-url', documentUrl);
      container.setAttribute('data-title', documentName);
      container.setAttribute('data-size', size.toString());
      container.contentEditable = 'false';

      // Create document icon
      const icon = document.createElement('div');
      icon.innerHTML = '📄';
      icon.style.cssText = `
        font-size: 32px;
        text-align: center;
        margin-bottom: 12px;
      `;

      // Create title
      const title = document.createElement('div');
      title.textContent = documentName;
      title.style.cssText = `
        color: #e5e7eb;
        font-size: 14px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 8px;
        word-break: break-all;
        line-height: 1.4;
      `;

      // Create size info
      const sizeInfo = document.createElement('div');
      sizeInfo.textContent = `${Math.round(size / 1024)} KB`;
      sizeInfo.style.cssText = `
        color: #9ca3af;
        font-size: 12px;
        text-align: center;
        margin-bottom: 8px;
      `;

      // Create action text
      const actionText = document.createElement('div');
      actionText.textContent = 'Click to download';
      actionText.style.cssText = `
        color: #60a5fa;
        font-size: 11px;
        text-align: center;
        font-style: italic;
      `;

      // Create delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '×';
      deleteBtn.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #ef4444;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: all 0.2s ease;
      `;
      
      deleteBtn.onmouseover = () => {
        deleteBtn.style.background = '#dc2626';
        deleteBtn.style.transform = 'scale(1.1)';
      };
      
      deleteBtn.onmouseout = () => {
        deleteBtn.style.background = '#ef4444';
        deleteBtn.style.transform = 'scale(1)';
      };
      
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        container.remove();
        setMediaItems(prev => prev.filter(item => item.id !== mediaId));
        updateContent();
      };

      // Add hover effect for container
      container.onmouseover = () => {
        container.style.borderColor = '#60a5fa';
        container.style.boxShadow = '0 4px 12px rgba(96, 165, 250, 0.3)';
      };
      
      container.onmouseout = () => {
        container.style.borderColor = '#374151';
        container.style.boxShadow = 'none';
      };

      // Add click to download/preview
      container.onclick = (e) => {
        if (e.target !== deleteBtn) {
          const fileExtension = documentName.split('.').pop()?.toLowerCase();
          
          if (fileExtension === 'pdf') {
            // For PDF files, try to open in a new tab for preview
            const newWindow = window.open();
            if (newWindow) {
              newWindow.document.write(`
                <html>
                  <head><title>${documentName}</title></head>
                  <body style="margin:0; padding:0;">
                    <iframe src="${documentUrl}" width="100%" height="100%" style="border:none;"></iframe>
                  </body>
                </html>
              `);
            }
          } else {
            // For other files, download directly
            const link = document.createElement('a');
            link.href = documentUrl;
            link.download = documentName;
            link.click();
          }
        }
      };

      container.appendChild(icon);
      container.appendChild(title);
      container.appendChild(sizeInfo);
      container.appendChild(actionText);
      container.appendChild(deleteBtn);
      
      range.insertNode(container);
      range.setStartAfter(container);
      
      // Add a line break after the media
      const br2 = document.createElement('br');
      range.insertNode(br2);
      range.setStartAfter(br2);
      
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

  const toggleMediaVisibility = () => {
    setShowMediaPreview(!showMediaPreview);
    if (editorRef.current) {
      const mediaContainers = editorRef.current.querySelectorAll('.media-preview-container');
      mediaContainers.forEach(container => {
        const element = container as HTMLElement;
        element.style.display = showMediaPreview ? 'none' : 'block';
      });
    }
  };

  // Helper function to create image thumbnails for PDF
  const createThumbnail = async (url: string, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = url;
    });
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

      // Extract text content (excluding media containers)
      const mediaContainers = tempDiv.querySelectorAll('.media-preview-container');
      mediaContainers.forEach(container => container.remove());
      
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      if (textContent.trim()) {
        const lines = doc.splitTextToSize(textContent, pageWidth - 2 * margin);
        
        for (const line of lines) {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += 7;
        }
      }

      // Add media section
      const tempDiv2 = document.createElement('div');
      tempDiv2.innerHTML = content;
      const images = tempDiv2.querySelectorAll('[data-type="image"]');
      const documents = tempDiv2.querySelectorAll('[data-type="document"]');

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
        for (const imgContainer of Array.from(images)) {
          if (yPosition > pageHeight - 120) {
            doc.addPage();
            yPosition = margin;
          }

          const imgTitle = imgContainer.getAttribute('data-title') || 'Image';
          const imgUrl = imgContainer.getAttribute('data-url') || '';

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`📷 ${imgTitle}`, margin, yPosition);
          yPosition += 10;

          try {
            if (imgUrl) {
              // Create thumbnail
              const thumbnail = await createThumbnail(imgUrl, 150, 100);
              
              // Add image to PDF
              doc.addImage(thumbnail, 'JPEG', margin, yPosition, 150, 100);
              
              // Make image clickable to open full version
              doc.link(margin, yPosition, 150, 100, { url: imgUrl });
              
              // Add preview text
              doc.setFontSize(8);
              doc.setFont('helvetica', 'italic');
              doc.setTextColor(0, 0, 255);
              doc.text("(Click image to view full size)", margin, yPosition + 105);
              doc.setTextColor(0, 0, 0);
              
              yPosition += 120;
            }
          } catch (error) {
            console.error('Error processing image:', error);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text('(Image could not be embedded - click link to view)', margin, yPosition);
            doc.setTextColor(0, 0, 255);
            doc.link(margin, yPosition, doc.getTextWidth('(Click here to view image)'), 10, { url: imgUrl });
            doc.text('(Click here to view image)', margin, yPosition + 12);
            doc.setTextColor(0, 0, 0);
            yPosition += 25;
          }
        }

        // Add documents
        for (const docContainer of Array.from(documents)) {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }

          const docTitle = docContainer.getAttribute('data-title') || 'Document';
          const docUrl = docContainer.getAttribute('data-url') || '';
          const docSize = docContainer.getAttribute('data-size') || '';

          // Add document icon and title
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 255);
          doc.text(`📄 ${docTitle}`, margin, yPosition);
          
          // Make title clickable
          if (docUrl) {
            doc.link(margin, yPosition - 5, doc.getTextWidth(`📄 ${docTitle}`), 12, { url: docUrl });
          }
          
          if (docSize) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`(${Math.round(parseInt(docSize) / 1024)}KB)`, margin + doc.getTextWidth(`📄 ${docTitle}`) + 5, yPosition);
          }
          
          // Add download instruction
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(0, 0, 255);
          doc.text("(Click to download/preview)", margin, yPosition + 12);
          
          doc.setTextColor(0, 0, 0);
          yPosition += 25;
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
          <button
            className="toolbar-button"
            onClick={toggleMediaVisibility}
            title={showMediaPreview ? "Hide Media" : "Show Media"}
          >
            {showMediaPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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