import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import adminRoutes from './src/admin/routes/index.routes.js';
import clientRoutes from './src/client/routes/index.routes.js';

import checkAuth from './src/shared/utils/checkAuth.js';
import { uploadImage, handleImageUpload } from './src/shared/utils/imageUploader.js';
import { deleteImage } from './src/shared/utils/imageDelete.js';

// import './GPT.js';
// import './src/admin/helpers/parseEmail.js';

const PORT = process.env.PORT || 8585;
mongoose.set('strictQuery', true);
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: process.env.LIMIT_UPLOAD_IMAGE }));
app.use('/upload', express.static('uploads'));

const server = app.listen(PORT, () => {
    console.log(`========== ✅ Server started on port ${PORT} ==========`);
});

// initWebSocket(server); // Ініціалізуємо WebSocket сервер

const start = async (req, res) => {
    try {
        await mongoose.connect(process.env.MONGO_URL).then(() => {
            console.log('========== ✅ DB CONNECTED! ==========');
        });
    } catch (err) {
        console.log('⛔️ Server error!', err.message);
        process.exit(1);
    }
};

app.post('/upload', uploadImage, handleImageUpload); // Завантаження зображень
app.post('/image/delete', checkAuth, deleteImage); // Видалення зображень

app.use(adminRoutes);
app.use(clientRoutes);

start();
