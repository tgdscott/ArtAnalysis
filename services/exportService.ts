import { jsPDF } from "jspdf";

export const exportService = {
  /**
   * Generates a PDF containing the image centered on a letter-sized page.
   */
  generatePDF: (base64Image: string, title: string) => {
    // Default to Letter size (8.5 x 11 inches)
    // jsPDF uses mm by default. Letter is approx 215.9mm x 279.4mm
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "letter"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Margins
    const margin = 20;
    const availableWidth = pageWidth - (margin * 2);
    
    // Add Image
    // We assume the image is square (1:1) based on our generator config
    doc.addImage(base64Image, 'PNG', margin, margin, availableWidth, availableWidth);

    // Add Title/Footer
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Projective Art Therapy - Generated Template: ${title}`, margin, availableWidth + margin + 10);
    doc.text("Instructions: Color freely. No rules apply.", margin, availableWidth + margin + 16);

    doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  },

  /**
   * Opens a print window with just the image.
   */
  printImage: (base64Image: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Art Therapy Template</title>
          <style>
            body, html { margin: 0; padding: 0; height: 100%; display: flex; align-items: center; justify-content: center; }
            img { max-width: 95%; max-height: 95vh; object-fit: contain; border: 1px solid #ccc; }
            @media print {
              body, html { display: block; }
              img { width: 100%; max-width: none; border: none; }
            }
          </style>
        </head>
        <body>
          <img src="${base64Image}" onload="window.print(); window.close();" />
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
};
