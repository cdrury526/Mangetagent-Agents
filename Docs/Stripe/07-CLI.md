# Stripe CLI

The Stripe CLI provides tools for local development, testing, and managing your Stripe account from the command line.

## Installation

### macOS

```bash
brew install stripe/stripe-brew/stripe
```

### Linux

```bash
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
tar -xvf stripe_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### Windows

```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

### Docker

```bash
docker run --rm -it stripe/stripe-cli:latest
```

## Authentication

### Login

```bash
stripe login
```

This opens a browser to authenticate and saves your credentials.

### API Key

```bash
stripe login --api-key sk_test_...
```

### Project-Based Auth

```bash
stripe login --project-name my-project
```

## Core Commands

### Listen to Webhooks

```bash
# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/webhook

# Forward specific events
stripe listen \
  --events payment_intent.succeeded,customer.created \
  --forward-to localhost:3000/webhook

# Print events to console
stripe listen --print-json

# Save webhook secret
stripe listen --print-secret
```

### Trigger Events

```bash
# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed

# Trigger with custom data
stripe trigger payment_intent.succeeded \
  --override amount=5000

# See available events
stripe trigger --help
```

### Make API Requests

```bash
# List resources
stripe customers list
stripe products list
stripe prices list --limit 10

# Create resources
stripe customers create \
  --email customer@example.com \
  --name "Jenny Rosen"

# Retrieve resources
stripe customers retrieve cus_...
stripe payment_intents retrieve pi_...

# Update resources
stripe customers update cus_... \
  --name "Jane Rosen"

# Delete resources
stripe customers delete cus_...
```

## Specific Resources

### Customers

```bash
# List customers
stripe customers list --limit 5

# Create customer
stripe customers create \
  --email john@example.com \
  --name "John Doe" \
  --description "Premium customer"

# Search customers
stripe customers search \
  --query 'email:"example.com"'

# Update customer
stripe customers update cus_... \
  --metadata.plan=premium

# Delete customer
stripe customers delete cus_...
```

### Payment Intents

```bash
# Create payment intent
stripe payment_intents create \
  --amount 2000 \
  --currency usd \
  --automatic-payment-methods[enabled]=true

# Retrieve payment intent
stripe payment_intents retrieve pi_...

# Cancel payment intent
stripe payment_intents cancel pi_...

# Capture payment intent
stripe payment_intents capture pi_...
```

### Subscriptions

```bash
# Create subscription
stripe subscriptions create \
  --customer cus_... \
  --items[0][price]=price_...

# List subscriptions
stripe subscriptions list --customer cus_...

# Update subscription
stripe subscriptions update sub_... \
  --items[0][id]=si_... \
  --items[0][price]=price_new

# Cancel subscription
stripe subscriptions cancel sub_...
```

### Products & Prices

```bash
# Create product
stripe products create \
  --name "Premium Plan" \
  --description "Access to premium features"

# Create price
stripe prices create \
  --product prod_... \
  --unit-amount 1000 \
  --currency usd \
  --recurring[interval]=month

# List prices
stripe prices list --product prod_...
```

### Invoices

```bash
# List invoices
stripe invoices list --customer cus_...

# Retrieve invoice
stripe invoices retrieve in_...

# Finalize invoice
stripe invoices finalize in_...

# Pay invoice
stripe invoices pay in_...

# Void invoice
stripe invoices void in_...
```

## Local Webhook Testing

### Basic Setup

```bash
# Terminal 1: Start your server
npm start

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/webhook
```

### Get Webhook Secret

```bash
stripe listen --print-secret
```

Output:
```
> Ready! Your webhook signing secret is whsec_... (^C to quit)
```

Use this secret in your `.env` file:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Test Webhook Flow

```bash
# Terminal 1: Listen
stripe listen --forward-to localhost:3000/webhook

# Terminal 2: Trigger event
stripe trigger payment_intent.succeeded
```

## Logs

### View Logs

```bash
# Recent API requests
stripe logs tail

# Filter by status
stripe logs tail --filter-status-code-type 4xx
stripe logs tail --filter-status-code-type 5xx

# Filter by HTTP method
stripe logs tail --filter-http-method post

# Filter by resource
stripe logs tail --filter-resource payment_intent
```

## Samples

### Install Samples

```bash
# Clone sample
stripe samples create accept-a-payment
cd accept-a-payment

# Configure
stripe samples .config --sample-name accept-a-payment

# Run sample
npm install && npm start
```

### Available Samples

```bash
stripe samples list
```

