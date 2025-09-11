# Chequemate Payment Integration

This repository contains a payment integration system for Chequemate using the Onit API. It includes Node.js scripts for testing deposits and withdrawals, and a PHP (Laravel) controller for handling API requests and webhooks.

## Prerequisites

- **Node.js** (v14 or higher) - For running the test scripts.
- **PHP** (v7.4 or higher) with **Laravel** - For the backend API.
- **Composer** - For PHP dependencies.
- **Git** - For cloning the repository.

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/erissatallan/chequemate-payment.git
   cd chequemate-payment
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Install PHP/Laravel dependencies:**
   ```bash
   composer install
   ```

4. **Set up environment variables:**
   - Copy the `.env` template (if available) or create one based on the scripts.
   - Fill in the required values:
     - `ONIT_HOST`: Onit API host (e.g., `api.onitmfbank.com`)
     - `ONIT_USER_ID` and `ONIT_PASSWORD`: Your Onit credentials.
     - `ONIT_BEARER`: Bearer token (obtain via `npm run auth`).
     - `ONIT_ACCOUNT`: Your Onit account number.
     - `ONIT_CALLBACK_URL`: URL for webhooks (e.g., your Laravel app's callback endpoint).
     - `ONIT_WEBHOOK_SECRET`: Secret for verifying webhooks.
     - Other transaction defaults like `AMOUNT`, `CHANNEL`, etc.

5. **Authenticate with Onit:**
   ```bash
   npm run auth
   ```
   This fetches a bearer token and updates `.env`.

## Usage

### Node.js Scripts

- **Authenticate:** `npm run auth` - Get a new bearer token.
Sample response:
```
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMDAzIiwiaWF0IjoxNzU3NTQwOTc2LCJleHAiOjE3NTc1NDQ1NzZ9.nY7qkKXhit73kaLH2Tc1fRGuThbVoeeleVFgB_zhNO4",
  "validity": 60,
  "expiry": "2025-09-11T01:49:36.988"
}
```
- **Deposit:** `npm run deposit` - Initiate a deposit and listen for the callback result.
Sample response:
```
Listening for deposit callback on http://localhost:3000/callback
Deposit request response: {
  "statusCode": "0001",
  "status": "Request accepted for processing"
}
```
- **Withdraw:** `npm run withdraw` - Initiate a withdrawal.
Sample response:
```
{
  "statusCode": "0001",
  "status": "Request accepted for processing"
}
```

Modify transaction details in `.env` or the script files as needed.

### PHP API

- The `paymentAPI.php` file contains a Laravel controller (`TransactionController`) with:
  - `deposit(Request $request)`: Handles deposit requests.
  - `callback(Request $request)`: Processes Onit webhooks with signature verification.

Integrate this into your Laravel routes (e.g., in `routes/api.php`):

```php
Route::post('/deposit', [TransactionController::class, 'deposit']);
Route::post('/callback', [TransactionController::class, 'callback']);
```

Ensure your Laravel app is configured with the Onit settings in `config/services.php` or via `.env`.

## Security Notes

- Never commit `.env` or any files containing sensitive information.
- The `.gitignore` is set up to ignore sensitive files.
- Regenerate tokens/passwords if they were previously exposed.
- Verify webhook signatures using the `ONIT_WEBHOOK_SECRET`.

## Additional Notes

- The `deposit.js` script includes a local callback listener for testing (listens on port 3000).
- For production, ensure the callback URL is publicly accessible.
- Refer to `Onit Integration.pdf` for detailed API specs.
- If issues arise, check logs in `storage/logs/` (Laravel) or console output (Node).

For more details, see the code comments or contact the maintainer.
