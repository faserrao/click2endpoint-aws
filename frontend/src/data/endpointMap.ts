export interface EndpointInfo {
  path: string;
  description: string;
  method: 'POST' | 'GET';
  parameters: string[];
  jwtExample: string;
  payloadExample: any;
}

export interface EndpointMap {
  [key: string]: EndpointInfo;
}

const endpointMap: EndpointMap = {
  // Use Case 1: Single document with template
  '/jobs/single-doc-job-template': {
    path: '/jobs/single-doc-job-template',
    description: 'Submit a single document job using a saved job template',
    method: 'POST',
    parameters: ['jobTemplateId', 'document', 'recipients'],
    jwtExample: `curl -X POST https://api.c2m.com/v2/jobs/single-doc-job-template \\
  -H 'Authorization: Bearer <token>' \\
  -H 'Content-Type: application/json' \\
  -d '{"jobTemplateId": "template_123", "document": {...}}'`,
    payloadExample: {
      jobTemplateId: 'template_123',
      document: {
        documentId: 'doc_456'
      },
      recipients: [
        {
          name: 'John Doe',
          address: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345'
        }
      ]
    }
  },
  
  // Use Case 2: Multiple documents with template
  '/jobs/multi-docs-job-template': {
    path: '/jobs/multi-docs-job-template',
    description: 'Submit multiple documents using a saved job template',
    method: 'POST',
    parameters: ['jobTemplateId', 'documents', 'recipients'],
    jwtExample: `curl -X POST https://api.c2m.com/v2/jobs/multi-docs-job-template \\
  -H 'Authorization: Bearer <token>' \\
  -H 'Content-Type: application/json' \\
  -d '{"jobTemplateId": "template_123", "documents": [...]}'`,
    payloadExample: {
      jobTemplateId: 'template_123',
      documents: [
        { documentId: 'doc_456' },
        { documentId: 'doc_789' }
      ],
      recipients: [
        {
          name: 'Jane Smith',
          address: '456 Oak Ave',
          city: 'Somewhere',
          state: 'CA',
          zip: '98765'
        }
      ]
    }
  },
  
  // Use Case 3: Merge multiple documents with template
  '/jobs/multi-doc-merge-job-template': {
    path: '/jobs/multi-doc-merge-job-template',
    description: 'Merge multiple documents into one mailing using a saved template',
    method: 'POST',
    parameters: ['jobTemplateId', 'documents', 'recipients'],
    jwtExample: `curl -X POST https://api.c2m.com/v2/jobs/multi-doc-merge-job-template \\
  -H 'Authorization: Bearer <token>' \\
  -H 'Content-Type: application/json' \\
  -d '{"jobTemplateId": "template_123", "documents": [...]}'`,
    payloadExample: {
      jobTemplateId: 'template_123',
      documents: [
        { documentUrl: 'https://example.com/cover.pdf' },
        { documentUrl: 'https://example.com/report.pdf' }
      ],
      recipients: [
        {
          addressListId: 'list_789'
        }
      ]
    }
  },
  
  // Use Case 4: Single document without template
  '/jobs/single-doc': {
    path: '/jobs/single-doc',
    description: 'Submit a single document job with manual configuration',
    method: 'POST',
    parameters: ['document', 'recipients', 'jobOptions'],
    jwtExample: `curl -X POST https://api.c2m.com/v2/jobs/single-doc \\
  -H 'Authorization: Bearer <token>' \\
  -H 'Content-Type: application/json' \\
  -d '{"document": {...}, "recipients": [...], "jobOptions": {...}}'`,
    payloadExample: {
      document: {
        uploadRequestId: 'upload_123',
        documentName: 'invoice.pdf'
      },
      recipients: [
        {
          name: 'Bob Johnson',
          address: '789 Pine St',
          city: 'Elsewhere',
          state: 'TX',
          zip: '54321'
        }
      ],
      jobOptions: {
        paperType: 'STANDARD',
        printColor: true,
        printBothSides: false,
        mailClass: 'FIRST_CLASS'
      }
    }
  },
  
  // Use Case 5: Multiple documents without template
  '/jobs/multi-doc': {
    path: '/jobs/multi-doc',
    description: 'Submit multiple separate documents with manual configuration',
    method: 'POST',
    parameters: ['documents', 'recipients', 'jobOptions'],
    jwtExample: `curl -X POST https://api.c2m.com/v2/jobs/multi-doc \\
  -H 'Authorization: Bearer <token>' \\
  -H 'Content-Type: application/json' \\
  -d '{"documents": [...], "recipients": [...], "jobOptions": {...}}'`,
    payloadExample: {
      documents: [
        { documentUrl: 'https://example.com/doc1.pdf' },
        { documentUrl: 'https://example.com/doc2.pdf' }
      ],
      recipients: [
        {
          name: 'Alice Williams',
          address: '321 Maple Dr',
          city: 'Hometown',
          state: 'FL',
          zip: '13579'
        }
      ],
      jobOptions: {
        paperType: 'PREMIUM',
        printColor: true,
        envelope: 'WINDOW'
      }
    }
  },
  
  // Use Case 6: Merge documents without template
  '/jobs/multi-doc-merge': {
    path: '/jobs/multi-doc-merge',
    description: 'Merge multiple documents into one mailing with manual configuration',
    method: 'POST',
    parameters: ['documents', 'recipients', 'jobOptions'],
    jwtExample: `curl -X POST https://api.c2m.com/v2/jobs/multi-doc-merge \\
  -H 'Authorization: Bearer <token>' \\
  -H 'Content-Type: application/json' \\
  -d '{"documents": [...], "recipients": [...], "jobOptions": {...}}'`,
    payloadExample: {
      documents: [
        { 
          zipId: 'zip_456',
          documentName: 'cover_letter.pdf'
        },
        { 
          zipId: 'zip_456',
          documentName: 'attachment.pdf'
        }
      ],
      recipients: [
        {
          addressBookId: 'book_123'
        }
      ],
      jobOptions: {
        paperType: 'STANDARD',
        printColor: false,
        mailClass: 'STANDARD'
      }
    }
  },
  
  // Use Case 7: Split PDF
  '/jobs/single-pdf-split': {
    path: '/jobs/single-pdf-split',
    description: 'Split a combined PDF into multiple mailings',
    method: 'POST',
    parameters: ['document', 'recipients', 'jobOptions', 'splitOptions'],
    jwtExample: `curl -X POST https://api.c2m.com/v2/jobs/single-pdf-split \\
  -H 'Authorization: Bearer <token>' \\
  -H 'Content-Type: application/json' \\
  -d '{"document": {...}, "recipients": [...], "splitOptions": {...}}'`,
    payloadExample: {
      document: {
        documentUrl: 'https://example.com/combined.pdf'
      },
      recipients: [
        { addressListId: 'list_123' }
      ],
      splitOptions: {
        pageBreakOn: 'BLANK_PAGE',
        documentsPerRecipient: 1
      },
      jobOptions: {
        paperType: 'STANDARD',
        mailClass: 'FIRST_CLASS'
      }
    }
  },
  
  // Use Case 8: Split PDF with address capture
  '/jobs/single-pdf-split-addressCapture': {
    path: '/jobs/single-pdf-split-addressCapture',
    description: 'Split a PDF and capture addresses from the document content',
    method: 'POST',
    parameters: ['document', 'jobOptions', 'splitOptions', 'addressCaptureOptions'],
    jwtExample: `curl -X POST https://api.c2m.com/v2/jobs/single-pdf-split-addressCapture \\
  -H 'Authorization: Bearer <token>' \\
  -H 'Content-Type: application/json' \\
  -d '{"document": {...}, "splitOptions": {...}, "addressCaptureOptions": {...}}'`,
    payloadExample: {
      document: {
        uploadRequestId: 'upload_789',
        zipId: 'zip_123',
        documentName: 'bulk_mail.pdf'
      },
      splitOptions: {
        pageBreakOn: 'PAGE_COUNT',
        pagesPerDocument: 3
      },
      addressCaptureOptions: {
        captureArea: 'TOP_RIGHT',
        returnAddressCapture: true
      },
      jobOptions: {
        paperType: 'STANDARD',
        envelope: 'WINDOW'
      }
    }
  }
};

export default endpointMap;