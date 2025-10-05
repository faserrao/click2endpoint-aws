export interface QuestionOption {
  value: string;
  label: string;
  description: string;
  icon?: string;
}

export interface Question {
  id: string;
  title: string;
  subtitle?: string;
  options: QuestionOption[];
}

export const questions: Record<string, Question> = {
  docType: {
    id: 'docType',
    title: 'What type of document submission do you need?',
    subtitle: 'Select the option that best describes your use case',
    options: [
      {
        value: 'single',
        label: 'Single document',
        description: 'One document going to one or more recipients',
        icon: '📄'
      },
      {
        value: 'multi',
        label: 'Multiple separate documents',
        description: 'Multiple individual documents, each processed separately',
        icon: '📑'
      },
      {
        value: 'merge',
        label: 'Multiple documents to merge',
        description: 'Multiple documents combined into one mailing',
        icon: '📎'
      },
      {
        value: 'pdfSplit',
        label: 'Split a combined PDF',
        description: 'One PDF containing multiple documents that need to be separated',
        icon: '✂️'
      }
    ]
  },
  
  templateUsage: {
    id: 'templateUsage',
    title: 'Will you use a saved job template?',
    subtitle: 'Templates save time by reusing common job settings',
    options: [
      {
        value: 'true',
        label: 'Yes - Use saved template',
        description: 'Reuse settings from a previously saved job template',
        icon: '🔖'
      },
      {
        value: 'false',
        label: 'No - Configure manually',
        description: 'Set up all job parameters from scratch',
        icon: '⚙️'
      }
    ]
  },
  
  recipientStyle: {
    id: 'recipientStyle',
    title: 'How will recipient addresses be provided?',
    subtitle: 'Choose how you want to specify the mailing addresses',
    options: [
      {
        value: 'explicit',
        label: 'Provided in API call',
        description: 'Addresses sent as part of the API request',
        icon: '📮'
      },
      {
        value: 'template',
        label: 'From template/mailing list',
        description: 'Use addresses saved in template or mailing list',
        icon: '📋'
      },
      {
        value: 'addressCapture',
        label: 'Extract from document',
        description: 'Automatically capture addresses from the document content',
        icon: '🔍'
      }
    ]
  },
  
  personalized: {
    id: 'personalized',
    title: 'Is each document personalized for its recipient?',
    subtitle: 'Personalized documents have unique content per recipient',
    options: [
      {
        value: 'true',
        label: 'Yes - Unique per recipient',
        description: 'Each document has recipient-specific content',
        icon: '👤'
      },
      {
        value: 'false',
        label: 'No - Same for all',
        description: 'Same document content for all recipients',
        icon: '👥'
      }
    ]
  },

  templateContent: {
    id: 'templateContent',
    title: 'What is stored in your job template?',
    subtitle: 'Templates can contain either address lists OR documents (but not both)',
    options: [
      {
        value: 'addressList',
        label: 'Address list',
        description: 'Template contains recipient addresses (you will provide documents)',
        icon: '📋'
      },
      {
        value: 'document',
        label: 'Document',
        description: 'Template contains the document (you will provide addresses)',
        icon: '📄'
      },
      {
        value: 'neither',
        label: 'Neither',
        description: 'Template only contains job options (you provide both)',
        icon: '⚙️'
      }
    ]
  }
};

// Decision tree logic to determine next question
export function getNextQuestion(answers: Record<string, string>): string | null {
  const { docType, templateUsage, recipientStyle, templateContent } = answers;

  // If no document type selected yet, start with that
  if (!docType) {
    return 'docType';
  }

  // For PDF split, skip template question and go straight to recipient style
  if (docType === 'pdfSplit') {
    if (!recipientStyle) {
      return 'recipientStyle';
    }
    return null; // Done with questions
  }

  // For other document types, ask about template usage
  if (!templateUsage) {
    return 'templateUsage';
  }

  // If using a template, ask what's stored in it BEFORE asking about recipient style
  if (templateUsage === 'true' && !templateContent) {
    return 'templateContent';
  }

  // Then ask about recipient style
  if (!recipientStyle) {
    return 'recipientStyle';
  }

  // For multi/merge documents, ask about personalization
  if ((docType === 'multi' || docType === 'merge') && !answers.personalized) {
    return 'personalized';
  }

  // All questions answered
  return null;
}

// Determine endpoint based on answers
export function getEndpoint(answers: Record<string, string>): string | null {
  const { docType, templateUsage, recipientStyle } = answers;
  
  if (docType === 'single') {
    if (templateUsage === 'true') {
      return '/jobs/single-doc-job-template';  // Use Case 1
    } else {
      return '/jobs/single-doc';  // Use Case 4
    }
  } else if (docType === 'multi') {
    if (templateUsage === 'true') {
      return '/jobs/multi-docs-job-template';  // Use Case 2
    } else {
      return '/jobs/multi-doc';  // Use Case 5
    }
  } else if (docType === 'merge') {
    if (templateUsage === 'true') {
      return '/jobs/multi-doc-merge-job-template';  // Use Case 3
    } else {
      return '/jobs/multi-doc-merge';  // Use Case 6
    }
  } else if (docType === 'pdfSplit') {
    if (recipientStyle === 'addressCapture') {
      return '/jobs/single-pdf-split-addressCapture';  // Use Case 8
    } else {
      return '/jobs/single-pdf-split';  // Use Case 7
    }
  }
  return null;
}