import fs from 'fs';
import PDFDocument from 'pdfkit';
import path from 'path';

export const generateInvoice = async (req, res) => {
    try {
        // Дані інвойса (в ідеалі, їх варто передавати через body запиту)
        const invoiceData = {
            invoiceNumber: 'INV-12345',
            date: new Date().toISOString().slice(0, 10),
            client: 'John Doe',
            items: [
                { description: 'Item 1', quantity: 2, price: 50 },
                { description: 'Item 2', quantity: 1, price: 100 },
            ],
            total: 200,
        };

        // Генерація унікального імені для PDF
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const filename = `invoice-${uniqueSuffix}.pdf`;

        // Шлях до файлу
        const filePath = path.join('uploads', 'invoices', filename);

        // Перевіряємо, чи існує папка, якщо ні — створюємо
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Створення PDF-документа
        const pdfDoc = new PDFDocument();
        const writeStream = fs.createWriteStream(filePath);

        pdfDoc.pipe(writeStream);

        // Заповнення PDF
        pdfDoc.fontSize(20).text('Invoice', { align: 'center' });
        pdfDoc.moveDown();
        pdfDoc.fontSize(12).text(`Invoice Number: ${invoiceData.invoiceNumber}`);
        pdfDoc.text(`Date: ${invoiceData.date}`);
        pdfDoc.text(`Client: ${invoiceData.client}`);
        pdfDoc.moveDown();
        pdfDoc.text('Items:');
        invoiceData.items.forEach((item) => {
            pdfDoc.text(`${item.description} - Quantity: ${item.quantity}, Price: $${item.price}`);
        });
        pdfDoc.moveDown();
        pdfDoc.text(`Total: $${invoiceData.total}`, { align: 'right' });

        pdfDoc.end();

        // Чекаємо завершення запису в файл
        writeStream.on('finish', () => {
            res.json({
                success: true,
                url: `/upload/invoices/${filename}`,
            });
        });

        writeStream.on('error', (err) => {
            console.error('Error writing PDF:', err);
            res.status(500).json({ success: false, error: 'Error generating PDF' });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
