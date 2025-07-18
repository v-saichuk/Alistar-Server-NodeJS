import Cart from '../../models/Cart/Cart.js';

export const getAll = async (req, res) => {
    try {
        const cart = await Cart.find();
        // const productCounts = await Product.aggregate([{ $unwind: '$category' }, { $group: { _id: '$category', productCount: { $sum: 1 } } }]);

        // const productCountMap = Object.fromEntries(productCounts.map(({ _id, productCount }) => [_id, productCount]));

        res.json({ success: true, cart });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Не вдалось отримати товари з кошика!',
            err,
        });
    }
};

export const create = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        const category = new Cart(req.body);
        await category.save();

        res.json({
            category,
            success: true,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Виникла помилка при додавані товара в кошик!',
            err,
        });
    }
};
