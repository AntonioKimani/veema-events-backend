const express = require('express');
const router = express.Router();
const mpesaService = require('../utils/mpesa');
const Order = require('../models/Order');

// ============================================
// INITIATE M-PESA STK PUSH
// ============================================
router.post('/stkpush', async (req, res) => {
    try {
        const { orderId, phone, amount } = req.body;
        
        if (!orderId || !phone || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        let orderReference = `VE-${orderId}`;
        
        const result = await mpesaService.stkPush(
            phone,
            amount,
            orderReference,
            `Payment for Order ${orderId}`
        );

        if (result.CheckoutRequestID) {
            // You can save this to your order in database
            console.log('CheckoutRequestID:', result.CheckoutRequestID);
        }

        res.json({
            success: true,
            message: 'STK Push sent successfully. Please check your phone and enter PIN.',
            CheckoutRequestID: result.CheckoutRequestID,
            MerchantRequestID: result.MerchantRequestID,
            ResponseCode: result.ResponseCode,
            ResponseDescription: result.ResponseDescription
        });

    } catch (error) {
        console.error('STK Push error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate payment',
            error: error.message
        });
    }
});

// ============================================
// M-PESA CALLBACK (Safaricom calls this)
// ============================================
router.post('/mpesa-callback', async (req, res) => {
    try {
        console.log('========== M-PESA CALLBACK RECEIVED ==========');
        console.log('Body:', JSON.stringify(req.body, null, 2));
        
        const { Body } = req.body;
        
        if (Body.stkCallback.ResultCode === 0) {
            // Payment successful
            const { 
                CheckoutRequestID, 
                Amount, 
                MpesaReceiptNumber, 
                PhoneNumber 
            } = Body.stkCallback;
            
            console.log('✅ Payment Successful!');
            console.log('Receipt:', MpesaReceiptNumber);
            console.log('Amount:', Amount);
            console.log('Phone:', PhoneNumber);
            
            // TODO: Update order status in database
            // You would need to map CheckoutRequestID to your order
            // await Order.updatePaymentStatusByCheckoutID(CheckoutRequestID, 'paid', MpesaReceiptNumber);
            
        } else {
            // Payment failed
            console.log('❌ Payment Failed:', Body.stkCallback.ResultDesc);
        }
        
        res.json({
            ResultCode: 0,
            ResultDesc: 'Success'
        });
        
    } catch (error) {
        console.error('Callback error:', error);
        res.json({
            ResultCode: 0,
            ResultDesc: 'Success'
        });
    }
});

// ============================================
// QUERY PAYMENT STATUS
// ============================================
router.get('/status/:checkoutRequestID', async (req, res) => {
    try {
        const { checkoutRequestID } = req.params;
        
        const result = await mpesaService.queryStatus(checkoutRequestID);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('Query status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to query status',
            error: error.message
        });
    }
});

module.exports = router;