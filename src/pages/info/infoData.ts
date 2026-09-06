export interface InfoSection {
  heading?: string
  body?: string
  list?: string[]
  cards?: { title: string; body: string }[]
  faq?: { q: string; a: string }[]
  cta?: { label: string; to: string }
}

export interface InfoPageData {
  slug: string
  title: string
  subtitle: string
  sections: InfoSection[]
}

const about: InfoPageData = {
  slug: 'about',
  title: 'About GlobalSend',
  subtitle:
    'GlobalSend is a money transfer and parcel tracking platform built around speed, transparency, and security.',
  sections: [
    {
      heading: 'Who we are',
      body:
        'GlobalSend helps businesses and individuals send money and ship parcels around the world without the guesswork. Every transaction on our platform is reviewed and approved by our team, so you always know exactly where your money and your shipment are.',
    },
    {
      heading: 'What we offer',
      cards: [
        { title: 'Money Transfers', body: 'Send funds to recipients globally with a clear, admin-verified workflow and full transaction history.' },
        { title: 'Parcel Tracking', body: 'Live parcel tracking with milestones, route maps, and printable invoices for every shipment.' },
        { title: 'Verified Accounts', body: 'Account holders are verified before transacting, which keeps the whole community safe.' },
      ],
    },
    {
      cta: { label: 'Create an Account', to: '/signup' },
    },
  ],
}

const careers: InfoPageData = {
  slug: 'careers',
  title: 'Careers at GlobalSend',
  subtitle: 'Join a team that is building simple, secure financial and logistics tools used every day.',
  sections: [
    {
      heading: 'Why work with us',
      body:
        'We are a growing team focused on making money movement and shipping transparent. We value trust, ownership, and clear communication, and we invest in people who care about getting the details right.',
    },
    {
      heading: 'Areas we hire across',
      list: [
        'Customer Support & Operations',
        'Engineering (Frontend, Backend, Infrastructure)',
        'Risk, Compliance & Fraud Prevention',
        'Logistics and Supply Chain Coordination',
        'Design and Product',
      ],
    },
    {
      heading: 'How to apply',
      body:
        'We do not currently list individual openings on this site. To submit your application, email your CV to careers@globalsend.com with the role you are interested in in the subject line. Our team reviews every application.',
    },
    {
      cta: { label: 'Contact Us', to: '/contact' },
    },
  ],
}

const contact: InfoPageData = {
  slug: 'contact',
  title: 'Contact Us',
  subtitle: 'We are here to help. Reach out any time and a member of our team will get back to you.',
  sections: [
    {
      heading: 'How to reach us',
      cards: [
        { title: 'Email Support', body: 'support@globalsend.com — for account, transfer, and parcel questions.' },
        { title: 'Live Chat', body: 'Use the chat widget on this site for quick help during business hours.' },
        { title: 'Careers', body: 'careers@globalsend.com — for job applications and recruitment enquiries.' },
        { title: 'Escalations', body: 'If your issue is not resolved, our duty team handles it personally — expect a reply within one business day.' },
      ],
    },
    {
      heading: 'Response times',
      list: [
        'General enquiries: within 24 hours',
        'Account and transaction questions: within 24 hours',
        'Urgent issues: flagged and handled the same day',
      ],
    },
    {
      cta: { label: 'Visit the Help Center', to: '/help' },
    },
  ],
}

const shipping: InfoPageData = {
  slug: 'shipping',
  title: 'Learn About Shipping',
  subtitle: 'Everything you need to know about shipping a parcel with GlobalSend.',
  sections: [
    {
      heading: 'How it works',
      body:
        'Shipping a parcel with GlobalSend is straightforward. Our team creates a tracking code for your shipment, and you share it with the recipient so they can follow progress in real time.',
    },
    {
      heading: 'What you need',
      list: [
        'Sender and recipient names and contact details',
        'Origin and destination',
        'Parcel weight and quantity',
        'A short description of the contents',
      ],
    },
    {
      heading: 'What you get',
      cards: [
        { title: 'Tracking code', body: 'Every parcel receives a unique code that works on our public tracking page.' },
        { title: 'Milestone updates', body: 'See each location and event as your parcel moves along its route.' },
        { title: 'Route map', body: 'A visual map showing origin, current location, and destination.' },
        { title: 'Printable invoice', body: 'Download a professional invoice for every shipment, complete with a QR code.' },
      ],
    },
    {
      cta: { label: 'Get a Quote', to: '/quote' },
    },
  ],
}

