#!/bin/bash

# Cognito Test User Management Script
# Usage: ./manage-test-users.sh [create|delete|recreate]

USER_POOL_ID="us-east-1_OUxQ8LNIL"

# Test users configuration (username:email:password)
USERS=(
    "developer:developer@c2m.com:DevPassword123!"
    "frank:frank@c2m.com:FrankPassword123!"
    "tester:tester@c2m.com:TestPassword123!"
)

create_users() {
    echo "Creating test users in Cognito User Pool: $USER_POOL_ID"
    echo "=========================================="

    for user_config in "${USERS[@]}"; do
        IFS=':' read -r username email password <<< "$user_config"

        echo "Creating user: $username ($email)"

        aws cognito-idp admin-create-user \
            --user-pool-id "$USER_POOL_ID" \
            --username "$username" \
            --user-attributes Name=email,Value="$email" Name=email_verified,Value=true \
            --temporary-password "$password" \
            --message-action SUPPRESS \
            2>&1 > /dev/null

        if [ $? -eq 0 ]; then
            echo "✓ Created: $username"

            # Set permanent password (skip force change password on first login)
            aws cognito-idp admin-set-user-password \
                --user-pool-id "$USER_POOL_ID" \
                --username "$username" \
                --password "$password" \
                --permanent \
                2>&1 > /dev/null

            if [ $? -eq 0 ]; then
                echo "✓ Password set to permanent for: $username"
            fi
        else
            echo "✗ Failed to create: $username (may already exist)"
        fi
        echo ""
    done

    echo "=========================================="
    echo "User creation complete!"
}

delete_users() {
    echo "Deleting test users from Cognito User Pool: $USER_POOL_ID"
    echo "=========================================="

    for user_config in "${USERS[@]}"; do
        IFS=':' read -r username email password <<< "$user_config"

        echo "Deleting user: $username"

        aws cognito-idp admin-delete-user \
            --user-pool-id "$USER_POOL_ID" \
            --username "$username" \
            2>&1 > /dev/null

        if [ $? -eq 0 ]; then
            echo "✓ Deleted: $username"
        else
            echo "✗ Failed to delete (may not exist): $username"
        fi
    done

    echo "=========================================="
    echo "User deletion complete!"
}

list_users() {
    echo ""
    echo "Listing all users in Cognito User Pool: $USER_POOL_ID"
    echo "=========================================="

    aws cognito-idp list-users \
        --user-pool-id "$USER_POOL_ID" \
        --query 'Users[*].[Username,UserStatus,Attributes[?Name==`email`].Value|[0]]' \
        --output table
}

# Main script logic
case "${1:-help}" in
    create)
        create_users
        list_users
        ;;
    delete)
        delete_users
        list_users
        ;;
    recreate)
        delete_users
        echo ""
        create_users
        list_users
        ;;
    list)
        list_users
        ;;
    help|*)
        echo "Cognito Test User Management"
        echo "============================="
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  create    - Create all test users"
        echo "  delete    - Delete all test users"
        echo "  recreate  - Delete and recreate all test users"
        echo "  list      - List all users in the pool"
        echo "  help      - Show this help message"
        echo ""
        echo "Test Users:"
        for user_config in "${USERS[@]}"; do
            IFS=':' read -r username email password <<< "$user_config"
            echo "  - Username: $username | Email: $email | Password: $password"
        done
        ;;
esac
