import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Image, FileText, Smile, Mic, Download, Save, Trash2, Eye, X, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, Plus, Search, Calendar, Clock, Tag, Star, Upload, File, Video, Music, Archive, Code, Hash, Quote, Strikethrough, Subscript, Superscript, Palette, Highlighter, RotateCcw, RotateCw, ZoomIn, ZoomOut, Copy, Cast as Paste, Nut as Cut, ChevronDown, Settings, Filter, SortAsc, SortDesc, Grid, Layout, Maximize, Minimize, RefreshCw, Share, Printer as Print, BookOpen, Bookmark, Flag, Heart, MessageCircle, Send, Phone, Mail, Globe, MapPin, User, Users, Home, Building, Car, Plane, Train, Ship, Bike, Wallet as Walk, Coffee, Pizza, Camera, Headphones, Gamepad2, Tv, Radio, Battery, Wifi, Bluetooth, Usb, HardDrive, Cpu, MemoryStick as Memory, Monitor, Keyboard, Mouse, Printer, Scan as Scanner, Webcam, Microscope as Microphone, Speaker, Volume1, Volume2, VolumeX, Play, Pause, Store as Stop, SkipBack, SkipForward, Repeat, Shuffle, FastForward, Rewind, SwordIcon as Record, Projector as Eject, Power, Settings2, PenTool as Tool, Wrench, Hammer, HardDrive as Screwdriver, Ruler, Scissors, PaintBucket, Brush, Pen, Pencil, Eraser, Pipette, Crop, Move, Rotate3D as RotateLeft, Rotate3D as RotateRight, FlipHorizontal, FlipVertical, Layers, Group, Ungroup, BringToFront, SendToBack, Lock, Unlock, Dribbble as Visible, LucidePen as Hidden, Locate as Duplicate, Delete, Archive as ArchiveIcon, Folder, FolderOpen, FolderPlus, FileIcon, FilePlus, FileX, FileCheck, FileClock, FileImage, FileVideo, FileAudio, FileCode, FileSpreadsheet, FileBarChart, FilePieChart, FileLineChart, FileText as FileTextIcon, Paperclip, Link2, ExternalLink, Download as DownloadIcon, Upload as UploadIcon, Cloud, CloudDownload, CloudUpload, Server, Database, HardDriveIcon, IdCard as SdCard, UsbIcon, WifiIcon, BluetoothIcon, Signal, Antenna, Satellite, Router, Code as Modem, NetworkIcon, EthernetPort, Cable, Plug, Pocket as Socket, Battery as BatteryIcon, BatteryLow, Zap, Sun, Moon, Star as StarIcon, Cloud as CloudIcon, CloudRain, CloudSnow, CloudLightning, Thermometer, Droplets, Wind, Compass, Navigation, Map, MapPin as MapPinIcon, Route, Car as CarIcon, Truck, Bus, CarTaxiFront as Taxi, Recycle as Motorcycle, Recycle as Bicycle, NotebookIcon as Scooter, Keyboard as Skateboard, PaintRoller as Roller, Footprints, Plane as PlaneIcon, HeaterIcon as Helicopter, Rocket, Bot as Boat, Anchor, Sailboat, Ship as ShipIcon, ChartLine as Submarine, Train as TrainIcon, Drama as Tram, Droplet as Metro, Binoculars as Funicular, Cable as Cableway, Calculator as Escalator, Calculator as Elevator, Stars as Stairs, DoorOpen as Door, AppWindow as Window, Book as Roof, Radiation as Foundation, ToyBrick as Brick, CigaretteIcon as Concrete, Book as Wood, HandMetal as Metal, Glasses as Glass, Joystick as Plastic, Ruler as Rubber, ToyBrick as Fabric, Feather as Leather, Paperclip as Paper, Keyboard as Cardboard, Bone as Stone, Hand as Sand, Heater as Water, Siren as Fire, Earth, AirVent as Air, CloudLightning as Lightning, IceCream as Ice, Stamp as Steam, AlarmSmoke as Smoke, Bus as Dust, Cloud as Mud, File as Oil, Cast as Gas, LineSquiggle as Liquid, Sliders as Solid, Power as Powder, Italic as Crystal, Dam as Foam, Gem as Gel } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import jsPDF from 'jspdf';
import html2canvas from 'html-to-image';

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  isPinned: boolean;
  createdAt: string;
}

