const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EVT-${year}${month}${day}-${random}`;
};

const formatPrice = (price) => {
    return `Ksh ${parseFloat(price).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPhone = (phone) => {
    const phoneRegex = /^(?:(?:\+254|0)[17]\d{8})$/;
    return phoneRegex.test(phone);
};

const getPagination = (page = 1, limit = 10) => {
    page = parseInt(page);
    limit = parseInt(limit);
    
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;
    
    const offset = (page - 1) * limit;
    return { limit, offset, page };
};

const formatPaginatedResponse = (data, total, page, limit) => {
    return {
        data,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    };
};

const calculateOrderTotal = (items) => {
    return items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
};

const sanitizeObject = (obj) => {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v != null)
    );
};

module.exports = {
    generateOrderNumber,
    formatPrice,
    isValidEmail,
    isValidPhone,
    getPagination,
    formatPaginatedResponse,
    calculateOrderTotal,
    sanitizeObject
};