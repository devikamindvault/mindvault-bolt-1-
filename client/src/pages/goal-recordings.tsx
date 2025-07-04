import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ArrowLeft } from "lucide-react";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import type { Goal, Transcription } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from 'dompurify';
import { useTheme } from "@/components/theme-provider";
import { useEffect } from "react";

// Define icons for the PDF
const IMAGE_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA+0lEQVR4nO2UMQ6CMBiFf40ncOIKOjp6CeNBPIJ6A93UwcWDeBJWnZxMdDQYtgYICRKG9xpaaEopYHDxJV8C6Xv/17wWvWvyAEPIBXRDVgDnqkCEbCTwB1QmQSWwEWCH0ArEj8DTwnaCnxZvJGgR+AkQXPgKsHxO/FXKS6AswTcgQg4SPLEniwWkTXQk4SJnMBjEc2AtFc8FtFSNteTpE/uIppL8gbopbgrHshGHhK8A9Ym4gBoJLmS5JGcr2USHySglePyM6BzASK5WUeV7JhqrQvQl9U9TXAj08Q+QB84SsKPlqiVY5vLJpYDOxHFX4krL/IPegKg7qc1zrebellQAAAABJRU5ErkJggg==";
const DOC_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA5ElEQVR4nO2UQQ6CMBBFf40ncOIKOjrqJYwH4QjqDXRTBxcP4klYdXIy0dFgoKVpSAgJQ/8YoKWUAQYXX/KShmbe79Aw0L96cgAeQCKiG7AGXFMFQmAnwTugNAksgYsEP4BGJH4GnhK0EfiyeCNBe+AkQXPgKsHRO/FXKS6AswTcgRA4SPLYniwSkTXQk4SJHP+jiGbAVEQzEU0keVcldwE6SXSW4B3QmoiHspHEIppL8Ku4Kx7IRh4SvAPWJuIAqCW5kuShnK9lEh8koJHj8jOgcwEiuVlHleyYaq0L0JfVPU1wI9PEPkAfOErCj5aokWObyya+7qc1zrebellQAAAABJRU5ErkJggg==";

