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

            // Header Section - Centered Title
            doc.fontSize(24).font('Helvetica-Bold').text('Quick Order', { align: 'center' });
            doc.moveDown(0.3);

            // Company Info - Centered
            doc.fontSize(9).font('Helvetica');
            doc.text('289 L. de Guzman St., Concepcion Uno, Marikina City', { align: 'center' });
            doc.text('Contact: 0912-345-6789', { align: 'center' });
            doc.text('Website: quickorder-production-145f.up.railway.app', { align: 'center' });
            doc.text('Owner: Juan dela Cruz', { align: 'center' });
            doc.moveDown(0.5);

            // Horizontal Line
            doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(0.5);

            // Invoice Details - Left side (not centered)
            const leftColX = 40;
            doc.fontSize(10).font('Helvetica-Bold').text('Invoice Details', leftColX);
            doc.fontSize(9).font('Helvetica-Bold').text('Invoice Number:', leftColX);
            doc.fontSize(9).font('Helvetica').text(order.invoiceNumber || 'N/A', leftColX + 110, doc.y - 12);

            doc.fontSize(9).font('Helvetica-Bold').text('Invoice Date:', leftColX);
            const invoiceDate = order.updatedAt ? new Date(order.updatedAt).toLocaleString('en-PH') : new Date().toLocaleString('en-PH');
            doc.fontSize(9).font('Helvetica').text(invoiceDate, leftColX + 110, doc.y - 12);

            doc.fontSize(9).font('Helvetica-Bold').text('Cashier:', leftColX);
            doc.fontSize(9).font('Helvetica').text(order.cashierName || 'N/A', leftColX + 110, doc.y - 12);
            doc.moveDown(0.5);

            // Customer Information Section
            doc.fontSize(10).font('Helvetica-Bold').text('Customer Information', leftColX);
            doc.fontSize(9).font('Helvetica');
            doc.text(`Name: ${order.customerName || 'N/A'}`, leftColX);
            doc.text(`Email: ${order.email || 'N/A'}`, leftColX);
            doc.text(`Phone: ${order.customerPhone || 'N/A'}`, leftColX);
            doc.text(`Address: ${order.address || 'N/A'}`, leftColX);
            doc.text(`Delivery Type: ${order.deliveryType === 'pickup' ? 'Pick-up' : 'Delivery'}`, leftColX);
            doc.moveDown(0.5);

            // Sales Invoice Title
            doc.fontSize(12).font('Helvetica-Bold').text('Sales Invoice', { align: 'center' });
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
            itemsY += 15;

            // Summary Section - Centered
            const summaryX = 320;
            let discountAmount = order.discount?.discountAmount || 0;
            let vatAmount = 0;

            // Calculate VAT (12%)
            let taxableAmount = subtotalAmount - discountAmount;
            vatAmount = taxableAmount * 0.12;

            doc.fontSize(10).font('Helvetica');
            doc.text('Subtotal:', summaryX, itemsY, { align: 'center' });
            doc.text(`₱${subtotalAmount.toFixed(2)}`, summaryX + 150, itemsY, { align: 'right', width: 70 });

            let summaryY = itemsY + 18;

            // Discount
            if (discountAmount > 0) {
                let discountLabel = '';
                if (order.discount?.eligibilityType === 'SC') {
                    discountLabel = 'SC Discount';
                } else if (order.discount?.eligibilityType === 'PWD') {
                    discountLabel = 'PWD Discount';
                } else if (order.discount?.code) {
                    discountLabel = order.discount.code;
                }
                
                doc.text('Discount:', summaryX, summaryY, { align: 'center' });
                doc.text(`-₱${discountAmount.toFixed(2)} (${discountLabel})`, summaryX + 150, summaryY, { align: 'right', width: 70 });
                summaryY += 18;
            }

            // VAT
            doc.text('VAT (12%):', summaryX, summaryY, { align: 'center' });
            doc.text(`₱${vatAmount.toFixed(2)}`, summaryX + 150, summaryY, { align: 'right', width: 70 });
            summaryY += 18;

            // Total Line
            doc.moveTo(summaryX + 30, summaryY).lineTo(summaryX + 200, summaryY).stroke();
            summaryY += 10;

            doc.fontSize(11).font('Helvetica-Bold');
            doc.text('Total Amount Due:', summaryX, summaryY, { align: 'center' });
            const totalAmount = order.total || 0;
            doc.text(`₱${totalAmount.toFixed(2)}`, summaryX + 150, summaryY, { align: 'right', width: 70 });

            summaryY += 25;

            // Payment Method
            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Payment Method:', summaryX, summaryY, { align: 'center' });
            doc.fontSize(9).font('Helvetica');
            doc.text(order.paymentMethod || 'N/A', summaryX, summaryY + 15, { align: 'center' });

            // Footer Message
            doc.moveDown(3);
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
