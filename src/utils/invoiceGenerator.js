const PDFDocument = require('pdfkit');

/**
 * Generate a sales invoice PDF as a buffer
 * @param {Object} order - The order object
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateInvoicePDF(order) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            // eslint-disable-next-line no-undef
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header Section - Centered
            doc.fontSize(20).font('Helvetica-Bold').text('Quick Order', { align: 'center' });
            doc.fontSize(12).font('Helvetica').text('Sales Invoice', { align: 'center' });
            doc.moveDown(0.8);

            // Company Info and Invoice Details in a table layout
            const leftColX = 40;
            const rightColX = 320;
            const currentY = doc.y;

            // Left column - Company Info
            doc.fontSize(10).font('Helvetica-Bold').text('Company Information', leftColX);
            doc.fontSize(9).font('Helvetica');
            doc.text('289 L. de Guzman St., Concepcion Uno, Marikina City', leftColX, doc.y);
            doc.text('Contact: 0912-345-6789', leftColX, doc.y);
            doc.text('Website: quickorder-production-145f.up.railway.app', leftColX, doc.y);
            doc.text('Owner: Juan dela Cruz', leftColX, doc.y);

            // Right column - Invoice Details
            doc.fontSize(10).font('Helvetica-Bold').text('Invoice Details', rightColX, currentY);
            doc.fontSize(9).font('Helvetica-Bold').text('Invoice Number:', rightColX, currentY + 20);
            doc.fontSize(9).font('Helvetica').text(order.invoiceNumber || 'N/A', rightColX, doc.y);

            doc.fontSize(9).font('Helvetica-Bold').text('Invoice Date:', rightColX, doc.y + 3);
            const invoiceDate = order.updatedAt ? new Date(order.updatedAt).toLocaleString('en-PH') : new Date().toLocaleString('en-PH');
            doc.fontSize(9).font('Helvetica').text(invoiceDate, rightColX, doc.y + 18);

            doc.fontSize(9).font('Helvetica-Bold').text('Cashier:', rightColX, doc.y + 3);
            doc.fontSize(9).font('Helvetica').text(order.cashierName || 'N/A', rightColX, doc.y + 18);

            doc.y = Math.max(doc.y, currentY + 95);
            doc.moveDown(0.5);

            // Horizontal Line
            doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(0.5);

            // Customer Info Section
            doc.fontSize(10).font('Helvetica-Bold').text('Customer Information');
            doc.fontSize(9).font('Helvetica');
            doc.text(`Name: ${order.customerName || 'N/A'}`);
            doc.text(`Email: ${order.email || 'N/A'}`);
            doc.text(`Phone: ${order.customerPhone || 'N/A'}`);
            doc.text(`Address: ${order.address || 'N/A'}`);
            doc.text(`Delivery Type: ${order.deliveryType === 'pickup' ? 'Pick-up' : 'Delivery'}`);
            doc.moveDown(0.5);

            // Horizontal Line
            doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(0.5);

            // Items Table Header
            const tableTop = doc.y;
            const col1 = 40;   // Item
            const col2 = 260;  // Quantity
            const col3 = 310;  // Unit Price
            const col4 = 420;  // Amount

            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Item Description', col1, tableTop);
            doc.text('Qty', col2, tableTop);
            doc.text('Unit Price', col3, tableTop);
            doc.text('Total', col4, tableTop);

            doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();

            // Items
            let itemsY = tableTop + 22;
            let subtotalAmount = 0;

            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    const itemTotal = item.price * item.quantity;
                    subtotalAmount += itemTotal;

                    // Item name with variations
                    let itemDesc = item.name;
                    if (item.selectedVariations && item.selectedVariations.length > 0) {
                        const varStr = item.selectedVariations.map(v => `${v.selectedOption}`).join(', ');
                        itemDesc += ` (${varStr})`;
                    }

                    doc.fontSize(9).font('Helvetica');
                    doc.text(itemDesc, col1, itemsY, { width: 210 });
                    doc.text(item.quantity.toString(), col2, itemsY);
                    doc.text(`₱${item.price.toFixed(2)}`, col3, itemsY);
                    doc.text(`₱${itemTotal.toFixed(2)}`, col4, itemsY, { align: 'right' });

                    itemsY += 25;
                });
            }

            doc.moveTo(40, itemsY).lineTo(555, itemsY).stroke();
            itemsY += 10;

            // Summary Section - Right aligned
            const summaryX = 360;
            let discountAmount = order.discount?.discountAmount || 0;
            let vatAmount = 0;

            // Calculate VAT (12%)
            let taxableAmount = subtotalAmount - discountAmount;
            vatAmount = taxableAmount * 0.12;

            doc.fontSize(9).font('Helvetica');
            doc.text('Subtotal:', summaryX, itemsY + 15);
            doc.text(`₱${subtotalAmount.toFixed(2)}`, 500, itemsY + 15, { align: 'right', width: 55 });

            let summaryY = itemsY + 30;

            // Discount
            if (discountAmount > 0) {
                doc.text('Discount:', summaryX, summaryY);
                const discountLabel = order.discount?.code ? `(${order.discount.code})` : '';
                doc.text(`-₱${discountAmount.toFixed(2)} ${discountLabel}`, 500, summaryY, { align: 'right', width: 55 });
                summaryY += 15;
            }

            // VAT
            doc.text('VAT (12%):', summaryX, summaryY);
            doc.text(`₱${vatAmount.toFixed(2)}`, 500, summaryY, { align: 'right', width: 55 });
            summaryY += 15;

            // Total Line
            doc.moveTo(summaryX - 5, summaryY).lineTo(555, summaryY).stroke();
            summaryY += 10;

            doc.fontSize(11).font('Helvetica-Bold');
            doc.text('Total Amount Due:', summaryX, summaryY);
            const totalAmount = order.total || 0;
            doc.text(`₱${totalAmount.toFixed(2)}`, 500, summaryY, { align: 'right', width: 55 });

            summaryY += 25;

            // Payment Method
            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Payment Method:', summaryX, summaryY);
            doc.fontSize(9).font('Helvetica');
            doc.text(order.paymentMethod || 'N/A', summaryX, summaryY + 15);

            // Footer Message
            doc.moveDown(2);
            doc.fontSize(11).font('Helvetica-Bold').text('Thank you for ordering with us!', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text('This serves as your sales invoice.', { align: 'center' });

            // Footer Info
            doc.moveDown(1);
            doc.fontSize(8).font('Helvetica').text('Quick Order System - Powered by QuickOrder', { align: 'center' });
            doc.text(`Generated: ${new Date().toLocaleString('en-PH')}`, { align: 'center' });

            // Finalize PDF
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateInvoicePDF
};
