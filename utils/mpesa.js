const axios = require('axios');
const moment = require('moment');

class MpesaService {
    constructor() {
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        this.passkey = process.env.MPESA_PASSKEY;
        this.shortCode = process.env.MPESA_SHORTCODE;
        this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
        
        this.baseURL = this.environment === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    async getAccessToken() {
        const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
        
        try {
            const response = await axios.get(
                `${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`,
                {
                    headers: {
                        Authorization: `Basic ${auth}`
                    }
                }
            );
            return response.data.access_token;
        } catch (error) {
            console.error('Error getting access token:', error.response?.data || error.message);
            throw error;
        }
    }

    async stkPush(phone, amount, accountReference, transactionDesc) {
        try {
            const token = await this.getAccessToken();
            
            const formattedPhone = this.formatPhoneNumber(phone);
            
            const timestamp = moment().format('YYYYMMDDHHmmss');
            const password = Buffer.from(
                `${this.shortCode}${this.passkey}${timestamp}`
            ).toString('base64');

            const stkPushData = {
                BusinessShortCode: this.shortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: Math.round(amount),
                PartyA: formattedPhone,
                PartyB: this.shortCode,
                PhoneNumber: formattedPhone,
                CallBackURL: `${process.env.BACKEND_URL}/api/payments/mpesa-callback`,
                AccountReference: accountReference || 'Veema Events',
                TransactionDesc: transactionDesc || 'Payment for order'
            };

            console.log('STK Push Data:', stkPushData);

            const response = await axios.post(
                `${this.baseURL}/mpesa/stkpush/v1/processrequest`,
                stkPushData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('STK Push Error:', error.response?.data || error.message);
            throw error;
        }
    }

    async queryStatus(checkoutRequestID) {
        try {
            const token = await this.getAccessToken();
            
            const timestamp = moment().format('YYYYMMDDHHmmss');
            const password = Buffer.from(
                `${this.shortCode}${this.passkey}${timestamp}`
            ).toString('base64');

            const queryData = {
                BusinessShortCode: this.shortCode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestID
            };

            const response = await axios.post(
                `${this.baseURL}/mpesa/stkpushquery/v1/query`,
                queryData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Query Status Error:', error.response?.data || error.message);
            throw error;
        }
    }

    formatPhoneNumber(phone) {
        let cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.startsWith('0')) {
            cleaned = '254' + cleaned.substring(1);
        }
        else if (cleaned.startsWith('7')) {
            cleaned = '254' + cleaned;
        }
        else if (cleaned.startsWith('254')) {
            // Already correct
        }
        else if (phone.startsWith('+254')) {
            cleaned = '254' + phone.substring(4).replace(/\D/g, '');
        }
        
        return cleaned;
    }
}

module.exports = new MpesaService();