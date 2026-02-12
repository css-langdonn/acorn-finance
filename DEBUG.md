# Debugging Guide

## Testing Webhooks

If webhook testing isn't working, check the browser console (F12) for errors.

### Common Issues:

1. **Webhook URL Invalid**
   - Check that the webhook URL starts with `https://discord.com/api/webhooks/`
   - Make sure the webhook hasn't been deleted from Discord

2. **CORS Errors**
   - Discord webhooks should work from browser, but check console for CORS errors
   - If you see CORS errors, the webhook URL might be incorrect

3. **Network Errors**
   - Check your internet connection
   - Check browser console for network errors

4. **Webhook Not Initialized**
   - Open browser console and type: `WebhookManager.webhooks`
   - Should show an array with at least one webhook
   - If empty, type: `WebhookManager.init()` then check again

### Manual Test

You can manually test a webhook in the browser console:

```javascript
// Get the webhook
const webhook = WebhookManager.webhooks[0];

// Test it
WebhookManager.testWebhook(webhook.id).then(result => {
    console.log('Test result:', result);
}).catch(error => {
    console.error('Test error:', error);
});
```

### Check Admin Panel

1. Open Admin Panel
2. Go to "Webhooks" section
3. Click "Test" button
4. Check browser console (F12) for any errors
5. Check Discord channel for the test message

### Verify Webhook URL

In browser console:
```javascript
console.log(WebhookManager.webhooks);
```

This will show all webhooks and their URLs.