interface EditEntry {
  id: string;
  content: string;
  timestamp: string;
  title: string;
  description: string;
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
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common emojis for quick access
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
    '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾'
  ];

  useEffect(() => {
    if (selectedIdea) {
      loadIdeaContent(selectedIdea.id);
    } else {
      setContent('');
    }
  }, [selectedIdea]);

  const loadIdeaContent = async (ideaId: string) => {
    try {
      const request = indexedDB.open('IdeaMediaDB', 3);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['history'], 'readonly');
        const store = transaction.objectStore('history');
        const getRequest = store.get(`idea-${ideaId}`);
        
        getRequest.onsuccess = () => {
          if (getRequest.result && getRequest.result.entries.length > 0) {
            const latestEntry = getRequest.result.entries[getRequest.result.entries.length - 1];
            setContent(latestEntry.content || '');
          } else {
            // Try to migrate from localStorage if exists
            const legacyContent = localStorage.getItem(`idea-content-${ideaId}`);
            if (legacyContent) {
              setContent(legacyContent);
              localStorage.removeItem(`idea-content-${ideaId}`);
            } else {
              setContent('');
            }
          }
        };
        
        getRequest.onerror = () => {
          console.error('Error loading content from IndexedDB');
          setContent('');
        };
      };
      
      request.onerror = () => {
        console.error('Error opening IndexedDB');
        setContent('');
      };
    } catch (error) {
      console.error('Error in loadIdeaContent:', error);
      setContent('');
    }
  };

  const saveToIndexedDB = async (ideaId: string, content: string, title: string, description: string) => {
    try {
      const request = indexedDB.open('IdeaMediaDB', 3);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');
        
        const getRequest = store.get(`idea-${ideaId}`);
        
        getRequest.onsuccess = () => {
          const existingData = getRequest.result;
          const entries = existingData ? existingData.entries : [];
          
          const newEntry: EditEntry = {
            id: Date.now().toString(),
            content,
            timestamp: new Date().toISOString(),
            title,
            description
          };
          
          entries.push(newEntry);
          
          const putRequest = store.put({
            id: `idea-${ideaId}`,
            entries
          });
          
          putRequest.onsuccess = () => {
            console.log('Content saved to IndexedDB successfully');
          };
          
          putRequest.onerror = () => {
            console.error('Error saving to IndexedDB');
          };
        };
        
        getRequest.onerror = () => {
          console.error('Error getting existing data from IndexedDB');
        };
      };
      
      request.onerror = () => {
        console.error('Error opening IndexedDB for saving');
      };
    } catch (error) {
      console.error('Error in saveToIndexedDB:', error);
    }
  };

  const handleSave = () => {
    if (!selectedIdea) {
      alert('Please select an idea first');
      return;
    }

    try {
      saveToIndexedDB(selectedIdea.id, content, selectedIdea.title, selectedIdea.description);
      alert('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error saving content. Please try again.');
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const insertEmoji = (emoji: string) => {
    insertTextAtCursor(emoji);
    setShowEmojiPicker(false);
  };

  const insertTextAtCursor = (text: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (editorRef.current) {
      editorRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const insertMediaAtCursor = (mediaHtml: string) => {
    try {
      if (editorRef.current) {
        editorRef.current.focus();
        
        setTimeout(() => {
          const selection = window.getSelection();
          let range: Range;
          
          if (selection && selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
          } else {
            range = document.createRange();
            range.selectNodeContents(editorRef.current!);
            range.collapse(false);
          }
          
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = mediaHtml;
          const mediaElement = tempDiv.firstChild;
          
          if (mediaElement) {
            range.deleteContents();
            range.insertNode(mediaElement);
            range.setStartAfter(mediaElement);
            range.setEndAfter(mediaElement);
            
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
          
          setContent(editorRef.current!.innerHTML);
        }, 100);
      }
    } catch (error) {
      console.error('Error inserting media at cursor:', error);
      if (editorRef.current) {
        editorRef.current.innerHTML += mediaHtml;
        setContent(editorRef.current.innerHTML);
      }
    }
  };

  const storeFileInIndexedDB = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open('IdeaMediaDB', 3);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('media')) {
            db.createObjectStore('media', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('history')) {
            db.createObjectStore('history', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['media'], 'readwrite');
          const store = transaction.objectStore('media');
          
          const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const fileData = {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            file: file,
            timestamp: new Date().toISOString()
          };
          
          const putRequest = store.put(fileData);
          
          putRequest.onsuccess = () => {
            resolve(fileId);
          };
          
          putRequest.onerror = () => {
            console.error('Error storing file in IndexedDB');
            const fallbackUrl = URL.createObjectURL(file);
            resolve(fallbackUrl);
          };
        };
        
        request.onerror = () => {
          console.error('Error opening IndexedDB for file storage');
          const fallbackUrl = URL.createObjectURL(file);
          resolve(fallbackUrl);
        };
      } catch (error) {
        console.error('Error in storeFileInIndexedDB:', error);
        const fallbackUrl = URL.createObjectURL(file);
        resolve(fallbackUrl);
      }
    });
  };

  const getFileFromIndexedDB = async (fileId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open('IdeaMediaDB', 3);
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['media'], 'readonly');
          const store = transaction.objectStore('media');
          const getRequest = store.get(fileId);
          
          getRequest.onsuccess = () => {
            if (getRequest.result && getRequest.result.file) {
              const url = URL.createObjectURL(getRequest.result.file);
              resolve(url);
            } else {
              reject(new Error('File not found'));
            }
          };
          
          getRequest.onerror = () => {
            reject(new Error('Error retrieving file'));
          };
        };
        
        request.onerror = () => {
          reject(new Error('Error opening IndexedDB'));
        };
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!selectedIdea) {
      alert('Please select an idea first to upload files');
      event.target.value = '';
      return;
    }

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const fileId = await storeFileInIndexedDB(file);
          const isStoredInDB = !fileId.startsWith('blob:');
          
          if (file.type.startsWith('image/')) {
            const imageUrl = isStoredInDB ? await getFileFromIndexedDB(fileId) : fileId;
            const imageHtml = `
              <div class="media-container" contenteditable="false">
                <div class="image-preview">
                  <img src="${imageUrl}" alt="${file.name}" onclick="window.openImageModal('${imageUrl}')" style="max-width: 300px; max-height: 200px; object-fit: contain; cursor: pointer;" />
                  <div class="media-caption">${file.name}${!isStoredInDB ? ' (temporary)' : ''}</div>
                  <button class="media-delete-btn" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
              </div>
            `;
            insertMediaAtCursor(imageHtml);
          } else {
            const docIcon = getDocumentIcon(file.type);
            const documentHtml = `
              <div class="media-container" contenteditable="false">
                <div class="document-preview" onclick="window.openDocumentModal('${file.name}', '${file.type}', '${fileId}')">
                  <div class="doc-icon">${docIcon}</div>
                  <div class="doc-info">
                    <div class="doc-name">${file.name}${!isStoredInDB ? ' (temporary)' : ''}</div>
                    <div class="doc-type">${file.type || 'Unknown'} • ${formatFileSize(file.size)}</div>
                    <div class="doc-actions">
                      <button onclick="event.stopPropagation(); window.openDocumentModal('${file.name}', '${file.type}', '${fileId}')">View</button>
                      <button onclick="event.stopPropagation(); window.downloadFile('${fileId}', '${file.name}')">Download</button>
                    </div>
                  </div>
                  <button class="media-delete-btn" onclick="event.stopPropagation(); this.parentElement.parentElement.remove()">×</button>
                </div>
              </div>
            `;
            insertMediaAtCursor(documentHtml);
          }
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          alert(`Failed to upload ${file.name}. ${error instanceof Error ? error.message : 'Please try again.'}`);
        }
      }
    } catch (error) {
      console.error('Error in file upload process:', error);
      alert('Error uploading files. Please try again.');
    }
    
    event.target.value = '';
  };

  const getDocumentIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    if (mimeType.includes('text')) return '📃';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '🗜️';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('video')) return '🎬';
    return '📎';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Global functions for media handling
  useEffect(() => {
    (window as any).openImageModal = (src: string) => {
      setSelectedImage(src);
      setShowImageModal(true);
    };

    (window as any).openDocumentModal = async (name: string, type: string, fileId: string) => {
      try {
        if (fileId.startsWith('blob:')) {
          setSelectedDocument({ name, type, content: 'File content not available for temporary files.' });
        } else {
          const request = indexedDB.open('IdeaMediaDB', 3);
          request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(['media'], 'readonly');
            const store = transaction.objectStore('media');
            const getRequest = store.get(fileId);
            
            getRequest.onsuccess = () => {
              if (getRequest.result && getRequest.result.file) {
                const file = getRequest.result.file;
                if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    setSelectedDocument({ 
                      name, 
                      type, 
                      content: e.target?.result as string || 'Could not read file content.' 
                    });
                  };
                  reader.readAsText(file);
                } else {
                  setSelectedDocument({ 
                    name, 
                    type, 
                    content: `File: ${name}\nType: ${type}\nSize: ${formatFileSize(file.size)}\n\nThis file type cannot be previewed as text.` 
                  });
                }
              } else {
                setSelectedDocument({ name, type, content: 'File not found.' });
              }
            };
          };
        }
        setShowDocumentModal(true);
      } catch (error) {
        console.error('Error opening document modal:', error);
        setSelectedDocument({ name, type, content: 'Error loading document.' });
        setShowDocumentModal(true);
      }
    };

    (window as any).downloadFile = async (fileId: string, fileName: string) => {
      try {
        if (fileId.startsWith('blob:')) {
          const a = document.createElement('a');
          a.href = fileId;
          a.download = fileName;
          a.click();
        } else {
          const url = await getFileFromIndexedDB(fileId);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
        console.error('Error downloading file:', error);
        alert('Error downloading file. Please try again.');
      }
    };

    return () => {
      delete (window as any).openImageModal;
      delete (window as any).openDocumentModal;
      delete (window as any).downloadFile;
    };
  }, []);

  const handleVoiceTranscription = (text: string) => {
    insertTextAtCursor(` ${text} `);
  };

  const exportToPDF = async () => {
    if (!selectedIdea || !content) {
      alert('Please select an idea and add some content first');
      return;
    }

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Title page
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedIdea.title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Category: ${selectedIdea.category || 'Uncategorized'}`, margin, yPosition);
      yPosition += 10;
      pdf.text(`Created: ${new Date(selectedIdea.createdAt).toLocaleDateString()}`, margin, yPosition);
      yPosition += 10;
      if (selectedIdea.deadline) {
        pdf.text(`Deadline: ${new Date(selectedIdea.deadline).toLocaleDateString()}`, margin, yPosition);
        yPosition += 10;
      }

      // Description
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Description:', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const descriptionLines = pdf.splitTextToSize(selectedIdea.description, maxWidth);
      pdf.text(descriptionLines, margin, yPosition);
      yPosition += descriptionLines.length * 6 + 20;

      // New page for content
      pdf.addPage();
      yPosition = margin;

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Content:', margin, yPosition);
      yPosition += 15;

      // Parse HTML content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      let mediaCounter = 1;
      let imageCounter = 1;
      let docCounter = 1;
      const mediaItems: Array<{type: 'image' | 'document', name: string, src?: string}> = [];

      // Process content and replace media with placeholders
      const processNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || '';
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          if (element.classList.contains('media-container')) {
            const img = element.querySelector('img');
            const docPreview = element.querySelector('.document-preview');
            
            if (img) {
              const imgName = img.alt || `Image ${imageCounter}`;
              mediaItems.push({type: 'image', name: imgName, src: img.src});
              return `\n\n[📷 INTERACTIVE IMAGE ${imageCounter}: ${imgName} - CLICK TO PREVIEW]\n\n`;
            } else if (docPreview) {
              const docName = docPreview.querySelector('.doc-name')?.textContent || `Document ${docCounter}`;
              mediaItems.push({type: 'document', name: docName});
              return `\n\n[📄 INTERACTIVE DOCUMENT ${docCounter}: ${docName} - CLICK TO PREVIEW]\n\n`;
            }
          }
          
          // Handle other HTML elements
          let result = '';
          for (let i = 0; i < node.childNodes.length; i++) {
            result += processNode(node.childNodes[i]);
          }
          
          // Add formatting based on element type
          switch (element.tagName?.toLowerCase()) {
            case 'h1': return `\n\n${result.toUpperCase()}\n`;
            case 'h2': return `\n\n${result}\n`;
            case 'h3': return `\n${result}\n`;
            case 'p': return `\n${result}\n`;
            case 'br': return '\n';
            case 'strong': case 'b': return `**${result}**`;
            case 'em': case 'i': return `*${result}*`;
            case 'u': return `_${result}_`;
            case 'li': return `• ${result}\n`;
            case 'ul': case 'ol': return `\n${result}\n`;
            default: return result;
          }
        }
        
        return '';
      };

      const processedContent = processNode(tempDiv);
      
      // Add processed content to PDF
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const contentLines = pdf.splitTextToSize(processedContent, maxWidth);
      
      for (let i = 0; i < contentLines.length; i++) {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        const line = contentLines[i];
        
        // Style interactive media placeholders
        if (line.includes('[📷 INTERACTIVE IMAGE') || line.includes('[📄 INTERACTIVE DOCUMENT')) {
          if (line.includes('📷')) {
            pdf.setFillColor(59, 130, 246); // Blue for images
          } else {
            pdf.setFillColor(34, 197, 94); // Green for docs
          }
          pdf.rect(margin - 2, yPosition - 4, maxWidth + 4, 8, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFont('helvetica', 'bold');
          pdf.text(line, margin, yPosition);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
        } else {
          pdf.text(line, margin, yPosition);
        }
        
        yPosition += 6;
      }

      // Add interactive media guide page
      if (mediaItems.length > 0) {
        pdf.addPage();
        yPosition = margin;
        
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Interactive Media Guide', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('This PDF contains interactive elements. Click on the colored boxes to preview media:', margin, yPosition);
        yPosition += 15;
        
        mediaItems.forEach((item, index) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          
          const color = item.type === 'image' ? [59, 130, 246] : [34, 197, 94];
          const icon = item.type === 'image' ? '📷' : '📄';
          const typeText = item.type === 'image' ? 'Image' : 'Document';
          
          pdf.setFillColor(color[0], color[1], color[2]);
          pdf.rect(margin, yPosition - 4, 8, 8, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.text(icon, margin + 2, yPosition + 1);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${typeText} ${index + 1}: ${item.name}`, margin + 15, yPosition + 1);
          
          yPosition += 12;
        });
        
        // Add usage instructions
        pdf.addPage();
        yPosition = margin;
        
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('How to Use Interactive Features', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const instructions = [
          '1. Open this PDF in a modern PDF viewer (Adobe Acrobat, Chrome, Firefox)',
          '2. Look for colored boxes with "CLICK TO PREVIEW" text',
          '3. Click on these boxes to view the associated media',
          '4. Blue boxes contain images, green boxes contain documents',
          '5. For best experience, use the PDF in digital format rather than printing'
        ];
        
        instructions.forEach(instruction => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(instruction, margin, yPosition);
          yPosition += 10;
        });
      }

      // Save the PDF
      pdf.save(`${selectedIdea.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_idea.pdf`);
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Error exporting to PDF. Please try again.');
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

  const filteredIdeas = ideas.filter(idea =>
    idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rich-text-editor-container">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button
            onClick={() => execCommand('bold')}
            className="toolbar-button"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('italic')}
            className="toolbar-button"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('underline')}
            className="toolbar-button"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('strikeThrough')}
            className="toolbar-button"
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        <div className="toolbar-group">
          <select
            onChange={(e) => execCommand('fontSize', e.target.value)}
            className="toolbar-select"
            defaultValue="3"
          >
            <option value="1">8pt</option>
            <option value="2">10pt</option>
            <option value="3">12pt</option>
            <option value="4">14pt</option>
            <option value="5">18pt</option>
            <option value="6">24pt</option>
            <option value="7">36pt</option>
          </select>
          <select
            onChange={(e) => execCommand('fontName', e.target.value)}
            className="toolbar-select"
          >
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times</option>
            <option value="Courier New">Courier</option>
            <option value="Verdana">Verdana</option>
          </select>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => execCommand('justifyLeft')}
            className="toolbar-button"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('justifyCenter')}
            className="toolbar-button"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('justifyRight')}
            className="toolbar-button"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('justifyFull')}
            className="toolbar-button"
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => execCommand('insertUnorderedList')}
            className="toolbar-button"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('insertOrderedList')}
            className="toolbar-button"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="toolbar-button"
            title="Upload Image/Document"
          >
            <Upload className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="toolbar-button"
              title="Insert Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
            {showEmojiPicker && (
              <div className="emoji-picker">
                <div className="emoji-grid">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(emoji)}
                      className="emoji-item"
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
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => execCommand('undo')}
            className="toolbar-button"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('redo')}
            className="toolbar-button"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={handleSave}
            className="toolbar-button"
            disabled={!selectedIdea}
            title="Save Content"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={exportToPDF}
            className="toolbar-button"
            disabled={!selectedIdea || !content}
            title="Export to PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={clearContent}
            className="toolbar-button"
            title="Clear Content"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="toolbar-group">
          <div className="relative">
            <button
              onClick={() => setShowIdeaSelector(!showIdeaSelector)}
              className="toolbar-button flex items-center gap-2"
              title="Switch Idea"
            >
              <Lightbulb className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
            {showIdeaSelector && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
                <div className="p-3 border-b border-slate-600">
                  <input
                    type="text"
                    placeholder="Search ideas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400 text-sm"
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
                        className={`w-full text-left p-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0 ${
                          selectedIdea?.id === idea.id ? 'bg-slate-700' : ''
                        }`}
                      >
                        <div className="font-medium text-white text-sm truncate">
                          {idea.title}
                          {idea.isPinned && <span className="ml-2 text-yellow-400">📌</span>}
                        </div>
                        <div className="text-xs text-gray-400 truncate mt-1">
                          {idea.description}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {idea.category && (
                            <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                              {idea.category}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(idea.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      {searchTerm ? 'No ideas found matching your search' : 'No ideas available'}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-slate-600 bg-slate-750">
                  <button
                    onClick={() => {
                      setShowIdeaSelector(false);
                      window.dispatchEvent(new CustomEvent('switchToIdeas'));
                    }}
                    className="w-full text-center text-purple-400 hover:text-purple-300 text-sm font-medium"
                  >
                    + Create New Idea
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        className="rich-editor"
        contentEditable
        onInput={(e) => setContent((e.target as HTMLDivElement).innerHTML)}
        dangerouslySetInnerHTML={{ __html: content }}
        style={{ minHeight: '500px' }}
        placeholder={selectedIdea ? `Start developing your idea: ${selectedIdea.title}` : "Select an idea to start writing..."}
      />

      {!selectedIdea && (
        <div className="text-center py-16 text-gray-400">
          <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Idea Selected</h3>
          <p className="mb-4">Choose an idea from the dropdown above or create a new one to start writing.</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('switchToIdeas'))}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Go to Ideas Page
          </button>
        </div>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.doc,.docx,.txt,.md,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="image-modal" onClick={() => setShowImageModal(false)}>
          <button 
            className="image-modal-close"
            onClick={() => setShowImageModal(false)}
          >
            ×
          </button>
          <img 
            src={selectedImage} 
            alt="Preview" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="image-modal" onClick={() => setShowDocumentModal(false)}>
          <div className="document-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="document-modal-header">
              <div>
                <h3>{selectedDocument.name}</h3>
                <span className="document-modal-type">{selectedDocument.type}</span>
              </div>
              <button 
                className="image-modal-close"
                onClick={() => setShowDocumentModal(false)}
              >
                ×
              </button>
            </div>
            <div className="document-modal-body">
              <pre>{selectedDocument.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;