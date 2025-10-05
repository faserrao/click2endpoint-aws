export interface ParameterField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'file' | 'array' | 'object' | 'oneOf';
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  fields?: ParameterField[]; // For nested objects
  oneOfOptions?: {
    label: string;
    value: string;
    fields: ParameterField[];
  }[]; // For oneOf types
}

export interface EndpointParameters {
  [endpoint: string]: ParameterField[];
}

export const parameterSchemas: EndpointParameters = {
  '/jobs/single-doc-job-template': [
    {
      name: 'jobTemplate',
      label: 'Job Template ID',
      type: 'text',
      required: true,
      placeholder: 'template_123',
      defaultValue: 'legal-contract-template',
      description: 'The ID of the saved job template to use'
    },
    {
      name: 'documentSourceIdentifier',
      label: 'Document Source',
      type: 'oneOf',
      required: true,
      description: 'Choose how to specify your document',
      oneOfOptions: [
        {
          label: 'Document ID (Previously Uploaded)',
          value: 'documentId',
          fields: [
            {
              name: 'documentId',
              label: 'Document ID',
              type: 'text',
              required: true,
              placeholder: 'doc_456',
              defaultValue: 'doc_sample_contract_001',
              description: 'ID of a document previously uploaded to the system'
            }
          ]
        },
        {
          label: 'External URL',
          value: 'externalUrl',
          fields: [
            {
              name: 'externalUrl',
              label: 'Document URL',
              type: 'text',
              required: true,
              placeholder: 'https://example.com/document.pdf',
              description: 'URL where the document can be downloaded'
            }
          ]
        },
        {
          label: 'Upload Request + Document Name',
          value: 'uploadRequestDocument',
          fields: [
            {
              name: 'uploadRequestId',
              label: 'Upload Request ID',
              type: 'text',
              required: true,
              placeholder: 'req_123',
              description: 'ID of the upload session'
            },
            {
              name: 'documentName',
              label: 'Document Name',
              type: 'text',
              required: true,
              placeholder: 'report.pdf',
              description: 'Name of the document in the upload session'
            }
          ]
        },
        {
          label: 'Upload Request + ZIP + Document',
          value: 'uploadRequestZipDocument',
          fields: [
            {
              name: 'uploadRequestId',
              label: 'Upload Request ID',
              type: 'text',
              required: true,
              placeholder: 'req_123',
              description: 'ID of the upload session'
            },
            {
              name: 'zipId',
              label: 'ZIP ID',
              type: 'text',
              required: true,
              placeholder: 'zip_456',
              description: 'ID of the ZIP file in the session'
            },
            {
              name: 'documentName',
              label: 'Document Name',
              type: 'text',
              required: true,
              placeholder: 'report.pdf',
              description: 'Name of the document inside the ZIP'
            }
          ]
        },
        {
          label: 'ZIP + Document Name',
          value: 'zipDocument',
          fields: [
            {
              name: 'zipId',
              label: 'ZIP ID',
              type: 'text',
              required: true,
              placeholder: 'zip_456',
              description: 'ID of an archived ZIP file'
            },
            {
              name: 'documentName',
              label: 'Document Name',
              type: 'text',
              required: true,
              placeholder: 'report.pdf',
              description: 'Name of the document inside the ZIP'
            }
          ]
        }
      ]
    },
    {
      name: 'recipientAddressSource',
      label: 'Recipients',
      type: 'array',
      required: true,
      description: 'Add one or more recipients using different methods',
      fields: [
        {
          name: '',
          label: 'Recipient',
          type: 'oneOf',
          required: true,
          oneOfOptions: [
            {
              label: 'New Address',
              value: 'recipientAddress',
              fields: [
                {
                  name: 'recipientAddress',
                  label: 'Address Details',
                  type: 'object',
                  required: true,
                  fields: [
                    {
                      name: 'firstName',
                      label: 'First Name',
                      type: 'text',
                      required: true,
                      placeholder: 'John'
                    },
                    {
                      name: 'lastName',
                      label: 'Last Name',
                      type: 'text',
                      required: true,
                      placeholder: 'Doe'
                    },
                    {
                      name: 'address1',
                      label: 'Street Address',
                      type: 'text',
                      required: true,
                      placeholder: '123 Main St'
                    },
                    {
                      name: 'city',
                      label: 'City',
                      type: 'text',
                      required: true,
                      placeholder: 'Anytown'
                    },
                    {
                      name: 'state',
                      label: 'State',
                      type: 'text',
                      required: true,
                      placeholder: 'NY',
                      validation: {
                        pattern: '^[A-Z]{2}$',
                        maxLength: 2
                      }
                    },
                    {
                      name: 'zip',
                      label: 'ZIP Code',
                      type: 'text',
                      required: true,
                      placeholder: '12345',
                      validation: {
                        pattern: '^\\d{5}(-\\d{4})?$'
                      }
                    },
                    {
                      name: 'country',
                      label: 'Country',
                      type: 'text',
                      required: true,
                      placeholder: 'USA',
                      defaultValue: 'USA'
                    },
                    {
                      name: 'nickName',
                      label: 'Nickname',
                      type: 'text',
                      required: false,
                      placeholder: 'Johnny',
                      description: 'Optional informal name'
                    },
                    {
                      name: 'address2',
                      label: 'Address Line 2',
                      type: 'text',
                      required: false,
                      placeholder: 'Apt 4B'
                    },
                    {
                      name: 'address3',
                      label: 'Address Line 3',
                      type: 'text',
                      required: false,
                      placeholder: 'Building C'
                    },
                    {
                      name: 'phoneNumber',
                      label: 'Phone Number',
                      type: 'text',
                      required: false,
                      placeholder: '(555) 123-4567'
                    }
                  ]
                }
              ]
            },
            {
              label: 'Address List ID',
              value: 'addressListId',
              fields: [
                {
                  name: 'addressListId',
                  label: 'List ID',
                  type: 'text',
                  required: true,
                  placeholder: 'list_789',
                  defaultValue: 'list_clients_q4_2024',
                  description: 'ID of a pre-uploaded address list'
                }
              ]
            },
            {
              label: 'Saved Address ID',
              value: 'addressId',
              fields: [
                {
                  name: 'addressId',
                  label: 'Address ID',
                  type: 'text',
                  required: true,
                  placeholder: 'addr_456',
                  description: 'ID of a saved address'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'paymentDetails',
      label: 'Payment Details',
      type: 'oneOf',
      required: true,
      description: 'Choose your payment method',
      oneOfOptions: [
        {
          label: 'Credit Card',
          value: 'creditCard',
          fields: [
            {
              name: 'CREDIT_CARD',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'CREDIT_CARD',
              placeholder: 'CREDIT_CARD'
            },
            {
              name: 'creditCardDetails',
              label: 'Card Information',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'cardType',
                  label: 'Card Type',
                  type: 'select',
                  required: true,
                  options: [
                    { value: 'visa', label: 'Visa' },
                    { value: 'mastercard', label: 'Mastercard' },
                    { value: 'discover', label: 'Discover' },
                    { value: 'americanExpress', label: 'American Express' }
                  ]
                },
                {
                  name: 'cardNumber',
                  label: 'Card Number',
                  type: 'text',
                  required: true,
                  placeholder: '4111111111111111',
                  defaultValue: '4111111111111111'
                },
                {
                  name: 'expirationDate',
                  label: 'Expiration',
                  type: 'object',
                  required: true,
                  fields: [
                    {
                      name: 'month',
                      label: 'Month',
                      type: 'number',
                      required: true,
                      placeholder: '12',
                      defaultValue: 12,
                      validation: {
                        min: 1,
                        max: 12
                      }
                    },
                    {
                      name: 'year',
                      label: 'Year',
                      type: 'number',
                      required: true,
                      placeholder: '2025',
                      defaultValue: 2025,
                      validation: {
                        min: 2024
                      }
                    }
                  ]
                },
                {
                  name: 'cvv',
                  label: 'CVV',
                  type: 'number',
                  required: true,
                  placeholder: '123',
                  defaultValue: 123
                }
              ]
            }
          ]
        },
        {
          label: 'Invoice',
          value: 'invoice',
          fields: [
            {
              name: 'INVOICE',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'INVOICE',
              placeholder: 'INVOICE'
            },
            {
              name: 'invoiceDetails',
              label: 'Invoice Information',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'invoiceNumber',
                  label: 'Invoice Number',
                  type: 'text',
                  required: true,
                  placeholder: 'INV-12345'
                },
                {
                  name: 'amountDue',
                  label: 'Amount Due',
                  type: 'number',
                  required: true,
                  placeholder: '100.00'
                }
              ]
            }
          ]
        },
        {
          label: 'ACH Transfer',
          value: 'ach',
          fields: [
            {
              name: 'ACH',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'ACH',
              placeholder: 'ACH'
            },
            {
              name: 'achDetails',
              label: 'ACH Information',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'routingNumber',
                  label: 'Routing Number',
                  type: 'text',
                  required: true,
                  placeholder: '123456789'
                },
                {
                  name: 'accountNumber',
                  label: 'Account Number',
                  type: 'text',
                  required: true,
                  placeholder: '1234567890'
                },
                {
                  name: 'checkDigit',
                  label: 'Check Digit',
                  type: 'number',
                  required: true,
                  placeholder: '1'
                }
              ]
            }
          ]
        },
        {
          label: 'User Credit',
          value: 'userCredit',
          fields: [
            {
              name: 'USER_CREDIT',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'USER_CREDIT',
              placeholder: 'USER_CREDIT'
            },
            {
              name: 'creditAmount',
              label: 'Credit Amount',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'amount',
                  label: 'Amount',
                  type: 'number',
                  required: true,
                  placeholder: '100.00'
                },
                {
                  name: 'currency',
                  label: 'Currency',
                  type: 'select',
                  required: true,
                  defaultValue: 'USD',
                  options: [
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'GBP', label: 'GBP' },
                    { value: 'CAD', label: 'CAD' },
                    { value: 'AUD', label: 'AUD' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],

  '/jobs/multi-docs-job-template': [
    {
      name: 'jobTemplate',
      label: 'Job Template ID',
      type: 'text',
      required: true,
      placeholder: 'template_123',
      defaultValue: 'legal-contract-template',
      description: 'The ID of the saved job template to use'
    },
    {
      name: 'items',
      label: 'Documents and Recipients',
      type: 'array',
      required: true,
      description: 'Each document paired with its recipient',
      fields: [
        {
          name: 'documentSourceIdentifier',
          label: 'Document Source',
          type: 'oneOf',
          required: true,
          oneOfOptions: [
            {
              label: 'Document ID',
              value: 'documentId',
              fields: [
                {
                  name: 'documentId',
                  label: 'Document ID',
                  type: 'text',
                  required: true,
                  placeholder: 'doc_456'
                }
              ]
            },
            {
              label: 'External URL',
              value: 'externalUrl',
              fields: [
                {
                  name: 'externalUrl',
                  label: 'Document URL',
                  type: 'text',
                  required: true,
                  placeholder: 'https://example.com/doc.pdf'
                }
              ]
            }
          ]
        },
        {
          name: 'recipientAddressSource',
          label: 'Recipient',
          type: 'object',
          required: true,
          fields: [
            {
              name: 'recipientAddress',
              label: 'Address',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'name',
                  label: 'Name',
                  type: 'text',
                  required: true,
                  placeholder: 'John Doe'
                },
                {
                  name: 'address',
                  label: 'Street',
                  type: 'text',
                  required: true,
                  placeholder: '123 Main St'
                },
                {
                  name: 'city',
                  label: 'City',
                  type: 'text',
                  required: true,
                  placeholder: 'Anytown'
                },
                {
                  name: 'state',
                  label: 'State',
                  type: 'text',
                  required: true,
                  placeholder: 'NY',
                  validation: {
                    pattern: '^[A-Z]{2}$',
                    maxLength: 2
                  }
                },
                {
                  name: 'zip',
                  label: 'ZIP',
                  type: 'text',
                  required: true,
                  placeholder: '12345',
                  validation: {
                    pattern: '^\\d{5}(-\\d{4})?$'
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'paymentDetails',
      label: 'Payment Details',
      type: 'oneOf',
      required: true,
      description: 'Choose your payment method',
      oneOfOptions: [
        {
          label: 'Credit Card',
          value: 'creditCard',
          fields: [
            {
              name: 'CREDIT_CARD',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'CREDIT_CARD',
              placeholder: 'CREDIT_CARD'
            },
            {
              name: 'creditCardDetails',
              label: 'Card Information',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'cardType',
                  label: 'Card Type',
                  type: 'select',
                  required: true,
                  options: [
                    { value: 'visa', label: 'Visa' },
                    { value: 'mastercard', label: 'Mastercard' },
                    { value: 'discover', label: 'Discover' },
                    { value: 'americanExpress', label: 'American Express' }
                  ]
                },
                {
                  name: 'cardNumber',
                  label: 'Card Number',
                  type: 'text',
                  required: true,
                  placeholder: '4111111111111111',
                  defaultValue: '4111111111111111'
                },
                {
                  name: 'expirationDate',
                  label: 'Expiration',
                  type: 'object',
                  required: true,
                  fields: [
                    {
                      name: 'month',
                      label: 'Month',
                      type: 'number',
                      required: true,
                      placeholder: '12',
                      defaultValue: 12,
                      validation: {
                        min: 1,
                        max: 12
                      }
                    },
                    {
                      name: 'year',
                      label: 'Year',
                      type: 'number',
                      required: true,
                      placeholder: '2025',
                      defaultValue: 2025,
                      validation: {
                        min: 2024
                      }
                    }
                  ]
                },
                {
                  name: 'cvv',
                  label: 'CVV',
                  type: 'number',
                  required: true,
                  placeholder: '123',
                  defaultValue: 123
                }
              ]
            }
          ]
        },
        {
          label: 'Invoice',
          value: 'invoice',
          fields: [
            {
              name: 'INVOICE',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'INVOICE',
              placeholder: 'INVOICE'
            },
            {
              name: 'invoiceDetails',
              label: 'Invoice Information',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'invoiceNumber',
                  label: 'Invoice Number',
                  type: 'text',
                  required: true,
                  placeholder: 'INV-12345'
                },
                {
                  name: 'amountDue',
                  label: 'Amount Due',
                  type: 'number',
                  required: true,
                  placeholder: '100.00'
                }
              ]
            }
          ]
        },
        {
          label: 'ACH Transfer',
          value: 'ach',
          fields: [
            {
              name: 'ACH',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'ACH',
              placeholder: 'ACH'
            },
            {
              name: 'achDetails',
              label: 'ACH Information',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'routingNumber',
                  label: 'Routing Number',
                  type: 'text',
                  required: true,
                  placeholder: '123456789'
                },
                {
                  name: 'accountNumber',
                  label: 'Account Number',
                  type: 'text',
                  required: true,
                  placeholder: '1234567890'
                },
                {
                  name: 'checkDigit',
                  label: 'Check Digit',
                  type: 'number',
                  required: true,
                  placeholder: '1'
                }
              ]
            }
          ]
        },
        {
          label: 'User Credit',
          value: 'userCredit',
          fields: [
            {
              name: 'USER_CREDIT',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'USER_CREDIT',
              placeholder: 'USER_CREDIT'
            },
            {
              name: 'creditAmount',
              label: 'Credit Amount',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'amount',
                  label: 'Amount',
                  type: 'number',
                  required: true,
                  placeholder: '100.00'
                },
                {
                  name: 'currency',
                  label: 'Currency',
                  type: 'select',
                  required: true,
                  defaultValue: 'USD',
                  options: [
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'GBP', label: 'GBP' },
                    { value: 'CAD', label: 'CAD' },
                    { value: 'AUD', label: 'AUD' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'tags',
      label: 'Tags',
      type: 'array',
      required: false,
      description: 'Optional metadata tags for analytics or categorization',
      fields: [
        {
          name: '',
          label: 'Tag',
          type: 'text',
          required: true,
          placeholder: 'campaign-2024'
        }
      ]
    }
  ],

  '/jobs/single-doc': [
    {
      name: 'documentSourceIdentifier',
      label: 'Document Source',
      type: 'oneOf',
      required: true,
      description: 'Choose how to specify your document',
      oneOfOptions: [
        {
          label: 'Document ID (Previously Uploaded)',
          value: 'documentId',
          fields: [
            {
              name: 'documentId',
              label: 'Document ID',
              type: 'text',
              required: true,
              placeholder: 'doc_456',
              defaultValue: 'doc_sample_contract_001',
              description: 'ID of a document previously uploaded to the system'
            }
          ]
        },
        {
          label: 'External URL',
          value: 'externalUrl',
          fields: [
            {
              name: 'externalUrl',
              label: 'Document URL',
              type: 'text',
              required: true,
              placeholder: 'https://example.com/document.pdf',
              description: 'URL where the document can be downloaded'
            }
          ]
        },
        {
          label: 'Upload Request + Document Name',
          value: 'uploadRequestDocument',
          fields: [
            {
              name: 'uploadRequestId',
              label: 'Upload Request ID',
              type: 'text',
              required: true,
              placeholder: 'req_123',
              description: 'ID of the upload session'
            },
            {
              name: 'documentName',
              label: 'Document Name',
              type: 'text',
              required: true,
              placeholder: 'report.pdf',
              description: 'Name of the document in the upload session'
            }
          ]
        },
        {
          label: 'Upload Request + ZIP + Document',
          value: 'uploadRequestZipDocument',
          fields: [
            {
              name: 'uploadRequestId',
              label: 'Upload Request ID',
              type: 'text',
              required: true,
              placeholder: 'req_123',
              description: 'ID of the upload session'
            },
            {
              name: 'zipId',
              label: 'ZIP ID',
              type: 'text',
              required: true,
              placeholder: 'zip_456',
              description: 'ID of the ZIP file in the session'
            },
            {
              name: 'documentName',
              label: 'Document Name',
              type: 'text',
              required: true,
              placeholder: 'report.pdf',
              description: 'Name of the document inside the ZIP'
            }
          ]
        },
        {
          label: 'ZIP + Document Name',
          value: 'zipDocument',
          fields: [
            {
              name: 'zipId',
              label: 'ZIP ID',
              type: 'text',
              required: true,
              placeholder: 'zip_456',
              description: 'ID of an archived ZIP file'
            },
            {
              name: 'documentName',
              label: 'Document Name',
              type: 'text',
              required: true,
              placeholder: 'report.pdf',
              description: 'Name of the document inside the ZIP'
            }
          ]
        }
      ]
    },
    {
      name: 'recipientAddressSource',
      label: 'Recipients',
      type: 'array',
      required: true,
      description: 'Add one or more recipients using different methods',
      fields: [
        {
          name: '',
          label: 'Recipient',
          type: 'oneOf',
          required: true,
          oneOfOptions: [
            {
              label: 'New Address',
              value: 'recipientAddress',
              fields: [
                {
                  name: 'recipientAddress',
                  label: 'Address Details',
                  type: 'object',
                  required: true,
                  fields: [
                    {
                      name: 'firstName',
                      label: 'First Name',
                      type: 'text',
                      required: true,
                      placeholder: 'John'
                    },
                    {
                      name: 'lastName',
                      label: 'Last Name',
                      type: 'text',
                      required: true,
                      placeholder: 'Doe'
                    },
                    {
                      name: 'address1',
                      label: 'Street Address',
                      type: 'text',
                      required: true,
                      placeholder: '123 Main St'
                    },
                    {
                      name: 'city',
                      label: 'City',
                      type: 'text',
                      required: true,
                      placeholder: 'Anytown'
                    },
                    {
                      name: 'state',
                      label: 'State',
                      type: 'text',
                      required: true,
                      placeholder: 'NY',
                      validation: {
                        pattern: '^[A-Z]{2}$',
                        maxLength: 2
                      }
                    },
                    {
                      name: 'zip',
                      label: 'ZIP Code',
                      type: 'text',
                      required: true,
                      placeholder: '12345',
                      validation: {
                        pattern: '^\\d{5}(-\\d{4})?$'
                      }
                    },
                    {
                      name: 'country',
                      label: 'Country',
                      type: 'text',
                      required: true,
                      placeholder: 'USA',
                      defaultValue: 'USA'
                    },
                    {
                      name: 'nickName',
                      label: 'Nickname',
                      type: 'text',
                      required: false,
                      placeholder: 'Johnny',
                      description: 'Optional informal name'
                    },
                    {
                      name: 'address2',
                      label: 'Address Line 2',
                      type: 'text',
                      required: false,
                      placeholder: 'Apt 4B'
                    },
                    {
                      name: 'address3',
                      label: 'Address Line 3',
                      type: 'text',
                      required: false,
                      placeholder: 'Building C'
                    },
                    {
                      name: 'phoneNumber',
                      label: 'Phone Number',
                      type: 'text',
                      required: false,
                      placeholder: '(555) 123-4567'
                    }
                  ]
                }
              ]
            },
            {
              label: 'Address List ID',
              value: 'addressListId',
              fields: [
                {
                  name: 'addressListId',
                  label: 'List ID',
                  type: 'text',
                  required: true,
                  placeholder: 'list_789',
                  defaultValue: 'list_clients_q4_2024',
                  description: 'ID of a pre-uploaded address list'
                }
              ]
            },
            {
              label: 'Saved Address ID',
              value: 'addressId',
              fields: [
                {
                  name: 'addressId',
                  label: 'Address ID',
                  type: 'text',
                  required: true,
                  placeholder: 'addr_456',
                  description: 'ID of a saved address'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'jobOptions',
      label: 'Job Options',
      type: 'object',
      required: true,
      fields: [
        {
          name: 'documentClass',
          label: 'Document Class',
          type: 'select',
          required: true,
          options: [
            { value: 'businessLetter', label: 'Business Letter' },
            { value: 'personalLetter', label: 'Personal Letter' }
          ],
          defaultValue: 'businessLetter'
        },
        {
          name: 'layout',
          label: 'Layout',
          type: 'select',
          required: true,
          options: [
            { value: 'portrait', label: 'Portrait' },
            { value: 'landscape', label: 'Landscape' }
          ],
          defaultValue: 'portrait'
        },
        {
          name: 'mailclass',
          label: 'Mail Class',
          type: 'select',
          required: true,
          options: [
            { value: 'firstClassMail', label: 'First Class Mail' },
            { value: 'priorityMail', label: 'Priority Mail' },
            { value: 'largeEnvelope', label: 'Large Envelope' }
          ],
          defaultValue: 'firstClassMail'
        },
        {
          name: 'paperType',
          label: 'Paper Type',
          type: 'select',
          required: true,
          options: [
            { value: 'letter', label: 'Letter (8.5" x 11")' },
            { value: 'legal', label: 'Legal (8.5" x 14")' },
            { value: 'postcard', label: 'Postcard' }
          ],
          defaultValue: 'letter'
        },
        {
          name: 'printOption',
          label: 'Print Option',
          type: 'select',
          required: true,
          options: [
            { value: 'none', label: 'None' },
            { value: 'color', label: 'Full Color' },
            { value: 'grayscale', label: 'Grayscale' }
          ],
          defaultValue: 'grayscale'
        },
        {
          name: 'envelope',
          label: 'Envelope',
          type: 'select',
          required: true,
          options: [
            { value: 'flat', label: 'Flat' },
            { value: 'windowedFlat', label: 'Windowed Flat' },
            { value: 'letter', label: 'Letter' },
            { value: 'legal', label: 'Legal' },
            { value: 'postcard', label: 'Postcard' }
          ],
          defaultValue: 'flat'
        }
      ]
    },
    {
      name: 'paymentDetails',
      label: 'Payment Details',
      type: 'oneOf',
      required: true,
      description: 'Choose your payment method',
      oneOfOptions: [
        {
          label: 'Credit Card',
          value: 'creditCard',
          fields: [
            {
              name: 'CREDIT_CARD',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'CREDIT_CARD',
              placeholder: 'CREDIT_CARD'
            },
            {
              name: 'creditCardDetails',
              label: 'Card Information',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'cardType',
                  label: 'Card Type',
                  type: 'select',
                  required: true,
                  options: [
                    { value: 'visa', label: 'Visa' },
                    { value: 'mastercard', label: 'Mastercard' },
                    { value: 'discover', label: 'Discover' },
                    { value: 'americanExpress', label: 'American Express' }
                  ]
                },
                {
                  name: 'cardNumber',
                  label: 'Card Number',
                  type: 'text',
                  required: true,
                  placeholder: '4111111111111111',
                  defaultValue: '4111111111111111'
                },
                {
                  name: 'expirationDate',
                  label: 'Expiration',
                  type: 'object',
                  required: true,
                  fields: [
                    {
                      name: 'month',
                      label: 'Month',
                      type: 'number',
                      required: true,
                      placeholder: '12',
                      defaultValue: 12,
                      validation: {
                        min: 1,
                        max: 12
                      }
                    },
                    {
                      name: 'year',
                      label: 'Year',
                      type: 'number',
                      required: true,
                      placeholder: '2025',
                      defaultValue: 2025,
                      validation: {
                        min: 2024
                      }
                    }
                  ]
                },
                {
                  name: 'cvv',
                  label: 'CVV',
                  type: 'number',
                  required: true,
                  placeholder: '123',
                  defaultValue: 123
                }
              ]
            }
          ]
        },
        {
          label: 'Invoice',
          value: 'invoice',
          fields: [
            {
              name: 'INVOICE',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'INVOICE',
              placeholder: 'INVOICE'
            },
            {
              name: 'invoiceDetails',
              label: 'Invoice Information',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'invoiceNumber',
                  label: 'Invoice Number',
                  type: 'text',
                  required: true,
                  placeholder: 'INV-12345'
                },
                {
                  name: 'amountDue',
                  label: 'Amount Due',
                  type: 'number',
                  required: true,
                  placeholder: '100.00'
                }
              ]
            }
          ]
        },
        {
          label: 'ACH Transfer',
          value: 'ach',
          fields: [
            {
              name: 'ACH',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'ACH',
              placeholder: 'ACH'
            },
            {
              name: 'achDetails',
              label: 'ACH Information',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'routingNumber',
                  label: 'Routing Number',
                  type: 'text',
                  required: true,
                  placeholder: '123456789'
                },
                {
                  name: 'accountNumber',
                  label: 'Account Number',
                  type: 'text',
                  required: true,
                  placeholder: '1234567890'
                },
                {
                  name: 'checkDigit',
                  label: 'Check Digit',
                  type: 'number',
                  required: true,
                  placeholder: '1'
                }
              ]
            }
          ]
        },
        {
          label: 'User Credit',
          value: 'userCredit',
          fields: [
            {
              name: 'USER_CREDIT',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'USER_CREDIT',
              placeholder: 'USER_CREDIT'
            },
            {
              name: 'creditAmount',
              label: 'Credit Amount',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'amount',
                  label: 'Amount',
                  type: 'number',
                  required: true,
                  placeholder: '100.00'
                },
                {
                  name: 'currency',
                  label: 'Currency',
                  type: 'select',
                  required: true,
                  defaultValue: 'USD',
                  options: [
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'GBP', label: 'GBP' },
                    { value: 'CAD', label: 'CAD' },
                    { value: 'AUD', label: 'AUD' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],

  '/jobs/multi-doc': [
    {
      name: 'items',
      label: 'Documents and Recipients',
      type: 'array',
      required: true,
      description: 'Each document paired with its recipient',
      fields: [
        {
          name: 'documentSourceIdentifier',
          label: 'Document Source',
          type: 'oneOf',
          required: true,
          oneOfOptions: [
            {
              label: 'Document ID',
              value: 'documentId',
              fields: [
                {
                  name: 'documentId',
                  label: 'Document ID',
                  type: 'text',
                  required: true,
                  placeholder: 'doc_456'
                }
              ]
            },
            {
              label: 'External URL',
              value: 'externalUrl',
              fields: [
                {
                  name: 'externalUrl',
                  label: 'Document URL',
                  type: 'text',
                  required: true,
                  placeholder: 'https://example.com/doc.pdf'
                }
              ]
            }
          ]
        },
        {
          name: 'recipientAddressSource',
          label: 'Recipient',
          type: 'object',
          required: true,
          fields: [
            {
              name: 'recipientAddress',
              label: 'Address',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'name',
                  label: 'Name',
                  type: 'text',
                  required: true,
                  placeholder: 'John Doe'
                },
                {
                  name: 'address',
                  label: 'Street',
                  type: 'text',
                  required: true,
                  placeholder: '123 Main St'
                },
                {
                  name: 'city',
                  label: 'City',
                  type: 'text',
                  required: true,
                  placeholder: 'Anytown'
                },
                {
                  name: 'state',
                  label: 'State',
                  type: 'text',
                  required: true,
                  placeholder: 'NY',
                  validation: {
                    pattern: '^[A-Z]{2}$',
                    maxLength: 2
                  }
                },
                {
                  name: 'zip',
                  label: 'ZIP',
                  type: 'text',
                  required: true,
                  placeholder: '12345',
                  validation: {
                    pattern: '^\\d{5}(-\\d{4})?$'
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'jobOptions',
      label: 'Job Options',
      type: 'object',
      required: true,
      fields: [
        {
          name: 'documentClass',
          label: 'Document Class',
          type: 'select',
          required: true,
          options: [
            { value: 'businessLetter', label: 'Business Letter' },
            { value: 'personalLetter', label: 'Personal Letter' }
          ],
          defaultValue: 'businessLetter'
        },
        {
          name: 'layout',
          label: 'Layout',
          type: 'select',
          required: true,
          options: [
            { value: 'portrait', label: 'Portrait' },
            { value: 'landscape', label: 'Landscape' }
          ],
          defaultValue: 'portrait'
        },
        {
          name: 'mailclass',
          label: 'Mail Class',
          type: 'select',
          required: true,
          options: [
            { value: 'firstClassMail', label: 'First Class Mail' },
            { value: 'priorityMail', label: 'Priority Mail' },
            { value: 'largeEnvelope', label: 'Large Envelope' }
          ],
          defaultValue: 'firstClassMail'
        },
        {
          name: 'paperType',
          label: 'Paper Type',
          type: 'select',
          required: true,
          options: [
            { value: 'letter', label: 'Letter (8.5" x 11")' },
            { value: 'legal', label: 'Legal (8.5" x 14")' },
            { value: 'postcard', label: 'Postcard' }
          ],
          defaultValue: 'letter'
        },
        {
          name: 'printOption',
          label: 'Print Option',
          type: 'select',
          required: true,
          options: [
            { value: 'none', label: 'None' },
            { value: 'color', label: 'Full Color' },
            { value: 'grayscale', label: 'Grayscale' }
          ],
          defaultValue: 'grayscale'
        },
        {
          name: 'envelope',
          label: 'Envelope',
          type: 'select',
          required: true,
          options: [
            { value: 'flat', label: 'Flat' },
            { value: 'windowedFlat', label: 'Windowed Flat' },
            { value: 'letter', label: 'Letter' },
            { value: 'legal', label: 'Legal' },
            { value: 'postcard', label: 'Postcard' }
          ],
          defaultValue: 'flat'
        }
      ]
    },
    {
      name: 'paymentDetails',
      label: 'Payment Details',
      type: 'oneOf',
      required: true,
      description: 'Choose your payment method',
      oneOfOptions: [
        {
          label: 'Credit Card',
          value: 'creditCard',
          fields: [
            {
              name: 'CREDIT_CARD',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'CREDIT_CARD',
              placeholder: 'CREDIT_CARD'
            },
            {
              name: 'creditCardDetails',
              label: 'Card Information',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'cardType',
                  label: 'Card Type',
                  type: 'select',
                  required: true,
                  options: [
                    { value: 'visa', label: 'Visa' },
                    { value: 'mastercard', label: 'Mastercard' },
                    { value: 'discover', label: 'Discover' },
                    { value: 'americanExpress', label: 'American Express' }
                  ]
                },
                {
                  name: 'cardNumber',
                  label: 'Card Number',
                  type: 'text',
                  required: true,
                  placeholder: '4111111111111111',
                  defaultValue: '4111111111111111'
                },
                {
                  name: 'expirationDate',
                  label: 'Expiration',
                  type: 'object',
                  required: true,
                  fields: [
                    {
                      name: 'month',
                      label: 'Month',
                      type: 'number',
                      required: true,
                      placeholder: '12',
                      defaultValue: 12,
                      validation: {
                        min: 1,
                        max: 12
                      }
                    },
                    {
                      name: 'year',
                      label: 'Year',
                      type: 'number',
                      required: true,
                      placeholder: '2025',
                      defaultValue: 2025,
                      validation: {
                        min: 2024
                      }
                    }
                  ]
                },
                {
                  name: 'cvv',
                  label: 'CVV',
                  type: 'number',
                  required: true,
                  placeholder: '123',
                  defaultValue: 123
                }
              ]
            }
          ]
        },
        {
          label: 'Invoice',
          value: 'invoice',
          fields: [
            {
              name: 'INVOICE',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'INVOICE',
              placeholder: 'INVOICE'
            },
            {
              name: 'invoiceDetails',
              label: 'Invoice Information',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'invoiceNumber',
                  label: 'Invoice Number',
                  type: 'text',
                  required: true,
                  placeholder: 'INV-12345'
                },
                {
                  name: 'amountDue',
                  label: 'Amount Due',
                  type: 'number',
                  required: true,
                  placeholder: '100.00'
                }
              ]
            }
          ]
        },
        {
          label: 'ACH Transfer',
          value: 'ach',
          fields: [
            {
              name: 'ACH',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'ACH',
              placeholder: 'ACH'
            },
            {
              name: 'achDetails',
              label: 'ACH Information',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'routingNumber',
                  label: 'Routing Number',
                  type: 'text',
                  required: true,
                  placeholder: '123456789'
                },
                {
                  name: 'accountNumber',
                  label: 'Account Number',
                  type: 'text',
                  required: true,
                  placeholder: '1234567890'
                },
                {
                  name: 'checkDigit',
                  label: 'Check Digit',
                  type: 'number',
                  required: true,
                  placeholder: '1'
                }
              ]
            }
          ]
        },
        {
          label: 'User Credit',
          value: 'userCredit',
          fields: [
            {
              name: 'USER_CREDIT',
              label: 'Payment Type',
              type: 'text',
              required: true,
              defaultValue: 'USER_CREDIT',
              placeholder: 'USER_CREDIT'
            },
            {
              name: 'creditAmount',
              label: 'Credit Amount',
              type: 'object',
              required: true,
              fields: [
                {
                  name: 'amount',
                  label: 'Amount',
                  type: 'number',
                  required: true,
                  placeholder: '100.00'
                },
                {
                  name: 'currency',
                  label: 'Currency',
                  type: 'select',
                  required: true,
                  defaultValue: 'USD',
                  options: [
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'GBP', label: 'GBP' },
                    { value: 'CAD', label: 'CAD' },
                    { value: 'AUD', label: 'AUD' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],

  // Simplified schemas for remaining endpoints
  '/jobs/multi-doc-merge-job-template': [
    {
      name: 'jobTemplate',
      label: 'Job Template ID',
      type: 'text',
      required: true,
      placeholder: 'template_123',
      defaultValue: 'legal-contract-template',
      description: 'The ID of the saved job template to use'
    },
    {
      name: 'documentsToMerge',
      label: 'Documents to Merge',
      type: 'array',
      required: true,
      description: 'Documents will be merged in the order listed',
      fields: [
        {
          name: 'documentSourceIdentifier',
          label: 'Document',
          type: 'oneOf',
          required: true,
          oneOfOptions: [
            {
              label: 'Document ID',
              value: 'documentId',
              fields: [
                {
                  name: 'documentId',
                  label: 'Document ID',
                  type: 'text',
                  required: true,
                  placeholder: 'doc_456'
                }
              ]
            },
            {
              label: 'External URL',
              value: 'externalUrl',
              fields: [
                {
                  name: 'externalUrl',
                  label: 'Document URL',
                  type: 'text',
                  required: true,
                  placeholder: 'https://example.com/doc.pdf'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'recipientAddressSource',
      label: 'Recipient',
      type: 'object',
      required: true,
      fields: [
        {
          name: 'recipientAddress',
          label: 'Address',
          type: 'object',
          required: true,
          fields: [
            {
              name: 'name',
              label: 'Name',
              type: 'text',
              required: true,
              placeholder: 'John Doe'
            },
            {
              name: 'address',
              label: 'Street',
              type: 'text',
              required: true,
              placeholder: '123 Main St'
            },
            {
              name: 'city',
              label: 'City',
              type: 'text',
              required: true,
              placeholder: 'Anytown'
            },
            {
              name: 'state',
              label: 'State',
              type: 'text',
              required: true,
              placeholder: 'NY',
              validation: {
                pattern: '^[A-Z]{2}$',
                maxLength: 2
              }
            },
            {
              name: 'zip',
              label: 'ZIP',
              type: 'text',
              required: true,
              placeholder: '12345',
              validation: {
                pattern: '^\\d{5}(-\\d{4})?$'
              }
            }
          ]
        }
      ]
    }
  ],

  '/jobs/multi-doc-merge': [],
  '/jobs/single-pdf-split': [],
  '/jobs/single-pdf-split-addressCapture': [],
  '/job-template/{id}/submit': [],
  '/no-match': []
};