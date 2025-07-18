import fs from 'fs';

export const deleteImage = (req, res) => {
    const filename = req.body.path.split('/')[4];
    const filePath = `uploads/${filename}`;

    fs.unlink(filePath, (err) => {
        if (err) {
            res.json({
                success: false,
                message: 'Image not found!',
            });
        } else {
            res.json({
                success: true,
                message: 'Image deleted!',
            });
        }
    });
};
