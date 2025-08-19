import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import SettingsEmail from '../../shared/models/Settings.email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function replacePlaceholders(template, data) {
    let result = template;

    // Replace simple placeholders
    Object.keys(data).forEach((key) => {
        if (typeof data[key] === 'string' || typeof data[key] === 'number') {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(placeholder, String(data[key]));
        }
    });

    // Handle array sections (global replace) with Handlebars-like {{#each key}}...{{/each}} or {{/each key}}
    Object.keys(data).forEach((key) => {
        if (!Array.isArray(data[key])) return;
        const sectionRe = new RegExp(`{{#each ${key}}}([\\s\\S]*?){{\\/(?:each\\s+${key}|each)}}`, 'g');
        let match;
        while ((match = sectionRe.exec(result)) !== null) {
            const full = match[0];
            const block = match[1];
            const itemsHtml = data[key]
                .map((item) => {
                    let html = block;
                    Object.keys(item).forEach((k) => {
                        const placeholder = new RegExp(`{{${k}}}`, 'g');
                        html = html.replace(placeholder, item[k] == null ? '' : String(item[k]));
                    });
                    return html;
                })
                .join('');
            result = result.replace(full, itemsHtml);
        }
    });

    return result;
}

export const SendFibermallBulkPriceReport = async (report) => {
    const { auth, host, port, secure } = await SettingsEmail.findOne();

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        requireTLS: true,
        auth: {
            user: auth.no_reply.user,
            pass: auth.no_reply.pass,
        },
        tls: { servername: 'alistar.ltd' },
    });

    const templatePath = path.join(__dirname, 'ParseReport.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    const startedAt = report.startedAt instanceof Date ? report.startedAt.toISOString() : String(report.startedAt || '');
    const finishedAt = report.finishedAt instanceof Date ? report.finishedAt.toISOString() : String(report.finishedAt || '');

    // Only errors in the table
    const failureItems = (report.items || []).filter((it) => {
        const s = String(it.status).toLowerCase();
        return s === 'error' || s === 'not_found' || s === 'not found';
    });

    // Hide table if no errors or not_found
    if (failureItems.length === 0) {
        htmlTemplate = htmlTemplate.replace(/<!-- ERRORS_TABLE_START -->[\s\S]*?<!-- ERRORS_TABLE_END -->/g, '');
    }

    const htmlContent = replacePlaceholders(htmlTemplate, {
        startedAt,
        finishedAt,
        attempted: report.attempted || 0,
        updated: report.updated || 0,
        notFound: report.notFoundOnSite || 0,
        errors: report.errors || 0,
        percent: typeof report.percent === 'number' ? report.percent : '',
        items: failureItems.map((it) => ({
            sku: it.sku ?? '',
            status: it.status ?? '',
            oldPrice: it.oldPrice ?? '',
            parsedPrice: it.parsedPrice ?? '',
            newPrice: it.newPrice ?? '',
            source: it.source ?? '',
            message: it.message ?? '',
        })),
    });

    const mailOptions = {
        from: `"Alistar HK LTD" <${auth.no_reply.user}>`,
        to: 'v.saic4uk@gmail.com, alistarhkltd@gmail.com',
        subject: 'Звіт про парсинг цін з Fibermall',
        html: htmlContent,
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Помилка відправки листа (Admin report):', error);
                return reject(error);
            }
            console.log('Звіт відправлено (Admin report):', info.response);
            resolve(true);
        });
    });
};
