import multer from 'multer';
import fs from 'fs';
import sharp from 'sharp';
import Gallery from '../models/Gallery.js';

// Налаштування сховища для зображень
const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, 'uploads');
    },
    filename: (_, file, cb) => {
        const format = file.originalname.match(/\.(jpg|jpeg|png|gif|svg|webp|xlsx)$/)?.[1];
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9) + '.' + format;
        cb(null, uniqueSuffix);
    },
});

export const uploadImage = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 МБ
}).single('file');

export const handleImageUpload = async (req, res) => {
    try {
        const existingFile = await Gallery.findOne({ filename: req.file.filename });

        if (existingFile) {
            const format = req.file.originalname.match(/\.(jpg|jpeg|png|gif|xlsx)$/)?.[1];
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9) + '.' + format;
            req.file.filename = uniqueSuffix;
            existingFile.filename = uniqueSuffix;
            await existingFile.save();

            res.json({ url: `/upload/${uniqueSuffix}` });
        } else {
            const doc = new Gallery({
                originalname: req.file.originalname,
                filename: req.file.filename,
                encoding: req.file.encoding,
                path: req.file.path,
                size: req.file.size,
            });

            const saved = await doc.save();

            if (req.file.mimetype.startsWith('image/')) {
                const originalImagePath = `${req.file.path}`;
                const outputPath = `uploads/small/${req.file.filename}`;
                const outputImage = fs.createWriteStream(outputPath);

                sharp(originalImagePath)
                    .resize(100)
                    .pipe(outputImage)
                    .on('error', (err) => console.error('Помилка зменшення зображення:', err));

                return res.json({
                    url: `/upload/${req.file.filename}`,
                    url_small: `/upload/small/${req.file.filename}`,
                    data: saved,
                });
            }

            return res.json({
                url: `/upload/${req.file.filename}`,
                url_small: `/upload/small/${req.file.filename}`,
                data: saved,
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};
