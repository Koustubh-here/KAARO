export const translations = {
  en: {
    common: {
      appName: 'KAARO',
      ok: 'OK',
      cancel: 'Cancel',
      continue: 'Continue',
      logout: 'Logout',
      areYouSureLogout: 'Are you sure you want to logout?',
      error: 'Error',
      success: 'Success',
      online: 'Online', 
      or: 'OR',
      loading: 'Loading...'
    },
    language: {
      title: 'Language',
      selectPrompt: 'Select your preferred language',
      english: 'English',
      hindi: 'Hindi',
      telugu: 'Telugu'
    },
    splash: {
      visionTitle: 'Empowering Your Business',
      visionSubtitle: 'Making business management simple, intuitive, and growth-focused',
      brand: 'BusinessPro'
    },
    auth: {
      login: {
        welcome: 'Welcome Back!',
        subtitle: 'Sign in to continue to BusinessPro',
        title: 'Sign In',
        emailLabel: 'Email Address',
        emailPlaceholder: 'Enter your email',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Enter your password',
        forgotPassword: 'Forgot Password?',
        signingIn: 'Signing In...',
        signIn: 'Sign In',
        divider: 'OR',
        noAccount: "Don't have an account? ",
        signUp: 'Sign Up',
        errors: {
          fillAll: 'Please fill in all fields',
          emailInvalid: 'Please enter a valid email address'
        },
        successLogin: 'Login successful!',
        continue: 'Continue'
      },
      signup: {
        createAccount: 'Create Account',
        subtitle: 'Join BusinessPro to get started',
        title: 'Sign Up',
        fullName: 'Full Name',
        fullNamePlaceholder: 'Enter your full name',
        emailLabel: 'Email Address',
        emailPlaceholder: 'Enter your email',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Create a password (min 6 characters)',
        confirmPasswordLabel: 'Confirm Password',
        confirmPasswordPlaceholder: 'Re-enter your password',
        terms: 'By signing up, you agree to our {{tos}} and {{privacy}}',
        tos: 'Terms of Service',
        privacy: 'Privacy Policy',
        creatingAccount: 'Creating Account...',
        createAccountBtn: 'Create Account',
        divider: 'OR',
        haveAccount: 'Already have an account? ',
        signIn: 'Sign In',
        successTitle: 'Success!',
        successBody: 'Account created successfully. Please sign in.',
        ok: 'OK',
        errors: {
          fullName: 'Please enter your full name',
          email: 'Please enter your email address',
          emailInvalid: 'Please enter a valid email address',
          password: 'Please enter a password',
          passwordShort: 'Password must be at least 6 characters long',
          passwordMismatch: 'Passwords do not match'
        }
      }
    },
    home: {
      headerTitle: 'KAARO',
      greeting: 'Good Morning, John!',
      overview: "Here's your business at a glance.",
      todaysSales: "Today's Sales",
      todaysExpenses: "Today's Expenses",
      quickActions: 'Quick Actions',
      newSale: 'New Sale',
      newExpense: 'New Expense',
      addStock: 'Add Stock',
      newReport: 'New Report',
      alertAddStockTitle: 'Add Stock',
      alertAddStockBody: 'Opening inventory management...',
      alertNewReportTitle: 'New Report',
      alertNewReportBody: 'Opening reports dashboard...',
      activityFeed: 'Activity Feed',
      bottomNav: {
        home: 'Home',
        inventory: 'Inventory',
        ledger: 'Ledger',
        crm: 'CRM',
        reports: 'Reports'
      },
      sidebar: {
        ledger: 'Ledger',
        inventory: 'Inventory',
        crm: 'CRM',
        reports: 'Reports',
        aiSettings: 'AI Settings',
        settings: 'Settings',
        logout: 'Logout',
        logoutTitle: 'Logout',
        logoutBody: 'Are you sure you want to logout?'
      },
      chat: {
        botName: 'KAARO.ai',
        online: 'Online',
        typing: 'Typing...',
        inputPlaceholder: 'Ask KAARO.ai anything...',
        welcome: "Hello! I'm KAARO.ai. How can I streamline your business tasks today?"
      }
    },
    inventory: {
      title: 'Inventory',
      addProductTitle: 'Add Product',
      addProductBody: 'Add a new product to your inventory',
      addProduct: 'Add Product',
      cancel: 'Cancel',
      searchPlaceholder: 'Search products...',
      categories: 'Categories',
      products: 'Products',
      noProducts: 'No products found.',
      tryAdjusting: 'Try adjusting your search or filters.',
      inStockSuffix: 'in stock',
      categoryList: {
        all: 'All',
        food: 'Food',
        beverages: 'Beverages',
        snacks: 'Snacks',
        dairy: 'Dairy'
      }
    },
    ledger: {
      title: 'Ledger',
      addTransactionTitle: 'Add Transaction',
      addTransactionBody: 'Choose transaction type',
      income: 'Income',
      expense: 'Expense',
      cancel: 'Cancel',
      totalIncome: 'Total Income',
      totalExpenses: 'Total Expenses',
      filters: {
        all: 'All',
        income: 'Income',
        expenses: 'Expenses'
      },
      recentTransactions: 'Recent Transactions',
      noTransactions: 'No transactions found.',
      addNewToStart: 'Add a new transaction to get started.'
    },
    crm: {
      title: 'Customers',
      searchPlaceholder: 'Search customers by name...',
      startCampaign: 'Start Campaign',
      modal: {
        title: 'Start a New Campaign',
        step1: '1. Choose Channel',
        step2: '2. Select Audience',
        step3: '3. Write Message',
        channels: { sms: 'SMS', email: 'Email', whatsapp: 'WhatsApp' },
        audienceAll: 'All Customers',
        audienceSpecific: 'Specific Groups',
        messagePlaceholder: 'Write your {{channel}} message here...',
        useTemplate: 'Use a template:',
        templateDiwali: 'Diwali Offer',
        sendCampaign: 'Send Campaign'
      },
      alerts: {
        enterMessage: 'Please enter a campaign message',
        sentTitle: 'Campaign Sent!',
        sentBody: 'Your {{channel}} campaign has been sent to {{audience}}.',
        ok: 'OK',
        customerDetails: 'Phone: {{phone}}\nEmail: {{email}}\nTotal Spend: ₹{{spend}}\nLast Purchase: {{lastPurchase}}',
        callCustomer: 'Call Customer',
        sendMessage: 'Send Message',
        cancel: 'Cancel'
      }
    },
    reports: {
      title: 'Reports',
      selectType: '1. Select Report Type',
      chooseDate: '2. Choose Date Range',
      types: {
        sales: 'Sales Report',
        expense: 'Expense Report',
        pnl: 'Profit & Loss',
        stock: 'Stock Movement'
      },
      dateRanges: {
        today: 'Today',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        custom: 'Custom'
      },
      generate: 'Generate Report',
      generatingTitle: 'Generating Report',
      generatingBody: 'Please wait while we generate your report...',
      ok: 'OK',
      generateNew: 'Generate New Report',
      chartPlaceholder: 'Visual Chart Appears Here',
      share: 'Download / Share',
      shareTitle: 'Share Report',
      shareBody: 'How would you like to share this report?',
      options: {
        downloadPdf: 'Download PDF',
        shareEmail: 'Share via Email',
        exportExcel: 'Export to Excel',
        cancel: 'Cancel'
      }
    },
    addTransaction: {
      addType: 'Add {{type}}',
      typeTransaction: '{{type}} Transaction',
      description: 'Description *',
      descriptionPlaceholder: 'Enter {{typeLower}} description',
      amount: 'Amount *',
      amountPlaceholder: '0.00',
      category: 'Category',
      categoryPlaceholderIncome: 'e.g., Product Sale, Services',
      categoryPlaceholderExpense: 'e.g., Office Supplies, Marketing',
      date: 'Date',
      datePlaceholder: 'YYYY-MM-DD',
      saveType: 'Save {{type}}',
      saving: 'Saving...',
      errors: {
        fillAll: 'Please fill in all required fields',
        amountInvalid: 'Please enter a valid amount'
      },
      successTitle: 'Success!',
      successBody: '{{type}} transaction has been added successfully.'
    },
    productDetails: {
      title: 'Product Details',
      inStock: '{{count}} in stock',
      updateStockTitle: 'Update Stock',
      updateStockBody: 'Update stock from {{from}} to {{to}}?',
      update: 'Update',
      cancel: 'Cancel',
      errorTitle: 'Error',
      errorBody: 'Please enter a valid stock number',
      successTitle: 'Success',
      successBody: 'Stock updated successfully!',
      details: 'Details',
      price: 'Price:',
      supplier: 'Supplier:',
      lastUpdated: 'Last Updated:',
      quickActions: 'Quick Actions',
      viewStockHistory: 'View Stock History',
      editProductDetails: 'Edit Product Details',
      viewAnalytics: 'View Analytics',
      featureComingSoon: 'Feature Coming Soon'
    },
    businessCategory: {
      title: 'Business Category',
      introTitle: 'Tell us about your business',
      introBody: 'Select a category and add basic details to personalize your experience.',
      chooseCategory: 'Choose Category',
      businessDetails: 'Business Details',
      businessName: 'Business Name',
      businessNamePlaceholder: 'e.g., Sunrise Cafe',
      phoneOptional: 'Phone (optional)',
      phonePlaceholder: 'e.g., 9876543210',
      continue: 'Continue',
      alerts: {
        selectCategoryTitle: 'Select Category',
        selectCategoryBody: 'Please choose a business category.',
        businessNameTitle: 'Business Name',
        businessNameBody: 'Please enter your business name.'
      },
      categories: {
        Retail: 'Retail',
        Cafe: 'Cafe',
        Salon: 'Salon',
        Grocery: 'Grocery',
        Restaurant: 'Restaurant',
        Pharmacy: 'Pharmacy',
        Electronics: 'Electronics',
        Services: 'Services'
      }
    },
    businessCard: {
      title: 'Business Card',
      createTitle: 'Create your digital business card',
      createSubtitle: 'Share your contact information with customers and partners',
      features: {
        contactInfo: 'Contact information included',
        qrShare: 'Easy sharing via QR code',
        customizable: 'Customizable design and content',
        upToDate: 'Always up-to-date information'
      },
      creating: 'Creating Business Card...',
      createBtn: 'Create Business Card',
      skip: 'Skip for Now',
      skipTitle: 'Skip Business Card',
      skipBody: 'You can create your business card later from the settings.',
      successTitle: 'Success!',
      successBody: 'Your digital business card has been created successfully.',
      continueToApp: 'Continue to App'
    },
    types: {
      income: 'Income',
      expense: 'Expense',
      expenses: 'Expenses'
    }
  },
  te: {
    common: {
      appName: 'కారో',
      ok: 'సరే',
      cancel: 'రద్దు',
      continue: 'కొనసాగించండి',
      logout: 'లాగ్ అవుట్',
      areYouSureLogout: 'మీరు నిజంగా లాగ్ అవుట్ కావాలనుకుంటున్నారా?',
      error: 'లోపం',
      success: 'విజయం',
      online: 'ఆన్‌లైన్',
      or: 'లేదా',
      loading: 'లోడ్ అవుతోంది...'
    },
    language: {
      title: 'భాష',
      selectPrompt: 'మీకు ఇష్టమైన భాషను ఎంచుకోండి',
      english: 'ఇంగ్లీష్',
      hindi: 'హిందీ',
      telugu: 'తెలుగు'
    },
    splash: {
      visionTitle: 'మీ వ్యాపారాన్ని శక్తివంతం చేయడం',
      visionSubtitle: 'వ్యాపార నిర్వహణను సులభం, సహజం, అభివృద్ధి-కేంద్రంగా చేస్తుంది',
      brand: 'బిజినెస్‌ప్రో'
    },
    auth: {
      login: {
        welcome: 'తిరిగి స్వాగతం!',
        subtitle: 'కొనసాగించడానికి సైన్ ఇన్ చేయండి',
        title: 'సైన్ ఇన్',
        emailLabel: 'ఈమెయిల్ చిరునామా',
        emailPlaceholder: 'మీ ఈమెయిల్‌ని నమోదు చేయండి',
        passwordLabel: 'పాస్‌వర్డ్',
        passwordPlaceholder: 'మీ పాస్‌వర్డ్‌ని నమోదు చేయండి',
        forgotPassword: 'పాస్‌వర్డ్ మర్చిపోయారా?',
        signingIn: 'సైన్ ఇన్ అవుతోంది...',
        signIn: 'సైన్ ఇన్',
        divider: 'లేదా',
        noAccount: 'ఖాతా లేదా? ',
        signUp: 'సైన్ అప్',
        errors: {
          fillAll: 'దయచేసి అన్ని ఫీల్డ్స్ పూరించండి',
          emailInvalid: 'దయచేసి చెల్లుబాటు అయ్యే ఈమెయిల్ నమోదు చేయండి'
        },
        successLogin: 'సైన్ ఇన్ విజయవంతం!',
        continue: 'కొనసాగించండి'
      },
      signup: {
        createAccount: 'ఖాతా సృష్టించండి',
        subtitle: 'ప్రారంభించడానికి బిజినెస్‌ప్రోలో చేరండి',
        title: 'సైన్ అప్',
        fullName: 'పూర్తి పేరు',
        fullNamePlaceholder: 'మీ పూర్తి పేరును నమోదు చేయండి',
        emailLabel: 'ఈమెయిల్ చిరునామా',
        emailPlaceholder: 'మీ ఈమెయిల్‌ని నమోదు చేయండి',
        passwordLabel: 'పాస్‌వర్డ్',
        passwordPlaceholder: 'పాస్‌వర్డ్ సృష్టించండి (కనీసం 6 అక్షరాలు)',
        confirmPasswordLabel: 'పాస్‌వర్డ్ నిర్ధారించండి',
        confirmPasswordPlaceholder: 'మీ పాస్‌వర్డ్‌ను మళ్లీ నమోదు చేయండి',
        terms: 'సైన్ అప్ చేస్తూ, మీరు మా {{tos}} మరియు {{privacy}}ను అంగీకరిస్తున్నారు',
        tos: 'సేవా నియమాలు',
        privacy: 'గోప్యతా విధానం',
        creatingAccount: 'ఖాతా సృష్టించబడుతోంది...',
        createAccountBtn: 'ఖాతా సృష్టించండి',
        divider: 'లేదా',
        haveAccount: 'ఇప్పటికే ఖాతా ఉందా? ',
        signIn: 'సైన్ ఇన్',
        successTitle: 'విజయం!',
        successBody: 'ఖాతా విజయవంతంగా సృష్టించబడింది. దయచేసి సైన్ ఇన్ చేయండి.',
        ok: 'సరే',
        errors: {
          fullName: 'దయచేసి మీ పూర్తి పేరును నమోదు చేయండి',
          email: 'దయచేసి మీ ఈమెయిల్ చిరునామాను నమోదు చేయండి',
          emailInvalid: 'దయచేసి చెల్లుబాటు అయ్యే ఈమెయిల్ నమోదు చేయండి',
          password: 'దయచేసి పాస్‌వర్డ్‌ను నమోదు చేయండి',
          passwordShort: 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి',
          passwordMismatch: 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు'
        }
      }
    },
    home: {
      headerTitle: 'కారో',
      greeting: 'శుభోదయం, జాన్!',
      overview: 'ఇది మీ వ్యాపారం యొక్క సమగ్ర అవలోకనం.',
      todaysSales: 'ఈరోజు అమ్మకాలు',
      todaysExpenses: 'ఈరోజు ఖర్చులు',
      quickActions: 'త్వరిత చర్యలు',
      newSale: 'క్రొత్త అమ్మకం',
      newExpense: 'క్రొత్త ఖర్చు',
      addStock: 'స్టాక్ జోడించండి',
      newReport: 'క్రొత్త నివేదిక',
      alertAddStockTitle: 'స్టాక్ జోడించండి',
      alertAddStockBody: 'ఇన్వెంటరీ నిర్వహణ తెరవబడుతోంది...',
      alertNewReportTitle: 'క్రొత్త నివేదిక',
      alertNewReportBody: 'రిపోర్ట్స్ డ్యాష్‌బోర్డ్ తెరవబడుతోంది...',
      activityFeed: 'కార్యకలాపాల ఫీడ్',
      bottomNav: {
        home: 'హోమ్',
        inventory: 'ఇన్వెంటరీ',
        ledger: 'లెడ్జర్',
        crm: 'CRM',
        reports: 'రిపోర్ట్స్'
      },
      sidebar: {
        ledger: 'లెడ్జర్',
        inventory: 'ఇన్వెంటరీ',
        crm: 'CRM',
        reports: 'రిపోర్ట్స్',
        aiSettings: 'AI సెట్టింగులు',
        settings: 'సెట్టింగులు',
        logout: 'లాగ్ అవుట్',
        logoutTitle: 'లాగ్ అవుట్',
        logoutBody: 'మీరు నిజంగా లాగ్ అవుట్ కావాలనుకుంటున్నారా?'
      },
      chat: {
        botName: 'KAARO.ai',
        online: 'ఆన్‌లైన్',
        typing: 'టైపింగ్...',
        inputPlaceholder: 'KAARO.aiని ఏదైనా అడగండి...',
        welcome: 'నమస్తే! నేను KAARO.ai. మీ వ్యాపార పనులను సులభతరం చేయడానికి ఎలా సహాయం చేయగలను?'
      }
    },
    inventory: {
      title: 'ఇన్వెంటరీ',
      addProductTitle: 'ఉత్పత్తి జోడించండి',
      addProductBody: 'మీ ఇన్వెంటరీకి క్రొత్త ఉత్పత్తి జోడించండి',
      addProduct: 'ఉత్పత్తి జోడించండి',
      cancel: 'రద్దు',
      searchPlaceholder: 'ఉత్పత్తులను శోధించండి...',
      categories: 'వర్గాలు',
      products: 'ఉత్పత్తులు',
      noProducts: 'ఉత్పత్తులు కనబడలేదు.',
      tryAdjusting: 'మీ శోధన లేదా ఫిల్టర్లను సవరించడానికి ప్రయత్నించండి.',
      inStockSuffix: 'స్టాక్‌లో',
      categoryList: {
        all: 'అన్నీ',
        food: 'ఆహారం',
        beverages: 'పానీయాలు',
        snacks: 'స్నాక్స్',
        dairy: 'పాలు ఉత్పత్తులు'
      }
    },
    ledger: {
      title: 'లెడ్జర్',
      addTransactionTitle: 'లావాదేవీ జోడించండి',
      addTransactionBody: 'లావాదేవీ రకం ఎంచుకోండి',
      income: 'ఆదాయం',
      expense: 'ఖర్చు',
      cancel: 'రద్దు',
      totalIncome: 'మొత్తం ఆదాయం',
      totalExpenses: 'మొత్తం ఖర్చులు',
      filters: {
        all: 'అన్నీ',
        income: 'ఆదాయం',
        expenses: 'ఖర్చులు'
      },
      recentTransactions: 'ఇటీవలి లావాదేవీలు',
      noTransactions: 'ఏ లావాదేవీలు కనబడలేదు.',
      addNewToStart: 'ప్రారంభించడానికి ఒక కొత్త లావాదేవీని జోడించండి.'
    },
    crm: {
      title: 'వినియోగదారులు',
      searchPlaceholder: 'పేరుతో వినియోగదారులను శోధించండి...',
      startCampaign: 'క్యాంపైన్ ప్రారంభించండి',
      modal: {
        title: 'క్రొత్త క్యాంపైన్ ప్రారంభించండి',
        step1: '1. ఛానల్ ఎంచుకోండి',
        step2: '2. ప్రేక్షకులను ఎంచుకోండి',
        step3: '3. సందేశం వ్రాయండి',
        channels: { sms: 'SMS', email: 'ఈమెయిల్', whatsapp: 'వాట్సాప్' },
        audienceAll: 'అన్ని వినియోగదారులు',
        audienceSpecific: 'ప్రత్యేక సమూహాలు',
        messagePlaceholder: 'మీ {{channel}} సందేశాన్ని ఇక్కడ వ్రాయండి...',
        useTemplate: 'ఒక టెంప్లేట్ ఉపయోగించండి:',
        templateDiwali: 'దీపావళి ఆఫర్',
        sendCampaign: 'క్యాంపైన్ పంపండి'
      },
      alerts: {
        enterMessage: 'దయచేసి క్యాంపైన్ సందేశాన్ని నమోదు చేయండి',
        sentTitle: 'క్యాంపైన్ పంపబడింది!',
        sentBody: 'మీ {{channel}} క్యాంపైన్ {{audience}} కు పంపబడింది.',
        ok: 'సరే',
        customerDetails: 'ఫోన్: {{phone}}\nఈమెయిల్: {{email}}\nమొత్తం ఖర్చు: ₹{{spend}}\nచివరి కొనుగోలు: {{lastPurchase}}',
        callCustomer: 'వినియోగదారుని కాల్ చేయండి',
        sendMessage: 'సందేశం పంపండి',
        cancel: 'రద్దు'
      }
    },
    reports: {
      title: 'రిపోర్ట్స్',
      selectType: '1. రిపోర్ట్ రకం ఎంచుకోండి',
      chooseDate: '2. తేదీ పరిధి ఎంచుకోండి',
      types: {
        sales: 'అమ్మకాల రిపోర్ట్',
        expense: 'ఖర్చుల రిపోర్ట్',
        pnl: 'లాభం & నష్టం',
        stock: 'స్టాక్ కదలిక'
      },
      dateRanges: {
        today: 'ఈ రోజు',
        thisWeek: 'ఈ వారం',
        thisMonth: 'ఈ నెల',
        custom: 'కస్టమ్'
      },
      generate: 'రిపోర్ట్ రూపొందించండి',
      generatingTitle: 'రిపోర్ట్ రూపొందుతోంది',
      generatingBody: 'దయచేసి వేచి ఉండండి, మీ రిపోర్ట్ తయారు అవుతోంది...',
      ok: 'సరే',
      generateNew: 'క్రొత్త రిపోర్ట్ రూపొందించండి',
      chartPlaceholder: 'ఇక్కడ చార్ట్ కనిపిస్తుంది',
      share: 'డౌన్‌లోడ్ / షేర్',
      shareTitle: 'రిపోర్ట్‌ను షేర్ చేయండి',
      shareBody: 'ఈ రిపోర్ట్‌ను మీరు ఎలా షేర్ చేయాలనుకుంటున్నారు?',
      options: {
        downloadPdf: 'PDF డౌన్‌లోడ్ చేయండి',
        shareEmail: 'ఈమెయిల్ ద్వారా షేర్ చేయండి',
        exportExcel: 'ఎక్సెల్‌కు ఎగుమతి చేయండి',
        cancel: 'రద్దు'
      }
    },
    addTransaction: {
      addType: '{{type}} జోడించండి',
      typeTransaction: '{{type}} లావాదేవీ',
      description: 'వివరణ *',
      descriptionPlaceholder: '{{typeLower}} వివరణను నమోదు చేయండి',
      amount: 'మొత్తం *',
      amountPlaceholder: '0.00',
      category: 'వర్గం',
      categoryPlaceholderIncome: 'ఉదా., ఉత్పత్తి విక్రయం, సేవలు',
      categoryPlaceholderExpense: 'ఉదా., కార్యాలయ సరఫరాలు, మార్కెటింగ్',
      date: 'తేదీ',
      datePlaceholder: 'YYYY-MM-DD',
      saveType: '{{type}} సేవ్ చేయండి',
      saving: 'సేవ్ అవుతోంది...',
      errors: {
        fillAll: 'దయచేసి అవసరమైన ఫీల్డ్స్ పూరించండి',
        amountInvalid: 'దయచేసి చెల్లుబాటు అయ్యే మొత్తం నమోదు చేయండి'
      },
      successTitle: 'విజయం!',
      successBody: '{{type}} లావాదేవీ విజయవంతంగా జోడించబడింది.'
    },
    productDetails: {
      title: 'ఉత్పత్తి వివరాలు',
      inStock: '{{count}} స్టాక్‌లో',
      updateStockTitle: 'స్టాక్ నవీకరించండి',
      updateStockBody: '{{from}} నుండి {{to}} కి స్టాక్‌ను నవీకరించాలా?',
      update: 'నవీకరించండి',
      cancel: 'రద్దు',
      errorTitle: 'లోపం',
      errorBody: 'దయచేసి చెల్లుబాటు అయ్యే స్టాక్ సంఖ్యను నమోదు చేయండి',
      successTitle: 'విజయం',
      successBody: 'స్టాక్ విజయవంతంగా నవీకరించబడింది!',
      details: 'వివరాలు',
      price: 'ధర:',
      supplier: 'సరఫరాదారు:',
      lastUpdated: 'చివరి నవీకరణ:',
      quickActions: 'త్వరిత చర్యలు',
      viewStockHistory: 'స్టాక్ చరిత్ర చూడండి',
      editProductDetails: 'ఉత్పత్తి వివరాలను సవరించండి',
      viewAnalytics: 'విశ్లేషణ చూడండి',
      featureComingSoon: 'ఫీచర్ త్వరలో వస్తుంది'
    },
    businessCategory: {
      title: 'వ్యాపార వర్గం',
      introTitle: 'మీ వ్యాపారం గురించి మాకు చెప్పండి',
      introBody: 'మీ అనుభవాన్ని వ్యక్తిగతీకరించడానికి ఒక వర్గాన్ని ఎంచుకుని ప్రాథమిక వివరాలను జోడించండి.',
      chooseCategory: 'వర్గం ఎంచుకోండి',
      businessDetails: 'వ్యాపార వివరాలు',
      businessName: 'వ్యాపార పేరు',
      businessNamePlaceholder: 'ఉదా., సన్‌రైజ్ కేఫ్',
      phoneOptional: 'ఫోన్ (ఐచ్చికం)',
      phonePlaceholder: 'ఉదా., 9876543210',
      continue: 'కొనసాగించండి',
      alerts: {
        selectCategoryTitle: 'వర్గం ఎంచుకోండి',
        selectCategoryBody: 'దయచేసి ఒక వ్యాపార వర్గాన్ని ఎంచుకోండి.',
        businessNameTitle: 'వ్యాపార పేరు',
        businessNameBody: 'దయచేసి మీ వ్యాపార పేరును నమోదు చేయండి.'
      },
      categories: {
        Retail: 'రిటైల్',
        Cafe: 'కేఫ్',
        Salon: 'సెలూన్',
        Grocery: 'కిరాణా',
        Restaurant: 'రెస్టారెంట్',
        Pharmacy: 'ఫార్మసీ',
        Electronics: 'ఎలక్ట్రానిక్స్',
        Services: 'సేవలు'
      }
    },
    businessCard: {
      title: 'బిజినెస్ కార్డ్',
      createTitle: 'మీ డిజిటల్ బిజినెస్ కార్డ్ సృష్టించండి',
      createSubtitle: 'గ్రాహకులు మరియు భాగస్వాములతో మీ సంప్రదింపు వివరాలను పంచుకోండి',
      features: {
        contactInfo: 'సంప్రదింపు సమాచారం చేర్చబడింది',
        qrShare: 'QR కోడ్ ద్వారా సులభమైన షేర్',
        customizable: 'అనుకూలీకరించిన డిజైన్ మరియు కంటెంట్',
        upToDate: 'ఎల్లప్పుడూ తాజా సమాచారం'
      },
      creating: 'బిజినెస్ కార్డ్ సృష్టించబడుతోంది...',
      createBtn: 'బిజినెస్ కార్డ్ సృష్టించండి',
      skip: 'ఇప్పటికైతే దాటవేయండి',
      skipTitle: 'బిజినెస్ కార్డ్ దాటవేయండి',
      skipBody: 'మీరు తరువాత సెట్టింగ్స్ నుండి మీ బిజినెస్ కార్డ్ సృష్టించవచ్చు.',
      successTitle: 'విజయం!',
      successBody: 'మీ డిజిటల్ బిజినెస్ కార్డ్ విజయవంతంగా సృష్టించబడింది.',
      continueToApp: 'యాప్‌కి కొనసాగండి'
    },
    types: {
      income: 'ఆదాయం',
      expense: 'ఖర్చు',
      expenses: 'ఖర్చులు'
    }
  },
  hi: {
    common: {
      appName: 'कारो',
      ok: 'ठीक है',
      cancel: 'रद्द करें',
      continue: 'जारी रखें',
      logout: 'लॉगआउट',
      areYouSureLogout: 'क्या आप वाकई लॉगआउट करना चाहते हैं?',
      error: 'त्रुटि',
      success: 'सफलता',
      online: 'ऑनलाइन',
      or: 'या',
      loading: 'लोड हो रहा है...'
    },
    language: {
      title: 'भाषा',
      selectPrompt: 'अपनी पसंदीदा भाषा चुनें',
      english: 'अंग्रेज़ी',
      hindi: 'हिन्दी',
      telugu: 'तेलुगू'
    },
    splash: {
      visionTitle: 'आपके व्यवसाय को सशक्त बनाना',
      visionSubtitle: 'बिज़नेस प्रबंधन को सरल, सहज और विकास-केंद्रित बनाना',
      brand: 'बिज़नेसप्रो'
    },
    auth: {
      login: {
        welcome: 'वापसी पर स्वागत है!',
        subtitle: 'जारी रखने के लिए साइन इन करें',
        title: 'साइन इन',
        emailLabel: 'ईमेल पता',
        emailPlaceholder: 'अपना ईमेल दर्ज करें',
        passwordLabel: 'पासवर्ड',
        passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
        forgotPassword: 'पासवर्ड भूल गए?',
        signingIn: 'साइन इन हो रहा है...',
        signIn: 'साइन इन',
        divider: 'या',
        noAccount: 'खाता नहीं है? ',
        signUp: 'साइन अप',
        errors: {
          fillAll: 'कृपया सभी फ़ील्ड भरें',
          emailInvalid: 'कृपया मान्य ईमेल पता दर्ज करें'
        },
        successLogin: 'सफलतापूर्वक साइन इन!',
        continue: 'जारी रखें'
      },
      signup: {
        createAccount: 'खाता बनाएं',
        subtitle: 'शुरू करने के लिए बिज़नेसप्रो से जुड़ें',
        title: 'साइन अप',
        fullName: 'पूरा नाम',
        fullNamePlaceholder: 'अपना पूरा नाम दर्ज करें',
        emailLabel: 'ईमेल पता',
        emailPlaceholder: 'अपना ईमेल दर्ज करें',
        passwordLabel: 'पासवर्ड',
        passwordPlaceholder: 'पासवर्ड बनाएं (कम से कम 6 अक्षर)',
        confirmPasswordLabel: 'पासवर्ड की पुष्टि करें',
        confirmPasswordPlaceholder: 'पासवर्ड दोबारा दर्ज करें',
        terms: 'साइन अप करके, आप हमारे {{tos}} और {{privacy}} से सहमत हैं',
        tos: 'सेवा की शर्तें',
        privacy: 'गोपनीयता नीति',
        creatingAccount: 'खाता बनाया जा रहा है...',
        createAccountBtn: 'खाता बनाएं',
        divider: 'या',
        haveAccount: 'पहले से खाता है? ',
        signIn: 'साइन इन',
        successTitle: 'सफलता!',
        successBody: 'खाता सफलतापूर्वक बन गया। कृपया साइन इन करें।',
        ok: 'ठीक है',
        errors: {
          fullName: 'कृपया अपना पूरा नाम दर्ज करें',
          email: 'कृपया अपना ईमेल पता दर्ज करें',
          emailInvalid: 'कृपया मान्य ईमेल पता दर्ज करें',
          password: 'कृपया पासवर्ड दर्ज करें',
          passwordShort: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए',
          passwordMismatch: 'पासवर्ड मेल नहीं खाते'
        }
      }
    },
    home: {
      headerTitle: 'कारो',
      greeting: 'सुप्रभात, जॉन!',
      overview: 'यहाँ आपके व्यवसाय का संक्षिप्त विवरण है।',
      todaysSales: 'आज की बिक्री',
      todaysExpenses: 'आज का खर्च',
      quickActions: 'त्वरित कार्य',
      newSale: 'नई बिक्री',
      newExpense: 'नया खर्च',
      addStock: 'स्टॉक जोड़ें',
      newReport: 'नयी रिपोर्ट',
      alertAddStockTitle: 'स्टॉक जोड़ें',
      alertAddStockBody: 'इन्वेंटरी मैनेजमेंट खोला जा रहा है...',
      alertNewReportTitle: 'नयी रिपोर्ट',
      alertNewReportBody: 'रिपोर्ट्स डैशबोर्ड खोला जा रहा है...',
      activityFeed: 'गतिविधि फ़ीड',
      bottomNav: {
        home: 'होम',
        inventory: 'इन्वेंटरी',
        ledger: 'लेजर',
        crm: 'सीआरएम',
        reports: 'रिपोर्ट्स'
      },
      sidebar: {
        ledger: 'लेजर',
        inventory: 'इन्वेंटरी',
        crm: 'सीआरएम',
        reports: 'रिपोर्ट्स',
        aiSettings: 'एआई सेटिंग्स',
        settings: 'सेटिंग्स',
        logout: 'लॉगआउट',
        logoutTitle: 'लॉगआउट',
        logoutBody: 'क्या आप वाकई लॉगआउट करना चाहते हैं?'
      },
      chat: {
        botName: 'KAARO.ai',
        online: 'ऑनलाइन',
        typing: 'टाइप कर रहा है...',
        inputPlaceholder: 'KAARO.ai से कुछ भी पूछें...',
        welcome: 'नमस्ते! मैं KAARO.ai हूँ। मैं आपके व्यावसायिक कार्यों को सरल बनाने में कैसे मदद कर सकता हूँ?'
      }
    },
    inventory: {
      title: 'इन्वेंटरी',
      addProductTitle: 'उत्पाद जोड़ें',
      addProductBody: 'अपनी इन्वेंटरी में नया उत्पाद जोड़ें',
      addProduct: 'उत्पाद जोड़ें',
      cancel: 'रद्द करें',
      searchPlaceholder: 'उत्पाद खोजें...',
      categories: 'श्रेणियाँ',
      products: 'उत्पाद',
      noProducts: 'कोई उत्पाद नहीं मिला।',
      tryAdjusting: 'अपनी खोज या फ़िल्टर समायोजित करने का प्रयास करें।',
      inStockSuffix: 'स्टॉक में',
      categoryList: {
        all: 'सभी',
        food: 'खाद्य',
        beverages: 'पेय',
        snacks: 'स्नैक्स',
        dairy: 'डेयरी'
      }
    },
    ledger: {
      title: 'लेजर',
      addTransactionTitle: 'लेन-देन जोड़ें',
      addTransactionBody: 'लेन-देन प्रकार चुनें',
      income: 'आय',
      expense: 'व्यय',
      cancel: 'रद्द करें',
      totalIncome: 'कुल आय',
      totalExpenses: 'कुल खर्च',
      filters: {
        all: 'सभी',
        income: 'आय',
        expenses: 'खर्चे'
      },
      recentTransactions: 'हाल के लेन-देन',
      noTransactions: 'कोई लेन-देन नहीं मिला।',
      addNewToStart: 'शुरू करने के लिए नया लेन-देन जोड़ें।'
    },
    crm: {
      title: 'ग्राहक',
      searchPlaceholder: 'नाम से ग्राहकों को खोजें...',
      startCampaign: 'अभियान शुरू करें',
      modal: {
        title: 'नया अभियान शुरू करें',
        step1: '1. चैनल चुनें',
        step2: '2. दर्शक चुनें',
        step3: '3. संदेश लिखें',
        channels: { sms: 'SMS', email: 'ईमेल', whatsapp: 'व्हाट्सएप' },
        audienceAll: 'सभी ग्राहक',
        audienceSpecific: 'विशिष्ट समूह',
        messagePlaceholder: 'अपना {{channel}} संदेश यहाँ लिखें...',
        useTemplate: 'टेम्प्लेट का उपयोग करें:',
        templateDiwali: 'दिवाली ऑफर',
        sendCampaign: 'अभियान भेजें'
      },
      alerts: {
        enterMessage: 'कृपया अभियान संदेश दर्ज करें',
        sentTitle: 'अभियान भेजा गया!',
        sentBody: 'आपका {{channel}} अभियान {{audience}} को भेज दिया गया है।',
        ok: 'ठीक है',
        customerDetails: 'फोन: {{phone}}\nईमेल: {{email}}\nकुल खर्च: ₹{{spend}}\nअंतिम खरीद: {{lastPurchase}}',
        callCustomer: 'ग्राहक को कॉल करें',
        sendMessage: 'संदेश भेजें',
        cancel: 'रद्द करें'
      }
    },
    reports: {
      title: 'रिपोर्ट्स',
      selectType: '1. रिपोर्ट प्रकार चुनें',
      chooseDate: '2. तारीख़ सीमा चुनें',
      types: {
        sales: 'बिक्री रिपोर्ट',
        expense: 'खर्च रिपोर्ट',
        pnl: 'लाभ और हानि',
        stock: 'स्टॉक मूवमेंट'
      },
      dateRanges: {
        today: 'आज',
        thisWeek: 'इस सप्ताह',
        thisMonth: 'इस माह',
        custom: 'कस्टम'
      },
      generate: 'रिपोर्ट बनाएं',
      generatingTitle: 'रिपोर्ट बन रही है',
      generatingBody: 'कृपया प्रतीक्षा करें, आपकी रिपोर्ट तैयार की जा रही है...',
      ok: 'ठीक है',
      generateNew: 'नयी रिपोर्ट बनाएं',
      chartPlaceholder: 'यहाँ चार्ट दिखाई देगा',
      share: 'डाउनलोड / शेयर',
      shareTitle: 'रिपोर्ट साझा करें',
      shareBody: 'आप इस रिपोर्ट को कैसे साझा करना चाहेंगे?',
      options: {
        downloadPdf: 'पीडीएफ डाउनलोड करें',
        shareEmail: 'ईमेल द्वारा साझा करें',
        exportExcel: 'एक्सेल में निर्यात करें',
        cancel: 'रद्द करें'
      }
    },
    addTransaction: {
      addType: '{{type}} जोड़ें',
      typeTransaction: '{{type}} लेन-देन',
      description: 'विवरण *',
      descriptionPlaceholder: '{{typeLower}} का विवरण दर्ज करें',
      amount: 'राशि *',
      amountPlaceholder: '0.00',
      category: 'श्रेणी',
      categoryPlaceholderIncome: 'जैसे, उत्पाद बिक्री, सेवाएँ',
      categoryPlaceholderExpense: 'जैसे, ऑफिस सप्लाई, मार्केटिंग',
      date: 'तारीख',
      datePlaceholder: 'YYYY-MM-DD',
      saveType: '{{type}} सहेजें',
      saving: 'सहेजा जा रहा है...',
      errors: {
        fillAll: 'कृपया सभी आवश्यक फ़ील्ड भरें',
        amountInvalid: 'कृपया मान्य राशि दर्ज करें'
      },
      successTitle: 'सफलता!',
      successBody: '{{type}} लेन-देन सफलतापूर्वक जोड़ दिया गया है।'
    },
    productDetails: {
      title: 'उत्पाद विवरण',
      inStock: '{{count}} स्टॉक में',
      updateStockTitle: 'स्टॉक अपडेट करें',
      updateStockBody: '{{from}} से {{to}} तक स्टॉक अपडेट करें?',
      update: 'अपडेट करें',
      cancel: 'रद्द करें',
      errorTitle: 'त्रुटि',
      errorBody: 'कृपया मान्य स्टॉक संख्या दर्ज करें',
      successTitle: 'सफलता',
      successBody: 'स्टॉक सफलतापूर्वक अपडेट हुआ!',
      details: 'विवरण',
      price: 'कीमत:',
      supplier: 'आपूर्तिकर्ता:',
      lastUpdated: 'अंतिम अपडेट:',
      quickActions: 'त्वरित कार्य',
      viewStockHistory: 'स्टॉक इतिहास देखें',
      editProductDetails: 'उत्पाद विवरण संपादित करें',
      viewAnalytics: 'एनालिटिक्स देखें',
      featureComingSoon: 'यह सुविधा जल्द आ रही है'
    },
    businessCategory: {
      title: 'व्यवसाय श्रेणी',
      introTitle: 'हमें अपने व्यवसाय के बारे में बताएं',
      introBody: 'अपने अनुभव को व्यक्तिगत बनाने के लिए एक श्रेणी चुनें और बुनियादी विवरण जोड़ें।',
      chooseCategory: 'श्रेणी चुनें',
      businessDetails: 'व्यवसाय विवरण',
      businessName: 'व्यवसाय का नाम',
      businessNamePlaceholder: 'उदा., सनराइज़ कैफ़े',
      phoneOptional: 'फ़ोन (वैकल्पिक)',
      phonePlaceholder: 'उदा., 9876543210',
      continue: 'जारी रखें',
      alerts: {
        selectCategoryTitle: 'श्रेणी चुनें',
        selectCategoryBody: 'कृपया एक व्यवसाय श्रेणी चुनें।',
        businessNameTitle: 'व्यवसाय का नाम',
        businessNameBody: 'कृपया अपना व्यवसाय नाम दर्ज करें।'
      },
      categories: {
        Retail: 'रिटेल',
        Cafe: 'कैफ़े',
        Salon: 'सैलून',
        Grocery: 'किराना',
        Restaurant: 'रेस्टोरेंट',
        Pharmacy: 'फार्मेसी',
        Electronics: 'इलेक्ट्रॉनिक्स',
        Services: 'सेवाएँ'
      }
    },
    businessCard: {
      title: 'बिजनेस कार्ड',
      createTitle: 'अपना डिजिटल बिजनेस कार्ड बनाएं',
      createSubtitle: 'ग्राहकों और भागीदारों के साथ अपने संपर्क विवरण साझा करें',
      features: {
        contactInfo: 'संपर्क जानकारी शामिल',
        qrShare: 'QR कोड के माध्यम से आसान शेयर',
        customizable: 'कस्टमाइज़ेबल डिज़ाइन और कंटेंट',
        upToDate: 'हमेशा अपडेटेड जानकारी'
      },
      creating: 'बिजनेस कार्ड बनाया जा रहा है...',
      createBtn: 'बिजनेस कार्ड बनाएं',
      skip: 'अभी के लिए छोड़ें',
      skipTitle: 'बिजनेस कार्ड छोड़ें',
      skipBody: 'आप बाद में सेटिंग्स से अपना बिजनेस कार्ड बना सकते हैं।',
      successTitle: 'सफलता!',
      successBody: 'आपका डिजिटल बिजनेस कार्ड सफलतापूर्वक बन गया है।',
      continueToApp: 'ऐप पर जाएँ'
    },
    types: {
      income: 'आय',
      expense: 'व्यय',
      expenses: 'खर्चे'
    }
  }
};