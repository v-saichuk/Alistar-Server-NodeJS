import jwt from 'jsonwebtoken';

export default (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);

            req.userId = decoded._id;

            next();
        } catch (error) {
            return res.status(401).json({
                message: 'В доступі відмовленно',
            });
        }
    } else {
        return res.status(401).json({
            message: 'В доступі відмовленно',
        });
    }
};
