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

            // Header Section
            doc.fontSize(20).font('Helvetica-Bold').text('Quick Order', { align: 'center' });
            doc.fontSize(12).font('Helvetica').text('Sales Invoice', { align: 'center' });
            doc.moveDown(0.5);

            // Company Info - Left Side
            doc.fontSize(10).font('Helvetica');
            doc.text('289 L. de Guzman St., Concepcion Uno, Marikina City');
            doc.text('Contact: 0912-345-6789');
            doc.text('Website: quickorder-production-145f.up.railway.app');
            doc.text('Owner: Juan dela Cruz');
            doc.moveDown(0.5);

            // Invoice Details - Right Side (overlay)
            const rightX = 350;
            doc.fontSize(9).font('Helvetica-Bold').text('Invoice Number:', rightX, doc.y - 60);
            doc.fontSize(9).font('Helvetica').text(order.invoiceNumber || 'N/A', rightX + 100, doc.y - 15);

            doc.fontSize(9).font('Helvetica-Bold').text('Invoice Date:', rightX, doc.y);
            const invoiceDate = order.updatedAt ? new Date(order.updatedAt).toLocaleString('en-PH') : new Date().toLocaleString('en-PH');
            doc.fontSize(9).font('Helvetica').text(invoiceDate, rightX + 100, doc.y - 15);

            doc.fontSize(9).font('Helvetica-Bold').text('Cashier:', rightX, doc.y);
            doc.fontSize(9).font('Helvetica').text(order.cashierName || 'N/A', rightX + 100, doc.y - 15);

            doc.moveDown(1.5);

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
            const col2 = 280;  // Quantity
            const col3 = 320;  // Unit Price
            const col4 = 420;  // Amount

            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Item Description', col1, tableTop);
            doc.text('Qty', col2, tableTop);
            doc.text('Unit Price', col3, tableTop);
            doc.text('Total', col4, tableTop);

            doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();

            // Items
            let itemsY = tableTop + 20;
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
                    doc.text(itemDesc, col1, itemsY, { width: 230 });
                    doc.text(item.quantity.toString(), col2, itemsY);
                    doc.text(`₱${item.price.toFixed(2)}`, col3, itemsY);
                    doc.text(`₱${itemTotal.toFixed(2)}`, col4, itemsY);

                    itemsY += 25;
                });
            }

            doc.moveTo(40, itemsY).lineTo(555, itemsY).stroke();
            itemsY += 10;

            // Summary Section
            const summaryX = 350;
            let discountAmount = order.discount?.discountAmount || 0;
            let vatAmount = 0;

            // Calculate VAT (12%)
            let taxableAmount = subtotalAmount - discountAmount;
            vatAmount = taxableAmount * 0.12;

            doc.fontSize(9).font('Helvetica');
            doc.text('Subtotal:', summaryX, itemsY);
            doc.text(`₱${subtotalAmount.toFixed(2)}`, 480, itemsY, { align: 'right' });

            itemsY += 15;

            // Discount
            if (discountAmount > 0) {
                doc.text('Discount:', summaryX, itemsY);
                const discountLabel = order.discount?.code ? `(${order.discount.code})` : '';
                doc.text(`-₱${discountAmount.toFixed(2)} ${discountLabel}`, 480, itemsY, { align: 'right' });
                itemsY += 15;
            }

            // VAT
            doc.text('VAT (12%):', summaryX, itemsY);
            doc.text(`₱${vatAmount.toFixed(2)}`, 480, itemsY, { align: 'right' });
            itemsY += 15;

            // Total Line
            doc.moveTo(summaryX, itemsY).lineTo(540, itemsY).stroke();
            itemsY += 5;

            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Total Amount Due:', summaryX, itemsY);
            const totalAmount = order.total || 0;
            doc.text(`₱${totalAmount.toFixed(2)}`, 480, itemsY, { align: 'right' });

            itemsY += 25;

            // Payment Method
            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Payment Method:', summaryX, itemsY);
            doc.fontSize(9).font('Helvetica');
            doc.text(order.paymentMethod || 'N/A', summaryX, itemsY + 15);

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