export default function GoalRecordings() {
  const { goalId } = useParams();
  const { toast } = useToast();
  const { theme } = useTheme();

  const { data: goals, error: goalsError } = useQuery<Goal[]>({
    onError: (error) => {
      console.error("Error fetching goals:", error);
      toast({
        title: "Error",
        description: "Failed to fetch goals data",
        variant: "destructive"
      });
    }
  });

  const { data: transcriptions, error: transcriptionsError } = useQuery<Transcription[]>({
    onError: (error) => {
      console.error("Error fetching transcriptions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch transcriptions data",
        variant: "destructive"
      });
    }
  });

  // Log data for debugging
  useEffect(() => {
    console.log("Goals data:", goals);
    console.log("Transcriptions data:", transcriptions);
    console.log("Current goal ID:", goalId);
  }, [goals, transcriptions, goalId]);

  const goal = goals?.find(g => g.id === Number(goalId));
  const goalTranscriptions = transcriptions
    ?.filter(t => t.goalId === Number(goalId))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Create a robust thumbnail generator with full error handling
  const createThumbnail = async (url: string, maxWidth: number, maxHeight: number): Promise<string> => {
    // Return a promise that always resolves (never rejects) for stability
    return new Promise((resolve) => {
      console.log("Creating thumbnail for:", url);
      
      // Handle missing or invalid URL
      if (!url) {
        console.log("No URL provided for thumbnail");
        return resolve(IMAGE_ICON);
      }
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      // Set a timeout to handle stalled image loading
      const timeout = setTimeout(() => {
        console.log("Image load timeout for:", url);
        resolve(IMAGE_ICON);
      }, 2000);
      
      img.onload = () => {
        clearTimeout(timeout);
        try {
          // Basic validation
          if (img.width === 0 || img.height === 0) {
            console.error("Invalid image dimensions:", img.width, img.height);
            return resolve(IMAGE_ICON);
          }
          
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            console.error("Could not get canvas context");
            return resolve(IMAGE_ICON);
          }
          
          // Calculate dimensions while preserving aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height * maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round(width * maxHeight / height);
              height = maxHeight;
            }
          }
          
          // Ensure minimum size
          width = Math.max(width, 10);
          height = Math.max(height, 10);
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image and get data URL in a single try block
          try {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            resolve(dataUrl);
          } catch (error) {
            console.error("Error processing canvas:", error);
            resolve(IMAGE_ICON);
          }
        } catch (error) {
          console.error("General error in thumbnail creation:", error);
          resolve(IMAGE_ICON);
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        console.error("Image loading error for:", url);
        resolve(IMAGE_ICON);
      };
      
      // Attempt to load the image with absolute URL and cache-busting
      try {
        // Make URL absolute if needed
        let imageUrl = url;
        if (!url.startsWith('http') && !url.startsWith('data:')) {
          const base = window.location.origin;
          imageUrl = base + (url.startsWith('/') ? '' : '/') + url;
        }
        
        // Add cache-busting query parameter
        img.src = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}_cb=${Date.now()}`;
      } catch (e) {
        clearTimeout(timeout);
        console.error("Error setting image src:", e);
        resolve(IMAGE_ICON);
      }
    });
  };

  const handleMediaElement = async (
    element: HTMLElement,
    doc: jsPDF,
    position: { y: number },
    margin: number,
    pageHeight: number
  ) => {
    // Determine if the element is an image by checking its type attribute or tag name
    const isImage = element.hasAttribute('data-type') 
      ? element.getAttribute('data-type') === 'image'
      : element.tagName.toLowerCase() === 'img';
    
    // Get URL from different possible attributes
    const url = element.getAttribute('data-url') || element.getAttribute('src') || element.getAttribute('href');
    
    // Get title or filename
    let title = element.getAttribute('data-title') || element.textContent || '';
    if (!title && url) {
      try {
        title = decodeURIComponent(url.split('/').pop() || '');
      } catch (e) {
        title = url.split('/').pop() || 'Media file';
      }
    }
    
    // Get size information if available
    const size = element.getAttribute('data-size');

    // Define sizes for display in the PDF
    const ICON_SIZE = isImage ? 80 : 30;
    const TEXT_OFFSET = isImage ? 90 : 40;

    // Create absolute URL if needed for external access
    const absoluteUrl = url?.startsWith('http') ? url : url ? `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}` : '';

    // Set PDF properties for better PDF viewer compatibility
    doc.setProperties({
      title: "Recordings with clickable media",
      subject: "Interactive PDF with clickable media elements",
      creator: "Goal Tracker Application",
    });

    try {
      if (isImage && absoluteUrl) {
        try {
          // Use the thumbnail generator for consistent handling with more robust error handling
          console.log("Creating thumbnail for:", absoluteUrl);
          const thumbnail = await createThumbnail(absoluteUrl, 150, 150);

          // Add thumbnail image
          doc.addImage(thumbnail, 'JPEG', margin, position.y, ICON_SIZE, ICON_SIZE);

          // Make image clickable with a wider clickable area for better usability
          doc.link(margin - 2, position.y - 2, ICON_SIZE + 4, ICON_SIZE + 4, { url: absoluteUrl });

          // Add clear instructions for clicking
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(0, 0, 255); // Blue for clickable text
          doc.text("👆 Click image to view", margin, position.y + ICON_SIZE + 5);
          
          // Add an underline to make it more obviously clickable
          doc.setLineWidth(0.1);
          doc.line(
            margin, 
            position.y + ICON_SIZE + 6,
            margin + doc.getTextWidth("👆 Click image to view"), 
            position.y + ICON_SIZE + 6
          );
          
          doc.setTextColor(0, 0, 0); // Reset text color
        } catch (error) {
          console.error('Error processing image:', error);
          // More robust fallback for image processing errors
          doc.addImage(IMAGE_ICON, 'PNG', margin, position.y, ICON_SIZE/2, ICON_SIZE/2);
          if (absoluteUrl) {
            doc.link(margin, position.y, ICON_SIZE/2, ICON_SIZE/2, { url: absoluteUrl });
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 255);
            doc.text(`[Open Image: ${title || 'Media file'}]`, margin + ICON_SIZE/2 + 5, position.y + 10);
            doc.link(
              margin + ICON_SIZE/2 + 5, 
              position.y, 
              doc.getTextWidth(`[Open Image: ${title || 'Media file'}]`) + 10, 
              20, 
              { url: absoluteUrl }
            );
          }
        }
      } else if (absoluteUrl) {
        // Add document icon
        doc.addImage(DOC_ICON, 'PNG', margin, position.y, ICON_SIZE/2, ICON_SIZE/2);
        
        // Make document clickable with larger clickable area
        doc.link(margin - 2, position.y - 2, ICON_SIZE/2 + 4, ICON_SIZE/2 + 4, { url: absoluteUrl });
        
        // Add clear instructions for clicking
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(0, 0, 255); // Blue for clickable text
        doc.text("👆 Click to open document", margin, position.y + ICON_SIZE/2 + 5);
        
        // Add an underline for better visibility
        doc.setLineWidth(0.1);
        doc.line(
          margin, 
          position.y + ICON_SIZE/2 + 6,
          margin + doc.getTextWidth("👆 Click to open document"), 
          position.y + ICON_SIZE/2 + 6
        );
        
        doc.setTextColor(0, 0, 0); // Reset text color
      }
    } catch (error) {
      console.error('Error processing media:', error);
      // Add a fallback icon when image processing fails
      const fallbackIcon = isImage ? IMAGE_ICON : DOC_ICON;
      doc.addImage(fallbackIcon, 'PNG', margin, position.y, ICON_SIZE/2, ICON_SIZE/2);
      
      // Still try to make it clickable if URL exists
      if (absoluteUrl) {
        doc.link(margin, position.y, ICON_SIZE/2, ICON_SIZE/2, { url: absoluteUrl });
      }
    }

    // Add the file title as clickable text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 255);
    
    // Position title with proper spacing
    doc.text(title, margin + TEXT_OFFSET, position.y + (ICON_SIZE/2), {
      baseline: 'middle'
    });
    
    // Make title clickable too for better accessibility
    if (url) {
      const titleWidth = doc.getTextWidth(title);
      doc.link(margin + TEXT_OFFSET - 2, position.y, titleWidth + 4, ICON_SIZE, { url });
      
      // Add an underline to make it obviously clickable
      doc.setLineWidth(0.1);
      doc.line(
        margin + TEXT_OFFSET, 
        position.y + (ICON_SIZE/2) + 2,
        margin + TEXT_OFFSET + titleWidth, 
        position.y + (ICON_SIZE/2) + 2
      );
    }
    doc.setTextColor(0, 0, 0);

    // Add file size if available
    if (size) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      let sizeText = "";
      try {
        const sizeValue = parseInt(size);
        sizeText = `${Math.round(sizeValue / 1024)} KB`;
      } catch (e) {
        sizeText = size;
      }
      doc.text(sizeText, margin + TEXT_OFFSET, position.y + ICON_SIZE - 2);
    }

    // Update position for next element with proper spacing
    position.y += ICON_SIZE + 15;

    // Add a new page if needed
    if (position.y > pageHeight - margin) {
      doc.addPage();
      position.y = 20;
    }
  };

  const downloadAllTranscriptions = async () => {
    if (!goalTranscriptions?.length || !goal) return;

    const doc = new jsPDF();
    
    // Set metadata for better PDF viewer compatibility
    doc.setProperties({
      title: `${goal.title} - All Recordings`,
      subject: "Recordings with clickable media elements",
      creator: "Goal Tracker Application",
    });
    
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;

    // Title
    doc.setFontSize(16);
    doc.text(`All Transcriptions for Goal: ${goal.title}`, margin, yPosition);
    yPosition += lineHeight * 2;

    doc.setFontSize(12);

    // Process each transcription one by one
    for (let i = 0; i < goalTranscriptions.length; i++) {
      const transcription = goalTranscriptions[i];

      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      const date = new Date(transcription.createdAt || new Date());
      doc.setFont("helvetica", "bold");
      doc.text(`Recording - ${format(date, 'PPP p')}`, margin, yPosition);
      yPosition += lineHeight * 2;

      doc.setFont("helvetica", "normal");

      // Create a temporary div to parse HTML content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = DOMPurify.sanitize(transcription.content || '');

      // Handle text and media elements in order of appearance
      const nodes = Array.from(tempDiv.childNodes);

      for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const textContent = node.textContent?.trim() || '';
          if (textContent) {
            const contentLines = doc.splitTextToSize(textContent, doc.internal.pageSize.width - margin * 2);
            for (const line of contentLines) {
              if (yPosition > pageHeight - 20) {
                doc.addPage();
                yPosition = 20;
              }
              doc.text(line, margin, yPosition);
              yPosition += lineHeight;
            }
          }
        } else if (node instanceof HTMLElement) {
          const isMediaElement = node.matches('img, span[data-preview], [data-type="image"], [data-type="document"]');
          if (isMediaElement) {
            if (yPosition + 40 > pageHeight - margin) {
              doc.addPage();
              yPosition = 20;
            }
            await handleMediaElement(node as HTMLElement, doc, { y: yPosition }, margin, pageHeight);
            yPosition += 45; // Add extra space after media elements
          }
        }
      }

      yPosition += lineHeight * 2; // Add space between recordings
    }

    // Add page numbers and footer with instructions
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      
      // Add page numbers
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      
      // Add clickable elements note on every page
      if (i === pageCount) {
        // On last page, add more detailed instructions
        doc.text("Note: This PDF contains clickable elements. For best experience, view in Adobe Acrobat Reader or Chrome's PDF viewer.", 20, doc.internal.pageSize.height - 10);
      } else {
        // On other pages, add a shorter note
        doc.text("Contains clickable elements - Best viewed in Adobe Reader or Chrome", 20, doc.internal.pageSize.height - 10);
      }
    }
    
    // Clean the filename to avoid issues with special characters
    const safeFilename = goal.title.replace(/[^a-z0-9 ]/gi, '_');
    
    // Try a more reliable approach to save the PDF
    try {
      // Use blob URL method first
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      // Create a temporary link and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeFilename}-all-recordings.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      
      toast({
        title: "Download Complete",
        description: `All ${goalTranscriptions.length} recordings have been downloaded as PDF with clickable media elements.`,
      });
    } catch (downloadError) {
      console.error('Error with blob download method, trying fallback:', downloadError);
      
      // Fallback to direct save method
      try {
        doc.save(`${safeFilename}-all-recordings.pdf`);
        
        toast({
          title: "Download Complete",
          description: `All ${goalTranscriptions.length} recordings have been downloaded as PDF with clickable media elements.`,
        });
      } catch (directSaveError) {
        console.error('Direct save also failed:', directSaveError);
        
        // Last resort - try data URL approach
        try {
          const dataUrl = doc.output('dataurlnewwindow');
          toast({
            title: "PDF Opened in New Window",
            description: "Your PDF opened in a new window. Please save it from there.",
          });
        } catch (finalError) {
          console.error('All PDF saving methods failed:', finalError);
          toast({
            title: "Error",
            description: "Failed to generate PDF. Please try again later or contact support.",
            variant: "destructive"
          });
        }
      }
    }
  };

  if (!goal) {
    return (
      <div className={`container mx-auto py-6 space-y-4 ${theme === 'light' ? 'light-theme' : ''}`}>
        <Button variant="outline" asChild>
          <a href="/goals">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Goals
          </a>
        </Button>
        <div className="flex items-center justify-center h-[50vh]">
          <p className="text-lg text-muted-foreground">Goal not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto py-6 space-y-4 ${theme === 'light' ? 'light-theme' : ''}`}>
      <div className="flex justify-between items-center">
        <Button variant="outline" asChild>
          <a href="/goals">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Goals
          </a>
        </Button>

        <Button onClick={downloadAllTranscriptions} disabled={!goalTranscriptions?.length}>
          <Download className="h-4 w-4 mr-2" />
          Download All Recordings
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{goal.title}</h1>
        {goal.description && <p className="text-muted-foreground mt-2">{goal.description}</p>}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Recordings ({goalTranscriptions?.length || 0})</h2>

        {goalTranscriptions?.length === 0 && (
          <p className="text-muted-foreground">No recordings found for this goal.</p>
        )}

        {goalTranscriptions?.map((transcription, index) => (
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium">
                Recording {index + 1} - {new Date(transcription.createdAt || new Date()).toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="whitespace-pre-wrap" 
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(transcription.content || '') 
                }} 
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}