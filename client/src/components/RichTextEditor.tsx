import React, { useRef, useState, useEffect } from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Image, Link, FileText, Smile, Palette, Download, Type,
  List, ListOrdered, Quote, Code, Undo, Redo
} from 'lucide-react';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

interface RichTextEditorProps {
  selectedGoal?: Goal | null;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ selectedGoal }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#1f2937');
  const [textColor, setTextColor] = useState('#ffffff');

  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'];

  const stickers = ['⭐', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🎯', '💡', '🔥', '💪', '👍', '✨', '🌟', '💫', '⚡', '🚀', '🎪', '🎭', '🎨', '🎵', '🎶', '❤️', '💖', '💝', '🌈', '🦄', '🌸', '🌺', '🌻', '🌷', '🌹', '💐'];

  useEffect(() => {
    if (selectedGoal && editorRef.current) {
      const goalContent = `
        <div style="border: 2px solid #4f46e5; border-radius: 8px; padding: 16px; margin-bottom: 20px; background: rgba(79, 70, 229, 0.1);">
          <h2 style="color: #6366f1; margin: 0 0 10px 0; font-size: 24px;">🎯 ${selectedGoal.title}</h2>
          <p style="color: #e2e8f0; margin: 0 0 10px 0; font-size: 16px;">${selectedGoal.description}</p>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; font-size: 14px;">
            ${selectedGoal.category ? `<span style="background: #374151; color: #d1d5db; padding: 4px 8px; border-radius: 4px;">📂 ${selectedGoal.category}</span>` : ''}
            ${selectedGoal.deadline ? `<span style="background: #374151; color: #d1d5db; padding: 4px 8px; border-radius: 4px;">📅 ${new Date(selectedGoal.deadline).toLocaleDateString()}</span>` : ''}
            <span style="background: ${selectedGoal.priority === 'high' ? '#ef4444' : selectedGoal.priority === 'medium' ? '#f59e0b' : '#10b981'}; color: white; padding: 4px 8px; border-radius: 4px;">🔥 ${selectedGoal.priority.toUpperCase()}</span>
          </div>
        </div>
        <p>Start writing about your goal...</p>
      `;
      editorRef.current.innerHTML = goalContent;
    }
  }, [selectedGoal]);

  const toast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.style.maxWidth = '300px';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '10px 0';
        img.style.borderRadius = '8px';
        img.style.cursor = 'pointer';
        img.style.resize = 'both';
        img.style.overflow = 'auto';
        
        // Make image resizable
        img.addEventListener('click', () => {
          const newWidth = prompt('Enter width (px):', '300');
          if (newWidth) {
            img.style.width = newWidth + 'px';
            img.style.maxWidth = 'none';
          }
        });
        
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
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const text = prompt('Enter link text:', url);
      if (text) {
        const link = document.createElement('a');
        link.href = url;
        link.textContent = text;
        link.style.color = '#60a5fa';
        link.style.textDecoration = 'underline';
        link.target = '_blank';
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(link);
          range.setStartAfter(link);
          range.setEndAfter(link);
        }
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = document.createTextNode(emoji);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
    }
    setShowEmojiPicker(false);
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
            img.style.maxWidth = '300px';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.margin = '10px 0';
            img.style.borderRadius = '8px';
            img.style.resize = 'both';
            img.style.overflow = 'auto';
            
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
      const content = editorRef.current;
      if (!content) return;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      
      const canvas = await htmlToImage.toCanvas(content, {
        pixelRatio: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: backgroundColor,
        width: content.scrollWidth,
        height: content.scrollHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      
      doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }
      
      doc.save('mind-vault-document.pdf');
      toast('Document downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast('Failed to generate PDF. Please try again.', 'error');
    }
  };

  return (
    <div className="rich-text-editor relative">
      <div className="editor-toolbar bg-slate-700 border border-slate-600 rounded-t-lg p-3 flex flex-wrap gap-2 items-center">
        {/* Text Formatting */}
        <div className="toolbar-group flex gap-1">
          <button onClick={() => execCommand('bold')} className="toolbar-button" title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('italic')} className="toolbar-button" title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('underline')} className="toolbar-button" title="Underline">
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="toolbar-group flex gap-1">
          <button onClick={() => execCommand('justifyLeft')} className="toolbar-button" title="Align Left">
            <AlignLeft className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('justifyCenter')} className="toolbar-button" title="Align Center">
            <AlignCenter className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('justifyRight')} className="toolbar-button" title="Align Right">
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="toolbar-group flex gap-1">
          <button onClick={() => execCommand('insertUnorderedList')} className="toolbar-button" title="Bullet List">
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('insertOrderedList')} className="toolbar-button" title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        {/* Font Size */}
        <div className="toolbar-group">
          <select 
            onChange={(e) => execCommand('fontSize', e.target.value)}
            className="toolbar-select bg-slate-600 text-white border border-slate-500 rounded px-2 py-1 text-sm"
          >
            <option value="1">Small</option>
            <option value="3" selected>Normal</option>
            <option value="5">Large</option>
            <option value="7">Extra Large</option>
          </select>
        </div>

        {/* Media */}
        <div className="toolbar-group flex gap-1">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="toolbar-button" 
            title="Insert Image"
          >
            <Image className="w-4 h-4" />
          </button>
          <button onClick={insertLink} className="toolbar-button" title="Insert Link">
            <Link className="w-4 h-4" />
          </button>
        </div>

        {/* Emoji & Stickers */}
        <div className="toolbar-group flex gap-1 relative">
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
            className="toolbar-button" 
            title="Insert Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
          
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg p-3 z-50 w-80">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Emojis</h4>
                <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(emoji)}
                      className="p-1 hover:bg-slate-700 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Stickers</h4>
                <div className="grid grid-cols-8 gap-1">
                  {stickers.map((sticker, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(sticker)}
                      className="p-1 hover:bg-slate-700 rounded text-lg"
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colors */}
        <div className="toolbar-group flex gap-1 relative">
          <button 
            onClick={() => setShowColorPicker(!showColorPicker)} 
            className="toolbar-button" 
            title="Colors"
          >
            <Palette className="w-4 h-4" />
          </button>
          
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg p-3 z-50">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">Background Color</label>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                    if (editorRef.current) {
                      editorRef.current.style.backgroundColor = e.target.value;
                    }
                  }}
                  className="w-full h-8 rounded border border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Text Color</label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value);
                    execCommand('foreColor', e.target.value);
                  }}
                  className="w-full h-8 rounded border border-slate-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Undo/Redo */}
        <div className="toolbar-group flex gap-1">
          <button onClick={() => execCommand('undo')} className="toolbar-button" title="Undo">
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('redo')} className="toolbar-button" title="Redo">
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div 
        ref={editorRef}
        className="rich-editor min-h-[500px] p-6 border border-slate-600 border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        contentEditable
        suppressContentEditableWarning={true}
        onPaste={handlePaste}
        style={{
          backgroundColor: backgroundColor,
          color: textColor,
          fontSize: '16px',
          lineHeight: '1.6',
          fontFamily: 'Georgia, serif'
        }}
      >
        {!selectedGoal && <p>Start writing your thoughts...</p>}
      </div>

      {/* PDF Download Button - Fixed Position */}
      <button
        onClick={downloadAsPDF}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors z-50"
        title="Download as PDF"
      >
        <Download className="w-5 h-5" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default RichTextEditor;