## Fixtures

Create test data using fixtures:

```bash
# Create fixture file: fixtures.json
{
  "customers": [
    {
      "email": "test@example.com",
      "name": "Test Customer"
    }
  ],
  "products": [
    {
      "name": "Premium Plan",
      "prices": [
        {
          "unit_amount": 1000,
          "currency": "usd",
          "recurring": {
            "interval": "month"
          }
        }
      ]
    }
  ]
}

# Apply fixtures
stripe fixtures fixtures.json
```

## Configuration

### Multiple Accounts

```bash
# Add account
stripe login --account-name production

# Switch accounts
stripe config --set-account production

# List accounts
stripe config --list
```

### API Version

```bash
# Set API version
stripe config --set api_version 2024-11-20.acacia

# View current version
stripe config --get api_version
```

### Default Currency

```bash
stripe config --set default_currency eur
```

## Resource CRUD Operations

### Generic Format

```bash
# List
stripe <resource> list [options]

# Create
stripe <resource> create [--param value ...]

# Retrieve
stripe <resource> retrieve <id>

# Update
stripe <resource> update <id> [--param value ...]

# Delete
stripe <resource> delete <id>
```

## Advanced Filtering

### Query Syntax

```bash
# Date ranges
stripe charges list \
  --created[gte]=1640995200 \
  --created[lte]=1643673600

# Pagination
stripe customers list --limit 100 --starting-after cus_...

# Expansion
stripe payment_intents retrieve pi_... \
  --expand customer,payment_method

# Metadata filtering
stripe customers list \
  --metadata.plan=premium
```

## Output Formats

```bash
# JSON output
stripe customers list --format json

# Table format
stripe customers list --format table

# Get specific field
stripe customers retrieve cus_... | jq '.email'
```

## Working with JSON

```bash
# Pretty print
stripe customers retrieve cus_... | jq '.'

# Extract field
stripe customers retrieve cus_... | jq '.email'

# List emails
stripe customers list --limit 10 | \
  jq '.data[].email'

# Create from JSON file
cat customer.json | stripe customers create -
```

## Scripts & Automation

### Bash Script

```bash
#!/bin/bash

# Create customer and subscription
CUSTOMER=$(stripe customers create \
  --email "$EMAIL" \
  --name "$NAME" \
  | jq -r '.id')

stripe subscriptions create \
  --customer "$CUSTOMER" \
  --items[0][price]="$PRICE_ID"
```

### Bulk Operations

```bash
# Create multiple customers from CSV
while IFS=, read -r email name; do
  stripe customers create \
    --email "$email" \
    --name "$name"
done < customers.csv
```

## Environment Variables

```bash
# Set API key
export STRIPE_API_KEY=sk_test_...

# Set device name
export STRIPE_DEVICE_NAME=my-computer

# Disable color output
export NO_COLOR=1
```

## Useful Commands

### Check Account Balance

```bash
stripe balance retrieve
```

### List Recent Events

```bash
stripe events list --limit 10
```

### Get Webhook Endpoints

```bash
stripe webhook_endpoints list
```

### Test Cards

```bash
# List test card numbers
stripe test cards list
```

## Troubleshooting

### Debug Mode

```bash
stripe --verbose customers list
```

### Check Version

```bash
stripe version
```

### Update CLI

```bash
# macOS
brew upgrade stripe

# Manual
stripe update
```

## Common Workflows

### Setup New Project

```bash
# 1. Login
stripe login

# 2. Start webhook listener
stripe listen --forward-to localhost:3000/webhook

# 3. Get webhook secret
stripe listen --print-secret

# 4. Create test data
stripe customers create --email test@example.com
stripe products create --name "Test Product"
```

### Testing Payments

```bash
# 1. Create payment intent
PI=$(stripe payment_intents create \
  --amount 2000 \
  --currency usd \
  --automatic-payment-methods[enabled]=true \
  | jq -r '.id')

# 2. Confirm (in your app)
# 3. Verify
stripe payment_intents retrieve $PI
```

### Manage Subscriptions

```bash
# List active subscriptions
stripe subscriptions list \
  --status active \
  --limit 10

# Cancel subscription
stripe subscriptions cancel sub_...

# Update subscription
stripe subscriptions update sub_... \
  --items[0][price]=price_new
```

## References

- **CLI Docs**: https://stripe.com/docs/stripe-cli
- **GitHub**: https://github.com/stripe/stripe-cli
- **Command Reference**: https://stripe.com/docs/cli
- **Samples**: https://github.com/stripe-samples
