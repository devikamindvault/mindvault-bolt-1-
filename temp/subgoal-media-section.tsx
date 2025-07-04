// Process images and documents using the improved approach
const subGoalMediaElements = Array.from(subGoalTempDiv.querySelectorAll('img, span[data-preview], [data-type="image"], [data-type="document"]'));

if (subGoalMediaElements.length > 0) {
  yPosition += 10; // Space before media section
  
  // Group media by type for better organization in subgoals
  const subGoalImages = subGoalMediaElements.filter(el => 
    (el instanceof HTMLElement) && 
    ((el.getAttribute('data-type') === 'image') || el.tagName.toLowerCase() === 'img')
  );
  
  const subGoalDocuments = subGoalMediaElements.filter(el => 
    (el instanceof HTMLElement) && 
    (el.getAttribute('data-type') === 'document')
  );
  
  // Process images first with better styling for subgoals
  if (subGoalImages.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("Images:", margin + 5, yPosition);
    yPosition += 8;
    
    for (const element of subGoalImages) {
      if (element instanceof HTMLElement) {
        try {
          const img = element.querySelector('img') || (element.tagName.toLowerCase() === 'img' ? element : null);
          let imgSrc = img && 'src' in img ? (img as HTMLImageElement).src : element.getAttribute('data-url');
          
          if (imgSrc) {
            // Ensure URL is absolute
            if (!imgSrc.startsWith('http')) {
              imgSrc = window.location.origin + (imgSrc.startsWith('/') ? '' : '/') + imgSrc;
            }
            
            // Check if we need a new page for the image
            if (yPosition > pageHeight - 80) {
              doc.addPage();
              yPosition = 20;
            }
            
            // Use dimensions adjusted for subgoals
            const imgWidth = 70;  
            const imgHeight = 55;
            
            // Add image title with better formatting
            const imgTitle = element.getAttribute('data-title') || 'Image';
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(imgTitle, margin + 8, yPosition);
            yPosition += 5;
            
            // Add timestamp if available
            const dateDiv = element.querySelector('.text-xs.text-gray-400');
            if (dateDiv) {
              doc.setFontSize(8);
              doc.setFont('helvetica', 'italic');
              doc.text(dateDiv.textContent || '', margin + 8, yPosition);
              yPosition += 4;
            }
            
            // Create and add thumbnail with better quality
            const thumbnail = await createThumbnail(imgSrc, imgWidth, imgHeight);
            doc.addImage(thumbnail, 'JPEG', margin + 8, yPosition, imgWidth, imgHeight);
            
            // Add a clickable area over the image that opens the full version
            doc.link(margin + 8, yPosition, imgWidth, imgHeight, { url: imgSrc });
            
            // Add "Click to view full image" text
            yPosition += imgHeight + 5;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(0, 0, 255);
            doc.text("(Click image to view full version)", margin + 8, yPosition);
            doc.setTextColor(0, 0, 0);
            
            yPosition += 12; // Space after each image
          }
        } catch (error) {
          console.error('Error adding subgoal image to PDF:', error);
          
          // Add a fallback for failed images
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(10);
          const imgTitle = element.getAttribute('data-title') || 'Image';
          doc.text(`[Image: ${imgTitle} - Failed to load]`, margin + 8, yPosition);
          yPosition += 8;
        }
      }
    }
  }
  
  // Process documents with improved preview for subgoals
  if (subGoalDocuments.length > 0) {
    // Add a page break if we're running out of space
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }
    
    yPosition += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("Documents:", margin + 5, yPosition);
    yPosition += 8;
    
    for (const element of subGoalDocuments) {
      if (element instanceof HTMLElement) {
        try {
          let docUrl = element.getAttribute('data-url');
          const docTitle = element.getAttribute('data-title') || 'Document';
          const docSize = element.getAttribute('data-size') || '';
          
          if (docUrl) {
            // Ensure URL is absolute
            if (!docUrl.startsWith('http')) {
              docUrl = window.location.origin + (docUrl.startsWith('/') ? '' : '/') + docUrl;
            }
            
            // Calculate space needed
            const itemHeight = 35;
            
            // Check for page break
            if (yPosition > pageHeight - itemHeight) {
              doc.addPage();
              yPosition = 20;
            }
            
            // Add document icon
            doc.addImage(DOC_ICON, 'PNG', margin + 8, yPosition, 15, 15);
            
            // Add document title with link
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 255);
            doc.text(docTitle, margin + 28, yPosition + 5);
            doc.link(margin + 8, yPosition, doc.getTextWidth(docTitle) + 25, 15, { url: docUrl });
            
            // Add size info
            if (docSize) {
              doc.setFontSize(8);
              doc.setFont('helvetica', 'italic');
              doc.setTextColor(100, 100, 100);
              const sizeText = `${Math.round(parseInt(docSize) / 1024)} KB`;
              doc.text(sizeText, margin + 28, yPosition + 15);
            }
            
            // Add "Click to open" text
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 255);
            doc.text("(Click to open)", margin + 28, yPosition + 20);
            
            // Reset text color
            doc.setTextColor(0, 0, 0);
            yPosition += itemHeight;
          }
        } catch (error) {
          console.error('Error adding subgoal document to PDF:', error);
          // Fallback for failed documents
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(10);
          const docTitle = element.getAttribute('data-title') || 'Document';
          doc.text(`[Document: ${docTitle} - Failed to load]`, margin + 8, yPosition);
          yPosition += 8;
        }
      }
    }
  }
}