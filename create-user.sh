#!/bin/bash

# Define your AWS Region
REGION="us-east-1"

# User Pool ID for Click2Endpoint
USER_POOL_ID="us-east-1_4fNSSRaag"

echo "Creating user 'frank' in User Pool: $USER_POOL_ID"

# Delete user if exists
aws cognito-idp admin-delete-user \
    --user-pool-id $USER_POOL_ID \
    --username frank \
    --region $REGION \
    2>/dev/null || true

# Create user with temporary password
aws cognito-idp admin-create-user \
    --user-pool-id $USER_POOL_ID \
    --username frank \
    --temporary-password "TempPass123!" \
    --message-action SUPPRESS \
    --user-attributes Name=email,Value=frank@c2m.com Name=email_verified,Value=True \
    --region $REGION

# Set permanent password
aws cognito-idp admin-set-user-password \
    --user-pool-id $USER_POOL_ID \
    --username frank \
    --password "TempPass123!" \
    --permanent \
    --region $REGION

echo "User 'frank' created successfully with password: TempPass123!"
echo "You can now login at: https://d2dodhc21bvs3s.cloudfront.net"
