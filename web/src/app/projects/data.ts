export interface Project {
  slug: string
  title: string
  description: string
  company: string
  year: number
  type?: 'role' | 'project'
  period?: string
  category: 'Internet of Things' | 'Artificial Intelligence' | 'Web' | 'Spatial Computing'
  tags: string[]
  featured?: boolean
  portfolio?: boolean
  order?: number
  image?: string
  link?: string
  youtubeId?: string
}

const ytThumb = (id: string, quality: 'hqdefault' | 'maxresdefault' = 'hqdefault'): string => {
  return `https://img.youtube.com/vi/${id}/${quality}.jpg`
}

export const projects: Project[] = [
  // 2024
  {
    slug: 'sidekick',
    title: 'Sidekick Money',
    description:
      'Next-gen wealth management app democratising access to the financial tools of the ultra-wealthy and leveraging AI for bespoke customer insights. Combines savings pots, long-term investing, private markets and Lombard lending in a single FCA-regulated product built for the mass affluent. I work here as a full stack engineer, building out features across the app and backend services.',
    company: 'Sidekick',
    year: 2024,
    type: 'role',
    category: 'Artificial Intelligence',
    tags: ['Fintech', 'TypeScript', 'React Native', 'Artificial Intelligence', 'Spring Boot'],
    link: 'https://www.sidekickmoney.com',
    youtubeId: 'fS8QJVoHblM',
    portfolio: true,
    order: 2,
  },
  // 2023
  {
    slug: 'jugo',
    title: 'Jugo',
    description:
      'Immersive virtual event platform that places real participants inside photorealistic 3D environments. Served enterprise clients including Coca-Cola, AWS, and Vodafone at scale. I worked on their ThreeJS web implementation designed for meetings.',
    company: 'Jugo',
    year: 2023,
    type: 'role',
    period: 'Apr 2023 – Jan 2024',
    category: 'Spatial Computing',
    tags: ['Three.js', 'Virtual Events', 'Artificial Intelligence', '3D', 'TypeScript'],
    link: 'https://www.jugo.io',
    youtubeId: 'F31qOBVzNbE',
    portfolio: true,
    order: 3,
  },
  // 2022
  {
    slug: 'rdx-works',
    title: 'Radix DLT',
    description:
      'A layer 1 blockchain protocol purpose-built for decentralised finance, Radix makes Web3 accessible to everyday users while giving developers a dramatically simpler path to building smart contracts. I worked on their backend data services as part of their projects team.',
    company: 'Radix DLT',
    year: 2022,
    type: 'role',
    period: 'Jun 2022 – Mar 2023',
    category: 'Web',
    tags: ['Blockchain', 'DeFi', 'Radix', 'Web3', 'TypeScript'],
    link: 'https://www.radixdlt.com/',
    youtubeId: 'To-e02CeH0I',
  },
  // 2021
  {
    slug: 'ford',
    title: 'Ford Motor Company',
    description:
      "Software design at DFord, Ford Motor Company's innovation lab, working across many different projects including building the initial prototypes and foundations that led to their Fleet as a Service offering.",
    company: 'Ford',
    year: 2021,
    type: 'role',
    period: 'Apr 2021 – Jun 2022',
    category: 'Web',
    tags: ['Automotive', 'Connected Vehicles', 'TypeScript', 'React'],
    youtubeId: '3hKME-cllDc',
  },
  // 2020
  {
    slug: 'momentum-vxi',
    title: 'Momentum VXi',
    description:
      'A virtual experience platform built during the pandemic pivot, enabling immersive brand activations in WebXR. Featured real-time collaboration and spatial audio.',
    company: 'Momentum Worldwide',
    year: 2020,
    category: 'Spatial Computing',
    tags: ['WebXR', 'Three.js', 'React', 'WebRTC'],
    featured: true,
    portfolio: true,
    order: 1,
    image: ytThumb('U4Z_eWDxBHQ'),
    youtubeId: 'U4Z_eWDxBHQ',
  },
  {
    slug: 'shift-platform',
    title: 'SHiFT Platform',
    description:
      'An emissions tracking and sustainability platform built for ocean conservation, helping crews log and visualise environmental impact data in real time.',
    company: 'Momentum Worldwide',
    year: 2020,
    category: 'Web',
    tags: ['React', 'Node.js', 'Data Visualisation'],
    image: ytThumb('ocxtkIf4Vk0'),
    youtubeId: 'ocxtkIf4Vk0',
  },
  // 2019
  {
    slug: 'future-decoded',
    title: 'Future Decoded',
    description:
      "Interactive exhibition experience for Microsoft's annual tech conference. Real-time data visualization and IoT-connected installations.",
    company: 'Momentum Worldwide',
    year: 2019,
    category: 'Spatial Computing',
    tags: ['IoT', 'Azure', 'React', 'Node.js'],
    portfolio: true,
    order: 8,
    image: ytThumb('a4VpmZfoyTM'),
    youtubeId: 'a4VpmZfoyTM',
  },
  {
    slug: 'champions-rally',
    title: "Champion's Rally",
    description:
      'Virtual reality tennis experience created for Wimbledon 2019. Visitors faced off against John McEnroe in an immersive mixed-reality challenge.',
    company: 'Momentum Worldwide',
    year: 2019,
    category: 'Spatial Computing',
    tags: ['VR', 'Mixed Reality', 'Unity'],
    image: ytThumb('pFkepY5tOaA'),
    youtubeId: 'pFkepY5tOaA',
  },
  {
    slug: 'call-the-shots',
    title: 'Call The Shots',
    description:
      'Interactive fan experience built for SAP, letting visitors predict live match outcomes using real-time data feeds and gesture-based controls.',
    company: 'Momentum Worldwide',
    year: 2019,
    category: 'Web',
    tags: ['React', 'WebSockets', 'SAP', 'Data'],
    image: ytThumb('kJ0XQ7IK2Tc'),
    youtubeId: 'kJ0XQ7IK2Tc',
  },
  {
    slug: 'cognitive-bar',
    title: 'Cognitive Bar',
    description:
      'An AI-powered cocktail bar that used Azure Cognitive Services to analyse personality and mood from conversation, then recommended and mixed a personalised drink.',
    company: 'Momentum Worldwide',
    year: 2019,
    category: 'Artificial Intelligence',
    tags: ['Azure', 'NLP', 'IoT', 'Raspberry Pi'],
    image: ytThumb('Ps1qvMk30XM'),
    youtubeId: 'Ps1qvMk30XM',
  },
  // 2018
  {
    slug: 'world-travel-market',
    title: 'World Travel Market',
    description:
      'Multi-sensory travel experience using scent diffusion, projection mapping, and machine learning to transport visitors to destinations worldwide.',
    company: 'Momentum Worldwide',
    year: 2018,
    category: 'Internet of Things',
    tags: ['ML', 'TensorFlow', 'Python', 'Raspberry Pi'],
    image: ytThumb('E4ga2by5Q1k'),
    youtubeId: 'E4ga2by5Q1k',
  },
  {
    slug: 'caddy-clubhouse',
    title: 'Caddy Clubhouse',
    description:
      'Golf training experience using computer vision to analyze swing mechanics and provide real-time coaching feedback.',
    company: 'Momentum Worldwide',
    year: 2018,
    category: 'Internet of Things',
    tags: ['Computer Vision', 'OpenCV', 'Python', 'React'],
    image: ytThumb('T19vR9AxUug'),
    youtubeId: 'T19vR9AxUug',
  },
  // 2017
  {
    slug: 'my-other-life',
    title: 'My Other Life',
    description:
      'Immersive VR documentary exploring alternative career paths. Users experience day-in-the-life scenarios through 360-degree video narratives.',
    company: 'Momentum Worldwide',
    year: 2017,
    category: 'Spatial Computing',
    tags: ['VR', '360 Video', 'Unity', 'Oculus'],
    portfolio: true,
    order: 5,
    image: ytThumb('FPOmiqU4bIs'),
    youtubeId: 'FPOmiqU4bIs',
  },
  {
    slug: 'maia',
    title: 'MAIA',
    description:
      'An AI-driven home security assistant for ADT that used voice recognition and machine learning to intelligently detect and respond to household events.',
    company: 'Kerve',
    year: 2017,
    category: 'Internet of Things',
    tags: ['AI', 'Voice Recognition', 'IoT', 'Python'],
    image: ytThumb('36XGBIJLyN4'),
    youtubeId: '36XGBIJLyN4',
  },
  // 2016
  {
    slug: 'pay-at-pump',
    title: 'Pay At Pump',
    description:
      'IoT-enabled fuel pump prototype with NFC payments, real-time pricing, and connected car integration for major UK petroleum retailer.',
    company: 'Kerve',
    year: 2016,
    category: 'Internet of Things',
    tags: ['IoT', 'NFC', 'Node.js', 'AWS'],
    portfolio: true,
    order: 7,
    image: ytThumb('8ycTf2TDH_I'),
    youtubeId: '8ycTf2TDH_I',
  },
  {
    slug: 'hole-in-the-wall',
    title: 'Hole In The Wall',
    description:
      "An interactive Krispy Kreme pop-up experience where customers 'discovered' fresh doughnuts through a surprise reveal mechanism triggered by physical interaction.",
    company: 'Kerve',
    year: 2016,
    category: 'Internet of Things',
    tags: ['IoT', 'Arduino', 'Node.js', 'Physical Computing'],
    image: ytThumb('AlvdRkRewvA'),
    youtubeId: 'AlvdRkRewvA',
  },
  {
    slug: 'mood-tree',
    title: 'Mood Tree',
    description:
      'Interactive installation using sentiment analysis to visualize collective mood through an LED-lit tree sculpture. Real-time social media integration.',
    company: 'Kerve',
    year: 2016,
    category: 'Internet of Things',
    tags: ['Sentiment Analysis', 'Arduino', 'Node.js', 'LED'],
    portfolio: true,
    order: 4,
    image: ytThumb('yVKqqdlHPLI'),
    youtubeId: 'yVKqqdlHPLI',
  },
  // 2015
  {
    slug: 'hacky-xmas',
    title: 'Hacky Xmas',
    description:
      'A festive internal hackathon project exploring playful interactions with connected Christmas decorations - lights, sounds, and sensors controlled via web.',
    company: 'Kerve',
    year: 2015,
    category: 'Internet of Things',
    tags: ['IoT', 'Arduino', 'Node.js', 'Web'],
    image: ytThumb('d_NQcNYMKG8', 'maxresdefault'),
    youtubeId: 'd_NQcNYMKG8',
  },
  {
    slug: 'epic-mind-drive',
    title: 'Epic Mind Drive',
    description:
      'Brain-computer interface racing game using EEG headsets. Players control speed through focus and meditation states.',
    company: 'Kerve',
    year: 2015,
    category: 'Artificial Intelligence',
    tags: ['BCI', 'EEG', 'Unity', 'C#'],
    portfolio: true,
    order: 2,
    image: ytThumb('K3N18cqnzHg'),
    youtubeId: 'K3N18cqnzHg',
  },
  // 2014
  {
    slug: 'hovis-bread-butter',
    title: 'Hovis Bread and Butter Prototype',
    description:
      'A creative technology prototype for Hovis that used physical sensing to detect buttering gestures, turning a mundane kitchen moment into an interactive experience.',
    company: 'HeyHuman',
    year: 2014,
    category: 'Internet of Things',
    tags: ['Prototype', 'Arduino', 'Physical Computing', 'Sensors'],
    image: ytThumb('OVP_DryiYNA'),
    youtubeId: 'OVP_DryiYNA',
  },
  {
    slug: 'malteser-levitation',
    title: 'Malteser Levitation Prototype',
    description:
      'An electromagnetic levitation prototype created for Maltesers, demonstrating how a chocolate could float mid-air as part of an experiential campaign concept.',
    company: 'HeyHuman',
    year: 2014,
    category: 'Internet of Things',
    tags: ['Prototype', 'Electromagnetics', 'Arduino', 'Physical Computing'],
    image: ytThumb('msJDEO9OTo8'),
    youtubeId: 'msJDEO9OTo8',
  },
  {
    slug: 'interactive-pumpkin',
    title: 'Interactive Pumpkin Prototype',
    description:
      'A Halloween-themed interactive prototype using proximity sensors and projection to bring a carved pumpkin to life with reactive expressions and sound.',
    company: 'HeyHuman',
    year: 2014,
    category: 'Internet of Things',
    tags: ['Prototype', 'Sensors', 'Projection', 'Arduino'],
    image: ytThumb('uXsSRnLs3mQ'),
    youtubeId: 'uXsSRnLs3mQ',
  },
  {
    slug: 'tassimo-leap-motion',
    title: 'Tassimo Leap Motion Prototype',
    description:
      'A gesture-controlled coffee machine prototype using Leap Motion sensor, allowing users to select and brew beverages with mid-air hand movements.',
    company: 'HeyHuman',
    year: 2014,
    category: 'Internet of Things',
    tags: ['Leap Motion', 'Gesture Control', 'Node.js', 'IoT'],
    image: ytThumb('wviBk2BYAzw'),
    youtubeId: 'wviBk2BYAzw',
  },
  // 2013
  {
    slug: 'what-if-you-were-in',
    title: 'What If You Were In',
    description:
      'A community installation created at University of Lincoln exploring empathy through interactive storytelling - visitors stepped into the lives of others via an immersive web experience.',
    company: 'University of Lincoln',
    year: 2013,
    category: 'Internet of Things',
    tags: ['Interactive Installation', 'Web', 'Storytelling'],
    image: ytThumb('Swuka5XJRcw'),
    youtubeId: 'Swuka5XJRcw',
  },
  {
    slug: 'electric-edibles',
    title: 'Electric Edibles',
    description:
      'A playful electronics project embedding conductivity into food - potatoes wired as musical instruments, turning the kitchen table into an interactive soundboard.',
    company: 'University of Lincoln',
    year: 2013,
    category: 'Internet of Things',
    tags: ['Physical Computing', 'Arduino', 'Sensors', 'Prototype'],
    image: ytThumb('vziFY450TeI'),
    youtubeId: 'vziFY450TeI',
  },
  // 2012
  {
    slug: 'dialects-midlands-tea-party',
    title: 'Dialects Of The Midlands Tea Party',
    description:
      'A university project exploring regional dialect through a participatory tea party installation, using audio triggers and interactive web elements to celebrate Midlands language and culture.',
    company: 'University of Lincoln',
    year: 2012,
    category: 'Web',
    tags: ['Interactive Installation', 'Web', 'Audio'],
    image: ytThumb('m4WKwmR-N84'),
    youtubeId: 'm4WKwmR-N84',
  },
]

export const getCategories = (): string[] => {
  return [
    'Highlights',
    'Internet of Things',
    'Artificial Intelligence',
    'Web',
    'Spatial Computing',
    'All',
  ]
}