const quote: InfoPageData = {
  slug: 'quote',
  title: 'Get a Quote',
  subtitle: 'Understand how shipping rates are calculated and get an estimate for your shipment.',
  sections: [
    {
      heading: 'What affects your rate',
      body:
        'Shipping rates depend on the origin and destination, the weight and quantity of the parcel, and the delivery speed you need. Getting a quote is simple — just tell us the basics and we will confirm the details.',
    },
    {
      heading: 'Steps to get a quote',
      list: [
        'Share the origin and destination of your shipment',
        'Provide the parcel weight and quantity',
        'Tell us the delivery timeline you are aiming for',
        'Our team confirms the fee and any applicable notes before you commit',
      ],
    },
    {
      heading: 'Talk to our team',
      body:
        'For a personalised quote, email support@globalsend.com or open an account and our team will walk you through your options.',
    },
    {
      cta: { label: 'Open an Account', to: '/signup' },
    },
  ],
}

const help: InfoPageData = {
  slug: 'help',
  title: 'Help Center',
  subtitle: 'Find quick answers about your account, deposits, transfers, and parcels.',
  sections: [
    {
      heading: 'Browse by topic',
      cards: [
        { title: 'Deposits', body: 'How deposits are made, the methods available, and how they are credited to your balance.' },
        { title: 'Transfers', body: 'How to send money, how admin approval works, and how long transfers take.' },
        { title: 'Parcel Tracking', body: 'How to use tracking codes, timelines, and route maps for your shipments.' },
        { title: 'Account & Security', body: 'Account verification, active status, blocked accounts, and keeping your account safe.' },
      ],
    },
    {
      heading: 'Still stuck?',
      body:
        'If you cannot find the answer you need, our support team will help. Email support@globalsend.com or use the live chat widget — we normally respond within 24 hours.',
    },
    {
      cta: { label: 'Browse the FAQs', to: '/faq' },
    },
  ],
}

const faq: InfoPageData = {
  slug: 'faq',
  title: 'Frequently Asked Questions',
  subtitle: 'The most common questions about GlobalSend, answered.',
  sections: [
    {
      heading: 'General',
      faq: [
        { q: 'What is GlobalSend?', a: 'GlobalSend is a money transfer and parcel tracking platform. Every transaction is reviewed and approved by our team before it is completed.' },
        { q: 'Do I need an account to track a parcel?', a: 'No. Shipments have a public tracking code that anyone can use at /track/:code to view progress without logging in.' },
      ],
    },
    {
      heading: 'Deposits',
      faq: [
        { q: 'How do I make a deposit?', a: 'Log in, go to the Deposit page, choose a crypto or gift card method, enter the amount, and submit. Deposits are processed by our team before being credited to your balance.' },
        { q: 'How long does a deposit take to be credited?', a: 'Once submitted, a deposit moves to processing and is credited as soon as our team approves it. You will receive a notification when it is done.' },
      ],
    },
    {
      heading: 'Transfers',
      faq: [
        { q: 'How do transfers work?', a: 'You submit a transfer with the recipient details and amount. It is reviewed by our team and, once approved, the amount is deducted from your balance and sent to the recipient.' },
        { q: 'Who can I transfer money to?', a: 'Transfers are sent to the recipient details you provide — name, bank, and account number. All transfers require admin approval for your safety.' },
      ],
    },
    {
      heading: 'Tracking',
      faq: [
        { q: 'What does each parcel status mean?', a: 'Pending, In Transit, Out for Delivery, Delivered, On Hold, and Exception. The timeline on the tracking page shows the latest updates.' },
        { q: 'Can I download an invoice?', a: 'Yes. Every shipment has a printable invoice with full details and a QR code, available on the public tracking page.' },
      ],
    },
  ],
}

