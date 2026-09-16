export interface VisualOption {
  text: string;
  icon: string; // emoji or visual icon indicator
  imageUrl?: string;
  badge?: string;
}

export interface AccessibleQuestion {
  id: string;
  trade: string;
  question: string;
  questionHindi: string;
  questionMarathi: string;
  audioPromptText: {
    en: string;
    hi: string;
    mr: string;
  };
  visualOptions: VisualOption[];
  correctIndex: number;
  explanation: {
    en: string;
    hi: string;
    mr: string;
  };
  conceptTag: string;
  hazardOrToolGraphic?: {
    type: 'wiring' | 'tool_selection' | 'safety_gear' | 'leak_check' | 'breaker';
    label: string;
    highlightZone?: string;
  };
}

export const ACCESSIBLE_SKILL_QUESTIONS: Record<string, AccessibleQuestion[]> = {
  Electrical: [
    {
      id: 'el-acc-1',
      trade: 'Electrical',
      question: 'Which tool do you use FIRST to check if a wire or switchboard is LIVE with dangerous current?',
      questionHindi: 'तार या स्विचबोर्ड में करंट चालू है या नहीं, यह जांचने के लिए सबसे पहले किस औजार का उपयोग करेंगे?',
      questionMarathi: 'वायर किंवा स्विचबोर्डमध्ये करंट सुरू आहे की नाही हे तपासण्यासाठी सर्वप्रथम कोणते साधन वापराल?',
      audioPromptText: {
        en: 'Question 1: Which tool do you use FIRST to check if a wire or switchboard has live electric current? Option 1: Insulated Neon Phase Tester screwdriver. Option 2: Bare fingers. Option 3: Plastic measuring tape.',
        hi: 'सवाल 1: तार या बोर्ड में करंट चालू है या नहीं, जांचने के लिए सबसे पहले क्या इस्तेमाल करेंगे? विकल्प 1: इंसुलेटेड नियॉन टेस्टर पेचकस। विकल्प 2: नंगे हाथ से छूना। विकल्प 3: प्लास्टिक की पट्टी।',
        mr: 'प्रश्न 1: वायरमध्ये करंट चालू आहे की नाही हे तपासण्यासाठी सर्वात आधी काय वापराल? पर्याय 1: इन्सुलेटेड निऑन टेस्टर. पर्याय 2: उघड्या हाताने स्पर्श करणे. पर्याय 3: मोजपट्टी.',
      },
      visualOptions: [
        {
          text: 'Insulated Neon Phase Tester Screwdriver (Safety Glow)',
          icon: '🪛',
          badge: 'IS 5571 Certified Tool',
        },
        {
          text: 'Bare fingers touch to feel vibration',
          icon: '🖐️',
          badge: 'Extremely Lethal Danger',
        },
        {
          text: 'Standard non-insulated utility knife',
          icon: '🔪',
          badge: 'Unsafe Metal Blade',
        },
      ],
      correctIndex: 0,
      explanation: {
        en: 'Always test with an insulated neon phase tester or multimeter. Never touch unknown wires with bare skin.',
        hi: 'हमेशा इंसुलेटेड नियॉन टेस्टर या मल्टीमीटर से करंट जांचें। कभी भी नंगे हाथों से तार न छुएं।',
        mr: 'नेहमी इन्सुलेटेड निऑन टेस्टर किंवा मल्टीमीटरने करंट तपासा. उघड्या हाताने कधीही वायर तपासू नका.',
      },
      conceptTag: 'Live Phase Verification',
      hazardOrToolGraphic: {
        type: 'tool_selection',
        label: 'Phase Tester Verification',
      },
    },
    {
      id: 'el-acc-2',
      trade: 'Electrical',
      question: 'In Indian standard wiring, what color wire is ALWAYS connected to the Earth / Ground pin (thickest top pin)?',
      questionHindi: 'भारतीय वायरिंग में सबसे ऊपर वाले मोटे अर्थिंग पिन में कौन से रंग का तार जोड़ा जाता है?',
      questionMarathi: 'भारतीय वायरिंग नियमांनुसार सर्वात वरच्या जाड अर्थिंग पिनमध्ये कोणत्या रंगाची वायर जोडली जाते?',
      audioPromptText: {
        en: 'Question 2: In Indian house wiring, which color wire connects to the top thick Earth pin? Option 1: Green or Green-Yellow wire. Option 2: Red live wire. Option 3: Black neutral wire.',
        hi: 'सवाल 2: भारतीय घर की वायरिंग में ऊपर वाले मोटे अर्थ पिन में कौन सा तार जुड़ता है? विकल्प 1: हरा या हरा-पीला तार। विकल्प 2: लाल तार। विकल्प 3: काला तार।',
        mr: 'प्रश्न 2: भारतीय घरगुती वायरिंगमध्ये सर्वात वरच्या जाड अर्थ पिनला कोणती वायर जोडतात? पर्याय 1: हिरवी किंवा पिवळी-हिरवी वायर. पर्याय 2: लाल वायर. पर्याय 3: काळी वायर.',
      },
      visualOptions: [
        {
          text: 'Green (or Green/Yellow striped) Earth Conductor',
          icon: '🟢',
          badge: 'Earth Ground Safety',
        },
        {
          text: 'Red Phase Line (Hot wire)',
          icon: '🔴',
          badge: 'Phase Conductor',
        },
        {
          text: 'Black Neutral Conductor',
          icon: '⚫',
          badge: 'Neutral Return',
        },
      ],
      correctIndex: 0,
      explanation: {
        en: 'Green or Green-Yellow is strictly reserved for Safety Earth Ground to drain fault current and prevent electric shock.',
        hi: 'हरा या हरा-पीला तार विशेष रूप से अर्थिंग ग्राउंड के लिए होता है ताकि करंट लगने से जान बच सके।',
        mr: 'हिरवी किंवा हिरवी-पिवळी वायर सुरक्षित अर्थिंगसाठी असते जेणेकरून विजेचा धक्का बसू नये.',
      },
      conceptTag: 'IS 732 Wire Color Codes',
      hazardOrToolGraphic: {
        type: 'wiring',
        label: '3-Pin Plug Wiring (Top Pin = Green Earth)',
      },
    },
    {
      id: 'el-acc-3',
      trade: 'Electrical',
      question: 'Before replacing an MCB breaker or opening a main panel, what is your MANDATORY first step?',
      questionHindi: 'मेन बोर्ड पर काम करने या MCB बदलने से पहले सबसे पहला जरूरी काम क्या है?',
      questionMarathi: 'मेन बोर्ड उघडण्यापूर्वी किंवा MCB बदलण्यापूर्वी सर्वात पहिली महत्त्वाची पायरी कोणती?',
      audioPromptText: {
        en: 'Question 3: Before opening the main electric distribution board, what must you do first? Option 1: Turn OFF the main power isolator switch outside. Option 2: Pour water on the board to cool it. Option 3: Touch both terminals together.',
        hi: 'सवाल 3: मेन बिजली बोर्ड खोलने से पहले सबसे पहला कदम क्या है? विकल्प 1: मेन स्विच बंद करें (पावर कट करें)। विकल्प 2: बोर्ड पर पानी छिड़कें। विकल्प 3: दोनों तार आपस में सटाएं।',
        mr: 'प्रश्न 3: मुख्य वीज बोर्ड उघडण्यापूर्वी सर्वात पहिले काय करावे? पर्याय 1: बाहेरून मुख्य मेन स्वीच बंद करा (वीज पुरवठा थांबवा). पर्याय 2: बोर्डवर पाणी टाका. पर्याय 3: दोन्ही तारा एकत्र जोडा.',
      },
      visualOptions: [
        {
          text: 'Switch OFF Main Power Supply & Verify Zero Current',
          icon: '⚡',
          badge: 'Zero Energy Lockout',
        },
        {
          text: 'Work while live with bare hands quickly',
          icon: '⚠️',
          badge: 'Fatal Risk',
        },
        {
          text: 'Pour water to cool hot wires',
          icon: '💧',
          badge: 'Catastrophic Short Circuit',
        },
      ],
      correctIndex: 0,
      explanation: {
        en: 'Always cut off the upstream main power switch before working inside electrical panels to guarantee zero electric risk.',
        hi: 'बिजली बोर्ड पर काम करने से पहले हमेशा मेन स्विच बंद करें ताकि कोई दुर्घटना न हो।',
        mr: 'विद्युत पॅनेलवर काम करण्यापूर्वी नेहमी मुख्य वीज पुरवठा बंद करा जेणेकरून अपघात टळेल.',
      },
      conceptTag: 'Zero Energy Isolation',
      hazardOrToolGraphic: {
        type: 'breaker',
        label: 'Main Isolator Cutoff Switch',
      },
    },
  ],
  Plumbing: [
    {
      id: 'pl-acc-1',
      trade: 'Plumbing',
      question: 'What tape must be wrapped on threaded pipe joints before tightening to prevent water leaks?',
      questionHindi: 'पानी के पाइप और नल की चूड़ियों पर पानी रिसने से रोकने के लिए कौन सा टेप लपेटा जाता है?',
      questionMarathi: 'नळ आणि पाईपच्या थ्रेड्सवर पाणी गळती रोखण्यासाठी कोणता पांढरा टेप गुंडाळला जातो?',
      audioPromptText: {
        en: 'Question 1: What white tape is wrapped onto pipe threads to prevent water drips? Option 1: White Teflon PTFE thread seal tape. Option 2: Cellophane packing tape. Option 3: Medical band-aid.',
        hi: 'सवाल 1: नल या पाइप की चूड़ियों पर पानी टपकना रोकने के लिए कौन सा टेप लगाते हैं? विकल्प 1: सफेद टेफ्लॉन टेप। विकल्प 2: पारदर्शी पैकिंग टेप। विकल्प 3: कपड़े की पट्टी।',
        mr: 'प्रश्न 1: नळातून पाणी गळू नये म्हणून थ्रेड्सवर कोणता टेप गुंडाळतात? पर्याय 1: पांढरा टेफ्लॉन पीटीएफई टेप. पर्याय 2: पॅकिंग टेप. पर्याय 3: कापडी पट्टी.',
      },
      visualOptions: [
        {
          text: 'White Teflon (PTFE) Thread Seal Tape',
          icon: '🧵',
          badge: 'Standard Sealant',
        },
        {
          text: 'Brown Cardboard Packing Tape',
          icon: '📦',
          badge: 'Will Disintegrate in Water',
        },
        {
          text: 'Black Electrical PVC Tape',
          icon: '🔌',
          badge: 'Not Water Tight',
        },
      ],
      correctIndex: 0,
      explanation: {
        en: 'Teflon tape fills micro-gaps between male and female pipe threads, forming a watertight barrier against pressure.',
        hi: 'टेफ्लॉन टेप चूड़ियों के बीच के खाली स्थान को भरकर पानी की बूंद-बूंद रिसाव को रोकता है।',
        mr: 'टेफ्लॉन टेप पाईपच्या थ्रेड्समधील जागा भरून काढतो आणि पाणी गळती पूर्णपणे थांबवतो.',
      },
      conceptTag: 'Thread Sealing',
      hazardOrToolGraphic: {
        type: 'tool_selection',
        label: 'PTFE Thread Seal Tape',
      },
    },
    {
      id: 'pl-acc-2',
      trade: 'Plumbing',
      question: 'Which tool is designed to securely grip, turn, and tighten round metal and GI pipes?',
      questionHindi: 'गोल लोहे या जीआई पाइप को मजबूती से पकड़ने और घुमाने के लिए कौन सा पाना (रिंच) उपयोग होता है?',
      questionMarathi: 'गोल लोखंडी पाईप घट्ट पकडण्यासाठी आणि फिरवण्यासाठी कोणते साधन वापरतात?',
      audioPromptText: {
        en: 'Question 2: Which tool is used to grip and tighten round metal water pipes? Option 1: Heavy duty Pipe Wrench with serrated jaws. Option 2: Wood hand saw. Option 3: Sewing needle.',
        hi: 'सवाल 2: गोल पाइप को पकड़ने और कसने के लिए कौन सा पाना इस्तेमाल होता है? विकल्प 1: बड़ा पाइप रिंच पाना। विकल्प 2: लकड़ी काटने की आरी। विकल्प 3: सिलाई सुई।',
        mr: 'प्रश्न 2: गोल पाईप घट्ट पकडण्यासाठी कोणता पाना वापरतात? पर्याय 1: दातेरी जबड्याचा पाईप रिंच (पाना). पर्याय 2: लाकूड कापायची करवत. पर्याय 3: सुई.',
      },
      visualOptions: [
        {
          text: 'Heavy Duty Pipe Wrench (Serrated steel grip)',
          icon: '🔧',
          badge: 'Master Plumber Tool',
        },
        {
          text: 'Wood Handsaw with sharp teeth',
          icon: '🪚',
          badge: 'Carpentry Tool Only',
        },
        {
          text: 'Paint Brush roller',
          icon: '🖌️',
          badge: 'Painting Tool Only',
        },
      ],
      correctIndex: 0,
      explanation: {
        en: 'Pipe wrenches have directional angled teeth that dig into round cylindrical pipes to give leverage without slipping.',
        hi: 'पाइप रिंच के दांत गोल पाइप को कसकर पकड़ लेते हैं जिससे बिना फिसले पाइप को घुमाया जा सकता है।',
        mr: 'पाईप रिंचचे दात गोल पाईपला घट्ट पकडतात ज्यामुळे पाईप न निसटता व्यवस्थित फिरवता येतो.',
      },
      conceptTag: 'Plumbing Hand Tools',
      hazardOrToolGraphic: {
        type: 'tool_selection',
        label: 'Heavy Duty Pipe Wrench',
      },
    },
    {
      id: 'pl-acc-3',
      trade: 'Plumbing',
      question: 'What is the main reason every sink, basin, and floor drain has a curved water trap (P-trap)?',
      questionHindi: 'सिंक, बेसिन और बाथरूम की नाली के नीचे मुड़ा हुआ पी-ट्रैप (P-Trap) क्यों लगाया जाता है?',
      questionMarathi: 'बेसिन आणि वॉशरुमच्या खाली वळणावळणाचा पी-ट्रॅप (P-Trap) का बसवला जातो?',
      audioPromptText: {
        en: 'Question 3: Why does every wash basin or floor drain have a curved P-trap underneath? Option 1: It holds water to block bad sewer smell and toxic gases. Option 2: To make water drain slower. Option 3: For decorative look.',
        hi: 'सवाल 3: बेसिन या नाली के नीचे मुड़ा हुआ पाइप क्यों होता है? विकल्प 1: इसमें जमा पानी गटर की बदबू और जहरीली गैस को घर में आने से रोकता है। विकल्प 2: पानी को धीमा करने के लिए। विकल्प 3: सुंदर दिखने के लिए।',
        mr: 'प्रश्न 3: बेसिनच्या खाली वळणावळणाचा पाईप का असतो? पर्याय 1: त्यातील साचलेले पाणी गटाराची दुर्गंधी आणि विषारी वायू घरात येण्यापासून रोखते. पर्याय 2: पाणी हळू जाण्यासाठी. पर्याय 3: शोभेसाठी.',
      },
      visualOptions: [
        {
          text: 'Holds water seal to block toxic sewer odors & gases',
          icon: '🛡️',
          badge: 'Health & Odor Barrier',
        },
        {
          text: 'Slows down water to create loud gurgle noise',
          icon: '🔊',
          badge: 'Incorrect',
        },
        {
          text: 'Installed purely as a decorative ornament',
          icon: '✨',
          badge: 'Incorrect',
        },
      ],
      correctIndex: 0,
      explanation: {
        en: 'The standing water inside the curve creates an airtight barrier preventing dangerous sewer methane gas from entering homes.',
        hi: 'मुड़े हुए हिस्से में रुका हुआ पानी एक ढाल बनाता है जिससे गटर की जहरीली मीथेन गैस और बदबू घर में नहीं आ पाती।',
        mr: 'त्यात साचलेले पाणी एक सील तयार करते ज्यामुळे गटाराची विषारी दुर्गंधी आणि गॅस घरात शिरत नाही.',
      },
      conceptTag: 'Water Trap Sanitation',
      hazardOrToolGraphic: {
        type: 'leak_check',
        label: 'P-Trap Sanitary Water Seal',
      },
    },
  ],
  'Appliance Repair': [
    {
      id: 'ap-acc-1',
      trade: 'Appliance Repair',
      question: 'Before opening the metal body of a microwave oven or washing machine, what must ALWAYS be done?',
      questionHindi: 'माइक्रोवेव ओवन या वॉशिंग मशीन की बॉडी खोलने से पहले हमेशा क्या करना चाहिए?',
      questionMarathi: 'मायक्रोवेव्ह ओव्हन किंवा वॉशिंग मशीन दुरुस्त करण्यासाठी उघडण्यापूर्वी सर्वात पहिले काय करावे?',
      audioPromptText: {
        en: 'Question 1: Before opening the cabinet of any home appliance, what is step one? Option 1: Unplug the power cable from the wall socket. Option 2: Spray water on the circuit. Option 3: Turn the speed to maximum.',
        hi: 'सवाल 1: किसी भी घरेलू उपकरण को खोलने से पहले क्या करना चाहिए? विकल्प 1: दीवार के सॉकेट से बिजली का प्लग बाहर निकालें। विकल्प 2: मशीन पर पानी छिड़कें। विकल्प 3: स्पीड सबसे तेज करें।',
        mr: 'प्रश्न 1: कोणत्याही उपकरणाचे कव्हर उघडण्यापूर्वी पहिले काय करावे? पर्याय 1: भिंतीतील सॉकेटमधून विजेचा प्लग बाहेर काढा. पर्याय 2: मशीनवर पाणी मारा. पर्याय 3: स्पीड वाढवा.',
      },
      visualOptions: [
        {
          text: 'Unplug Power Cable from 230V Wall Socket',
          icon: '🔌',
          badge: 'De-energize Appliance',
        },
        {
          text: 'Leave plugged in with power ON',
          icon: '⚡',
          badge: 'High Shock Risk',
        },
        {
          text: 'Spray water inside cabinet',
          icon: '💧',
          badge: 'Short Circuit Hazard',
        },
      ],
      correctIndex: 0,
      explanation: {
        en: 'Always pull the plug to disconnect 230V mains power before touching motors, heaters, or electronic PCBs.',
        hi: 'अंदरूनी मोटरों या तारों को छूने से पहले हमेशा बिजली का प्लग बाहर निकालें।',
        mr: 'आतील भाग तपासण्यापूर्वी नेहमी भिंतीतील विजेचा प्लग काढून वीज पुरवठा बंद करा.',
      },
      conceptTag: 'Mains Isolation',
      hazardOrToolGraphic: {
        type: 'breaker',
        label: 'Unplug Wall Socket',
      },
    },
    {
      id: 'ap-acc-2',
      trade: 'Appliance Repair',
      question: 'Which instrument is used to check if a motor coil, heating element, or fuse is burned or broken?',
      questionHindi: 'मोटर का तार, हीटर या फ्यूज जल गया है या सही है, यह नापने के लिए किस मीटर का उपयोग करते हैं?',
      questionMarathi: 'मोटरची कॉईल, हीटर किंवा फ्युज तुटला आहे की चालू आहे हे तपासण्यासाठी कोणते मीटर वापरतात?',
      audioPromptText: {
        en: 'Question 2: Which testing instrument checks if a heating element or motor coil has continuity? Option 1: Digital Multimeter with continuity buzzer. Option 2: Measuring tape. Option 3: Hammer.',
        hi: 'सवाल 2: हीटर या मोटर की तार सही है या टूटी, जांचने के लिए क्या इस्तेमाल करेंगे? विकल्प 1: डिजिटल मल्टीमीटर (बीप की आवाज वाला)। विकल्प 2: इंची टेप। विकल्प 3: हथौड़ी।',
        mr: 'प्रश्न 2: हीटर किंवा मोटर चालू आहे की नाही हे तपासण्यासाठी कोणते साधन वापरतात? पर्याय 1: डिजिटल मल्टीमीटर (बीप आवाजासह). पर्याय 2: पट्टी. पर्याय 3: हातोडा.',
      },
      visualOptions: [
        {
          text: 'Digital Multimeter (Continuity & Resistance buzzer mode)',
          icon: '📟',
          badge: 'Essential Diagnostic Tool',
        },
        {
          text: 'Steel Claw Hammer',
          icon: '🔨',
          badge: 'Destructive Impact',
        },
        {
          text: 'Paint Scraper blade',
          icon: '🪓',
          badge: 'Incorrect',
        },
      ],
      correctIndex: 0,
      explanation: {
        en: 'The multimeter continuity beep confirms complete electrical path without invisible internal wire breaks.',
        hi: 'मल्टीमीटर की बीप आवाज यह बताती है कि तार अंदर से जुड़ी हुई है या बीच में से कट गई है।',
        mr: 'मल्टीमीटरचा बीप आवाज सांगतो की वायर किंवा कॉईल अखंड आहे की मध्येच तुटली आहे.',
      },
      conceptTag: 'Continuity Testing',
      hazardOrToolGraphic: {
        type: 'tool_selection',
        label: 'Digital Multimeter',
      },
    },
    {
      id: 'ap-acc-3',
      trade: 'Appliance Repair',
      question: 'When an AC or refrigerator has gas leak, what should NEVER be used near the copper pipes?',
      questionHindi: 'एसी या फ्रिज में गैस लीकेज चेक करते समय तांबे के पाइप के पास क्या कभी इस्तेमाल नहीं करना चाहिए?',
      questionMarathi: 'एसी किंवा फ्रिजच्या गॅस लीकेज जवळ कोणती गोष्ट कधीही वापरू नये?',
      audioPromptText: {
        en: 'Question 3: When checking for gas leaks on air conditioners or fridges, what must NEVER be used? Option 1: Open flame matches or lighter. Option 2: Soap bubble water sponge. Option 3: Electronic gas detector.',
        hi: 'सवाल 3: एसी या फ्रिज में गैस लीकेज चेक करते समय क्या कभी नहीं जलाना चाहिए? विकल्प 1: माचिस या खुली आग। विकल्प 2: साबुन के झाग वाला पानी। विकल्प 3: इलेक्ट्रॉनिक डिटेक्टर।',
        mr: 'प्रश्न 3: गॅस गळती तपासताना कोणती गोष्ट कधीही जवळ नेऊ नये? पर्याय 1: माचिस किंवा उघडी आग. पर्याय 2: साबणाचा फेस. पर्याय 3: गॅस डिटेक्टर.',
      },
      visualOptions: [
        {
          text: 'Open Flame Matchbox or Cigarette Lighter',
          icon: '🔥',
          badge: 'Explosion Danger (R600a / R32 Gas)',
        },
        {
          text: 'Soapy water sponge (Creates visible bubbles safely)',
          icon: '🫧',
          badge: 'Safe Field Method',
        },
        {
          text: 'Electronic refrigerant leak detector probe',
          icon: '📡',
          badge: 'Safe Electronic Method',
        },
      ],
      correctIndex: 0,
      explanation: {
        en: 'Modern refrigerants (R600a and R32) are flammable. Open flames can trigger a flash explosion.',
        hi: 'आजकल के फ्रिज और एसी में ज्वलनशील गैस होती है। खुली आग से भयंकर विस्फोट हो सकता है।',
        mr: 'नवीन एसी आणि फ्रिजमध्ये ज्वलनशील गॅस असतो. उघडी आग लावल्यास मोठा स्फोट होऊ शकतो.',
      },
      conceptTag: 'Flammable Refrigerant Safety',
      hazardOrToolGraphic: {
        type: 'leak_check',
        label: 'Soap Bubble Leak Test',
      },
    },
  ],
  Carpentry: [
    {
      id: 'cp-acc-1',
      trade: 'Carpentry',
      question: 'When cutting wood with a power circular saw, which safety item protects your eyes from flying sawdust and chips?',
      questionHindi: 'कटर मशीन या आरी से लकड़ी काटते समय आंखों को उड़ने वाले बुरादे से बचाने के लिए क्या पहनना जरूरी है?',
      questionMarathi: 'कटर मशिनने लाकूड कापताना डोळ्यांना भुसा लागण्यापासून वाचवण्यासाठी काय घालणे आवश्यक आहे?',
      audioPromptText: {
        en: 'Question 1: What must you wear to protect your eyes when cutting wood with power saws? Option 1: Clear Safety Goggles. Option 2: Sunglasses. Option 3: Cotton handkerchief.',
        hi: 'सवाल 1: लकड़ी काटते समय आंखों को बचाने के लिए क्या पहनना चाहिए? विकल्प 1: पारदर्शी सेफ्टी चश्मा (गॉगल्स)। विकल्प 2: धूप का चश्मा। विकल्प 3: रुमाल।',
        mr: 'प्रश्न 1: लाकूड कापताना डोळ्यांचे रक्षण करण्यासाठी काय वापरावे? पर्याय 1: पारदर्शक सेफ्टी गॉगल (चष्मा). पर्याय 2: सनग्लासेस. पर्याय 3: रुमाल.',
      },
      visualOptions: [
        {
          text: 'Impact-Resistant Clear Safety Eyewear Goggles',
          icon: '🥽',
          badge: 'Mandatory PPE',
        },
        {
          text: 'Dark fashion sunglasses',
          icon: '🕶️',
          badge: 'Blocks Sight indoors',
        },
        {
          text: 'No eye protection at all',
          icon: '👁️',
          badge: 'High Blindness Risk',
        },
      ],
      correctIndex: 0,
      explanation: {
        en: 'High-speed saw blades fling sharp wood chips that can cause permanent eye blindness without safety goggles.',
        hi: 'लकड़ी का बुरादा और छिलके तेज गति से उड़ते हैं। चश्मा न पहनने से आंखों की रोशनी जा सकती है।',
        mr: 'लाकडाचे कण वेगाने डोळ्यात जाऊ शकतात. चष्मा वापरल्याने डोळ्यांचे गंभीर दुखापतीपासून रक्षण होते.',
      },
      conceptTag: 'Eye Protection & PPE',
      hazardOrToolGraphic: {
        type: 'safety_gear',
        label: 'Safety Goggles PPE',
      },
    },
    {
      id: 'cp-acc-2',
      trade: 'Carpentry',
      question: 'Which tool gives a true 90-degree right angle check when making doors, cabinets, and tables?',
      questionHindi: 'दरवाजे, अलमारी या फ्रेम के कोने बिल्कुल 90 अंश (सीधे) हैं या नहीं, यह जांचने के लिए क्या इस्तेमाल करते हैं?',
      questionMarathi: 'कपाटाचे किंवा दरवाजाचे कोपरे बरोबर काटकोनात (90 अंशात) आहेत की नाही हे तपासण्यासाठी काय वापरतात?',
      audioPromptText: {
        en: 'Question 2: Which tool verifies an exact 90-degree square right angle on wooden frames? Option 1: Try Square or L-Corner Right Angle Scale. Option 2: Plastic water bottle. Option 3: Ball pen.',
        hi: 'सवाल 2: लकड़ी के कोने सही 90 डिग्री पर हैं, जांचने के लिए क्या उपयोग होता है? विकल्प 1: एल-गुनिया (Try Square)। विकल्प 2: पानी की बोतल। विकल्प 3: बॉल पेन।',
        mr: 'प्रश्न 2: लाकडी कोपरा बरोबर 90 अंशात आहे हे पाहण्यासाठी काय वापरतात? पर्याय 1: काटकोना (Try Square / गुण्या). पर्याय 2: बाटली. पर्याय 3: पेन.',
      },
      visualOptions: [
        {
          text: 'Try Square / L-Angle Gunia (Precision 90° right angle)',
          icon: '📐',
          badge: 'Master Carpenter Tool',
        },
        {
          text: 'Straight sewing thread line',
          icon: '🧵',
          badge: 'Cannot check 90°',
        },
        {
          text: 'Curved wood rasp file',
          icon: '🪚',
          badge: 'Shaping Tool Only',
        },
      ],
      correctIndex: 0,
      explanation: {
        en: 'A carpenter try-square (gunia) ensures frames are perfectly perpendicular so doors close without jamming.',
        hi: 'गुनिया से 90 डिग्री का कोना नापा जाता है ताकि दरवाजा या पल्ला चौखट में फंसे बिना आसानी से बंद हो सके।',
        mr: 'गुण्याने काटकोन तपासला जातो जेणेकरून दरवाजा किंवा कपाट व्यवस्थित फिट बसते आणि अडकत नाही.',
      },
      conceptTag: 'Square Measurement',
      hazardOrToolGraphic: {
        type: 'tool_selection',
        label: 'Carpenter Try-Square (Gunia)',
      },
    },
    {
      id: 'cp-acc-3',
      trade: 'Carpentry',
      question: 'Why must new wooden doors have a 2mm to 3mm gap along the floor and frame margins?',
      questionHindi: 'दरवाजे और चौखट के बीच 2-3 मिलीमीटर की खाली जगह (गैप) क्यों छोड़ी जाती है?',
      questionMarathi: 'दरवाजा बसवताना कडांवर 2 ते 3 मिलिमीटरची मोकळी जागा का सोडली जाते?',
      audioPromptText: {
        en: 'Question 3: Why is a small 2 to 3 millimeter gap left around wooden doors? Option 1: Because wood expands in rainy season humidity and needs room to close. Option 2: To let dust blow in. Option 3: By mistake.',
        hi: 'सवाल 3: दरवाजे के किनारों पर थोड़ी खाली जगह क्यों छोड़ते हैं? विकल्प 1: बारिश के मौसम में नमी से लकड़ी फूलती है, जगह होने से दरवाजा अटकेगा नहीं। विकल्प 2: धूल आने के लिए। विकल्प 3: गलती से।',
        mr: 'प्रश्न 3: दरवाजाच्या कडेला थोडी रिकामी जागा का ठेवली जाते? पर्याय 1: पावसाळ्यात दमट हवेमुळे लाकूड फुगते, जागा असल्यास दरवाजा अडकत नाही. पर्याय 2: धूळ येण्यासाठी. पर्याय 3: चुकीने.',
      },
      visualOptions: [
        {
          text: 'Wood swells in monsoon humidity; gap prevents door jamming',
          icon: '🚪',
          badge: 'Natural Expansion Allowance',
        },
        {
          text: 'To let cool wind enter room under door',
          icon: '💨',
          badge: 'Incorrect',
        },
        {
          text: 'To save on cutting wood',
          icon: '🪵',
          badge: 'Incorrect',
        },
      ],
      correctIndex: 0,
      explanation: {
        en: 'Natural wood absorbs atmospheric moisture in monsoon and swells; expansion margin prevents binding in the frame.',
        hi: 'बरसात में लकड़ी नमी सोखकर फूलती है। खाली जगह रखने से बारिश में भी दरवाजा आसानी से खुलता-बंद होता है।',
        mr: 'पावसाळ्यात लाकूड ओलावा शोषून फुगते. रिकामी जागा ठेवल्याने दरवाजा कोणत्याही ऋतूत अडकत नाही.',
      },
      conceptTag: 'Wood Movement & Clearance',
      hazardOrToolGraphic: {
        type: 'tool_selection',
        label: 'Door Clearance Allowance',
      },
    },
  ],
};

export function getAccessibleQuestions(trade: string): AccessibleQuestion[] {
  return ACCESSIBLE_SKILL_QUESTIONS[trade] || ACCESSIBLE_SKILL_QUESTIONS['Electrical'];
}