const claim: InfoPageData = {
  slug: 'claim',
  title: 'File a Claim',
  subtitle: 'If something went wrong with your shipment or transfer, we will sort it out fairly.',
  sections: [
    {
      heading: 'When to file a claim',
      list: [
        'A parcel was not delivered or arrived damaged',
        'A transfer was not completed correctly',
        'A charge was applied to your account that you did not expect',
      ],
    },
    {
      heading: 'What to include',
      body:
        'To help us resolve your claim quickly, please include your account email, any tracking codes or transaction references involved, and a short description of what happened and what you are asking for.',
    },
    {
      heading: 'How the process works',
      body:
        'Our team reviews every claim within one business day and follows up with clear next steps. Where appropriate, we resolve issues by correcting balances, reissuing shipments, or refunding applicable amounts.',
    },
    {
      cta: { label: 'Contact Support to File a Claim', to: '/contact' },
    },
  ],
}

const mobileApp: InfoPageData = {
  slug: 'mobile-app',
  title: 'Mobile App',
  subtitle: 'GlobalSend works beautifully on your phone — as a fast, installable app.',
  sections: [
    {
      heading: 'Install the app',
      body:
        'GlobalSend is a Progressive Web App, which means you can install it on your phone or desktop like a native app. Once installed, it works from your home screen with offline-friendly performance and no download from an app store required.',
    },
    {
      heading: 'Installation steps',
      list: [
        'Open GlobalSend in your browser (Chrome, Safari, Edge, or Firefox)',
        'Tap the install icon in the address bar or browser menu',
        'Confirm the install prompt',
        'Launch GlobalSend from your home screen like any other app',
      ],
    },
    {
      heading: 'What you can do in the app',
      cards: [
        { title: 'Deposits & Transfers', body: 'Move money, track balances, and see your full transaction history.' },
        { title: 'Parcel Tracking', body: 'Track shipments with milestones and maps from anywhere.' },
        { title: 'Notifications', body: 'Get alerted the moment your transactions are processed.' },
      ],
    },
    {
      cta: { label: 'Go to the App', to: '/' },
    },
  ],
}

const developers: InfoPageData = {
  slug: 'developers',
  title: 'Developer Portal',
  subtitle: 'Build on GlobalSend with publicly available tracking data.',
  sections: [
    {
      heading: 'Public tracking',
      body:
        'Every GlobalSend parcel is visible through a public tracking page at /track/:code, where :code is the parcel tracking code (for example, FX-2026-0001). No authentication is required to view tracking information.',
    },
    {
      heading: 'What is available',
      list: [
        'Parcel status, origin, destination, and current location',
        'Shipment milestones with timestamps',
        'Sender and recipient names (public page only shows non-sensitive details)',
        'A printable invoice with a QR code for the tracking code',
      ],
    },
    {
      heading: 'Automation',
      body:
        'To integrate tracking into your own systems, contact support@globalsend.com. Our team can walk you through the available endpoints and agree on rate limits so your integration stays reliable.',
    },
    {
      cta: { label: 'Contact the Developer Team', to: '/contact' },
    },
  ],
}

const supplyChain: InfoPageData = {
  slug: 'supply-chain',
  title: 'Supply Chain',
  subtitle: 'Confidence at every step of your shipment, from pickup to delivery.',
  sections: [
    {
      heading: 'End-to-end visibility',
      body:
        'GlobalSend gives you a single view of every parcel in your pipeline. With a tracking code for each shipment and milestone updates at every stage, you always know where goods are and when they will arrive.',
    },
    {
      heading: 'What we support',
      cards: [
        { title: 'Origin handling', body: 'Clear details on what is being shipped, when, and by whom.' },
        { title: 'In-transit updates', body: 'Location milestones and status changes shown in real time.' },
        { title: 'Delivery confirmation', body: 'A delivery-confirmed record and invoice for every completed shipment.' },
      ],
    },
    {
      heading: 'Getting started',
      body:
        'Open an account and our team will help you set up shipments, generate tracking codes, and share links with your recipients and partners.',
    },
    {
      cta: { label: 'Start Shipping', to: '/signup' },
    },
  ],
}

const terms: InfoPageData = {
  slug: 'terms',
  title: 'Terms of Use',
  subtitle: 'The terms that govern your use of the GlobalSend platform.',
  sections: [
    {
      heading: '1. Services',
      body:
        'GlobalSend provides money transfer and parcel tracking services. All transactions are subject to review and approval by our team before completion.',
    },
    {
      heading: '2. Accounts',
      body:
        'You are responsible for keeping your account credentials secure and for the activity on your account. Accounts must not be shared with third parties.',
    },
    {
      heading: '3. Acceptable use',
      list: [
        'You may not use the platform for unlawful or fraudulent purposes',
        'You may not upload, share, or transact with stolen or fraudulent funds',
        'You may not misrepresent the identity of a sender or recipient',
        'You may not attempt to disrupt or gain unauthorised access to the platform',
      ],
    },
    {
      heading: '4. Transactions and fees',
      body:
        'Deposits and transfers are credited or processed only after approval. Fees, where applicable, are identified before a transaction is submitted. Your balance history provides a full audit trail.',
    },
    {
      heading: '5. Liability',
      body:
        'GlobalSend is committed to resolving issues fairly and promptly. To the extent permitted by law, our liability is limited to the amount involved in the affected transaction.',
    },
    {
      heading: '6. Governing law',
      body:
        'These terms are governed by the laws of the jurisdiction in which GlobalSend operates. Contact support@globalsend.com with any questions about these terms.',
    },
    {
      cta: { label: 'Contact Us', to: '/contact' },
    },
  ],
}

const privacy: InfoPageData = {
  slug: 'privacy',
  title: 'Security & Privacy',
  subtitle: 'How we protect your data and keep every transaction safe.',
  sections: [
    {
      heading: 'Data we collect',
      body:
        'We collect the information you provide when you create an account — such as your name, email, and contact details — along with transaction records and shipment details needed to operate the service.',
    },
    {
      heading: 'How we use your data',
      list: [
        'To operate your account and process your transactions',
        'To provide parcel tracking and invoices',
        'To verify identity and prevent fraud',
        'To support you when you contact us',
      ],
    },
    {
      heading: 'How we protect it',
      body:
        'Your data is stored securely, access is limited to staff who need it to operate the platform, and every financial transaction is reviewed by our team before approval. We never sell your personal data.',
    },
    {
      heading: 'Retention',
      body:
        'We keep account and transaction records as long as needed to operate the service and comply with legal obligations. You can contact us at any time to ask what data we hold about you.',
    },
    {
      heading: 'Questions',
      body:
        'For any privacy or security question, email support@globalsend.com and our team will respond within one business day.',
    },
    {
      cta: { label: 'Read Our FAQs', to: '/faq' },
    },
  ],
}

const fraud: InfoPageData = {
  slug: 'fraud-prevention',
  title: 'Recognize & Prevent Fraud',
  subtitle: 'Stay informed about common fraud tactics and learn how to protect yourself and your shipments.',
  sections: [
    {
      heading: 'Common warning signs',
      list: [
        'Requests to move money quickly or secretly',
        'Unsolicited messages asking for your password or verification codes',
        'Offers that sound too good to be true — discounts, prizes, or "guaranteed" profits',
        'Pressure to pay through unusual methods or to a newly changed account',
        'Senders who claim to be from GlobalSend but use personal email addresses',
      ],
    },
    {
      heading: 'How GlobalSend protects you',
      body:
        'Every transaction and deposit on our platform is reviewed by our team before completion. Account holders are verified, and we keep a complete, transparent history of all activity on your account.',
    },
    {
      heading: 'What to do if you spot fraud',
      body:
        'Stop any transaction in progress, do not share your password or codes with anyone, and contact support@globalsend.com immediately so our team can review and secure your account.',
    },
    {
      cta: { label: 'Contact Support Immediately', to: '/contact' },
    },
  ],
}

export const infoData: Record<string, InfoPageData> = {
  about,
  careers,
  contact,
  shipping,
  quote,
  help,
  faq,
  claim,
  'mobile-app': mobileApp,
  developers,
  'supply-chain': supplyChain,
  terms,
  privacy,
  'fraud-prevention': fraud,
}